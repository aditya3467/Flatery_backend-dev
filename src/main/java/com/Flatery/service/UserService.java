package com.Flatery.service;

import com.Flatery.dto.RegisterRequest;
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
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
        System.out.println("[Auth] loadUserByUsername called with: " + username + " -> key: " + key);
        User user = userRepo.findByUsernameOrEmail(key)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + key));
        System.out.println("[Auth] User resolved: id=" + user.getId() + ", username=" + user.getUsername() + ", email=" + user.getEmail());

        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .collect(Collectors.toSet());

        System.out.println("[Auth] Authorities: " + authorities);
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
