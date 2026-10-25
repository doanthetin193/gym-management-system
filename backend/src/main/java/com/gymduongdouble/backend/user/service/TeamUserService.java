package com.gymduongdouble.backend.user.service;

import com.gymduongdouble.backend.common.enums.PtLevel;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.exception.BadRequestException;
import com.gymduongdouble.backend.common.exception.ConflictException;
import com.gymduongdouble.backend.common.exception.ResourceNotFoundException;
import com.gymduongdouble.backend.common.security.AuthenticatedUser;
import com.gymduongdouble.backend.common.security.PasswordPolicy;
import com.gymduongdouble.backend.common.validation.VietnamPhoneNormalizer;
import com.gymduongdouble.backend.pt.domain.PtProfile;
import com.gymduongdouble.backend.pt.repository.PtProfileRepository;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;
import com.gymduongdouble.backend.user.web.dto.CreateTeamUserRequest;
import com.gymduongdouble.backend.user.web.dto.TeamUserResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dịch vụ Quản lý Nhân sự Nội bộ (Team Users: OWNER và PT).
 * 
 * ====================================================================================
 * CÁC QUY TẮC NGHIỆP VỤ & CHỐT CHẶN BẢO MẬT CỐT LÕI (MENTOR NOTES):
 * 1. Cơ chế Vai trò Kép (Dual-Role: Chủ phòng kiêm PT):
 *    - Trong phòng gym tư nhân/quy mô vừa, Chủ phòng (OWNER) thường trực tiếp đứng lớp dạy học viên.
 *    - Do đó, khi tạo hoặc nâng cấp một tài khoản lên OWNER, hệ thống TỰ ĐỘNG cấp kèm vai trò PT
 *      (user.getRoles().add(teamRole("PT"))) và tự động sinh một PtProfile (active=true) nếu chưa có.
 * 2. Gate 1 - Chống tự can thiệp (Anti-Self-Modification):
 *    - Tài khoản đang đăng nhập (currentUser) KHÔNG ĐƯỢC PHÉP tự đổi vai trò của chính mình
 *      hoặc tự khóa tài khoản của mình. Điều này ngăn ngừa sơ suất tự tước quyền quản trị.
 * 3. Gate 2 - Phòng thủ Chủ phòng cuối cùng (Anti-Lockout / Orphaned System Defense):
 *    - Hàm `ensureNotLastActiveOwner()` kiểm tra xem có ít nhất 2 OWNER đang ACTIVE trong hệ thống
 *      trước khi cho phép hạ quyền (thành PT) hoặc khóa (LOCKED) một OWNER.
 *    - Điều này ngăn chặn 100% tình huống phòng gym mất sạch quản trị viên tối cao.
 * 4. Gate 3 - Đồng bộ trạng thái Huấn Luyện Viên (PtProfile Synchronization):
 *    - Khi một tài khoản PT/OWNER bị khóa (status = LOCKED), hệ thống tự động tìm PtProfile
 *      tương ứng và đặt `profile.setActive(false)`. Nhờ vậy, Chủ phòng sẽ không phân công
 *      học viên mới hoặc xếp lịch cho một PT đã bị vô hiệu hóa tài khoản.
 * 5. Gate 4 - Thu hồi phiên đăng nhập tức thì (Token Revocation via authVersion++):
 *    - Khi reset mật khẩu cho nhân sự, gọi `user.revokeActiveTokens()` để tăng `authVersion`.
 *    - Mọi JWT token cũ được cấp trước đó ngay lập tức bị từ chối ở tầng JwtAuthenticationFilter,
 *      ngăn chặn triệt để nhân viên cũ tiếp tục truy cập dữ liệu nội bộ.
 * ====================================================================================
 */
