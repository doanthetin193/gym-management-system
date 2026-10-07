package com.gymduongdouble.backend.user.repository;

import com.gymduongdouble.backend.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles")
    java.util.List<User> findAllWithRoles();
}
