package com.Flatery.service.property.mapper;

import com.Flatery.dto.property.CreatePropertyRequest;
import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.model.property.Property;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PropertyMapper {

    @Autowired
    private UserRepository userRepository;

    public Property toEntity(CreatePropertyRequest req, Long ownerId) {
        Property p = new Property();
        p.setOwnerId(ownerId);

        p.setType(req.getType());
        p.setName(req.getName());
        p.setFlatNumber(req.getFlatNumber());
        p.setBhkType(req.getBhkType());
        p.setPgSeater(req.getPgSeater());

        p.setCurrentFloor(req.getCurrentFloor());
        p.setTotalFloor(req.getTotalFloor());
        p.setAge(req.getAge());
        p.setFacing(req.getFacing());
        p.setBuiltUpAreaSqft(req.getBuiltUpAreaSqft());

        p.setCity(req.getLocality().getCity());
        p.setLocation(req.getLocality().getLocation());
        p.setLandmark(req.getLocality().getLandmark());
        
        // Use coordinates from locality if available, otherwise from top-level fields
        Double lat = req.getLocality().getLatitude() != null ? req.getLocality().getLatitude() : req.getLatitude();
        Double lng = req.getLocality().getLongitude() != null ? req.getLocality().getLongitude() : req.getLongitude();
        p.setLatitude(lat);
        p.setLongitude(lng);

        p.setExpectedRent(req.getRental().getExpectedRent());
        p.setExpectedDeposit(req.getRental().getExpectedDeposit());
        p.setNegotiable(Boolean.TRUE.equals(req.getRental().getNegotiable()));
        p.setMonthlyMaintenance(req.getRental().getMonthlyMaintenance());
        p.setAvailableFrom(req.getRental().getAvailableFrom());
        p.setFurnishing(req.getRental().getFurnishing());
        p.setParking(req.getRental().getParking());
        p.setDescription(req.getRental().getDescription());
        p.setPreferredTenants(req.getRental().getPreferredTenants());

        p.setBathrooms(req.getBathrooms());
        p.setAmenities(req.getAmenities());
        p.setBalcony(Boolean.TRUE.equals(req.getBalcony()));

        if (req.getShowing() != null) {
            p.setWhoShows(req.getShowing().getWhoShows());
            p.setCurrentCondition(req.getShowing().getCurrentCondition());
        }

        if (req.getSchedule() != null) {
            p.setScheduleAvailability(req.getSchedule().getAvailability());
            p.setAllDay(Boolean.TRUE.equals(req.getSchedule().getAllDay()));
            p.setScheduleStart(req.getSchedule().getStartTime());
            p.setScheduleEnd(req.getSchedule().getEndTime());
        } else {
            p.setAllDay(false);
        }

        return p;
    }

    public PropertyResponse toResponse(Property p, String primaryImageUrl) {
        PropertyResponse res = new PropertyResponse();
        res.setId(p.getId());
        res.setType(p.getType());
        res.setStatus(p.getStatus());
        res.setName(p.getName());
        res.setFlatNumber(p.getFlatNumber());
        res.setBhkType(p.getBhkType());
        res.setPgSeater(p.getPgSeater());
        res.setCurrentFloor(p.getCurrentFloor());
        res.setTotalFloor(p.getTotalFloor());
        res.setAge(p.getAge());
        res.setFacing(p.getFacing());
        res.setBuiltUpAreaSqft(p.getBuiltUpAreaSqft());
        res.setCity(p.getCity());
        res.setLocation(p.getLocation());
        res.setLandmark(p.getLandmark());
        res.setLatitude(p.getLatitude());
        res.setLongitude(p.getLongitude());
        res.setExpectedRent(p.getExpectedRent());
        res.setExpectedDeposit(p.getExpectedDeposit());
        res.setNegotiable(p.isNegotiable());
        res.setMonthlyMaintenance(p.getMonthlyMaintenance());
        res.setAvailableFrom(p.getAvailableFrom());
        res.setPreferredTenants(p.getPreferredTenants());
        res.setFurnishing(p.getFurnishing());
        res.setParking(p.getParking());
        res.setDescription(p.getDescription());
        res.setBathrooms(p.getBathrooms());
        res.setAmenities(p.getAmenities());
        res.setBalcony(p.isBalcony());
        res.setWhoShows(p.getWhoShows());
        res.setCurrentCondition(p.getCurrentCondition());
        res.setAvailability(p.getScheduleAvailability());
        res.setStartTime(p.getScheduleStart());
        res.setEndTime(p.getScheduleEnd());
        res.setAllDay(p.isAllDay());
        res.setPrimaryImageUrl(primaryImageUrl);
        res.setPostedOn(p.getPostedOn());
        // Set owner details
        if (p.getOwnerId() != null) {
            userRepository.findById(p.getOwnerId()).ifPresent(owner -> {
                res.setOwnerName(owner.getFirstName() + (owner.getLastName() != null ? (" " + owner.getLastName()) : ""));
                res.setOwnerPhone(owner.getPhoneNumber());
                res.setOwnerEmail(owner.getEmail());
            });
        }
        return res;
    }

    public PropertySummary toSummary(Property p, String primaryImageUrl) {
        return toSummary(p, primaryImageUrl, null);
    }

    public PropertySummary toSummary(Property p, String primaryImageUrl, Double distanceKm) {
        PropertySummary s = new PropertySummary();
        s.setId(p.getId());
        s.setType(p.getType());
        s.setStatus(p.getStatus());
        s.setName(p.getName());
        s.setFlatNumber(p.getFlatNumber());
        s.setBhkType(p.getBhkType());
        s.setCity(p.getCity());
        s.setLocation(p.getLocation());
        s.setBuiltUpAreaSqft(p.getBuiltUpAreaSqft());
        s.setLatitude(p.getLatitude());
        s.setLongitude(p.getLongitude());
        s.setDistanceKm(distanceKm);
        s.setExpectedRent(p.getExpectedRent());
        s.setFurnishing(p.getFurnishing());
        s.setParking(p.getParking());
        s.setAvailableFrom(p.getAvailableFrom());
        s.setPrimaryImageUrl(primaryImageUrl);
        s.setPostedOn(p.getPostedOn());
        // Set owner details
        if (p.getOwnerId() != null) {
            userRepository.findById(p.getOwnerId()).ifPresent(owner -> {
                s.setOwnerName(owner.getFirstName() + (owner.getLastName() != null ? (" " + owner.getLastName()) : ""));
                s.setOwnerPhone(owner.getPhoneNumber());
                s.setOwnerEmail(owner.getEmail());
            });
        }
        return s;
    }
}
