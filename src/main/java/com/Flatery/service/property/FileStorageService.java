package com.Flatery.service.property;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir:uploads/properties}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("File storage location initialized: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Could not create upload directory", ex);
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }

    /**
     * Store a single file and return its relative URL path
     */
    public String storeFile(MultipartFile file, Long propertyId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Validate file size (5MB max)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }

        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            
            String filename = UUID.randomUUID().toString() + extension;
            
            // Create property-specific directory
            Path propertyDir = this.fileStorageLocation.resolve(propertyId.toString());
            Files.createDirectories(propertyDir);
            
            // Store file
            Path targetLocation = propertyDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Return relative URL path
            String relativePath = "/uploads/properties/" + propertyId + "/" + filename;
            log.info("File stored successfully: {}", relativePath);
            return relativePath;
            
        } catch (IOException ex) {
            log.error("Failed to store file", ex);
            throw new RuntimeException("Failed to store file", ex);
        }
    }

    /**
     * Store multiple files and return list of relative URL paths
     */
    public List<String> storeFiles(List<MultipartFile> files, Long propertyId) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                urls.add(storeFile(file, propertyId));
            }
        }
        return urls;
    }

    /**
     * Store payment proof screenshot
     */
    public String storePaymentProof(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Validate file size (5MB max)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }

        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            
            String filename = "payment-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString() + extension;
            
            // Create payment-proofs directory
            Path paymentProofsDir = Paths.get("uploads/payment-proofs").toAbsolutePath().normalize();
            Files.createDirectories(paymentProofsDir);
            
            // Store file
            Path targetLocation = paymentProofsDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Return relative URL path
            String relativePath = "/uploads/payment-proofs/" + filename;
            log.info("Payment proof stored successfully: {}", relativePath);
            return relativePath;
            
        } catch (IOException ex) {
            log.error("Failed to store payment proof", ex);
            throw new RuntimeException("Failed to store payment proof", ex);
        }
    }

    /**
     * Delete a file by its path
     */
    public void deleteFile(String fileUrl) {
        try {
            // Extract relative path from URL (remove /uploads/properties/ prefix)
            String relativePath = fileUrl.replace("/uploads/properties/", "");
            Path filePath = this.fileStorageLocation.resolve(relativePath).normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileUrl);
        } catch (IOException ex) {
            log.error("Failed to delete file: {}", fileUrl, ex);
        }
    }

    /**
     * Delete all files for a property
     */
    public void deletePropertyFiles(Long propertyId) {
        try {
            Path propertyDir = this.fileStorageLocation.resolve(propertyId.toString());
            if (Files.exists(propertyDir)) {
                Files.walk(propertyDir)
                    .sorted((a, b) -> b.compareTo(a)) // reverse order to delete files before directory
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            log.error("Failed to delete: {}", path, e);
                        }
                    });
                log.info("All files deleted for property: {}", propertyId);
            }
        } catch (IOException ex) {
            log.error("Failed to delete property files", ex);
        }
    }
}
