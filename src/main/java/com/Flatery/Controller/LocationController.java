package com.Flatery.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

    @GetMapping("/search")
    public ResponseEntity<?> searchLocation(@RequestParam String q, 
                                           @RequestParam(defaultValue = "5") int limit) {
        try {
            String url = String.format("%s/search?q=%s&format=json&addressdetails=1&limit=%d&countrycodes=in",
                    NOMINATIM_BASE_URL, 
                    java.net.URLEncoder.encode(q, "UTF-8"),
                    limit);
            
            String response = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"Failed to fetch location suggestions\"}");
        }
    }

    @GetMapping("/reverse")
    public ResponseEntity<?> reverseGeocode(@RequestParam double lat, 
                                           @RequestParam double lon) {
        try {
            String url = String.format("%s/reverse?lat=%f&lon=%f&format=json",
                    NOMINATIM_BASE_URL, lat, lon);
            
            String response = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"Failed to reverse geocode\"}");
        }
    }
}
