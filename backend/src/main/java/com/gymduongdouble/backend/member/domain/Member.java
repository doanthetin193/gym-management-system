package com.gymduongdouble.backend.member.domain;

import com.gymduongdouble.backend.common.domain.AuditableEntity;
import com.gymduongdouble.backend.common.enums.Gender;
import com.gymduongdouble.backend.common.enums.MemberSource;
import com.gymduongdouble.backend.common.enums.MemberStatus;
import com.gymduongdouble.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "members")
public class Member extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    // [TUYẾN PHÒNG THỦ TẦNG DATABASE - DEFENSE IN DEPTH]:
    // Cột phone có ràng buộc UNIQUE cứng trong PostgreSQL để chống race-condition
    // (nếu 2 thao tác cùng bấm tạo hồ sơ tại cùng 1 tích tắc, DB sẽ chặn đứng câu lệnh INSERT thứ hai).
    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender;

    private String address;

    @Column(name = "zalo_phone", length = 20)
    private String zaloPhone;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MemberSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MemberStatus status = MemberStatus.ACTIVE;

    @Column(columnDefinition = "text")
    private String note;
}
