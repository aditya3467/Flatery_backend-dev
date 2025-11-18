package com.Flatery.repository.help;

import com.Flatery.model.help.ComplaintResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintResponseRepository extends JpaRepository<ComplaintResponse, Long> {

    // Find all responses for a complaint (ordered by responded date)
    List<ComplaintResponse> findByComplaintIdOrderByRespondedAtAsc(Long complaintId);

    // Find all owner responses for a complaint
    List<ComplaintResponse> findByComplaintIdAndIsOwnerResponseTrueOrderByRespondedAtAsc(Long complaintId);

    // Find all tenant responses for a complaint
    List<ComplaintResponse> findByComplaintIdAndIsOwnerResponseFalseOrderByRespondedAtAsc(Long complaintId);

    // Count total responses for a complaint
    Long countByComplaintId(Long complaintId);

    // Count owner responses for a complaint
    Long countByComplaintIdAndIsOwnerResponseTrue(Long complaintId);

    // Check if complaint has any responses
    boolean existsByComplaintId(Long complaintId);
}
