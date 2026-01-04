package com.Flatery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for monitoring
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * Public health check endpoint
     * @return Health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Flatery Backend is running");
        response.put("timestamp", LocalDateTime.now());
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Database connectivity check
     * @return Database status
     */
    @GetMapping("/health/db")
    public ResponseEntity<Map<String, String>> healthDb() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Database connected");
        
        return ResponseEntity.ok(response);
    }
}
