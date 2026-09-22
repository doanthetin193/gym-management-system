package com.gymduongdouble.backend.common.config;

import com.gymduongdouble.backend.common.domain.SystemSetting;
import com.gymduongdouble.backend.common.enums.FinancialCategoryType;
import com.gymduongdouble.backend.common.enums.UserStatus;
import com.gymduongdouble.backend.common.repository.SystemSettingRepository;
import com.gymduongdouble.backend.finance.domain.FinancialCategory;
import com.gymduongdouble.backend.finance.repository.FinancialCategoryRepository;
import com.gymduongdouble.backend.user.domain.Role;
import com.gymduongdouble.backend.user.domain.User;
import com.gymduongdouble.backend.user.repository.RoleRepository;
import com.gymduongdouble.backend.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final FinancialCategoryRepository financialCategoryRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.owner.username:owner}")
    private String ownerUsername;

    @Value("${app.seed.owner.password:change_me}")
    private String ownerPassword;

    @Value("${app.seed.owner.full-name:Gym Owner}")
    private String ownerFullName;

    @Value("${app.seed.owner.phone:}")
    private String ownerPhone;

    @Value("${app.seed.owner.email:}")
    private String ownerEmail;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedOwner();
        seedFinancialCategories();
        seedSystemSettings();
    }

    private void seedRoles() {
        createRoleIfMissing("OWNER", "Owner");
        createRoleIfMissing("PT", "Personal Trainer");
        createRoleIfMissing("MEMBER", "Member");
    }

    private void createRoleIfMissing(String code, String name) {
        roleRepository.findByCode(code).orElseGet(() -> {
            Role role = new Role();
            role.setCode(code);
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private void seedOwner() {
        if (!StringUtils.hasText(ownerPassword)) {
            return;
        }

        Role ownerRole = roleRepository.findByCode("OWNER")
            .orElseThrow(() -> new IllegalStateException("OWNER role is missing."));

        User owner = userRepository.findByUsername(ownerUsername)
            .orElseGet(() -> {
                User user = new User();
                user.setUsername(ownerUsername);
                return user;
            });

        owner.setPasswordHash(passwordEncoder.encode(ownerPassword));
        owner.setFullName(ownerFullName);
        owner.setPhone(StringUtils.hasText(ownerPhone) ? ownerPhone : null);
        owner.setEmail(StringUtils.hasText(ownerEmail) ? ownerEmail : null);
        owner.setStatus(UserStatus.ACTIVE);
        owner.getRoles().clear();
        owner.getRoles().add(ownerRole);
        userRepository.save(owner);
    }

    private void seedFinancialCategories() {
        List<SeedFinancialCategory> categories = List.of(
            new SeedFinancialCategory(FinancialCategoryType.INCOME, "SELF_TRAINING", "Self training"),
            new SeedFinancialCategory(FinancialCategoryType.INCOME, "GUIDANCE", "Guidance"),
            new SeedFinancialCategory(FinancialCategoryType.INCOME, "PT_MAIN", "Main PT"),
            new SeedFinancialCategory(FinancialCategoryType.INCOME, "PT_NEW", "New PT"),
            new SeedFinancialCategory(FinancialCategoryType.INCOME, "OTHER_INCOME", "Other income"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "RENT", "Rent"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "MARKETING", "Marketing"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "ELECTRICITY", "Electricity"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "WATER", "Water"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "WASTE", "Waste"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "INTERNET", "Internet"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "DRINKING_WATER", "Drinking water"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "PT_SALARY", "PT salary"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "BONUS", "Bonus"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "HOLIDAY_BONUS", "Holiday bonus"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "STAFF_EXPENSE", "Staff expense"),
            new SeedFinancialCategory(FinancialCategoryType.EXPENSE, "OTHER_EXPENSE", "Other expense")
        );

        categories.forEach(category -> financialCategoryRepository.findByCode(category.code()).orElseGet(() -> {
            FinancialCategory financialCategory = new FinancialCategory();
            financialCategory.setType(category.type());
            financialCategory.setCode(category.code());
            financialCategory.setName(category.name());
            financialCategory.setActive(true);
            return financialCategoryRepository.save(financialCategory);
        }));
    }

    private void seedSystemSettings() {
        createSettingIfMissing("membership.expiring_soon_days", "7", "Days before membership expiration to show warning");
        createSettingIfMissing("notification.birthday_time", "06:00", "Default birthday reminder time");
    }

    private void createSettingIfMissing(String key, String value, String description) {
        systemSettingRepository.findById(key).orElseGet(() -> {
            SystemSetting setting = new SystemSetting();
            setting.setKey(key);
            setting.setValue(value);
            setting.setDescription(description);
            setting.setUpdatedAt(Instant.now());
            return systemSettingRepository.save(setting);
        });
    }

    private record SeedFinancialCategory(FinancialCategoryType type, String code, String name) {
    }
}
