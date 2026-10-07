package com.gymduongdouble.backend.user.service;

import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import com.gymduongdouble.backend.pt.repository.PtProfileRepository;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;
import com.gymduongdouble.backend.user.web.dto.CreateTeamUserRequest;
import com.gymduongdouble.backend.user.web.dto.TeamUserResponse;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TeamUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PtProfileRepository ptProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<TeamUserResponse> listTeamUsers() {
        return userRepository.findAllWithRoles().stream()
            .filter(user -> user.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode()) || "PT".equals(r.getCode())))
            .sorted(Comparator.comparing(User::getId))
            .map(TeamUserResponse::from)
            .toList();
    }

    @Transactional
    public TeamUserResponse createTeamUser(CreateTeamUserRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new ConflictException("Email này đã được sử dụng trong hệ thống.");
        }

        if (StringUtils.hasText(request.phone())) {
            String cleanPhone = request.phone().trim();
            if (userRepository.findByPhone(cleanPhone).isPresent()) {
                throw new ConflictException("Số điện thoại này đã được sử dụng.");
            }
        }

        String targetRoleCode = "OWNER".equalsIgnoreCase(request.roleCode()) ? "OWNER" : "PT";
        Role role = roleRepository.findByCode(targetRoleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + targetRoleCode));

        User user = new User();
        user.setEmail(cleanEmail);
        user.setFullName(request.fullName().trim());
        user.setPhone(StringUtils.hasText(request.phone()) ? request.phone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(request.password().trim()));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(role);
        User savedUser = userRepository.save(user);

        if ("PT".equals(targetRoleCode)) {
            ptProfileRepository.findByUserId(savedUser.getId()).orElseGet(() -> {
                PtProfile profile = new PtProfile();
                profile.setUser(savedUser);
                profile.setPtLevel(PtLevel.NEW);
                profile.setSpecialty("Huấn luyện viên thể hình");
                profile.setBaseSalary(BigDecimal.ZERO);
                profile.setTeachingRate(new BigDecimal("0.30"));
                profile.setSalesCommissionRate(new BigDecimal("0.10"));
                profile.setActive(true);
                return ptProfileRepository.save(profile);
            });
        }

        return TeamUserResponse.from(savedUser);
    }

    @Transactional
    public TeamUserResponse updateRole(Long userId, String roleCode, AuthenticatedUser currentUser) {
        User user = findUser(userId);
        String targetRoleCode = "OWNER".equalsIgnoreCase(roleCode) ? "OWNER" : "PT";

        boolean isCurrentOwner = user.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode()));
        if (isCurrentOwner && !"OWNER".equals(targetRoleCode)) {
            long ownerCount = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE && u.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode())))
                .count();
            if (ownerCount <= 1) {
                throw new BadRequestException("Hệ thống phải có ít nhất một Chủ phòng đang hoạt động.");
            }
        }

        Role newRole = roleRepository.findByCode(targetRoleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + targetRoleCode));

        user.getRoles().clear();
        user.getRoles().add(newRole);
        User saved = userRepository.save(user);

        if ("PT".equals(targetRoleCode) && ptProfileRepository.findByUserId(saved.getId()).isEmpty()) {
            PtProfile profile = new PtProfile();
            profile.setUser(saved);
            profile.setPtLevel(PtLevel.NEW);
            profile.setSpecialty("Huấn luyện viên thể hình");
            profile.setActive(true);
            ptProfileRepository.save(profile);
        }

        return TeamUserResponse.from(saved);
    }

    @Transactional
    public TeamUserResponse updateStatus(Long userId, UserStatus status, AuthenticatedUser currentUser) {
        if (currentUser != null && currentUser.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể khóa tài khoản của chính mình.");
        }

        User user = findUser(userId);
        user.setStatus(status);
        return TeamUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public TeamUserResponse resetPassword(Long userId, String newPassword) {
        User user = findUser(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        return TeamUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteTeamUser(Long userId, AuthenticatedUser currentUser) {
        if (currentUser != null && currentUser.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể xóa tài khoản của chính mình.");
        }

        User user = findUser(userId);
        ptProfileRepository.findByUserId(userId).ifPresent(ptProfile -> {
            ptProfile.setActive(false);
            ptProfileRepository.save(ptProfile);
        });

        userRepository.delete(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID " + userId));
    }
}
