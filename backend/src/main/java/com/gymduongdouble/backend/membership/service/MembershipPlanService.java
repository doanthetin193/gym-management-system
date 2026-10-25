package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MembershipPlanRepository;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanRequest;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanResponse;
import com.gymduongdouble.backend.membership.web.dto.PublicMembershipPlanResponse;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dịch vụ Quản lý Danh mục Gói tập (Membership Plan - Master Data):
 * 
 * [KIẾN TRÚC & NGHIỆP VỤ BẢNG GIÁ]:
 * 1. Master Data vs Transactional Data:
 *    - MembershipPlan: Danh mục sản phẩm mẫu, bảng giá niêm yết do OWNER quản lý.
 *    - MemberMembership: Hợp đồng mua gói thực tế của từng hội viên.
 * 2. Giá niêm yết (defaultPrice) vs Giá bán thực tế (actualPrice):
 *    - defaultPrice chỉ là giá tham chiếu. Giá thực tế trên từng hợp đồng (actualPrice)
 *      có thể được chiết khấu/thỏa thuận riêng và là giá bất biến (immutable).
 *    - Doanh thu phòng gym tuyệt đối không tính bằng count * defaultPrice, mà tính theo dòng tiền thực thu.
 * 3. Nguyên tắc Không Xóa Cứng (Soft Active Toggle):
 *    - Khi ngừng bán một gói, chỉ cập nhật cờ active = false chứ KHÔNG dùng lệnh DELETE,
 *      giúp bảo toàn toàn vẹn lịch sử các hợp đồng hội viên đã mua trong quá khứ.
 */
@Service
@RequiredArgsConstructor
public class MembershipPlanService {

    private final MembershipPlanRepository membershipPlanRepository;

    /**
     * Tạo mới gói tập mẫu vào danh mục:
     * - BƯỚC 1: validatePlanShape() kiểm tra cấu trúc 4 loại gói (SELF_TRAINING, PT, GUIDANCE, OTHER).
     * - BƯỚC 2: existsByNameIgnoreCase() kiểm tra chống trùng tên không phân biệt hoa thường ở tầng Service
     *   (Lưu ý: Bảng DB không đặt UNIQUE vật lý cho cột name, đây là ràng buộc nghiệp vụ do tầng Service kiểm soát).
     * - BƯỚC 3: Lưu gói với giá niêm yết defaultPrice (chuẩn hóa null -> 0).
     */
    @Transactional
    public MembershipPlanResponse create(MembershipPlanRequest request) {
        validatePlanShape(request);
        String cleanName = request.name().trim();
        // Kiểm tra trùng lặp tên gói không phân biệt chữ hoa/thường (SQL: LOWER(name) = LOWER(?))
        if (membershipPlanRepository.existsByNameIgnoreCase(cleanName)) {
            throw new ConflictException("Tên gói tập này đã tồn tại.");
        }

        MembershipPlan plan = new MembershipPlan();
        plan.setName(cleanName);
        plan.setPlanType(request.planType());
        plan.setPtLevel(request.ptLevel());
        plan.setDurationDays(request.durationDays());
        plan.setDefaultPrice(valueOrZero(request.defaultPrice()));
        plan.setPtSessionCount(request.ptSessionCount());
        plan.setPracticeSessionCount(request.practiceSessionCount());
        plan.setGuidanceSessionCount(request.guidanceSessionCount());
        plan.setDescription(request.description());
        plan.setActive(request.active() == null || request.active());

        return MembershipPlanResponse.from(membershipPlanRepository.save(plan));
    }

    /**
     * Lấy toàn bộ danh mục gói tập (kể cả gói đã ngừng bán active = false):
     * - Dành riêng cho OWNER xem và cấu hình tại màn hình Cài đặt hệ thống.
     */
    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> listAll() {
        return membershipPlanRepository.findAllByOrderByNameAsc().stream()
            .map(MembershipPlanResponse::from)
            .toList();
    }

    /**
     * Lấy danh sách các gói tập đang kinh doanh (active = true):
     * - Dành cho cả OWNER và PT để đổ vào dropdown khi đăng ký gói tập cho hội viên.
     */
    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> listActive() {
        return membershipPlanRepository.findByActiveTrueOrderByNameAsc().stream()
            .map(MembershipPlanResponse::from)
            .toList();
    }

