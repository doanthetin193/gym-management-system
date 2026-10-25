package com.gymduongdouble.backend.finance.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.PaymentMethod;
import com.gymduongdouble.backend.common.enums.PlanType;
import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.RevenueCategory;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.SecurityUtils;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.common.web.dto.PageResponse;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.domain.Payment;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.finance.web.dto.CreatePaymentRequest;
import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import com.gymduongdouble.backend.finance.web.dto.FinanceSummaryResponse;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.service.MemberAccessService;
import com.gymduongdouble.backend.member.service.MemberService;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.service.MemberMembershipService;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service quản lý Tài chính, Công nợ và Phiếu thu (Finance & Debt Coordination).
 * <p>
 * NGUYÊN TẮC THIẾT KẾ & ĐIỀU PHỐI DÒNG TIỀN:
 * 1. Phân định ranh giới giữa Công nợ (DebtRecord) và Thực thu (Payment):
 *    - DebtRecord: Theo dõi nghĩa vụ tài chính còn nợ (Accounts Receivable).
 *    - Payment: Ghi nhận dòng tiền thực tế vào quỹ (Cash Inflow).
 * 2. Tính toàn vẹn giao dịch (ACID & Transactional Consistency):
 *    - Toàn bộ thao tác tạo phiếu thu, gạch nợ và cập nhật trạng thái gói tập được bao bọc trong @Transactional.
 *    - Áp dụng Khóa lạc quan (@Version) trên DebtRecord để ngăn chặn xung đột thanh toán đồng thời (Lost Update).
 * 3. Tận dụng Hibernate Dirty Checking:
 *    - Sau khi persist `Payment`, các entity `DebtRecord` và `MemberMembership` chỉ cần thay đổi trạng thái qua setters.
 *    - Hibernate tự động phát hiện thay đổi và sinh lệnh SQL UPDATE đồng bộ khi commit transaction.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final MemberService memberService;
    private final MemberMembershipService memberMembershipService;
    private final UserRepository userRepository;
    private final MemberAccessService memberAccessService;

    /**
     * Tạo phiếu thu mới và điều phối gạch nợ tự động.
     * <p>
     * QUY TRÌNH 6 CỔNG KIỂM SOÁT NGHIỆP VỤ (6 ENFORCEMENT GATES):
     * - Cổng 1 (Security): Kiểm tra quyền truy cập hội viên (IDOR defense - PT chỉ thao tác với học viên phụ trách).
     * - Cổng 2 (Integrity): Xác định & thẩm định khoản công nợ (phải thuộc hội viên, đúng gói tập, từ chối nợ đã PAID/CANCELLED).
     * - Cổng 3 (Financial): Thẩm định số tiền thu (chặn overpay: số tiền thu <= số tiền nợ còn lại).
     * - Cổng 4 (Accounting): Tự động phân loại danh mục doanh thu (RevenueCategory) theo cấu hình gói tập.
     * - Cổng 5 (Timeline): Thẩm định ngày lập phiếu thu (paymentDate <= today - không thu tiền ở tương lai).
     * - Cổng 6 (Synchronization): Lưu Payment và cập nhật số dư công nợ/gói tập qua Hibernate Dirty Checking.
     */
    @Transactional
    public PaymentResponse create(CreatePaymentRequest request) {
        // [CỔNG 1] IDOR Defense: Kiểm tra quyền truy cập hội viên (PT chỉ thao tác với học viên phụ trách)
        memberAccessService.ensureCanAccessMember(request.memberId());
        Member member = memberService.findEntity(request.memberId());
        MemberMembership membership = request.membershipId() == null
            ? null
            : memberMembershipService.findEntity(request.membershipId());

        // [CỔNG 2] Tìm kiếm khoản nợ tương ứng (theo debtRecordId hoặc quét khoản nợ chưa tất toán của gói)
        DebtRecord debtRecord = resolveDebtRecord(request, member, membership);

        if (membership != null && !membership.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Lượt đăng ký gói không thuộc khách hàng này.");
        }
        if (debtRecord == null) {
            throw new BadRequestException("Phiếu thu phải thuộc một khoản công nợ của gói tập.");
        }
        // Thẩm định tính toàn vẹn: nợ phải thuộc hội viên, đúng gói, và chưa tất toán
        validateDebtRecord(debtRecord, member, membership);
        membership = debtRecord.getMembership();
        if (membership == null) {
            throw new BadRequestException("Khoản công nợ không gắn với lượt đăng ký gói tập.");
        }

        // [CỔNG 3] Chặn Overpay: Số tiền thu không được vượt quá số nợ còn lại (remainingAmount)
        validatePaymentAmount(request.amount(), debtRecord);

        // [CỔNG 4] Tự động suy luận danh mục doanh thu từ loại gói tập (tránh gian lận kế toán nếu để client gửi lên)
        RevenueCategory revenueCategory = inferRevenueCategory(membership);

        // [CỔNG 5] Kiểm tra ngày thu: Ngày ghi nhận không được vượt quá ngày hiện tại (AppClock.today())
        LocalDate paymentDate = resolvePaymentDate(request.paymentDate());

        // [CỔNG 6 - Thao tác 1] Khởi tạo và lưu phiếu thu thực tế vào cơ sở dữ liệu
        Payment payment = new Payment();
        payment.setMember(member);
        payment.setMembership(membership);
        payment.setDebtRecord(debtRecord);
        payment.setPaymentDate(paymentDate);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setRevenueCategory(revenueCategory);
        payment.setDescription(request.note());
        payment.setCreatedBy(currentUserOrNull());

        Payment savedPayment = paymentRepository.save(payment);

        // [CỔNG 6 - Thao tác 2] ĐỒNG BỘ CÔNG NỢ & GÓI TẬP (Hibernate Dirty Checking):
        // Không cần gọi explicit debtRecordRepository.save() hay membershipRepository.save().
        // Do phương thức được đánh dấu @Transactional, Hibernate Session sẽ tự động theo dõi (Dirty Check)
        // các Managed Entity này và phát sinh các câu lệnh SQL UPDATE tương ứng khi commit transaction.
        syncDebtAndMembership(debtRecord, membership, request.amount());

        return PaymentResponse.from(savedPayment);
    }

    /**
     * Xác định và kiểm tra tính hợp lệ của ngày lập phiếu thu.
     * Quy tắc kế toán: Không cho phép lập phiếu thu cho các ngày ở tương lai (paymentDate <= today).
     */
    private LocalDate resolvePaymentDate(LocalDate requestedDate) {
        LocalDate paymentDate = requestedDate == null ? AppClock.today() : requestedDate;
        if (paymentDate.isAfter(AppClock.today())) {
            throw new BadRequestException("Ngày lập phiếu thu không được ở tương lai.");
        }
        return paymentDate;
    }

    @Transactional(readOnly = true)
    public List<DebtRecordResponse> listDebts(Long memberId, DebtStatus status) {
        return resolveDebts(memberId, status, null);
    }

    /**
     * Phân trang danh sách công nợ (In-memory Bounded Pagination via PageResponse.fromItems).
     * Áp dụng bảo mật phân quyền: PT chỉ xem được công nợ của học viên mình quản lý (canAccessMember).
     */
    @Transactional(readOnly = true)
    public PageResponse<DebtRecordResponse> listDebtsPage(
        Long memberId,
        DebtStatus status,
        String keyword,
        int page,
        int size
    ) {
        return PageResponse.fromItems(resolveDebts(memberId, status, keyword), page, size, 10);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(
        Long memberId,
        LocalDate fromDate,
        LocalDate toDate,
        PaymentMethod paymentMethod
    ) {
        return resolvePayments(memberId, fromDate, toDate, paymentMethod, null);
    }

    /**
     * Phân trang danh sách phiếu thu (In-memory Bounded Pagination via PageResponse.fromItems).
     * Tương tự công nợ, phiếu thu cũng được lọc bảo mật phân quyền PT (canAccessMember) trước khi cắt trang.
     */
    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> listPaymentsPage(
        Long memberId,
        LocalDate fromDate,
        LocalDate toDate,
        PaymentMethod paymentMethod,
        String keyword,
        int page,
        int size
    ) {
        return PageResponse.fromItems(resolvePayments(memberId, fromDate, toDate, paymentMethod, keyword), page, size, 10);
    }

    @Transactional(readOnly = true)
    public FinanceSummaryResponse summary() {
        List<DebtRecord> openDebts = debtRecordRepository.findAll().stream()
            .filter(debtRecord -> memberAccessService.canAccessMember(debtRecord.getMember().getId()))
            .filter(debtRecord -> debtRecord.getStatus() == DebtStatus.OPEN || debtRecord.getStatus() == DebtStatus.PARTIALLY_PAID)
            .toList();
        BigDecimal totalOpenDebt = openDebts.stream()
            .map(DebtRecord::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate today = AppClock.today();
        BigDecimal paidToday = paymentRepository.findByPaymentDateBetween(today, today).stream()
            .filter(payment -> memberAccessService.canAccessMember(payment.getMember().getId()))
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FinanceSummaryResponse(openDebts.size(), totalOpenDebt, paidToday);
    }

    private List<DebtRecordResponse> resolveDebts(Long memberId, DebtStatus status, String keyword) {
        String normalizedKeyword = normalizeKeyword(keyword);
        return debtRecordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .filter(debtRecord -> memberAccessService.canAccessMember(debtRecord.getMember().getId()))
            .filter(debtRecord -> memberId == null || debtRecord.getMember().getId().equals(memberId))
            .filter(debtRecord -> matchesDebtStatus(debtRecord, status))
            .filter(debtRecord -> matchesKeyword(
                normalizedKeyword,
                debtRecord.getMember().getFullName(),
                debtRecord.getMember().getPhone(),
                debtRecord.getMembership() == null || debtRecord.getMembership().getPlan() == null
                    ? null
                    : debtRecord.getMembership().getPlan().getName()
            ))
            .map(DebtRecordResponse::from)
            .toList();
    }

    private List<PaymentResponse> resolvePayments(
        Long memberId,
        LocalDate fromDate,
        LocalDate toDate,
        PaymentMethod paymentMethod,
        String keyword
    ) {
        String normalizedKeyword = normalizeKeyword(keyword);
        return paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "paymentDate").and(Sort.by(Sort.Direction.DESC, "id"))).stream()
            .filter(payment -> memberAccessService.canAccessMember(payment.getMember().getId()))
            .filter(payment -> memberId == null || payment.getMember().getId().equals(memberId))
            .filter(payment -> fromDate == null || !payment.getPaymentDate().isBefore(fromDate))
            .filter(payment -> toDate == null || !payment.getPaymentDate().isAfter(toDate))
            .filter(payment -> paymentMethod == null || payment.getPaymentMethod() == paymentMethod)
            .filter(payment -> matchesKeyword(
                normalizedKeyword,
                payment.getMember().getFullName(),
                payment.getMember().getPhone(),
                payment.getMembership() == null || payment.getMembership().getPlan() == null
                    ? null
                    : payment.getMembership().getPlan().getName(),
                payment.getDescription()
            ))
            .map(PaymentResponse::from)
            .toList();
    }

    /**
     * Tự động suy luận danh mục doanh thu (RevenueCategory) từ cấu trúc gói tập:
     * - SELF_TRAINING -> Doanh thu gói tự tập.
     * - GUIDANCE -> Doanh thu gói có người hướng dẫn.
     * - PT (NEW) -> Doanh thu HLV mới kèm 1:1.
     * - PT -> Doanh thu HLV tiêu chuẩn/master kèm 1:1.
     * - Khác -> OTHER_INCOME.
     * <p>
     * THIẾT KẾ BẢO VỆ DỮ LIỆU TÀI CHÍNH:
     * Không cho phép nhân viên quầy tự chọn danh mục doanh thu trên UI để tránh gian lận hoặc sai lệch báo cáo tài chính.
     */
    private RevenueCategory inferRevenueCategory(MemberMembership membership) {
        MembershipPlan plan = membership.getPlan();
        if (plan.getPlanType() == PlanType.SELF_TRAINING) {
            return RevenueCategory.SELF_TRAINING;
        }
        if (plan.getPlanType() == PlanType.GUIDANCE) {
            return RevenueCategory.GUIDANCE;
        }
        if (plan.getPlanType() == PlanType.PT && plan.getPtLevel() == PtLevel.NEW) {
            return RevenueCategory.PT_NEW;
        }
        if (plan.getPlanType() == PlanType.PT) {
            return RevenueCategory.PT_MAIN;
        }
        return RevenueCategory.OTHER_INCOME;
    }

    /**
     * Xác định bản ghi công nợ cần thanh toán:
     * 1. Nếu client chỉ định rõ debtRecordId -> Tìm nợ trực tiếp theo ID.
     * 2. Nếu chỉ có membershipId -> Tự động tìm khoản công nợ gần nhất của gói chưa tất toán (!= PAID && != CANCELLED).
     */
    private DebtRecord resolveDebtRecord(
        CreatePaymentRequest request,
        Member member,
        MemberMembership membership
    ) {
        if (request.debtRecordId() != null) {
            return debtRecordRepository.findById(request.debtRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản công nợ."));
        }
        if (membership == null) {
            return null;
        }
        return debtRecordRepository.findByMembershipIdOrderByCreatedAtDesc(membership.getId()).stream()
            .filter(debtRecord -> debtRecord.getStatus() != DebtStatus.PAID)
            .filter(debtRecord -> debtRecord.getStatus() != DebtStatus.CANCELLED)
            .findFirst()
            .orElse(null);
    }

    /**
     * Thẩm định tính toàn vẹn và hợp lệ của khoản nợ:
     * - Phải thuộc đúng hội viên.
     * - Phải gắn đúng với gói tập tương ứng.
     * - Chặn thanh toán cho khoản nợ đã trả hết (PAID) hoặc đã bị hủy (CANCELLED).
     */
    private void validateDebtRecord(DebtRecord debtRecord, Member member, MemberMembership membership) {
        if (!debtRecord.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Khoản công nợ không thuộc khách hàng này.");
        }
        if (membership != null && debtRecord.getMembership() != null
            && !debtRecord.getMembership().getId().equals(membership.getId())) {
            throw new BadRequestException("Khoản công nợ không thuộc lượt đăng ký gói này.");
        }
        if (debtRecord.getStatus() == DebtStatus.PAID) {
            throw new BadRequestException("Khoản công nợ đã được thanh toán đủ.");
        }
        if (debtRecord.getStatus() == DebtStatus.CANCELLED) {
            throw new BadRequestException("Khoản công nợ đã bị hủy.");
        }
    }

    /**
     * Chặn Overpay (Thu vượt số nợ):
     * Số tiền thu tuyệt đối không được vượt quá số tiền còn nợ thực tế (amount <= remainingAmount).
     */
    private void validatePaymentAmount(BigDecimal amount, DebtRecord debtRecord) {
        if (amount.compareTo(debtRecord.getRemainingAmount()) > 0) {
            throw new BadRequestException("Số tiền thu không được lớn hơn số tiền còn nợ.");
        }
    }

    /**
     * Đồng bộ số dư nợ và số tiền đã thanh toán giữa DebtRecord và MemberMembership:
     * - Sử dụng BigDecimal để đảm bảo độ chính xác tuyệt đối trong phép toán tài chính (không bị lỗi dấu phẩy động IEEE 754).
     * - Sử dụng `.max(BigDecimal.ZERO)` để chặn số âm do sai lệch làm tròn.
     * - Sử dụng `.min(...)` để chặn số tiền đã thu vượt quá giá trị nợ gốc ban đầu (originalAmount) hoặc số phải trả (payableAmount).
     * - Cập nhật trạng thái công nợ qua resolveDebtStatus().
     */
    private void syncDebtAndMembership(DebtRecord debtRecord, MemberMembership membership, BigDecimal amount) {
        if (debtRecord == null && membership == null) {
            return;
        }

        if (debtRecord != null) {
            BigDecimal paidAmount = debtRecord.getPaidAmount().add(amount);
            BigDecimal remainingAmount = debtRecord.getRemainingAmount().subtract(amount).max(BigDecimal.ZERO);
            debtRecord.setPaidAmount(paidAmount.min(debtRecord.getOriginalAmount()));
            debtRecord.setRemainingAmount(remainingAmount);
            debtRecord.setStatus(resolveDebtStatus(debtRecord));
        }

        if (membership != null) {
            BigDecimal paidAmount = membership.getPaidAmount().add(amount);
            BigDecimal payableAmount = membership.getActualPrice().subtract(membership.getDiscountAmount()).max(BigDecimal.ZERO);
            BigDecimal debtAmount = payableAmount.subtract(paidAmount).max(BigDecimal.ZERO);
            membership.setPaidAmount(paidAmount.min(payableAmount));
            membership.setDebtAmount(debtRecord == null ? debtAmount : debtRecord.getRemainingAmount());
        }
    }

    /**
     * Suy luận trạng thái công nợ sau khi gạch nợ:
     * - remainingAmount <= 0 -> PAID (Đã tất toán).
     * - paidAmount > 0 (nhưng remainingAmount > 0) -> PARTIALLY_PAID (Đã thanh toán một phần).
     * - Ngược lại -> OPEN (Chưa thanh toán).
     */
    private DebtStatus resolveDebtStatus(DebtRecord debtRecord) {
        if (debtRecord.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return DebtStatus.PAID;
        }
        if (debtRecord.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            return DebtStatus.PARTIALLY_PAID;
        }
        return DebtStatus.OPEN;
    }

    /**
     * LOGIC LỌC TRẠNG THÁI CÔNG NỢ PHỤC VỤ THỰC TẾ VẬN HÀNH:
     * - Khi bộ lọc UI yêu cầu `DebtStatus.OPEN` (Còn nợ), hệ thống trả về cả bản ghi OPEN lẫn PARTIALLY_PAID.
     * - Lý do: Đối với Chủ phòng, bất kỳ hội viên nào chưa thanh toán hết 100% nghĩa vụ tài chính
     *   đều nằm trong danh sách "Cần theo dõi/thu tiền", tránh việc bỏ sót các hội viên mới đóng cọc một phần.
     */
    private boolean matchesDebtStatus(DebtRecord debtRecord, DebtStatus status) {
        if (status == null) {
            return true;
        }
        if (status == DebtStatus.OPEN) {
            return debtRecord.getStatus() == DebtStatus.OPEN || debtRecord.getStatus() == DebtStatus.PARTIALLY_PAID;
        }
        return debtRecord.getStatus() == status;
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim().toLowerCase(Locale.ROOT);
    }

    private boolean matchesKeyword(String keyword, String... values) {
        if (keyword == null) {
            return true;
        }
        for (String value : values) {
            if (value != null && value.toLowerCase(Locale.ROOT).contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private User currentUserOrNull() {
        Long currentUserId = SecurityUtils.currentUserIdOrNull();
        return currentUserId == null ? null : userRepository.findById(currentUserId).orElse(null);
    }
}
