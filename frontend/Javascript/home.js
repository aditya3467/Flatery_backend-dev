/**
 * Home Page JavaScript
 * Loads recommended properties for the homepage
 */

document.addEventListener('DOMContentLoaded', async function() {
    loadRecommendedProperties();
});

/**
 * Load recommended properties from API and display on homepage
 */
async function loadRecommendedProperties() {
    const container = document.querySelector('.recc-properties .row:last-child');
    
    if (!container) {
        console.log('Recommended properties container not found');
        return;
    }
    
    try {
        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                <p style="margin-top: 10px;">Loading properties...</p>
            </div>
        `;
        
        // Fetch first 3 properties from the API
        const response = await apiService.getProperties();
        const properties = response.content || [];
        
        if (properties.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; width: 100%;">
                    <i class="fas fa-home" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="margin-top: 10px;">No properties available yet.</p>
                </div>
            `;
            return;
        }
        
        // Display up to 3 properties
        container.innerHTML = properties.slice(0, 3).map(property => createPropertyCard(property)).join('');
        
    } catch (error) {
        console.error('Error loading recommended properties:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f44336;"></i>
                <p style="margin-top: 10px;">Failed to load properties. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Create a property card for homepage
 */
function createPropertyCard(property) {
    const bhkType = property.bhkType || property.bhk;
    const seater = property.pgSeater || property.seater;
    const title = property.name || 
                  `${bhkType ? bhkType + ' BHK' : seater + ' Seater'} ${property.type}`;
    const imageUrl = property.primaryImageUrl || 'img/properties/default.jpg';
    
    return `
        <div class="property-card" onclick="viewProperty(${property.id})">
            <div class="property-image">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='img/properties/1.jpeg'">
            </div>
            <div class="property-details">
                <h3>${title}</h3>
                <p>
                    ${bhkType ? bhkType + ' Beds' : seater + ' Seater'} • 
                    ${property.bathrooms} Baths • 
                    ${property.builtUpAreaSqft} sqft
                </p>
                <p>₹${formatPrice(property.expectedRent)}/month</p>
            </div>
        </div>
    `;
}

/**
 * Format price with Indian number system
 */
function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Navigate to property details page
 */
function viewProperty(propertyId) {
    // TODO: Navigate to property details page
    window.location.href = `property-details.html?id=${propertyId}`;
}
