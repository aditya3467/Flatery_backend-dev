package com.Flatery.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads/properties}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve absolute paths for resource locations
        String projectRoot = Paths.get("").toAbsolutePath().normalize().toString();
        String frontendPath = Paths.get(projectRoot, "frontend").toAbsolutePath().normalize().toUri().toString();

        // Serve static files from the frontend directory (entire tree)
        registry.addResourceHandler("/frontend/**")
                .addResourceLocations(frontendPath)
                .setCachePeriod(0);

        // Optionally also expose common static subpaths if referenced directly
        registry.addResourceHandler("/css/**", "/Javascript/**", "/img/**")
                .addResourceLocations(frontendPath + "css/", frontendPath + "Javascript/", frontendPath + "img/")
                .setCachePeriod(0);

        // Serve uploaded property images
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadPathStr = uploadPath.toUri().toString();
        registry.addResourceHandler("/uploads/properties/**")
                .addResourceLocations(uploadPathStr)
                .setCachePeriod(0);
    }
}
