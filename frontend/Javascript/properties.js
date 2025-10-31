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
        filteredProperties = [...allProperties];
        
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
    const title = property.name || 
                  `${bhkType ? bhkType + ' BHK' : seater + ' Seater'} ${property.type}`;
    
    // Use primaryImageUrl from API, fallback to placeholder
    const imageUrl = property.primaryImageUrl || 'img/properties/default.jpg';
    
    return `
        <div class="property-card" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='img/properties/default.jpg'">
                <span class="property-badge">${property.type}</span>
            </div>
            <div class="property-content">
                <h3 class="property-title">${title}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.location}, ${property.city}</span>
                </div>
                <div class="property-details">
                    ${bhkType ? `<div class="detail-item"><i class="fas fa-bed"></i> ${bhkType} BHK</div>` : ''}
                    ${seater ? `<div class="detail-item"><i class="fas fa-users"></i> ${seater} Seater</div>` : ''}
                    <div class="detail-item"><i class="fas fa-ruler-combined"></i> ${property.builtUpAreaSqft} sq.ft</div>
                    <div class="detail-item"><i class="fas fa-bath"></i> ${property.bathrooms} Bath</div>
                    <div class="detail-item"><i class="fas fa-couch"></i> ${property.furnishing}</div>
                </div>
                <div class="property-amenities">
                    ${property.amenities && property.amenities.length > 0 ? property.amenities.slice(0, 3).map(amenity => 
                        `<span class="amenity-badge">${amenity.replace('_', ' ')}</span>`
                    ).join('') : ''}
                    ${property.amenities && property.amenities.length > 3 ? `<span class="amenity-badge">+${property.amenities.length - 3} more</span>` : ''}
                </div>
                <div class="property-footer">
                    <div class="property-price">
                        <span class="price-amount">₹${formatNumber(property.expectedRent)}</span>
                        <span class="price-label">per month</span>
                    </div>
                    <button class="view-details-btn">View Details</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Apply filters
 */
function applyFilters() {
    const propertyType = document.getElementById('filterPropertyType').value;
    const bhk = document.getElementById('filterBHK').value;
    const city = document.getElementById('filterCity').value.toLowerCase();
    const maxRent = parseInt(document.getElementById('filterMaxRent').value) || Infinity;
    
    filteredProperties = allProperties.filter(property => {
        const matchType = !propertyType || property.type === propertyType;
        const matchBHK = !bhk || property.bhkType === bhk || property.bhk === bhk;
        const matchCity = !city || property.city.toLowerCase().includes(city);
        const matchRent = property.expectedRent <= maxRent;
        
        return matchType && matchBHK && matchCity && matchRent;
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
    document.getElementById('filterCity').value = '';
    document.getElementById('filterMaxRent').value = '';
    
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
    // TODO: Navigate to property details page
    console.log('Viewing property:', propertyId);
    // window.location.href = `property-details.html?id=${propertyId}`;
    
    if (typeof showNotification === 'function') {
        showNotification('Property details page coming soon!', 'info');
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Make functions globally available
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.nextPage = nextPage;
window.previousPage = previousPage;

console.log('Properties page initialized');
