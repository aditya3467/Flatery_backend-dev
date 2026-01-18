package com.Flatery.repository;

import com.Flatery.model.PasswordResetOtp;
import com.Flatery.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /**
     * Find the latest valid OTP for a given email
     */
    @Query("SELECT p FROM PasswordResetOtp p WHERE p.email = ?1 AND p.isUsed = false AND p.expiresAt > CURRENT_TIMESTAMP ORDER BY p.createdAt DESC LIMIT 1")
    Optional<PasswordResetOtp> findLatestValidOtpByEmail(String email);

    /**
     * Find OTP by email and OTP value
     */
    Optional<PasswordResetOtp> findByEmailAndOtp(String email, String otp);

    /**
     * Find all OTPs for a user
     */
    List<PasswordResetOtp> findByUser(User user);

    /**
     * Find unused OTPs for an email
     */
    @Query("SELECT p FROM PasswordResetOtp p WHERE p.email = ?1 AND p.isUsed = false")
    List<PasswordResetOtp> findUnusedOtpsByEmail(String email);

    /**
     * Delete expired OTPs (older than expiresAt date)
     */
    @Query("DELETE FROM PasswordResetOtp p WHERE p.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredOtps();

    /**
     * Delete used OTPs (optional cleanup)
     */
    @Query("DELETE FROM PasswordResetOtp p WHERE p.isUsed = true AND p.expiresAt < CURRENT_TIMESTAMP")
    void deleteUsedAndExpiredOtps();

    /**
     * Count recent OTP requests for rate limiting (last N minutes)
     */
    @Query("SELECT COUNT(p) FROM PasswordResetOtp p WHERE p.email = ?1 AND p.createdAt > ?2")
    long countRecentOtpRequestsByEmail(String email, LocalDateTime since);
}
