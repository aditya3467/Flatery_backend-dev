package com.Flatery.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static files from the frontend directory
        registry.addResourceHandler("/frontend/**")
                .addResourceLocations("file:frontend/")
                .setCachePeriod(3600);
        
        // Serve the main index.html at root
        registry.addResourceHandler("/")
                .addResourceLocations("file:frontend/")
                .setCachePeriod(3600);
    }
}
