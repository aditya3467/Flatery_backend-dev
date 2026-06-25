package com.Flatery.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriUtils;

@Controller
public class HomeController {

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
        String encodedToken = UriUtils.encode(token, "UTF-8");
        return "redirect:" + frontendUrl("/verify-email.html?token=") + encodedToken;
    }
}
