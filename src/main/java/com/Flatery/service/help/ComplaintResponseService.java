package com.Flatery.service.help;

import com.Flatery.dto.help.ComplaintResponseDTO;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.ComplaintResponse;
import com.Flatery.model.help.ResponseType;
import com.Flatery.repository.help.ComplaintResponseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling complaint responses and comments
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintResponseService {

    private final ComplaintResponseRepository responseRepository;

    /**
     * Add response to complaint
     */
    @Transactional
    public ComplaintResponse addResponse(Complaint complaint, Long responderId,
                                         String message, ResponseType responseType,
                                         boolean isOwnerResponse) {
        ComplaintResponse response = ComplaintResponse.builder()
                .complaintId(complaint.getId())
                .responderId(responderId)
                .message(message)
                .responseType(responseType)
                .isOwnerResponse(isOwnerResponse)
                .respondedAt(LocalDateTime.now())
                .build();

        response = responseRepository.save(response);

        log.info("{} added response to complaint {}: {}",
                isOwnerResponse ? "Owner" : "Tenant",
                complaint.getComplaintId(),
                responseType);

        return response;
    }

    /**
     * Add owner comment
     */
    @Transactional
    public ComplaintResponse addOwnerComment(Complaint complaint, Long ownerId, String message) {
        return addResponse(complaint, ownerId, message, ResponseType.COMMENT, true);
    }

    /**
     * Add tenant comment
     */
    @Transactional
    public ComplaintResponse addTenantComment(Complaint complaint, Long tenantId, String message) {
        return addResponse(complaint, tenantId, message, ResponseType.COMMENT, false);
    }

    /**
     * Get all responses for a complaint
     */
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getResponsesByComplaintId(Long complaintId) {
        return responseRepository.findByComplaintIdOrderByRespondedAtAsc(complaintId);
    }

    /**
     * Validate response message
     */
    public void validateResponse(String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Response message cannot be empty");
        }

        if (message.trim().length() < 5) {
            throw new IllegalArgumentException("Response message must be at least 5 characters");
        }

        if (message.trim().length() > 1000) {
            throw new IllegalArgumentException("Response message cannot exceed 1000 characters");
        }
    }
}
