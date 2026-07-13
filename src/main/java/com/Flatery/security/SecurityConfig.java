package com.Flatery.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Lazy UserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll() // Allow CORS preflight
                        .requestMatchers("/api/auth/**").permitAll() // Allow all auth endpoints
                        .requestMatchers("/api/setup/**").permitAll() // Allow setup endpoints (DELETE AFTER FIRST USE!)
                        .requestMatchers("/api/superadmin/**").permitAll() // SuperAdmin endpoints - auth checked in controller
                        .requestMatchers("/api/properties/**").permitAll() // Allow public property listing
                        .requestMatchers("/api/tenants/check-active-tenancy").permitAll() // Allow active tenancy check for frontend validation
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll() // Allow Swagger UI access
                        .requestMatchers("/api/owner-payment-info/public/**").permitAll() // Allow tenants to fetch owner QR/UPI
            .requestMatchers("/frontend/**").permitAll() // Allow access to frontend files
            .requestMatchers("/", "/index.html", "/verify-email.html", "/unverified-email.html", "/about.html", "/search-property.html", "/request-callback.html", "/services.html", "/tenant.html", "/tenant-profile.html", "/tenant-dashboard.html", "/superadmin-dashboard.html", "/owner/**", "/components/**").permitAll()
            .requestMatchers("/verify-email").permitAll() // Public email verification landing route
            .requestMatchers("/unverified-email").permitAll() // Public unverified account landing route
            .requestMatchers("/css/**", "/Javascript/**", "/img/**").permitAll() // static assets
            .requestMatchers("/error", "/favicon.ico").permitAll() // Allow error page and favicon
                        .requestMatchers("/uploads/properties/**").permitAll() // Allow access to uploaded images
                        .requestMatchers("/uploads/payment-proofs/**").permitAll() // Allow access to payment proofs
                        .requestMatchers("/uploads/complaints/**").permitAll() // ← NEW: Complaint attachments
                        // payment api's endpoint
                                .requestMatchers("/api/transactions/**").authenticated()
                                .requestMatchers("/api/owner-payment-info/**").authenticated()
                                .requestMatchers("/api/receipts/**").authenticated()


                        // Complaints APIs - Authenticated (role-based in controller)
                        .requestMatchers("/api/complaints/**").authenticated() // ← NEW: Complaints endpoints
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Allow all origins for development
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
