/**
 * Properties Listing Page JavaScript
 * Handles property listing, filtering, and pagination
 */

// Sample properties data (replace with API call)
let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const itemsPerPage = 9;

document.addEventListener('DOMContentLoaded', function() {
    // Set filter values from URL first
    setFilterValuesFromUrl();
    // Then load properties
    loadProperties();
    // Initialize mobile filter bar
    initializeMobileFilterBar();
});

/**
 * Initialize mobile filter bar functionality
 */
function initializeMobileFilterBar() {
    // Mobile filter buttons
    const sortBtn = document.getElementById('mobileSortBtn');
    const filtersBtn = document.getElementById('mobileFiltersBtn');
    
    // Mobile elements
    const sortDropdown = document.getElementById('mobileSortDropdown');
    const filtersPopup = document.getElementById('mobileFiltersPopup');
    const filtersClose = document.getElementById('mobileFiltersClose');
    const resetBtn = document.getElementById('mobileResetBtn');
    const applyBtn = document.getElementById('mobileApplyBtn');
    
    // Sort dropdown toggle
    if (sortBtn && sortDropdown) {
        sortBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sortDropdown.classList.toggle('show');
            sortBtn.classList.toggle('active');
            
            // Close filters popup if open
            if (filtersPopup) {
                filtersPopup.classList.remove('show');
            }
        });
    }
    
    // Filters popup toggle
    if (filtersBtn && filtersPopup) {
        filtersBtn.addEventListener('click', function() {
            filtersPopup.classList.add('show');
            
            // Close sort dropdown if open
            if (sortDropdown) {
                sortDropdown.classList.remove('show');
                sortBtn.classList.remove('active');
            }
        });
    }
    
    // Close filters popup
    if (filtersClose && filtersPopup) {
        filtersClose.addEventListener('click', function() {
            filtersPopup.classList.remove('show');
        });
    }
    
    // Close popup when clicking overlay
    if (filtersPopup) {
        filtersPopup.addEventListener('click', function(e) {
            if (e.target.classList.contains('popup-overlay')) {
                filtersPopup.classList.remove('show');
            }
        });
    }
    
    // Close sort dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (sortDropdown && !sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove('show');
            sortBtn.classList.remove('active');
        }
    });
    
    // Handle sort selection
    document.querySelectorAll('input[name="mobileSort"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                applySortFilter(this.value);
                sortDropdown.classList.remove('show');
                sortBtn.classList.remove('active');
            }
        });
    });
    
    // Handle property type change to show/hide flat type section
    const mobilePropertyType = document.getElementById('mobileFilterPropertyType');
    const mobileFlatTypeSection = document.getElementById('mobileFlatTypeSection');
    
    if (mobilePropertyType && mobileFlatTypeSection) {
        mobilePropertyType.addEventListener('change', function() {
            if (this.value === 'FLAT') {
                mobileFlatTypeSection.style.display = 'block';
            } else {
                mobileFlatTypeSection.style.display = 'none';
                // Clear flat type selections
                document.querySelectorAll('.mobile-filter-checkbox[data-filter="flatType"]').forEach(cb => {
                    cb.checked = false;
                });
            }
        });
    }
    
    // Apply filters button
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applyMobileFilters();
            filtersPopup.classList.remove('show');
        });
    }
    
    // Reset filters button
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetMobileFilters();
        });
    }
}

/**
 * Apply sort filter
 */
function applySortFilter(sortType) {
    console.log('Applying sort:', sortType);
    
    switch(sortType) {
        case 'rent_low_high':
            filteredProperties.sort((a, b) => a.expectedRent - b.expectedRent);
            break;
        case 'rent_high_low':
            filteredProperties.sort((a, b) => b.expectedRent - a.expectedRent);
            break;
        case 'newest':
            filteredProperties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
    }
    
    currentPage = 1;
    displayProperties();
    setupPagination();
}

/**
 * Apply mobile filters (same logic as desktop but using mobile elements)
 */
