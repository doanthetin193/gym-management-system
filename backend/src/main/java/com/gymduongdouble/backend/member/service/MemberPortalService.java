package com.gymduongdouble.backend.member.service;

import com.gymduongdouble.backend.common.enums.DebtStatus;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.time.AppClock;
import com.gymduongdouble.backend.finance.domain.DebtRecord;
import com.gymduongdouble.backend.finance.repository.DebtRecordRepository;
import com.gymduongdouble.backend.finance.repository.PaymentRepository;
import com.gymduongdouble.backend.finance.web.dto.DebtRecordResponse;
import com.gymduongdouble.backend.finance.web.dto.PaymentResponse;
import com.gymduongdouble.backend.member.domain.Member;
import com.gymduongdouble.backend.member.repository.MemberRepository;
import com.gymduongdouble.backend.member.web.dto.MemberPortalResponse;
import com.gymduongdouble.backend.member.web.dto.MemberResponse;
import com.gymduongdouble.backend.member.web.dto.PtSessionPackageResponse;
import com.gymduongdouble.backend.membership.domain.MemberMembership;
import com.gymduongdouble.backend.membership.repository.MemberMembershipRepository;
import com.gymduongdouble.backend.membership.service.MembershipLifecyclePolicy;
import com.gymduongdouble.backend.membership.web.dto.MemberMembershipResponse;
import com.gymduongdouble.backend.pt.repository.PtScheduleRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionLogRepository;
import com.gymduongdouble.backend.pt.repository.PtSessionPackageRepository;
import com.gymduongdouble.backend.pt.web.dto.BodyMeasurementResponse;
import com.gymduongdouble.backend.pt.web.dto.PtGoalResponse;
import com.gymduongdouble.backend.pt.web.dto.PtScheduleResponse;
import com.gymduongdouble.backend.pt.web.dto.PtSessionLogResponse;
import com.gymduongdouble.backend.training.repository.BodyMeasurementRepository;
import com.gymduongdouble.backend.training.repository.PtGoalRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service tổng hợp dữ liệu phục vụ Cổng thông tin Hội viên (Member Portal Service).
 * <p>
 * NGUYÊN TẮC THIẾT KẾ & TỔNG HỢP DỮ LIỆU:
 * 1. Góc nhìn toàn diện 360 độ (360-degree Member View):
 *    - Gom toàn bộ dữ liệu đa module (Hội viên, Gói tập, Huấn luyện viên PT, Tài chính & Công nợ)
 *      vào một DTO duy nhất (MemberPortalResponse) để frontend hiển thị mượt mà chỉ với 1 request.
 * 2. Bảo mật chống IDOR:
 *    - Nhận `userId` từ JWT Principal đã xác thực, tra cứu ngược ra `Member` duy nhất qua quan hệ khóa ngoại 1-1.
 * 3. Kiểm soát trạng thái vận hành:
 *    - Bắt buộc hội viên phải ở trạng thái ACTIVE; nếu hội viên đã bị tạm ngưng thì từ chối truy cập.
 */
@Service
@RequiredArgsConstructor
public class MemberPortalService {

    private final MemberRepository memberRepository;
    private final MemberMembershipRepository memberMembershipRepository;
    private final PtSessionPackageRepository ptSessionPackageRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PtScheduleRepository ptScheduleRepository;
    private final PtSessionLogRepository ptSessionLogRepository;
    private final BodyMeasurementRepository bodyMeasurementRepository;
    private final PtGoalRepository ptGoalRepository;
    private final MembershipLifecyclePolicy membershipLifecyclePolicy;

    /**
     * Tra cứu và tổng hợp toàn bộ dữ liệu của hội viên theo ID tài khoản đăng nhập (userId).
     * <p>
     * Dữ liệu tổng hợp gồm 11 thành phần:
     * 1. Profile: Thông tin hồ sơ hội viên.
     * 2. Active Memberships: Các gói tập đang có hiệu lực hôm nay (tính theo MembershipLifecyclePolicy).
     * 3. Membership History: Lịch sử các gói tập cũ đã hết hạn hoặc gói tương lai.
     * 4. PT Session Packages: Gói buổi tập PT kèm 1:1 và buổi tự ôn tập (số buổi còn lại, thời hạn).
     * 5. Debts: Toàn bộ danh sách công nợ.
     * 6. Payments: Lịch sử các phiếu thu dòng tiền đã nộp.
     * 7. Schedules: Lịch hẹn tập luyện với PT (được frontend lọc lấy lịch sắp tới).
     * 8. Session Logs: Nhật ký điểm danh các buổi tập đã thực hiện.
     * 9. Body Measurements: Lịch sử số đo cơ thể InBody (dùng vẽ biểu đồ biến thiên thể trạng).
     * 10. Goals: Danh sách mục tiêu luyện tập đã thiết lập cùng HLV.
     * 11. Total Debt: Tổng số tiền công nợ mở còn phải nộp (OPEN hoặc PARTIALLY_PAID).
     */
    @Transactional(readOnly = true)
    public MemberPortalResponse getPortal(Long userId) {
        // Tra cứu hồ sơ hội viên gắn liền với tài khoản User đăng nhập (IDOR Defense)
        Member member = memberRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tai khoan hoi vien chua duoc lien ket voi ho so khach hang."));
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new AccessDeniedException("Tài khoản hội viên đã ngừng hoạt động.");
        }
        Long memberId = member.getId();
        LocalDate today = AppClock.today();
        List<MemberMembership> memberships = memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId);
        List<DebtRecord> debts = debtRecordRepository.findByMemberIdOrderByCreatedAtDesc(memberId);

        return new MemberPortalResponse(
            MemberResponse.from(member),
            memberships.stream()
                .filter(membership -> membershipLifecyclePolicy.isEffective(membership, today))
                .map(membership -> MemberMembershipResponse.from(
                    membership,
                    membershipLifecyclePolicy.effectiveStatus(membership, today)
                ))
                .toList(),
            memberships.stream()
                .filter(membership -> !membershipLifecyclePolicy.isEffective(membership, today))
                .map(membership -> MemberMembershipResponse.from(
                    membership,
                    membershipLifecyclePolicy.effectiveStatus(membership, today)
                ))
                .toList(),
            ptSessionPackageRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .map(sessionPackage -> PtSessionPackageResponse.from(
                    sessionPackage,
                    membershipLifecyclePolicy.effectiveStatus(sessionPackage, today)
                ))
                .toList(),
            debts.stream().map(DebtRecordResponse::from).toList(),
            paymentRepository.findByMemberIdOrderByPaymentDateDesc(memberId).stream()
                .map(PaymentResponse::from)
                .toList(),
            ptScheduleRepository.findByMemberIdOrderByScheduleDateDesc(memberId).stream()
                .map(PtScheduleResponse::from)
                .toList(),
            ptSessionLogRepository.findByMemberIdOrderBySessionDateDesc(memberId).stream()
                .map(PtSessionLogResponse::from)
                .toList(),
            bodyMeasurementRepository.findByMemberIdOrderByRecordedAtDesc(memberId).stream()
                .map(BodyMeasurementResponse::from)
                .toList(),
            ptGoalRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(PtGoalResponse::from)
                .toList(),
            debts.stream()
                .filter(debt -> debt.getStatus() == DebtStatus.OPEN || debt.getStatus() == DebtStatus.PARTIALLY_PAID)
                .map(DebtRecord::getRemainingAmount)
                .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
    }

}
