package com.Flatery.Controller;

import com.Flatery.dto.UserLookupResponse;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<?> searchUser(
        @RequestParam(required = false) String username,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) String phone
    ) {
        if ((username == null || username.isBlank()) &&
            (email == null || email.isBlank()) &&
            (phone == null || phone.isBlank())) {
            return ResponseEntity.badRequest().body("Provide username or email or phone to search");
        }

        Optional<User> found = Optional.empty();
        if (phone != null && !phone.isBlank()) {
            String raw = phone.trim();
            // try exact first
            found = userRepository.findByPhoneNumber(raw);
            // if not found, try with last 10 digits
            if (found.isEmpty()) {
                String digits = raw.replaceAll("[^0-9]", "");
                if (digits.length() >= 10) {
                    String last10 = digits.substring(digits.length() - 10);
                    found = userRepository.findByPhoneNumberEndingWith(last10);
                }
            }
        }
        if (found.isEmpty() && email != null && !email.isBlank()) {
            found = userRepository.findByEmail(email.trim());
        }
        if (found.isEmpty() && username != null && !username.isBlank()) {
            found = userRepository.findByUsername(username.trim());
        }

        return found
                .map(u -> ResponseEntity.ok(new UserLookupResponse(
                        u.getId(), u.getUsername(), u.getEmail(), u.getPhoneNumber(), u.getFirstName(), u.getLastName(), u.getRoles()
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        // Get authenticated username (phone number)
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();

        // Fetch user by username
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            // Fallback: try phone number
            userOpt = userRepository.findByPhoneNumber(username);
        }

        return userOpt
                .map(u -> ResponseEntity.ok(new UserLookupResponse(
                        u.getId(), u.getUsername(), u.getEmail(), u.getPhoneNumber(), u.getFirstName(), u.getLastName(), u.getRoles()
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
