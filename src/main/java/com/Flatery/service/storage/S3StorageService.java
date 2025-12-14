package com.Flatery.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucketName;

    public S3StorageService(
            S3Client s3Client,
            @Value("${aws.s3.bucket-name}") String bucketName) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        log.info("S3StorageService initialized with bucket: {}", bucketName);
    }

    /**
     * Store a single property image to S3
     */
    public String storePropertyImage(MultipartFile file, Long propertyId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        validateImageFile(file);

        try {
            String key = generatePropertyImageKey(propertyId, file.getOriginalFilename());
            uploadToS3(file, key);
            String url = getPublicUrl(key);
            log.info("Property image stored successfully: {}", url);
            return url;
        } catch (IOException ex) {
            log.error("Failed to store property image", ex);
            throw new RuntimeException("Failed to store property image", ex);
        }
    }

    /**
     * Store multiple property images
     */
    public List<String> storePropertyImages(List<MultipartFile> files, Long propertyId) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                urls.add(storePropertyImage(file, propertyId));
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

        validateImageFile(file);

        try {
            String key = generatePaymentProofKey(file.getOriginalFilename());
            uploadToS3(file, key);
            String url = getPublicUrl(key);
            log.info("Payment proof stored successfully: {}", url);
            return url;
        } catch (IOException ex) {
            log.error("Failed to store payment proof", ex);
            throw new RuntimeException("Failed to store payment proof", ex);
        }
    }

    /**
     * Store owner QR code
     */
    public String storeOwnerQRCode(MultipartFile file, Long ownerId) {
        log.info("=== storeOwnerQRCode called ===");
        log.info("File: {}, Size: {}, Owner ID: {}", file.getOriginalFilename(), file.getSize(), ownerId);
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        validateImageFile(file);

        try {
            String key = generateOwnerQRKey(ownerId, file.getOriginalFilename());
            log.info("Generated S3 key: {}", key);
            log.info("Uploading to bucket: {}", bucketName);
            
            uploadToS3(file, key);
            
            String url = getPublicUrl(key);
            log.info("Owner QR code stored successfully: {}", url);
            log.info("Check S3 console: https://s3.console.aws.amazon.com/s3/object/{}?region={}", bucketName, "ap-south-1");
            return url;
        } catch (IOException ex) {
            log.error("Failed to store owner QR code", ex);
            throw new RuntimeException("Failed to store owner QR code: " + ex.getMessage(), ex);
        }
    }

    /**
     * Store complaint attachment
     */
    public String storeComplaintAttachment(MultipartFile file, Long complaintId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        validateImageFile(file);

        try {
            String key = generateComplaintAttachmentKey(complaintId, file.getOriginalFilename());
            uploadToS3(file, key);
            String url = getPublicUrl(key);
            log.info("Complaint attachment stored successfully: {}", url);
            return url;
        } catch (IOException ex) {
            log.error("Failed to store complaint attachment", ex);
            throw new RuntimeException("Failed to store complaint attachment", ex);
        }
    }

    /**
     * Delete file from S3
     */
    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            
            s3Client.deleteObject(deleteRequest);
            log.info("File deleted from S3: {}", key);
        } catch (Exception ex) {
            log.error("Failed to delete file from S3: {}", fileUrl, ex);
            throw new RuntimeException("Failed to delete file from S3", ex);
        }
    }

    /**
     * Check if file exists in S3
     */
    public boolean fileExists(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            
            s3Client.headObject(headRequest);
            return true;
        } catch (NoSuchKeyException ex) {
            return false;
        } catch (Exception ex) {
            log.error("Error checking file existence: {}", fileUrl, ex);
            return false;
        }
    }

    // ========== Private Helper Methods ==========

    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 5MB");
        }
    }

    private void uploadToS3(MultipartFile file, String key) throws IOException {
        log.info("=== uploadToS3 called ===");
        log.info("Bucket: {}, Key: {}, ContentType: {}", bucketName, key, file.getContentType());
        
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                // No ACL - bucket must have public policy instead
                .build();

        log.info("Sending file to S3...");
        s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        log.info("S3 upload completed successfully!");
    }

    private String generatePropertyImageKey(Long propertyId, String originalFilename) {
        String extension = extractExtension(originalFilename);
        return String.format("properties/%d/%s%s", propertyId, UUID.randomUUID(), extension);
    }

    private String generatePaymentProofKey(String originalFilename) {
        String extension = extractExtension(originalFilename);
        return String.format("payment-proofs/payment-%d-%s%s", 
                System.currentTimeMillis(), UUID.randomUUID(), extension);
    }

    private String generateOwnerQRKey(Long ownerId, String originalFilename) {
        String extension = extractExtension(originalFilename);
        return String.format("owner-qr/%d/%s%s", ownerId, UUID.randomUUID(), extension);
    }

    private String generateComplaintAttachmentKey(Long complaintId, String originalFilename) {
        String extension = extractExtension(originalFilename);
        return String.format("complaints/%d/%s%s", complaintId, UUID.randomUUID(), extension);
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return ".jpg";
    }

    private String getPublicUrl(String key) {
        // Return S3 public URL
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    private String extractKeyFromUrl(String fileUrl) {
        // Extract key from S3 URL
        // Format: https://bucket-name.s3.amazonaws.com/key
        if (fileUrl.contains(".s3.amazonaws.com/")) {
            return fileUrl.substring(fileUrl.indexOf(".s3.amazonaws.com/") + 18);
        }
        return fileUrl;
    }
}