function applyMobileFilters() {
    console.log('Applying mobile filters...');
    
    const propertyType = document.getElementById('mobileFilterPropertyType')?.value || '';
    const city = document.getElementById('mobileFilterCity')?.value?.toLowerCase() || '';
    const maxRent = parseInt(document.getElementById('mobileFilterMaxRent')?.value) || Infinity;
    const furnishing = document.getElementById('mobileFilterFurnishing')?.value || '';
    
    // Get checked values for checkbox filters
    const selectedFlatTypes = Array.from(document.querySelectorAll('.mobile-filter-checkbox[data-filter="flatType"]:checked')).map(cb => cb.value);
    const selectedAmenities = Array.from(document.querySelectorAll('.mobile-filter-checkbox[data-filter="amenities"]:checked')).map(cb => cb.value);
    
    console.log('Mobile filter values:', {
        propertyType, city, maxRent, furnishing,
        selectedFlatTypes, selectedAmenities
    });
    
    filteredProperties = allProperties.filter(property => {
        // Property Type filter
        const matchType = !propertyType || property.type === propertyType;
        
        // City filter
        const matchCity = !city || (property.city && property.city.toLowerCase().includes(city));
        
        // Max Rent filter
        const matchRent = property.expectedRent <= maxRent;
        
        // Furnishing filter
        const matchFurnishing = !furnishing || property.furnishing === furnishing;
        
        // Flat Type filter (BHK types for FLAT properties)
        let matchFlatType = true;
        if (selectedFlatTypes.length > 0 && property.type === 'FLAT') {
            matchFlatType = selectedFlatTypes.includes(property.bhkType);
        }
        
        // Amenities filter
        let matchAmenities = true;
        if (selectedAmenities.length > 0) {
            const propertyAmenities = Array.isArray(property.amenities) ? property.amenities : [];
            matchAmenities = selectedAmenities.every(amenity => propertyAmenities.includes(amenity));
        }
        
        return matchType && matchCity && matchRent && matchFurnishing && matchFlatType && matchAmenities;
    });
    
    console.log('Mobile filtered properties:', filteredProperties.length);
    
    currentPage = 1;
    displayProperties();
    setupPagination();
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`Found ${filteredProperties.length} properties`, 'success');
    }
}

/**
 * Reset mobile filters
 */
function resetMobileFilters() {
    // Reset all mobile filter inputs
    document.getElementById('mobileFilterPropertyType').value = '';
    document.getElementById('mobileFilterCity').value = '';
    document.getElementById('mobileFilterMaxRent').value = '';
    document.getElementById('mobileFilterFurnishing').value = '';
    
    // Reset all checkboxes
    document.querySelectorAll('.mobile-filter-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    // Hide flat type section
    const mobileFlatTypeSection = document.getElementById('mobileFlatTypeSection');
    if (mobileFlatTypeSection) {
        mobileFlatTypeSection.style.display = 'none';
    }
    
    // Reset to all properties
    filteredProperties = [...allProperties];
    currentPage = 1;
    displayProperties();
    setupPagination();
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification('Filters reset', 'info');
    }
}

/**
 * Set filter input values from URL parameters (before properties load)
 */
function setFilterValuesFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    const keywordParam = urlParams.get('keyword');
    const propertyTypeParam = urlParams.get('propertyType');
    const minRentParam = urlParams.get('minRent');
    const maxRentParam = urlParams.get('maxRent');
    
    // Set filter dropdowns and inputs if they exist
    if (cityParam) {
        const cityFilter = document.getElementById('filterCity');
        if (cityFilter) {
            cityFilter.value = cityParam;
        }
    }
    
    if (keywordParam) {
        const keywordFilter = document.getElementById('filterKeyword');
        if (keywordFilter) {
            keywordFilter.value = keywordParam;
        }
    }
    
    if (propertyTypeParam) {
        const propertyTypeFilter = document.getElementById('filterPropertyType');
        if (propertyTypeFilter) {
            propertyTypeFilter.value = propertyTypeParam;
            // Trigger the toggle function to show/hide relevant sections
            if (typeof togglePropertyTypeOptions === 'function') {
                togglePropertyTypeOptions();
            }
        }
    }
    
    if (minRentParam) {
        const minRentFilter = document.getElementById('filterMinRent');
        if (minRentFilter) {
            minRentFilter.value = minRentParam;
        }
    }
    
    if (maxRentParam) {
        const maxRentFilter = document.getElementById('filterMaxRent');
        if (maxRentFilter) {
            maxRentFilter.value = maxRentParam;
        }
    }
}

/**
 * Load properties from API
 */
