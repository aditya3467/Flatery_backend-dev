package com.Flatery.repository.tenant;

import com.Flatery.model.tenant.TenancyHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenancyHistoryRepository extends JpaRepository<TenancyHistory, Long> {

    /**
     * Find all tenancy history records for a specific tenant by phone number
     */
    List<TenancyHistory> findByPhoneNumberOrderByTenancyEndDateDesc(String phoneNumber);

    /**
     * Find all tenancy history records for a specific property
     */
    List<TenancyHistory> findByPropertyIdOrderByTenancyEndDateDesc(Long propertyId);

    /**
     * Find all tenancy history records for a specific owner
     */
    List<TenancyHistory> findByOwnerIdOrderByTenancyEndDateDesc(Long ownerId);

    /**
     * Find tenancy history by property and unit (for PG)
     */
    @Query("SELECT th FROM TenancyHistory th WHERE th.propertyId = :propertyId " +
           "AND th.floorId = :floorId AND th.unitId = :unitId " +
           "ORDER BY th.tenancyEndDate DESC")
    List<TenancyHistory> findByPropertyAndPGUnit(@Param("propertyId") Long propertyId,
                                                 @Param("floorId") Long floorId,
                                                 @Param("unitId") Long unitId);

    /**
     * Find tenancy history by property and flat room number (for Flat)
     */
    @Query("SELECT th FROM TenancyHistory th WHERE th.propertyId = :propertyId " +
           "AND th.flatRoomNumber = :flatRoomNumber ORDER BY th.tenancyEndDate DESC")
    List<TenancyHistory> findByPropertyAndFlat(@Param("propertyId") Long propertyId,
                                               @Param("flatRoomNumber") String flatRoomNumber);

    /**
     * Count total number of tenancies for a tenant
     */
    long countByPhoneNumber(String phoneNumber);

    /**
     * Check if a tenant has stayed at a specific property before
     */
    boolean existsByPhoneNumberAndPropertyId(String phoneNumber, Long propertyId);

    /**
     * Get latest tenancy record for a tenant
     */
    @Query("SELECT th FROM TenancyHistory th WHERE th.phoneNumber = :phoneNumber " +
           "ORDER BY th.tenancyEndDate DESC LIMIT 1")
    TenancyHistory findLatestTenancyByPhoneNumber(@Param("phoneNumber") String phoneNumber);
}