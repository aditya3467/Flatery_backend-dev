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
    loadProperties();
    applyUrlFilters();
});

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
 * Fetch full details for PG and APARTMENT properties to get their names
 */
async function enrichPropertiesWithNames() {
    const pgAndApartments = allProperties.filter(p => p.type === 'PG' || p.type === 'APARTMENT');
    
    // Fetch details in parallel for all PG/APARTMENT properties
    const detailsPromises = pgAndApartments.map(async (property) => {
        try {
            const details = await apiService.makeRequest(`/properties/${property.id}`, { includeAuth: false });
            property.name = details.name; // Add name to the summary object
        } catch (error) {
            console.warn(`Failed to fetch name for property ${property.id}:`, error);
        }
    });
    
    await Promise.all(detailsPromises);
}

/**
 * Apply filters from URL parameters
 */
function applyUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    const keywordParam = urlParams.get('keyword');
    
    // Set filter dropdowns if they exist
    if (cityParam) {
        const cityFilter = document.getElementById('filterCity');
        if (cityFilter) {
            cityFilter.value = cityParam;
        }
        
        // Apply city filter to properties
        filteredProperties = allProperties.filter(property => 
            property.city && property.city.toLowerCase() === cityParam.toLowerCase()
        );
    }
    
    // Apply keyword filter if provided
    if (keywordParam) {
        const keyword = keywordParam.toLowerCase();
        filteredProperties = filteredProperties.filter(property => 
            (property.city && property.city.toLowerCase().includes(keyword)) ||
            (property.location && property.location.toLowerCase().includes(keyword)) ||
            (property.type && property.type.toLowerCase().includes(keyword)) ||
            (property.name && property.name.toLowerCase().includes(keyword))
        );
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
    const propertiesGrid = document.getElementById('propertiesGrid');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    if (currentProperties.length === 0) {
        propertiesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No Properties Found</h3>
                <p>Try adjusting your filters or search criteria.</p>
            </div>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    propertiesGrid.innerHTML = currentProperties.map(property => createPropertyCard(property)).join('');
    
    // Update favorite icons based on localStorage
    updateFavoriteIcons();
    
    // Add click listeners to property cards
    document.querySelectorAll('.property-card').forEach(card => {
        card.addEventListener('click', function() {
            const propertyId = this.getAttribute('data-property-id');
            viewPropertyDetails(propertyId);
        });
    });
}

/**
 * Create property card HTML
 */
function createPropertyCard(property) {
    // Handle API response format (PropertySummary)
    const bhkType = property.bhkType || property.bhk;
    const seater = property.pgSeater || property.seater;
    
    // Compute property name:
    // For PG and APARTMENT: use name field (enriched from details API)
    // For FLAT: use "BHK in Location"
    let title;
    if ((property.type === 'PG' || property.type === 'APARTMENT') && property.name) {
        title = property.name;
    } else if (property.type === 'FLAT' && bhkType) {
        const bhkNumber = bhkType.replace('BHK_', '');
        const locationName = property.location || property.city || 'Property';
        title = `${bhkNumber} BHK in ${locationName}`;
    } else {
        // Fallback
        title = property.location || property.city || 'Property';
    }
    
    // Use primaryImageUrl from API, fallback to placeholder
    const imageUrl = property.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60';
    
    // Format available from date
    const availableDate = property.availableFrom ? new Date(property.availableFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Available Now';
    
    // Format furnishing display
    const furnishingDisplay = property.furnishing ? property.furnishing.replace('_', ' ') : 'Not Specified';
    
    // Format apartment type display  
    const apartmentType = bhkType ? bhkType.replace('BHK_', '') + ' BHK' : (property.type || 'Property');
    
    // Get preferred tenants (assuming it comes as array or string)
    const preferredTenants = Array.isArray(property.preferredTenants) && property.preferredTenants.length > 0 
        ? property.preferredTenants[0].replace('_', ' ') 
        : 'Any';
    
    return `
        <div class="property-card" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'">
                <span class="property-badge">${property.type}</span>
                <button class="favorite-btn" onclick="toggleFavorite(event, ${property.id})">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="property-content">
                <h3 class="property-title">${title}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.location}, ${property.city}</span>
                </div>
                <div class="property-info-grid">
                    <div class="property-info-item">
                        <div class="property-info-icon">
                            <i class="fas fa-couch"></i>
                        </div>
                        <div class="property-info-content">
                            <span class="property-info-label">Furnishing</span>
                            <span class="property-info-value">${furnishingDisplay}</span>
                        </div>
                    </div>
                    <div class="property-info-item">
                        <div class="property-info-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="property-info-content">
                            <span class="property-info-label">Apartment Type</span>
                            <span class="property-info-value">${apartmentType}</span>
                        </div>
                    </div>
                    <div class="property-info-item">
                        <div class="property-info-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="property-info-content">
                            <span class="property-info-label">Preferred Tenants</span>
                            <span class="property-info-value">${preferredTenants}</span>
                        </div>
                    </div>
                    <div class="property-info-item">
                        <div class="property-info-icon">
                            <i class="fas fa-key"></i>
                        </div>
                        <div class="property-info-content">
                            <span class="property-info-label">Available From</span>
                            <span class="property-info-value">${availableDate}</span>
                        </div>
                    </div>
                </div>
                <div class="property-footer">
                    <div class="property-price">
                        <span class="price-amount">â‚¹${formatNumber(property.expectedRent)}</span>
                        <span class="price-label">per month</span>
                    </div>
                    <button class="view-details-btn">View Details</button>
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
    const propertyType = document.getElementById('filterPropertyType').value;
    const bhk = document.getElementById('filterBHK').value;
    const seater = document.getElementById('filterSeater').value;
    const city = document.getElementById('filterCity').value.toLowerCase();
    const maxRent = parseInt(document.getElementById('filterMaxRent').value) || Infinity;
    const availability = document.getElementById('filterAvailability').value;
    const preferredTenant = document.getElementById('filterPreferredTenant').value;
    const furnishing = document.getElementById('filterFurnishing').value;
    
    const today = new Date();
    
    filteredProperties = allProperties.filter(property => {
        // Property Type
        const matchType = !propertyType || property.type === propertyType;
        
        // BHK or Seater (depending on property type)
        let matchBhkSeater = true;
        if (propertyType === 'PG' && seater) {
            matchBhkSeater = property.pgSeater && property.pgSeater >= parseInt(seater);
        } else if (bhk) {
            matchBhkSeater = property.bhkType === bhk;
        }
        
        // City
        const matchCity = !city || property.city.toLowerCase().includes(city);
        
        // Max Rent
        const matchRent = property.expectedRent <= maxRent;
        
        // Availability
        let matchAvailability = true;
        if (availability && property.availableFrom) {
            const availableDate = new Date(property.availableFrom);
            const diffTime = availableDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            switch(availability) {
                case 'immediate':
                    matchAvailability = diffDays <= 0;
                    break;
                case '15days':
                    matchAvailability = diffDays > 0 && diffDays <= 15;
                    break;
                case '30days':
                    matchAvailability = diffDays > 0 && diffDays <= 30;
                    break;
                case 'after30days':
                    matchAvailability = diffDays > 30;
                    break;
            }
        }
        
        // Preferred Tenant
        const matchTenant = !preferredTenant || 
                           (Array.isArray(property.preferredTenants) && property.preferredTenants.includes(preferredTenant)) ||
                           property.preferredTenants === preferredTenant;
        
        // Furnishing
        const matchFurnishing = !furnishing || property.furnishing === furnishing;
        
        return matchType && matchBhkSeater && matchCity && matchRent && matchAvailability && matchTenant && matchFurnishing;
    });
    
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
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    
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
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const card = btn.closest('.property-card');
        const propertyId = parseInt(card.getAttribute('data-property-id'));
        const icon = btn.querySelector('i');
        
        if (favorites.includes(propertyId)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            btn.classList.add('active');
        }
    });
}

// Make functions globally available
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.nextPage = nextPage;
window.previousPage = previousPage;
window.toggleFavorite = toggleFavorite;
window.toggleBhkSeaterFilter = toggleBhkSeaterFilter;

console.log('Properties page initialized');
