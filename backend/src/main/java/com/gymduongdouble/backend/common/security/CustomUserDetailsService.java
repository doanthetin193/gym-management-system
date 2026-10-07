package com.gymduongdouble.backend.common.security;

import com.gymduongdouble.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) {
        String cleanIdentifier = identifier == null ? "" : identifier.trim();
        return userRepository.findByEmail(cleanIdentifier)
            .or(() -> userRepository.findByPhone(cleanIdentifier))
            .map(AuthenticatedUser::new)
            .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản."));
    }
}