    /**
     * Bảng giá công khai cho khách vãng lai xem trên trang chủ:
     * - Không yêu cầu đăng nhập, chỉ lấy gói active = true.
     * - Trả về DTO rút gọn PublicMembershipPlanResponse (ẩn các trường nội bộ/quản trị).
     */
    @Transactional(readOnly = true)
    public List<PublicMembershipPlanResponse> listPublic() {
        return membershipPlanRepository.findByActiveTrueOrderByNameAsc().stream()
            .map(PublicMembershipPlanResponse::from)
            .toList();
    }

    /**
     * Bật/tắt trạng thái kinh doanh của gói tập (Soft Active Toggle):
     * - Khi active = false: Gói biến mất khỏi trang công khai và dropdown bán gói ở quầy.
     * - Tuyệt đối không xóa bản ghi khỏi DB để bảo toàn toàn vẹn dữ liệu cho các hợp đồng cũ.
     */
    @Transactional
    public MembershipPlanResponse updateActive(Long id, boolean active) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói tập."));
        plan.setActive(active);
        return MembershipPlanResponse.from(plan);
    }

    /**
     * Thẩm định cấu trúc hình dáng gói tập theo ma trận 4 loại hình dịch vụ:
     * 
     * [TẠI SAO PHẢI THẨM ĐỊNH THỦ CÔNG TẠI SERVICE MÀ KHÔNG DÙNG @NotNull TRÊN DTO?]:
     * - Vì tính hợp lệ mang tính phụ thuộc chéo (Conditional Validation):
     *   Ví dụ: ptLevel bắt buộc có khi planType == PT, nhưng lại CẤM có khi planType == SELF_TRAINING.
     *   Bean Validation annotation chuẩn không thể kiểm tra logic điều kiện chéo này.
     * 
     * [ĐIỂM TINH TẾ VỀ KIỂM TRA != null THAY VÌ > 0]:
     * - Khi kiểm tra if (request.guidanceSessionCount() != null), nếu client gửi số 0 thì vẫn bị từ chối ngay.
     * - Ép client không được gửi các trường rác không thuộc phạm vi loại gói đang tạo.
     */
    private void validatePlanShape(MembershipPlanRequest request) {
        if (request.durationDays() == null || request.durationDays() <= 0) {
            throw new BadRequestException("Goi tap phai co thoi han su dung lon hon 0 ngay.");
        }

        switch (request.planType()) {
            case PT -> {
                // Gói PT: Bắt buộc ptLevel, ptSessionCount > 0, practiceSessionCount > 0. Cấm guidanceSessionCount.
                if (request.guidanceSessionCount() != null) {
                    throw new BadRequestException("Goi PT khong duoc co so buoi huong dan/tri lieu.");
                }
                if (request.ptLevel() == null) {
                    throw new BadRequestException("Gói PT phải có cấp PT chính hoặc PT mới.");
                }
                if (request.ptSessionCount() == null || request.ptSessionCount() <= 0) {
                    throw new BadRequestException("Gói PT phải có số buổi PT lớn hơn 0.");
                }
                if (request.practiceSessionCount() == null || request.practiceSessionCount() <= 0) {
                    throw new BadRequestException("Goi PT phai co so buoi huong dan/on tap lon hon 0.");
                }
            }
            case GUIDANCE -> {
                // Gói Giáo án / Trị liệu: Bắt buộc guidanceSessionCount > 0. Cấm mọi trường liên quan đến PT.
                ensureNoPtFields(request);
                if (request.guidanceSessionCount() == null || request.guidanceSessionCount() <= 0) {
                    throw new BadRequestException("Gói giáo án phải có số buổi giáo án lớn hơn 0.");
                }
            }
            default -> {
                // Gói Tự tập (SELF_TRAINING) hoặc Gói Khác (OTHER): Cấm cả trường PT lẫn trường giáo án.
                ensureNoPtFields(request);
                if (request.guidanceSessionCount() != null) {
                    throw new BadRequestException("Goi nay khong duoc co so buoi huong dan/tri lieu.");
                }
            }
        }
    }

    /**
     * Đảm bảo gói không chứa bất kỳ trường nào dành riêng cho Huấn luyện viên cá nhân (PT).
     */
    private void ensureNoPtFields(MembershipPlanRequest request) {
        if (request.ptLevel() != null || request.ptSessionCount() != null || request.practiceSessionCount() != null) {
            throw new BadRequestException("Chi goi PT moi duoc khai bao cap PT va so buoi PT/on tap.");
        }
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
