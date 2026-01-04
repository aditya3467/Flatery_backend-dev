package com.Flatery.superadmin.service;

import com.Flatery.model.property.Property;
import com.Flatery.model.property.PropertyView;
import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.property.PropertyViewRepository;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.AnalyticsOverviewDto;
import com.Flatery.superadmin.dto.CityAnalyticsDto;
import com.Flatery.superadmin.dto.TimeSeriesDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for analytics and reporting in SuperAdmin panel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {
    
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyViewRepository propertyViewRepository;
    
    /**
     * Get analytics overview for a time period
     */
    public AnalyticsOverviewDto getAnalyticsOverview(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching analytics overview from {} to {}", startDate, endDate);
        
        // User growth
        Long totalNewUsers = userRepository.count();
        Long newOwners = 0L; // OWNER role doesn't exist in RoleName enum
        Long newTenants = 0L; // TENANT role doesn't exist in RoleName enum
        
        // Property stats
        Long totalProperties = propertyRepository.count();
        Long activeProperties = propertyRepository.countByStatus(PropertyStatus.ACTIVE);
        Long inactiveProperties = totalProperties - activeProperties;
        
        // Property views
        Long totalPropertyViews = propertyViewRepository.count();
        Double averageViewsPerProperty = totalProperties > 0 ? 
            (double) totalPropertyViews / totalProperties : 0.0;
        
        // Calculate growth rates (simplified - comparing to all-time data)
        Double userGrowthRate = calculateGrowthRate(totalNewUsers, totalNewUsers);
        Double propertyGrowthRate = calculateGrowthRate(totalProperties, totalProperties);
        
        // Revenue calculations (simplified)
        Double averagePropertyValue = calculateAveragePropertyValue();
        
        // Top cities and property types
        Map<String, Long> topCitiesByProperties = getTopCitiesByProperties(5);
        Map<String, Long> topPropertyTypes = getTopPropertyTypes();
        
        return AnalyticsOverviewDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalNewUsers(totalNewUsers)
                .newOwners(newOwners)
                .newTenants(newTenants)
                .userGrowthRate(userGrowthRate)
                .totalNewProperties(totalProperties)
                .activeProperties(activeProperties)
                .inactiveProperties(inactiveProperties)
                .propertyGrowthRate(propertyGrowthRate)
                .totalRevenue(0.0) // Placeholder
                .averagePropertyValue(averagePropertyValue)
                .totalPropertyViews(totalPropertyViews)
                .totalEnquiries(0L) // Placeholder
                .totalComplaints(0L) // Placeholder
                .averageViewsPerProperty(averageViewsPerProperty)
                .activeUsersCount(totalNewUsers)
                .averageSessionDuration(0.0) // Placeholder
                .topCitiesByProperties(topCitiesByProperties)
                .topPropertyTypes(topPropertyTypes)
                .build();
    }
    
    /**
     * Get user registration time series data
     */
    public TimeSeriesDataDto getUserRegistrationTimeSeries(LocalDate startDate, LocalDate endDate, String interval) {
        log.info("Fetching user registration time series from {} to {} with interval {}", startDate, endDate, interval);
        
        List<User> allUsers = userRepository.findAll();
        Map<LocalDate, Long> countsByDate = new LinkedHashMap<>();
        
        // Initialize dates
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            countsByDate.put(current, 0L);
            current = current.plusDays(1);
        }
        
        // Count users by registration date
        for (User user : allUsers) {
            if (user.getCreatedAt() != null) {
                LocalDate registrationDate = user.getCreatedAt().toLocalDate();
                if (!registrationDate.isBefore(startDate) && !registrationDate.isAfter(endDate)) {
                    countsByDate.merge(registrationDate, 1L, Long::sum);
                }
            }
        }
        
        return TimeSeriesDataDto.builder()
                .label("User Registrations")
                .dates(new ArrayList<>(countsByDate.keySet()))
                .values(new ArrayList<>(countsByDate.values()))
                .metric("users")
                .build();
    }
    
    /**
     * Get property creation time series data
     */
    public TimeSeriesDataDto getPropertyCreationTimeSeries(LocalDate startDate, LocalDate endDate, String interval) {
        log.info("Fetching property creation time series from {} to {} with interval {}", startDate, endDate, interval);
        
        List<Property> allProperties = propertyRepository.findAll();
        Map<LocalDate, Long> countsByDate = new LinkedHashMap<>();
        
        // Initialize dates
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            countsByDate.put(current, 0L);
            current = current.plusDays(1);
        }
        
        // Count properties by posted date
        for (Property property : allProperties) {
            if (property.getPostedOn() != null) {
                LocalDate postedDate = property.getPostedOn();
                if (!postedDate.isBefore(startDate) && !postedDate.isAfter(endDate)) {
                    countsByDate.merge(postedDate, 1L, Long::sum);
                }
            }
        }
        
        return TimeSeriesDataDto.builder()
                .label("Property Listings")
                .dates(new ArrayList<>(countsByDate.keySet()))
                .values(new ArrayList<>(countsByDate.values()))
                .metric("properties")
                .build();
    }
    
    /**
     * Get property views time series data
     */
    public TimeSeriesDataDto getPropertyViewsTimeSeries(LocalDate startDate, LocalDate endDate, String interval) {
        log.info("Fetching property views time series from {} to {} with interval {}", startDate, endDate, interval);
        
        List<PropertyView> allViews = propertyViewRepository.findAll();
        Map<LocalDate, Long> countsByDate = new LinkedHashMap<>();
        
        // Initialize dates
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            countsByDate.put(current, 0L);
            current = current.plusDays(1);
        }
        
        // Count views by date
        for (PropertyView view : allViews) {
            if (view.getViewedAt() != null) {
                LocalDate viewDate = view.getViewedAt().toLocalDate();
                if (!viewDate.isBefore(startDate) && !viewDate.isAfter(endDate)) {
                    countsByDate.merge(viewDate, 1L, Long::sum);
                }
            }
        }
        
        return TimeSeriesDataDto.builder()
                .label("Property Views")
                .dates(new ArrayList<>(countsByDate.keySet()))
                .values(new ArrayList<>(countsByDate.values()))
                .metric("views")
                .build();
    }
    
    /**
     * Get city-wise analytics
     */
    public List<CityAnalyticsDto> getCityAnalytics() {
        log.info("Fetching city-wise analytics");
        
        List<Property> allProperties = propertyRepository.findAll();
        Map<String, List<Property>> propertiesByCity = allProperties.stream()
                .filter(p -> p.getCity() != null)
                .collect(Collectors.groupingBy(Property::getCity));
        
        return propertiesByCity.entrySet().stream()
                .map(entry -> {
                    String city = entry.getKey();
                    List<Property> cityProperties = entry.getValue();
                    
                    long totalProperties = cityProperties.size();
                    long activeProperties = cityProperties.stream()
                            .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
                            .count();
                    
                    // Get unique owners in this city
                    long totalOwners = cityProperties.stream()
                            .map(Property::getOwnerId)
                            .filter(Objects::nonNull)
                            .distinct()
                            .count();
                    
                    // Calculate average rent
                    double averageRent = cityProperties.stream()
                            .filter(p -> p.getExpectedRent() != null)
                            .mapToDouble(p -> p.getExpectedRent().doubleValue())
                            .average()
                            .orElse(0.0);
                    
                    // Get total views for this city
                    long totalViews = cityProperties.stream()
                            .mapToLong(p -> propertyViewRepository.countByPropertyId(p.getId()))
                            .sum();
                    
                    // Calculate occupancy rate (simplified)
                    double occupancyRate = totalProperties > 0 ? 
                            (activeProperties * 100.0 / totalProperties) : 0.0;
                    
                    return CityAnalyticsDto.builder()
                            .cityName(city)
                            .totalProperties(totalProperties)
                            .activeProperties(activeProperties)
                            .totalOwners(totalOwners)
                            .totalTenants(0L) // Would need to join with tenants
                            .totalViews(totalViews)
                            .averageRent(averageRent)
                            .occupancyRate(occupancyRate)
                            .build();
                })
                .sorted(Comparator.comparing(CityAnalyticsDto::getTotalProperties).reversed())
                .collect(Collectors.toList());
    }
    
    /**
     * Calculate growth rate
     */
    private Double calculateGrowthRate(Long current, Long previous) {
        if (previous == 0) return 0.0;
        return ((current - previous) * 100.0) / previous;
    }
    
    /**
     * Calculate average property value
     */
    private Double calculateAveragePropertyValue() {
        List<Property> allProperties = propertyRepository.findAll();
        return allProperties.stream()
                .filter(p -> p.getExpectedRent() != null)
                .mapToDouble(p -> p.getExpectedRent().doubleValue())
                .average()
                .orElse(0.0);
    }
    
    /**
     * Get top cities by property count
     */
    private Map<String, Long> getTopCitiesByProperties(int limit) {
        List<Property> allProperties = propertyRepository.findAll();
        return allProperties.stream()
                .filter(p -> p.getCity() != null)
                .collect(Collectors.groupingBy(Property::getCity, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }
    
    /**
     * Get top property types
     */
    private Map<String, Long> getTopPropertyTypes() {
        List<Property> allProperties = propertyRepository.findAll();
        return allProperties.stream()
                .filter(p -> p.getType() != null)
                .collect(Collectors.groupingBy(p -> p.getType().toString(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }
}
