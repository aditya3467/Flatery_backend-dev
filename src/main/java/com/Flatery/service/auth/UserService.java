package com.Flatery.service.auth;

import com.Flatery.dto.auth.RegisterRequest;
import com.Flatery.model.auth.RoleName;
import com.Flatery.model.auth.User;
import com.Flatery.repository.auth.UserRepository;
import jakarta.transaction.Transactional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String key = username.trim().toLowerCase();
        // Try to find user by username first, then by email
        User user = userRepo.findByUsername(key)
                .orElseGet(() -> userRepo.findByEmail(key)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found")));

        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .collect(Collectors.toSet());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(), authorities);
    }

    @Transactional
    public void register(RegisterRequest req) {
        String username = req.getUsername().trim().toLowerCase();
        String email = req.getEmail().trim().toLowerCase();

        if (userRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()
                && userRepo.existsByPhoneNumber(req.getPhoneNumber().trim())) {
            throw new IllegalArgumentException("Phone number already exists");
        }

        User user = new User();
        user.setFirstName(req.getFirstName().trim());
        user.setLastName(req.getLastName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPhoneNumber(req.getPhoneNumber() == null ? null : req.getPhoneNumber().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        Set<RoleName> roleSet = (req.getRoles() == null || req.getRoles().isEmpty())
                ? Set.of(RoleName.USER)
                : req.getRoles().stream()
                .map(s -> RoleName.valueOf(s.trim().toUpperCase()))
                .collect(Collectors.toSet());

        user.setRoles(roleSet);
        userRepo.save(user);
    }
}
