package com.Flatery.repository;

import com.Flatery.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a specific user, ordered by most recent first
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find unread notifications for a specific user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Count unread notifications for a specific user
     */
    Long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Mark all notifications as read for a specific user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);

    /**
     * Delete all read notifications for a user (cleanup)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.isRead = true")
    int deleteAllReadByUserId(@Param("userId") Long userId);

    /**
     * Find notifications by type for a user
     */
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type);
}
