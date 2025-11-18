package com.Flatery.service.help;

import com.Flatery.exception.help.InvalidComplaintActionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class ComplaintFileService {

    @Value("${file.upload.complaint-dir:uploads/complaints}")
    private String uploadDir;

    /**
     * Upload file and return URL
     */
    public String uploadFile(MultipartFile file, String complaintId) {
        validateFile(file);

        try {
            // Create directory for complaint if not exists
            Path complaintDirPath = Paths.get(uploadDir, complaintId);
            Files.createDirectories(complaintDirPath);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path targetPath = complaintDirPath.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/" + uploadDir + "/" + complaintId + "/" + filename;
            log.info("File uploaded successfully: {}", fileUrl);

            return fileUrl;

        } catch (IOException e) {
            log.error("Failed to upload file", e);
            throw new InvalidComplaintActionException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidComplaintActionException("File is empty");
        }

        // Check file size (max 5MB)
        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new InvalidComplaintActionException("File size exceeds maximum limit of 5MB");
        }

        // Check file type (only images)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidComplaintActionException("Only image files are allowed (jpg, png, jpeg, gif)");
        }
    }

    /**
     * Delete file from storage
     */
    public void deleteFile(String fileUrl) {
        try {
            Path filePath = Paths.get(fileUrl);
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileUrl);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileUrl, e);
        }
    }

    /**
     * Get file from storage
     */
    public byte[] getFile(String fileUrl) {
        try {
            Path filePath = Paths.get(fileUrl);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read file: {}", fileUrl, e);
            throw new InvalidComplaintActionException("Failed to read file: " + e.getMessage());
        }
    }
}