async function loadProperties() {
    const propertiesGrid = document.getElementById('propertiesGrid');
    
    try {
        // Call the public properties API
        const response = await apiService.getProperties();
        
        // Response is a Page object with content array
        allProperties = response.content || [];
        
        // Fetch full details for PG and APARTMENT to get names
        await enrichPropertiesWithNames();
        
        filteredProperties = [...allProperties];
        
        // Apply URL filters after loading
        applyUrlFilters();
        
        displayProperties();
        setupPagination();
        
    } catch (error) {
        console.error('Error loading properties:', error);
        propertiesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Properties</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Fetch full details for all properties to get their names and all images
 */
async function enrichPropertiesWithNames() {
    console.log('Starting to enrich properties with full details...');
    
    // Fetch details in parallel for all properties to get names and full image arrays
    const detailsPromises = allProperties.map(async (property) => {
        try {
            console.log(`Fetching full details for property ${property.id}...`);
            
            // Fetch full details and merge with existing property data
            const details = await apiService.makeRequest(`/properties/${property.id}`, { includeAuth: false });
            
            // Merge all details into the property object
            Object.assign(property, {
                name: details.name,
                type: details.propertyType || details.type || property.type,
                bhkType: details.bhkType || details.bhk,
                pgSeater: details.pgSeater || details.seater || details.sharingType,
                builtUpArea: details.builtUpAreaSqft || details.builtUpArea,
                bathrooms: details.bathrooms || details.totalBathrooms,
                expectedDeposit: details.expectedDeposit || details.securityDeposit,
                maintenance: details.monthlyMaintenance || details.maintenanceCharges || details.maintenance,
                currentFloor: details.currentFloor || details.floorNumber,
                totalFloor: details.totalFloor || details.totalFloors,
                furnishing: details.furnishing || details.furnishingStatus,
                parking: details.parking || details.parkingAvailable,
                preferredTenants: details.preferredTenants,
                amenities: details.amenities,
                propertyDescription: details.propertyDescription || details.description,
                availableFrom: details.availableFrom || details.availabilityDate
            });
            
            // Fetch all images using the same endpoint as property details page
            const images = await apiService.makeRequest(`/properties/${property.id}/images`, { includeAuth: false });
            let imgs = Array.isArray(images) ? images : [];
            
            if (imgs.length > 0) {
                // Normalize and sort: primary first then by position (same logic as property-details.js)
                const normalized = imgs.map(img => ({
                    id: img.id,
                    url: img.url || img.imageUrl || img.path,
                    primary: !!(img.primaryImage || img.primary),
                    position: (img.position !== undefined && img.position !== null) ? img.position : 9999,
                })).filter(x => !!x.url);

                normalized.sort((a, b) => (b.primary - a.primary) || (a.position - b.position));
                
                // Extract just the URLs for the carousel
                // Check if URL is already a full URL (http/https) or S3 URL, otherwise add leading slash
                property.images = normalized.map(img => {
                    const url = img.url;
                    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
                        return url;
                    }
                    return `/${url}`;
                });
                console.log(`✓ Property ${property.id} loaded with ${property.images.length} images:`, property.images);
            } else {
                // Fallback to primary image
                property.images = property.primaryImageUrl ? [property.primaryImageUrl] : [];
                console.log(`⚠ Property ${property.id} has no images from /images endpoint, using primary:`, property.images);
            }
        } catch (error) {
            console.warn(`Failed to fetch details for property ${property.id}:`, error);
            // Keep original images if any, or use primary
            if (!property.images && property.primaryImageUrl) {
                property.images = [property.primaryImageUrl];
            }
        }
    });
    
    await Promise.all(detailsPromises);
    console.log('Finished enriching properties with all images');
}

/**
 * Apply filters from URL parameters to properties array
 */
function applyUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    const keywordParam = urlParams.get('keyword');
    const propertyTypeParam = urlParams.get('propertyType');
    const minRentParam = urlParams.get('minRent');
    const maxRentParam = urlParams.get('maxRent');
    
    // Start with all properties
    filteredProperties = [...allProperties];
    
    // Apply city filter to properties
    if (cityParam && filteredProperties.length > 0) {
        filteredProperties = filteredProperties.filter(property => 
            property.city && property.city.toLowerCase() === cityParam.toLowerCase()
        );
    }
    
    // Apply keyword filter if provided
    if (keywordParam && filteredProperties.length > 0) {
        const keyword = keywordParam.toLowerCase();
        filteredProperties = filteredProperties.filter(property => 
            (property.city && property.city.toLowerCase().includes(keyword)) ||
            (property.location && property.location.toLowerCase().includes(keyword)) ||
            (property.type && property.type.toLowerCase().includes(keyword)) ||
            (property.name && property.name.toLowerCase().includes(keyword))
        );
    }
    
    // Apply property type filter
    if (propertyTypeParam && filteredProperties.length > 0) {
        filteredProperties = filteredProperties.filter(property => 
            property.type && property.type.toUpperCase() === propertyTypeParam.toUpperCase()
        );
    }
    
    // Apply rent range filters
    if ((minRentParam || maxRentParam) && filteredProperties.length > 0) {
        const minRent = minRentParam ? parseInt(minRentParam) : 0;
        const maxRent = maxRentParam ? parseInt(maxRentParam) : Infinity;
        
        filteredProperties = filteredProperties.filter(property => {
            const rent = property.expectedRent || 0;
            return rent >= minRent && rent <= maxRent;
        });
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update display
    if (allProperties.length > 0) {
        displayProperties();
        setupPagination();
    }
}

/**
 * Generate sample properties data
 */
function generateSampleProperties() {
    const propertyTypes = ['PG', 'FLAT', 'APARTMENT'];
    const bhkTypes = ['1', '2', '3', '4', '4+'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];
    const locations = ['Andheri', 'Koramangala', 'Hitech City', 'Connaught Place', 'Baner'];
    const furnishing = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
    const amenitiesList = ['Wi-Fi', 'AC', 'Parking', 'Gym', 'Swimming Pool', 'Power Backup', '24x7 Security'];
    
    const properties = [];
    for (let i = 1; i <= 25; i++) {
        const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
        const bhk = bhkTypes[Math.floor(Math.random() * bhkTypes.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const rent = Math.floor(Math.random() * (50000 - 10000 + 1) + 10000);
        const builtUpArea = Math.floor(Math.random() * (2000 - 600 + 1) + 600);
        
        properties.push({
            id: i,
            propertyType: propertyType,
            bhkType: propertyType === 'PG' ? null : bhk,
            seater: propertyType === 'PG' ? Math.floor(Math.random() * 3 + 1) : null,
            propertyName: propertyType !== 'FLAT' ? `${location} ${propertyType}` : null,
            city: city,
            location: location,
            landmark: 'Near Metro Station',
            expectedRent: rent,
            expectedDeposit: rent * 2,
            builtUpArea: builtUpArea,
            currentFloor: Math.floor(Math.random() * 10 + 1),
            totalFloor: Math.floor(Math.random() * 15 + 5),
            bathrooms: Math.floor(Math.random() * 3 + 1),
            furnishing: furnishing[Math.floor(Math.random() * furnishing.length)],
            parking: Math.random() > 0.5 ? 'Available' : 'None',
            amenities: amenitiesList.slice(0, Math.floor(Math.random() * 5 + 2)),
            propertyDescription: 'Beautiful property with modern amenities and great connectivity.',
            availableFrom: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            image: `img/properties/property-${(i % 5) + 1}.jpg` // Placeholder
        });
    }
    
    return properties;
}

/**
 * Display properties in grid
 */
function displayProperties() {
    const propertiesList = document.getElementById('propertiesList');
    const resultsCount = document.getElementById('resultsCount');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (!propertiesList) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `${filteredProperties.length} properties found`;
    }
    
    if (currentProperties.length === 0) {
        propertiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Properties Found</h3>
                <p>Try adjusting your filters or search criteria.</p>
            </div>
        `;
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    propertiesList.innerHTML = currentProperties.map(property => createPropertyCard(property)).join('');
    
    // After rendering, sync favorite states and setup carousels
    updateFavoriteIcons();
    setupCarouselEventListeners();
    initializeCarousels();
    
    console.log('Properties rendered:', currentProperties.length);
    // Setup event listeners for manual carousel controls
    setupCarouselEventListeners();
    
    // Show pagination if needed
    if (paginationContainer && filteredProperties.length > itemsPerPage) {
        paginationContainer.style.display = 'flex';
    } else if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

/**
 * Create property card HTML
 */
function createPropertyCard(property) {
    const bhkType = property.bhkType || property.bhk;
    const seater = property.pgSeater || property.seater;
    // Compute title based on type
    let title;
    if ((property.type === 'PG' || property.type === 'APARTMENT') && property.name) {
        title = property.name;
    } else if (property.type === 'FLAT' && bhkType) {
        const bhkNumber = bhkType.replace('BHK_', '');
        const locationName = property.location || property.city || 'Property';
        title = `${bhkNumber} BHK in ${locationName}`;
    } else {
        title = property.location || property.city || 'Property';
    }
    // Images array from property data
    console.log(`Creating card for property ${property.id}:`, {
        originalImages: property.images,
        isArray: Array.isArray(property.images),
        length: property.images?.length,
        primaryImageUrl: property.primaryImageUrl
    });
    
    const images = Array.isArray(property.images) && property.images.length > 0
        ? property.images
        : [property.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'];
        
    console.log(`Property ${property.id} final images for card:`, images);
    
    const firstImage = images[0];
    const availableDate = property.availableFrom ? new Date(property.availableFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Available Now';
    const furnishingDisplay = property.furnishing ? property.furnishing.replace('_', ' ') : 'Not Specified';
    const preferredTenants = Array.isArray(property.preferredTenants) && property.preferredTenants.length > 0
        ? property.preferredTenants.map(t => t.replace('_', ' ')).join(', ')
        : 'Any';
    
    // Info grid values
    const typeDisplay = property.type || '—';
    const ocupDisplay = property.type === 'PG' ? (seater ? `${seater} Seater` : '—') : (bhkType ? `${bhkType.replace('BHK_', '')} BHK` : '—');
    const areaDisplay = property.builtUpArea ? `${property.builtUpArea} sqft` : '—';
    const bathDisplay = property.bathrooms ? `${property.bathrooms}` : '—';
    const floorDisplay = property.currentFloor && property.totalFloor ? `${property.currentFloor}/${property.totalFloor}` : (property.currentFloor ? `${property.currentFloor}` : '—');
    const parkingDisplay = property.parking || '—';
    // Highlights data
    const deposit = property.expectedDeposit ? `₹${formatNumber(property.expectedDeposit)}` : '—';
    const maintenance = property.maintenance ? `₹${formatNumber(property.maintenance)}/mo` : '—';
    const availabilityText = property.availableFrom ? 'Available from ' + availableDate : 'Available Now';
    // Description snippet
    const description = property.propertyDescription || '';
    // Amenities chips (limit to 4 for compactness)
    const amenityArray = Array.isArray(property.amenities) ? property.amenities : [];
    const topAmenities = amenityArray.slice(0, 4);
    const moreAmenityCount = amenityArray.length > 4 ? amenityArray.length - 4 : 0;
    // Static rating placeholder (could be computed later)
    const ratingValue = (property.rating || 4.6).toFixed(1);
    // Favorite state for initial render
    const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
    const isFav = favorites.includes(property.id);
    return `
      <div class="property-card" data-property-id="${property.id}" onclick="window.location.href='property-details.html?id=${property.id}'">
        <div class="property-image" data-property-id="${property.id}" data-image-index="0" data-images="${encodeURIComponent(JSON.stringify(images))}">
          <img src="${firstImage}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'" />
          <span class="property-badge">${property.type}</span>
          <span class="rating-badge"><i class="fas fa-star"></i> ${ratingValue}</span>
          <button class="wishlist-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${property.id})" aria-label="Add to wishlist">
            <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="carousel-btn prev" aria-label="Previous image">‹</button>
          <button class="carousel-btn next" aria-label="Next image">›</button>
          <div class="carousel-controls">
            ${images.map((_, idx) => `<span class="carousel-dot ${idx===0?'active':''}" data-index="${idx}"></span>`).join('')}
          </div>
        </div>
        <div class="property-info">
          <div class="property-header">
            <h3 class="property-title">${title}</h3>
            <div class="property-rent">₹${formatNumber(property.expectedRent)} <span>/month</span></div>
          </div>
          <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}, ${property.city}</div>
          <div class="divider"></div>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Type</span><span class="info-value">${typeDisplay}</span></div>
                        <div class="info-item"><span class="info-label">${property.type === 'PG' ? 'Seater' : 'BHK'}</span><span class="info-value">${ocupDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Area</span><span class="info-value">${areaDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Bath</span><span class="info-value">${bathDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Furnishing</span><span class="info-value">${furnishingDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Floor</span><span class="info-value">${floorDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Parking</span><span class="info-value">${parkingDisplay}</span></div>
                        <div class="info-item"><span class="info-label">Deposit</span><span class="info-value">${deposit}</span></div>
                        <div class="info-item"><span class="info-label">Maintenance</span><span class="info-value">${maintenance}</span></div>
                        <div class="info-item"><span class="info-label">Available</span><span class="info-value">${availabilityText}</span></div>
                        <div class="info-item"><span class="info-label">Tenants</span><span class="info-value">${preferredTenants}</span></div>
                    </div>
                    ${description ? `<p class="description clamp-2">${description}</p>` : ''}
                    <div class="amenities">
                        ${topAmenities.map(a => `<div class="amenity"><i class=\"fas fa-check\"></i>${a}</div>`).join('')}
                        ${moreAmenityCount ? `<div class="amenity">+${moreAmenityCount} more</div>` : ''}
                    </div>
          <div class="property-actions">
            <button class="btn btn-outline" onclick="event.stopPropagation(); window.location.href='property-details.html?id=${property.id}'">Details</button>
            <button class="btn btn-primary" onclick="event.stopPropagation(); alert('Booking feature coming soon!')">Book Visit</button>
          </div>
        </div>
      </div>
    `;
}

/**
 * Toggle BHK/Seater filter based on property type
 */
function toggleBhkSeaterFilter() {
    const propertyType = document.getElementById('filterPropertyType').value;
    const bhkGroup = document.getElementById('bhkFilterGroup');
    const seaterGroup = document.getElementById('seaterFilterGroup');
    
    if (propertyType === 'PG') {
        bhkGroup.style.display = 'none';
        seaterGroup.style.display = 'flex';
    } else {
        bhkGroup.style.display = 'flex';
        seaterGroup.style.display = 'none';
    }
}

/**
 * Apply filters
 */
function applyFilters() {
    console.log('applyFilters() called');
    
    // Get filter values from actual HTML structure
    const propertyType = document.getElementById('filterPropertyType')?.value || '';
    const city = document.getElementById('filterCity')?.value?.toLowerCase() || '';
    const maxRent = parseInt(document.getElementById('filterMaxRent')?.value) || Infinity;
    const furnishing = document.getElementById('filterFurnishing')?.value || '';
    
    // Get checked values for checkbox filters
    const selectedFlatTypes = Array.from(document.querySelectorAll('input[data-filter="flatType"]:checked')).map(cb => cb.value);
    const selectedPgTypes = Array.from(document.querySelectorAll('input[data-filter="pgType"]:checked')).map(cb => cb.value);
    const selectedSharing = Array.from(document.querySelectorAll('input[data-filter="sharing"]:checked')).map(cb => parseInt(cb.value));
    const selectedAmenities = Array.from(document.querySelectorAll('input[data-filter="amenities"]:checked')).map(cb => cb.value);
    const selectedPreferredTenants = Array.from(document.querySelectorAll('input[data-filter="preferredTenants"]:checked')).map(cb => cb.value);
    
    console.log('Filter values:', {
        propertyType, city, maxRent, furnishing,
        selectedFlatTypes, selectedPgTypes, selectedSharing, selectedAmenities, selectedPreferredTenants
    });
    console.log('Total properties before filtering:', allProperties.length);
    
    const today = new Date();
    
    filteredProperties = allProperties.filter(property => {
        // Property Type filter
        const matchType = !propertyType || property.type === propertyType;
        
        // City filter
        const matchCity = !city || (property.city && property.city.toLowerCase().includes(city));
        
        // Max Rent filter
        const matchRent = property.expectedRent <= maxRent;
        
        // Furnishing filter
        const matchFurnishing = !furnishing || property.furnishing === furnishing;
        
        // Flat Type filter (BHK types for FLAT properties)
        let matchFlatType = true;
        if (selectedFlatTypes.length > 0 && property.type === 'FLAT') {
            matchFlatType = selectedFlatTypes.includes(property.bhkType);
        }
        
        // PG Type filter (for PG properties)
        let matchPgType = true;
        if (selectedPgTypes.length > 0 && property.type === 'PG') {
            matchPgType = selectedPgTypes.includes(property.pgGenderType);
        }
        
        // Room Sharing filter (for PG properties)
        let matchSharing = true;
        if (selectedSharing.length > 0 && property.type === 'PG') {
            matchSharing = selectedSharing.includes(property.pgSeater);
        }
        
        // Amenities filter
        let matchAmenities = true;
        if (selectedAmenities.length > 0) {
            const propertyAmenities = Array.isArray(property.amenities) ? property.amenities : [];
            matchAmenities = selectedAmenities.every(amenity => propertyAmenities.includes(amenity));
        }
        
        // Preferred Tenants filter
        let matchPreferredTenants = true;
        if (selectedPreferredTenants.length > 0) {
            const propertyPreferredTenants = Array.isArray(property.preferredTenants) ? property.preferredTenants : [];
            matchPreferredTenants = selectedPreferredTenants.some(tenant => propertyPreferredTenants.includes(tenant));
        }
        
        return matchType && matchCity && matchRent && matchFurnishing && matchFlatType && matchPgType && matchSharing && matchAmenities && matchPreferredTenants;
    });
    
    console.log('Filtered properties count:', filteredProperties.length);
    
    currentPage = 1;
    displayProperties();
    setupPagination();
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`Found ${filteredProperties.length} properties`, 'success');
    }
}

/**
 * Clear filters
 */
function clearFilters() {
    document.getElementById('filterPropertyType').value = '';
    document.getElementById('filterBHK').value = '';
    document.getElementById('filterSeater').value = '';
    document.getElementById('filterCity').value = '';
    document.getElementById('filterMaxRent').value = '';
    document.getElementById('filterAvailability').value = '';
    document.getElementById('filterPreferredTenant').value = '';
    document.getElementById('filterFurnishing').value = '';
    
    // Reset BHK/Seater visibility
    document.getElementById('bhkFilterGroup').style.display = 'flex';
    document.getElementById('seaterFilterGroup').style.display = 'none';
    
    filteredProperties = [...allProperties];
    currentPage = 1;
    displayProperties();
    setupPagination();
}

/**
 * Setup pagination
 */
function setupPagination() {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    const pagination = document.getElementById('paginationContainer'); // Fixed: was 'pagination'
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (!pagination || !pageNumbers) {
        console.warn('Pagination elements not found');
        return;
    }
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageNumbers.innerHTML = '';
    
    // Show max 5 page numbers
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
}

/**
 * Go to specific page
 */
function goToPage(page) {
    currentPage = page;
    displayProperties();
    setupPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Next page
 */
function nextPage() {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

/**
 * Previous page
 */
function previousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

/**
 * View property details
 */
function viewPropertyDetails(propertyId) {
    console.log('Viewing property:', propertyId);
    window.location.href = `property-details.html?id=${propertyId}`;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Toggle favorite property
 */
function toggleFavorite(event, propertyId) {
    event.stopPropagation(); // Prevent card click
    
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    
    // Get favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
    
    if (favorites.includes(propertyId)) {
        // Remove from favorites
        favorites = favorites.filter(id => id !== propertyId);
        icon.classList.remove('fas');
        icon.classList.add('far');
        btn.classList.remove('active');
        
        if (typeof showNotification === 'function') {
            showNotification('Removed from favorites', 'info');
        }
    } else {
        // Add to favorites
        favorites.push(propertyId);
        icon.classList.remove('far');
        icon.classList.add('fas');
        btn.classList.add('active');
        
        if (typeof showNotification === 'function') {
            showNotification('Added to favorites', 'success');
        }
    }
    
    // Save to localStorage
    localStorage.setItem('favoriteProperties', JSON.stringify(favorites));
}

/**
 * Check if property is favorited and update icon
 */
function updateFavoriteIcons() {
    const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const card = btn.closest('.property-card');
        if (!card) return;
        const propertyId = parseInt(card.getAttribute('data-property-id'));
        const icon = btn.querySelector('i');
        if (favorites.includes(propertyId)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.classList.add('active');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            btn.classList.remove('active');
        }
    });
}

function setupCarouselEventListeners() {
    // Set up event listeners for carousel buttons and dots
    document.querySelectorAll('.carousel-btn.prev').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeCarouselImage(btn, -1);
        });
    });
    
    document.querySelectorAll('.carousel-btn.next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeCarouselImage(btn, 1);
        });
    });
    
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(dot.getAttribute('data-index'));
            jumpToCarouselImage(dot, index);
        });
    });
    
    console.log('Carousel event listeners set up');
}

// Carousel helpers
let carouselIntervals = new Map(); // Store intervals for each carousel

function initializeCarousels() {
    console.log('Initializing carousels...');
    
    // Clear existing intervals
    carouselIntervals.forEach(interval => clearInterval(interval));
    carouselIntervals.clear();
    
    // Initialize auto-scroll for each carousel with multiple images
    const imageWrappers = document.querySelectorAll('.property-image');
    console.log(`Found ${imageWrappers.length} image wrappers`);
    
    imageWrappers.forEach(imageWrapper => {
        const encoded = imageWrapper.getAttribute('data-images');
        console.log('Checking wrapper:', imageWrapper, 'data-images:', encoded);
        if (!encoded) return;
        
        try {
            const images = JSON.parse(decodeURIComponent(encoded));
            
            // Temporarily add demo images for testing carousel
            const testImages = [
                ...images,
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
            ];
            
            console.log(`Property has ${testImages.length} images (${images.length} original + demo)`, testImages);
            
            // Initialize auto-scroll for any carousel (even single images for consistency)
            if (images.length >= 1) {
                const propertyId = imageWrapper.getAttribute('data-property-id');
                console.log(`Starting auto-scroll for property ${propertyId}`);
                
                // Start auto-scroll every 4 seconds
                const interval = setInterval(() => {
                    // Check if element is still in DOM and visible
                    if (document.contains(imageWrapper) && isElementVisible(imageWrapper)) {
                        const nextBtn = imageWrapper.querySelector('.carousel-btn.next');
                        if (nextBtn) {
                            changeCarouselImage(nextBtn, 1);
                        }
                    } else {
                        clearInterval(interval);
                        carouselIntervals.delete(propertyId);
                    }
                }, 4000);
                
                carouselIntervals.set(propertyId, interval);
                
                // Pause on hover, resume on leave
                imageWrapper.addEventListener('mouseenter', () => {
                    const interval = carouselIntervals.get(propertyId);
                    if (interval) {
                        clearInterval(interval);
                        carouselIntervals.delete(propertyId);
                        console.log(`Paused auto-scroll for property ${propertyId}`);
                    }
                });
                
                imageWrapper.addEventListener('mouseleave', () => {
                    // Restart auto-scroll after hover
                    setTimeout(() => {
                        if (document.contains(imageWrapper) && !carouselIntervals.has(propertyId)) {
                            const newInterval = setInterval(() => {
                                if (document.contains(imageWrapper) && isElementVisible(imageWrapper)) {
                                    const nextBtn = imageWrapper.querySelector('.carousel-btn.next');
                                    if (nextBtn) {
                                        changeCarouselImage(nextBtn, 1);
                                    }
                                } else {
                                    clearInterval(newInterval);
                                    carouselIntervals.delete(propertyId);
                                }
                            }, 4000);
                            carouselIntervals.set(propertyId, newInterval);
                            console.log(`Resumed auto-scroll for property ${propertyId}`);
                        }
                    }, 500); // Small delay before restarting
                });
            }
        } catch (error) {
            console.error('Error initializing carousel:', error);
        }
    });
}

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
}

function changeCarouselImage(button, direction) {
    console.log('changeCarouselImage called with:', button, direction);
    const imageWrapper = button ? button.closest('.property-image') : null;
    if (!imageWrapper) {
        console.error('Image wrapper not found');
        return;
    }
    
    const img = imageWrapper.querySelector('img');
    const encoded = imageWrapper.getAttribute('data-images');
    console.log('Found data-images:', encoded);
    
    if (!encoded) {
        console.error('No images data found');
        return;
    }
    
    try {
        const images = JSON.parse(decodeURIComponent(encoded));
        let index = parseInt(imageWrapper.getAttribute('data-image-index')) || 0;
        
        console.log('Current index:', index, 'Direction:', direction, 'Images count:', images.length);
        
        // Calculate new index
        index = (index + direction + images.length) % images.length;
        
        console.log('New index:', index);
        
        // Update image and index
        imageWrapper.setAttribute('data-image-index', index);
        img.src = images[index];
        
        // Update dots
        updateCarouselDots(imageWrapper, index);
        
        console.log(`Changed to image ${index + 1}/${images.length}`);
    } catch (error) {
        console.error('Error changing carousel image:', error);
    }
}

function jumpToCarouselImage(dotEl, targetIndex) {
    const imageWrapper = dotEl.closest('.property-image');
    if (!imageWrapper) return;
    
    const img = imageWrapper.querySelector('img');
    const encoded = imageWrapper.getAttribute('data-images');
    if (!encoded) return;
    
    try {
        const images = JSON.parse(decodeURIComponent(encoded));
        if (targetIndex < 0 || targetIndex >= images.length) return;
        
        // Update image and index
        imageWrapper.setAttribute('data-image-index', targetIndex);
        img.src = images[targetIndex];
        
        // Update dots
        updateCarouselDots(imageWrapper, targetIndex);
        
        console.log(`Jumped to image ${targetIndex + 1}/${images.length}`);
    } catch (error) {
        console.error('Error jumping to carousel image:', error);
    }
}

function updateCarouselDots(wrapper, activeIndex) {
    wrapper.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        if (i === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function setupCarouselEventListeners() {
    console.log('Setting up carousel event listeners...');
    
    // Setup carousel arrow buttons
    const prevButtons = document.querySelectorAll('.carousel-btn.prev');
    const nextButtons = document.querySelectorAll('.carousel-btn.next');
    const dots = document.querySelectorAll('.carousel-dot');
    
    console.log('Found carousel elements:', {
        prevButtons: prevButtons.length,
        nextButtons: nextButtons.length,
        dots: dots.length
    });
    
    prevButtons.forEach(btn => {
        console.log('Adding prev listener to:', btn);
        btn.addEventListener('click', (e) => {
            console.log('Prev button clicked!', btn);
            e.stopPropagation();
            changeCarouselImage(btn, -1);
        });
    });
    
    nextButtons.forEach(btn => {
        console.log('Adding next listener to:', btn);
        btn.addEventListener('click', (e) => {
            console.log('Next button clicked!', btn);
            e.stopPropagation();
            changeCarouselImage(btn, 1);
        });
    });
    
    // Setup carousel dots
    dots.forEach(dot => {
        console.log('Adding dot listener to:', dot);
        dot.addEventListener('click', (e) => {
            console.log('Dot clicked!', dot);
            e.stopPropagation();
            const index = parseInt(dot.getAttribute('data-index'));
            jumpToCarouselImage(dot, index);
        });
    });
    
    console.log('Carousel event listeners setup complete');
}
// Expose carousel functions
window.changeCarouselImage = changeCarouselImage;
window.jumpToCarouselImage = jumpToCarouselImage;
window.initializeCarousels = initializeCarousels;
window.setupCarouselEventListeners = setupCarouselEventListeners;

// Make functions globally available
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.nextPage = nextPage;
window.previousPage = previousPage;
window.toggleFavorite = toggleFavorite;
window.toggleBhkSeaterFilter = toggleBhkSeaterFilter;

// Clean up intervals when page is about to unload
window.addEventListener('beforeunload', () => {
    carouselIntervals.forEach(interval => clearInterval(interval));
    carouselIntervals.clear();
});

console.log('Properties page initialized');
