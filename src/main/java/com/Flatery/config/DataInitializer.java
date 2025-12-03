package com.Flatery.config;

import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.model.property.enums.PropertyAge;
import com.Flatery.model.property.enums.Parking;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Initializes default data on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PasswordEncoder passwordEncoder;
    private boolean initialized = false;  // flag to run only once per application run

    @Override
    public void run(ApplicationArguments args) {
        if (!initialized) {
            initializeSuperAdmin();
            initializeDemoProperties();
            initialized = true;
        }
    }

    private void initializeSuperAdmin() {
        String superAdminUsername = "Superadmin";

        if (userRepository.findByUsername(superAdminUsername).isPresent()) {
            log.debug("Super admin user already exists");
            return;
        }

        User superAdmin = new User();
        superAdmin.setUsername(superAdminUsername);
        superAdmin.setPassword(passwordEncoder.encode("Admin123"));
        superAdmin.setEmail("superadmin@flatery.com");
        superAdmin.setFirstName("Super");
        superAdmin.setLastName("Admin");
        superAdmin.setPhoneNumber("0000000000");
        superAdmin.setRoles(Set.of(RoleName.SUPERADMIN, RoleName.ADMIN));

        userRepository.save(superAdmin);
        log.info("Super admin user created successfully with username: {}", superAdminUsername);
    }

    private void initializeDemoProperties() {
        // Check if demo properties already exist (properties with name starting with "DEMO_")
        if (propertyRepository.count() > 0) {
            log.debug("Properties already exist in database, skipping demo property creation");
            return;
        }

        log.info("Creating demo properties for Mohali, Chandigarh, and Noida...");
        
        List<Property> demoProperties = new ArrayList<>();
        
        // MOHALI Properties (10)
        demoProperties.addAll(createCityDemoProperties("Mohali", 1));
        
        // CHANDIGARH Properties (10) 
        demoProperties.addAll(createCityDemoProperties("Chandigarh", 11));
        
        // NOIDA Properties (10)
        demoProperties.addAll(createCityDemoProperties("Noida", 21));
        
        propertyRepository.saveAll(demoProperties);
        log.info("Created {} demo properties (DEMO_ prefixed for easy deletion)", demoProperties.size());
    }
    
    private List<Property> createCityDemoProperties(String city, int startIndex) {
        List<Property> properties = new ArrayList<>();
        
        String[] locations = getLocationsForCity(city);
        PropertyType[] types = {PropertyType.PG, PropertyType.FLAT, PropertyType.APARTMENT};
        BhkType[] bhkTypes = {BhkType.ONE, BhkType.TWO, BhkType.THREE, BhkType.FOUR};
        Furnishing[] furnishings = {Furnishing.FURNISHED, Furnishing.SEMI_FURNISHED, Furnishing.UNFURNISHED};
        
        for (int i = 0; i < 10; i++) {
            PropertyType type = types[i % types.length];
            String location = locations[i % locations.length];
            BhkType bhkType = type == PropertyType.FLAT ? bhkTypes[i % bhkTypes.length] : null;
            Furnishing furnishing = furnishings[i % furnishings.length];
            
            Property property = Property.builder()
                    .ownerId(1L) // Default owner ID
                    .name("DEMO_" + city + "_Property_" + (startIndex + i))
                    .type(type)
                    .bhkType(bhkType)
                    .currentFloor(1 + (i % 5))
                    .totalFloor(3 + (i % 7))
                    .age(PropertyAge.Y1_3)
                    .builtUpAreaSqft(400 + (i * 100))
                    .city(city)
                    .location(location)
                    .landmark("Near " + (i % 2 == 0 ? "Metro Station" : "Shopping Mall"))
                    .expectedRent(5000 + (i * 2000) + (city.hashCode() % 5000))
                    .expectedDeposit((5000 + (i * 2000) + (city.hashCode() % 5000)) * 2)
                    .negotiable(i % 3 == 0)
                    .monthlyMaintenance(500 + (i * 100))
                    .availableFrom(LocalDate.now().plusDays(i))
                    .furnishing(furnishing)
                    .parking(i % 3 != 0 ? Parking.BIKE : Parking.NONE)
                    .description("Demo " + type.name().toLowerCase() + " property in " + city + " with modern amenities. This is a test property and will be removed later.")
                    .bathrooms(1 + (i % 3))
                    .balcony(i % 2 == 0)
                    .allDay(true)
                    .build();
                    
            properties.add(property);
        }
        
        return properties;
    }
    
    private String[] getLocationsForCity(String city) {
        switch (city) {
            case "Mohali":
                return new String[]{"Phase 3B2", "Phase 7", "Phase 8", "Phase 9", "Phase 11", "Sector 68", "Sector 70", "Sector 71", "Sector 78", "Sector 82"};
            case "Chandigarh":
                return new String[]{"Sector 17", "Sector 22", "Sector 26", "Sector 34", "Sector 35", "Sector 43", "Sector 46", "Sector 47", "Sector 56", "Sector 62"};
            case "Noida":
                return new String[]{"Sector 18", "Sector 25", "Sector 37", "Sector 44", "Sector 50", "Sector 62", "Sector 76", "Sector 104", "Sector 128", "Sector 137"};
            default:
                return new String[]{"Central Area", "East Zone", "West Zone", "North Area", "South Area"};
        }
    }
}

