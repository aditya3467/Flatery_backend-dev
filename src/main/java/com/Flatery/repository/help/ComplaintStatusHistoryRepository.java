package com.Flatery.repository.help;

import com.Flatery.model.help.ComplaintStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintStatusHistoryRepository extends JpaRepository<ComplaintStatusHistory, Long> {

    // Find status history for a complaint (ordered by changed date)
    List<ComplaintStatusHistory> findByComplaintIdOrderByChangedAtAsc(Long complaintId);

    // Find latest status change for a complaint
    ComplaintStatusHistory findTopByComplaintIdOrderByChangedAtDesc(Long complaintId);

    // Count total status changes for a complaint
    Long countByComplaintId(Long complaintId);
}
