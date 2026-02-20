package com.khathabook.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            // ❌ Disable CSRF (REST API)
            .csrf(csrf -> csrf.disable())

            // ✅ Enable CORS
            .cors(cors -> {})

            // ❌ Disable default login page
            .formLogin(form -> form.disable())

            // ❌ Disable logout
            .logout(logout -> logout.disable())

            // ❌ Stateless session (API only)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ✅ Allow API + Google OAuth routes
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/**",
                    "/auth/**"     // 🔥 ADD THIS FOR GOOGLE OAUTH
                ).permitAll()
                .anyRequest().permitAll()
            );

        return http.build();
    }

    // ✅ REQUIRED FOR FRONTEND (Vite) + FILE UPLOAD + GOOGLE CALLBACK
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Allow frontend (Vite default port)
        // Allow ALL origins (Mobile, Localhost, Network) using Patterns
        config.setAllowedOriginPatterns(List.of("*"));

        // REMOVED setAllowedOrigins to avoid "IllegalArgumentException" with allowCredentials(true)
        // config.setAllowedOrigins(List.of(...));

        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
