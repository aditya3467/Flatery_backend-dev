package com.Flatery.email.repository;

import com.Flatery.email.entity.EmailQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {

    @Query("SELECT e FROM EmailQueue e WHERE e.status = 'PENDING' AND e.scheduledAt <= :now ORDER BY e.scheduledAt ASC")
    List<EmailQueue> findPending(@Param("now") Instant now);
}
