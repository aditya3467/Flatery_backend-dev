package com.Flatery.service.property;

import com.Flatery.model.property.Property;
import com.Flatery.model.property.PropertyView;
import com.Flatery.model.User;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.property.PropertyViewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyViewService {

    private final PropertyViewRepository viewRepository;
    private final PropertyRepository propertyRepository;

    /**
     * Record a property view
     * Returns true if view was recorded, false if duplicate within 24h
     */
    @Transactional
    public boolean recordView(
            Long propertyId,
            User user,
            String sessionId,
            String ipHash,
            String referrer,
            Integer viewDurationSeconds
    ) {
        // Validate property exists
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));

        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
        
        // Check if this is owner viewing their own property
        boolean isOwnerView = false;
        if (user != null && property.getOwnerId() != null) {
            isOwnerView = user.getId().equals(property.getOwnerId());
        }

        // For logged-in users: check if already viewed today
        if (user != null) {
            boolean alreadyViewed = viewRepository.existsByPropertyIdAndUserIdAndViewedAtAfter(
                    propertyId, user.getId(), oneDayAgo
            );
            if (alreadyViewed && !isOwnerView) {
                log.debug("User {} already viewed property {} in last 24h", user.getId(), propertyId);
                return false;
            }
        } 
        // For guests: check by session
        else if (sessionId != null && !sessionId.isEmpty()) {
            boolean alreadyViewed = viewRepository.existsByPropertyIdAndSessionIdAndViewedAtAfter(
                    propertyId, sessionId, oneDayAgo
            );
            if (alreadyViewed) {
                log.debug("Session {} already viewed property {} in last 24h", sessionId, propertyId);
                return false;
            }
        }

        // Record the view
        PropertyView view = PropertyView.builder()
                .propertyId(propertyId)
                .userId(user != null ? user.getId() : null)
                .sessionId(sessionId)
                .viewedAt(LocalDateTime.now())
                .viewDurationSeconds(viewDurationSeconds)
                .ipHash(ipHash)
                .referrer(referrer)
                .ownerView(isOwnerView)
                .build();

        viewRepository.save(view);
        log.info("Recorded view for property {} by {}", propertyId, 
                user != null ? "user " + user.getId() : "guest " + sessionId);

        return true;
    }

    /**
     * Get view count for a property (excludes owner views)
     */
    public long getPropertyViewCount(Long propertyId) {
        return viewRepository.countByPropertyId(propertyId);
    }

    /**
     * Get unique viewer count for a property
     */
    public long getUniqueViewerCount(Long propertyId) {
        return viewRepository.countUniqueUsersByPropertyId(propertyId);
    }
}
