package com.Flatery.Controller.property;

import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
<<<<<<< HEAD
import com.Flatery.model.property.PropertyImage;
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.property.PropertyImageRepository;
=======
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyType;
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
import com.Flatery.service.property.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

<<<<<<< HEAD
import java.util.List;

=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PublicPropertyController {

    private final PropertyQueryService queryService;
<<<<<<< HEAD
    private final PropertyImageRepository propertyImageRepository;
=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f

    // Public detail
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(queryService.getPublicById(id));
    }

    // Public search with common filters
    @GetMapping
    public ResponseEntity<Page<PropertySummary>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BhkType bhk,
            @RequestParam(required = false) Integer minRent,
            @RequestParam(required = false) Integer maxRent,
            @RequestParam(required = false) Furnishing furnishing,
            Pageable pageable
    ) {
        Page<PropertySummary> page = queryService.search(city, location, type, bhk, minRent, maxRent, furnishing, pageable);
        return ResponseEntity.ok(page);
    }
<<<<<<< HEAD

    // Get images for a property (public endpoint)
    @GetMapping("/{id}/images")
    public ResponseEntity<List<PropertyImage>> getPropertyImages(@PathVariable Long id) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(id);
        return ResponseEntity.ok(images);
    }
=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
}