@Service
@RequiredArgsConstructor
public class TeamUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PtProfileRepository ptProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final VietnamPhoneNormalizer phoneNormalizer;

    /**
     * Lấy danh sách toàn bộ nhân sự nội bộ (chỉ bao gồm người dùng có vai trò OWNER hoặc PT).
     * Loại trừ các tài khoản Hội viên (MEMBER) thông thường.
     */
    @Transactional(readOnly = true)
    public List<TeamUserResponse> listTeamUsers() {
        return userRepository.findAllWithRoles().stream()
            .filter(user -> user.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode()) || "PT".equals(r.getCode())))
            .sorted(Comparator.comparing(User::getId))
            .map(TeamUserResponse::from)
            .toList();
    }

    /**
     * Tạo mới tài khoản nhân sự (OWNER hoặc PT).
     * Áp dụng chuẩn hóa email, số điện thoại Việt Nam, kiểm tra trùng lặp và cấp quyền kép cho OWNER.
     */
    @Transactional
    public TeamUserResponse createTeamUser(CreateTeamUserRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new ConflictException("Email này đã được sử dụng trong hệ thống.");
        }

        String cleanPhone = phoneNormalizer.normalizeOptional(request.phone(), "Số điện thoại");
        if (cleanPhone != null) {
            if (userRepository.findByPhone(cleanPhone).isPresent()) {
                throw new ConflictException("Số điện thoại này đã được sử dụng.");
            }
        }

        // Chỉ chấp nhận 2 vai trò nội bộ hợp lệ: "OWNER" hoặc "PT"
        String targetRoleCode = requireTeamRole(request.roleCode());
        Role role = roleRepository.findByCode(targetRoleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + targetRoleCode));

        User user = new User();
        user.setEmail(cleanEmail);
        user.setFullName(request.fullName().trim());
        user.setPhone(cleanPhone);
        user.setPasswordHash(passwordEncoder.encode(
            passwordPolicy.requireValid(request.password(), cleanEmail, cleanPhone)
        ));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(role);

        // QUY TẮC: Nếu tạo mới OWNER -> Tự động cấp thêm vai trò PT để Chủ phòng có thể dạy học viên
        if ("OWNER".equals(targetRoleCode)) {
            user.getRoles().add(teamRole("PT"));
        }
        User savedUser = userRepository.save(user);

        // Đảm bảo nhân sự (PT hoặc OWNER) có hồ sơ PtProfile để phục vụ xếp lịch tập
        if ("PT".equals(targetRoleCode) || "OWNER".equals(targetRoleCode)) {
            createPtProfileIfMissing(savedUser);
        }

        return TeamUserResponse.from(savedUser);
    }

    /**
     * Thay đổi vai trò nhân sự (VD: Thăng cấp PT lên OWNER, hoặc giáng cấp OWNER xuống PT).
     * Có chốt chặn chống tự đổi role và chống giáng cấp OWNER cuối cùng.
     */
    @Transactional
    public TeamUserResponse updateRole(Long userId, String roleCode, AuthenticatedUser currentUser) {
        // CHỐT CHẶN 1: Không được tự đổi vai trò của chính mình
        if (currentUser != null && currentUser.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể thay đổi vai trò của chính mình.");
        }

        User user = findUser(userId);
        String targetRoleCode = requireTeamRole(roleCode);

        // CHỐT CHẶN 2: Nếu muốn hạ OWNER xuống PT, phải đảm bảo còn ít nhất 1 OWNER khác đang ACTIVE
        if ("PT".equals(targetRoleCode)) {
            ensureNotLastActiveOwner(user);
        }

        Role newRole = roleRepository.findByCode(targetRoleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + targetRoleCode));

        user.getRoles().clear();
        user.getRoles().add(newRole);

        // Nếu chuyển thành OWNER -> Gán kèm role PT
        if ("OWNER".equals(targetRoleCode)) {
            user.getRoles().add(teamRole("PT"));
        }
        User saved = userRepository.save(user);

        // Đảm bảo luôn tồn tại PtProfile cho nhân sự
        if ("PT".equals(targetRoleCode) || "OWNER".equals(targetRoleCode)) {
            createPtProfileIfMissing(saved);
        }

        return TeamUserResponse.from(saved);
    }

    /**
     * Cập nhật trạng thái nhân sự (ACTIVE / LOCKED).
     * Có chốt chặn chống tự khóa tài khoản, bảo vệ OWNER cuối cùng, và đồng bộ cờ active ở PtProfile.
     */
    @Transactional
    public TeamUserResponse updateStatus(Long userId, UserStatus status, AuthenticatedUser currentUser) {
        // CHỐT CHẶN 1: Không được tự khóa chính mình
        if (currentUser != null && currentUser.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể khóa tài khoản của chính mình.");
        }

        User user = findUser(userId);

        // CHỐT CHẶN 2: Không được khóa OWNER cuối cùng còn hoạt động
        if (status == UserStatus.LOCKED) {
            ensureNotLastActiveOwner(user);
        }
        user.setStatus(status);

        // CHỐT CHẶN 3: Đồng bộ trạng thái sang PtProfile (Nếu user bị LOCKED thì hồ sơ PT cũng bị ngưng hoạt động)
        ptProfileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setActive(status == UserStatus.ACTIVE);
            ptProfileRepository.save(profile);
        });
        return TeamUserResponse.from(userRepository.save(user));
    }

    /**
     * Đặt lại mật khẩu nhân sự bởi Chủ phòng (Admin Reset).
     * Tự động kích hoạt cơ chế thu hồi token (Token Revocation) để đăng xuất mọi phiên làm việc cũ.
     */
    @Transactional
    public TeamUserResponse resetPassword(Long userId, String newPassword) {
        User user = findUser(userId);
        user.setPasswordHash(passwordEncoder.encode(
            passwordPolicy.requireValid(newPassword, user.getEmail(), user.getPhone())
        ));

        // CHỐT CHẶN BẢO MẬT: authVersion++ khiến mọi JWT token đã phát hành trước đó bị vô hiệu hóa tức thì
        user.revokeActiveTokens();
        return TeamUserResponse.from(userRepository.save(user));
    }

    /**
     * Kiểm tra bảo vệ: Ngăn chặn tình huống không còn Chủ phòng nào hoạt động trong hệ thống (Orphaned System).
     */
    private void ensureNotLastActiveOwner(User user) {
        boolean isActiveOwner = user.getStatus() == UserStatus.ACTIVE
            && user.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode()));
        if (!isActiveOwner) {
            return;
        }

        // Đếm số lượng tài khoản OWNER đang ở trạng thái ACTIVE
        long activeOwnerCount = userRepository.findAll().stream()
            .filter(u -> u.getStatus() == UserStatus.ACTIVE)
            .filter(u -> u.getRoles().stream().anyMatch(r -> "OWNER".equals(r.getCode())))
            .count();
        if (activeOwnerCount <= 1) {
            throw new BadRequestException("Hệ thống phải có ít nhất một Chủ phòng đang hoạt động.");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID " + userId));
    }

    private Role teamRole(String roleCode) {
        return roleRepository.findByCode(roleCode)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + roleCode));
    }

    /**
     * Tự động khởi tạo hồ sơ Huấn luyện viên (PtProfile) mặc định nếu nhân sự chưa có hồ sơ trong DB.
     */
    private void createPtProfileIfMissing(User user) {
        ptProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            PtProfile profile = new PtProfile();
            profile.setUser(user);
            profile.setPtLevel(PtLevel.NEW);
            profile.setSpecialty("Huấn luyện viên thể hình");
            profile.setActive(true);
            return ptProfileRepository.save(profile);
        });
    }

    /**
     * Chuẩn hóa và ràng buộc chỉ cho phép vai trò nội bộ là OWNER hoặc PT.
     */
    private String requireTeamRole(String roleCode) {
        String normalized = roleCode == null ? "" : roleCode.trim().toUpperCase(Locale.ROOT);
        if (!"OWNER".equals(normalized) && !"PT".equals(normalized)) {
            throw new BadRequestException("Vai trò hệ thống chỉ có thể là OWNER hoặc PT.");
        }
        return normalized;
    }
}
