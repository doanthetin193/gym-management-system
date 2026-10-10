package com.gymduongdouble.backend.membership.service;

import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.membership.domain.MembershipPlan;
import com.gymduongdouble.backend.membership.repository.MembershipPlanRepository;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanRequest;
import com.gymduongdouble.backend.membership.web.dto.MembershipPlanResponse;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MembershipPlanService {

    private final MembershipPlanRepository membershipPlanRepository;

    @Transactional
    public MembershipPlanResponse create(MembershipPlanRequest request) {
        validatePlanShape(request);
        String cleanName = request.name().trim();
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
        plan.setPriceRatio(request.priceRatio());
        plan.setDescription(request.description());
        plan.setActive(request.active() == null || request.active());

        return MembershipPlanResponse.from(membershipPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> listAll() {
        return membershipPlanRepository.findAllByOrderByNameAsc().stream()
            .map(MembershipPlanResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> listActive() {
        return membershipPlanRepository.findByActiveTrueOrderByNameAsc().stream()
            .map(MembershipPlanResponse::from)
            .toList();
    }

    @Transactional
    public MembershipPlanResponse updateActive(Long id, boolean active) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói tập."));
        plan.setActive(active);
        return MembershipPlanResponse.from(plan);
    }

    private void validatePlanShape(MembershipPlanRequest request) {
        switch (request.planType()) {
            case PT -> {
                if (request.ptLevel() == null) {
                    throw new BadRequestException("Gói PT phải có cấp PT chính hoặc PT mới.");
                }
                if (request.ptSessionCount() == null || request.ptSessionCount() <= 0) {
                    throw new BadRequestException("Gói PT phải có số buổi PT lớn hơn 0.");
                }
            }
            case GUIDANCE -> {
                if (request.guidanceSessionCount() == null || request.guidanceSessionCount() <= 0) {
                    throw new BadRequestException("Gói giáo án phải có số buổi giáo án lớn hơn 0.");
                }
            }
            default -> {
            }
        }
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
