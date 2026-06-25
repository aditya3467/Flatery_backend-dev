package com.Flatery.Controller;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriUtils;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:/frontend/index.html";
    }

    @GetMapping("/verify-email")
    public String verifyEmailPage(@RequestParam(value = "token", required = false) String token) {
        if (token == null || token.isBlank()) {
            return "redirect:/frontend/verify-email.html";
        }
        String encodedToken = UriUtils.encode(token, "UTF-8");
        return "redirect:/frontend/verify-email.html?token=" + encodedToken;
    }
}
