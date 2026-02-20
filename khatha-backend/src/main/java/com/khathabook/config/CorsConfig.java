package com.khathabook.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// ❌ DISABLED via commenting out @Configuration (or just removing the bean logic)
// We are handling CORS in SecurityConfig.java to avoid conflicts.
// @Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
         // registry.addMapping("/**")
         //        .allowedOriginPatterns("*")
         //        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
         //        .allowedHeaders("*")
         //        .allowCredentials(true);
    }
}
