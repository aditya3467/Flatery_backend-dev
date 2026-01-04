package com.Flatery.repository.help;

import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.helpstatus;
import com.Flatery.model.help.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // Find complaint by unique complaint ID
    Optional<Complaint> findByComplaintId(String complaintId);

    // Find all complaints by tenant ID
    List<Complaint> findByTenantIdOrderBySubmittedAtDesc(Long tenantId);

    // Find complaints by tenant ID and status
    List<Complaint> findByTenantIdAndStatusOrderBySubmittedAtDesc(Long tenantId, helpstatus status);

    // Find all complaints by owner ID
    List<Complaint> findByOwnerIdOrderBySubmittedAtDesc(Long ownerId);

    // Find complaints by owner ID and status (with IN clause for multiple statuses)
    @Query("SELECT c FROM Complaint c WHERE c.ownerId = :ownerId " +
            "AND c.status IN :statuses " +
            "ORDER BY c.submittedAt DESC")
    List<Complaint> findByOwnerIdAndStatusOrderBySubmittedAtDesc(@Param("ownerId") Long ownerId, @Param("statuses") List<helpstatus> statuses);

    // Find pending complaints for owner (OPEN, IN_PROGRESS, REOPENED)
    @Query("SELECT c FROM Complaint c WHERE c.ownerId = :ownerId " +
            "AND c.status IN ('OPEN', 'IN_PROGRESS', 'REOPENED') " +
            "ORDER BY c.priority DESC, c.submittedAt ASC")
    List<Complaint> findPendingComplaintsByOwnerId(@Param("ownerId") Long ownerId);

    // Find all complaints by property ID
    List<Complaint> findByPropertyIdOrderBySubmittedAtDesc(Long propertyId);

    // Count complaints by tenant ID
    Long countByTenantId(Long tenantId);

    // Count open complaints by tenant ID
    Long countByTenantIdAndStatus(Long tenantId, helpstatus status);

    // Count complaints by owner ID
    Long countByOwnerId(Long ownerId);

    // Count open complaints by owner ID
    Long countByOwnerIdAndStatus(Long ownerId, helpstatus status);

    // Find SLA breached complaints for owner
    @Query("SELECT c FROM Complaint c WHERE c.ownerId = :ownerId " +
            "AND c.isSlaBreached = true " +
            "AND c.status NOT IN ('RESOLVED', 'CLOSED') " +
            "ORDER BY c.slaDeadline ASC")
    List<Complaint> findSlaBreachedComplaintsByOwnerId(@Param("ownerId") Long ownerId);

    // Find complaints nearing SLA deadline (within next 2 hours)
    @Query("SELECT c FROM Complaint c WHERE c.ownerId = :ownerId " +
            "AND c.isSlaBreached = false " +
            "AND c.status NOT IN ('RESOLVED', 'CLOSED') " +
            "AND c.slaDeadline <= :deadline " +
            "ORDER BY c.slaDeadline ASC")
    List<Complaint> findComplaintsNearingSla(@Param("ownerId") Long ownerId,
                                             @Param("deadline") LocalDateTime deadline);

    // Check if complaint exists and belongs to tenant
    boolean existsByIdAndTenantId(Long id, Long tenantId);

    // Check if complaint exists and belongs to owner
    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    // Get average resolution time for tenant
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.submittedAt, c.actualResolutionDate)) " +
            "FROM Complaint c WHERE c.tenantId = :tenantId " +
            "AND c.actualResolutionDate IS NOT NULL")
    Double getAverageResolutionTimeByTenantId(@Param("tenantId") Long tenantId);

    // Get average resolution time for owner
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.submittedAt, c.actualResolutionDate)) " +
            "FROM Complaint c WHERE c.ownerId = :ownerId " +
            "AND c.actualResolutionDate IS NOT NULL")
    Double getAverageResolutionTimeByOwnerId(@Param("ownerId") Long ownerId);
    
    // For SuperAdmin - pagination support
    Page<Complaint> findByStatus(helpstatus status, Pageable pageable);
    Page<Complaint> findByPriority(Priority priority, Pageable pageable);
}
