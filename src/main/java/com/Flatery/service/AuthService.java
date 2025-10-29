package com.Flatery.service;

import com.Flatery.dto.RegisterRequest;
import com.Flatery.dto.AuthResponse;
import com.Flatery.dto.LoginRequest;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.security.JwtService;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final UserService userService;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String jwtToken = jwtService.generateToken(principal);
        long expiresIn = jwtService.getExpirationTime();

        User user = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        Set<String> roles = user.getRoles().stream().map(Enum::name).collect(Collectors.toSet());

        AuthResponse resp = new AuthResponse();
        resp.setToken(jwtToken);
        resp.setTokenType("Bearer");
        resp.setExpiresIn(expiresIn);
        resp.setRoles(roles);
        return resp;
    }

    public void signup(RegisterRequest registerRequest) {
        userService.register(registerRequest);
    }
}
