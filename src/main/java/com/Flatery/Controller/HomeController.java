package com.Flatery.Controller;

import com.Flatery.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriUtils;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final EmailVerificationService emailVerificationService;

    @Value("${flatery.frontend.base-path:/frontend}")
    private String frontendBasePath;

    private String frontendUrl(String path) {
        String base = frontendBasePath == null ? "" : frontendBasePath.trim();
        if (base.isEmpty() || "/".equals(base)) {
            return path.startsWith("/") ? path : "/" + path;
        }
        String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return normalizedBase + normalizedPath;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:" + frontendUrl("/index.html");
    }

    @GetMapping("/verify-email")
    public String verifyEmailPage(@RequestParam(value = "token", required = false) String token) {
        if (token == null || token.isBlank()) {
            return "redirect:" + frontendUrl("/verify-email.html");
        }

        try {
            emailVerificationService.verifyEmail(token);
            return "redirect:" + frontendUrl("/verify-email.html?verified=1");
        } catch (Exception ex) {
            String message = ex.getMessage() == null
                    ? "Verification failed. Link is invalid or expired."
                    : ex.getMessage();
            return "redirect:" + frontendUrl("/verify-email.html?verificationError=")
                    + UriUtils.encode(message, "UTF-8");
        }
    }

    @GetMapping("/unverified-email")
    public String unverifiedEmailPage(@RequestParam(value = "email", required = false) String email,
                                      @RequestParam(value = "username", required = false) String username) {
        StringBuilder target = new StringBuilder(frontendUrl("/unverified-email.html"));
        boolean hasQuery = false;

        if (email != null && !email.isBlank()) {
            target.append("?email=").append(UriUtils.encode(email, "UTF-8"));
            hasQuery = true;
        }

        if (username != null && !username.isBlank()) {
            target.append(hasQuery ? "&" : "?").append("username=").append(UriUtils.encode(username, "UTF-8"));
        }

        return "redirect:" + target;
    }
}
