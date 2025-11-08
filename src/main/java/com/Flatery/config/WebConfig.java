package com.Flatery.config;

<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Value;
=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

<<<<<<< HEAD
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads/properties}")
    private String uploadDir;

=======
@Configuration
public class WebConfig implements WebMvcConfigurer {

>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
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
<<<<<<< HEAD

        // Serve uploaded property images
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadPathStr = uploadPath.toUri().toString();
        
        registry.addResourceHandler("/uploads/properties/**")
                .addResourceLocations(uploadPathStr + "/");
=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
    }
}
