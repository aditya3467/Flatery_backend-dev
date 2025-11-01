/**
 * Property Details Page JavaScript
 * Handles fetching and displaying detailed property information
 */

let propertyId = null;
let propertyData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    propertyId = urlParams.get('id');
    
    if (!propertyId) {
        showError('Property ID not found');
        return;
    }
    
    loadPropertyDetails();
});

/**
 * Load property details from API
 */
async function loadPropertyDetails() {
    try {
        // Fetch property details from API
        const response = await fetch(`http://localhost:8081/api/properties/${propertyId}`);
        
        if (!response.ok) {
            throw new Error('Property not found');
        }
        
        propertyData = await response.json();
        displayPropertyDetails(propertyData);
        
    } catch (error) {
        console.error('Error loading property:', error);
        showError('Failed to load property details');
    }
}

/**
 * Display property details
 */
function displayPropertyDetails(property) {
    const container = document.getElementById('propertyDetails');
    
    // Determine title
    const bhkType = property.bhkType || property.bhk;
    const seater = property.pgSeater || property.seater;
    const title = property.name || 
                  `${bhkType ? bhkType + ' BHK' : seater + ' Seater'} ${property.type}`;
    
    // Format availability date
    const availableDate = new Date(property.availableFrom).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    container.innerHTML = `
        <a href="properties.html" class="back-button">
            <i class="fas fa-arrow-left"></i>
            Back to Properties
        </a>
        
        <div class="property-header">
            <h1 class="property-title">${title}</h1>
            <div class="property-location-header">
                <i class="fas fa-map-marker-alt"></i>
                <span>${property.location}, ${property.city}</span>
                ${property.landmark ? `<span style="color: #999;">• ${property.landmark}</span>` : ''}
            </div>
            <div class="property-meta">
                <div class="meta-item">
                    <i class="fas fa-tag"></i>
                    <span><strong>${property.type}</strong></span>
                </div>
                ${bhkType ? `
                <div class="meta-item">
                    <i class="fas fa-bed"></i>
                    <span>${bhkType} BHK</span>
                </div>` : ''}
                ${seater ? `
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${seater} Seater</span>
                </div>` : ''}
                <div class="meta-item">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.builtUpAreaSqft} sq.ft</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Posted on ${new Date(property.postedOn).toLocaleDateString('en-IN')}</span>
                </div>
            </div>
        </div>
        
        <div class="property-content">
            <div class="main-content">
                <!-- Images Section -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-images"></i> Property Images
                    </h2>
                    <div id="imageGallery">
                        <div class="loading-container">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Description -->
                ${property.description ? `
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-align-left"></i> Description
                    </h2>
                    <p class="description-text">${property.description}</p>
                </div>` : ''}
                
                <!-- Property Details -->
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-info-circle"></i> Property Details
                    </h2>
                    <div class="details-grid">
                        <div class="detail-row">
                            <span class="detail-label">Property Type</span>
                            <span class="detail-value">${property.type}</span>
                        </div>
                        ${bhkType ? `
                        <div class="detail-row">
                            <span class="detail-label">BHK Type</span>
                            <span class="detail-value">${bhkType} BHK</span>
                        </div>` : ''}
                        ${seater ? `
                        <div class="detail-row">
                            <span class="detail-label">Seater</span>
                            <span class="detail-value">${seater} Seater</span>
                        </div>` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Built-up Area</span>
                            <span class="detail-value">${property.builtUpAreaSqft} sq.ft</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Floor</span>
                            <span class="detail-value">${property.currentFloor} of ${property.totalFloor}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Property Age</span>
                            <span class="detail-value">${formatPropertyAge(property.age)}</span>
                        </div>
                        ${property.facing ? `
                        <div class="detail-row">
                            <span class="detail-label">Facing</span>
                            <span class="detail-value">${property.facing}</span>
                        </div>` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Furnishing</span>
                            <span class="detail-value">${property.furnishing}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Bathrooms</span>
                            <span class="detail-value">${property.bathrooms}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Parking</span>
                            <span class="detail-value">${property.parking}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Balcony</span>
                            <span class="detail-value">${property.balcony ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Monthly Maintenance</span>
                            <span class="detail-value">₹${formatNumber(property.monthlyMaintenance)}</span>
                        </div>
                        ${property.currentCondition ? `
                        <div class="detail-row">
                            <span class="detail-label">Current Condition</span>
                            <span class="detail-value">${formatEnumValue(property.currentCondition)}</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Amenities -->
                ${property.amenities && property.amenities.length > 0 ? `
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-check-circle"></i> Amenities
                    </h2>
                    <div class="amenities-list">
                        ${property.amenities.map(amenity => `
                            <div class="amenity-badge">
                                <i class="fas fa-check"></i>
                                ${formatEnumValue(amenity)}
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
                
                <!-- Preferred Tenants -->
                ${property.preferredTenants && property.preferredTenants.length > 0 ? `
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-user-friends"></i> Preferred Tenants
                    </h2>
                    <div class="amenities-list">
                        ${property.preferredTenants.map(tenant => `
                            <div class="amenity-badge">
                                <i class="fas fa-user"></i>
                                ${formatEnumValue(tenant)}
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
                
                <!-- Schedule Information -->
                ${property.scheduleAvailability ? `
                <div class="section-card">
                    <h2 class="section-title">
                        <i class="fas fa-clock"></i> Viewing Schedule
                    </h2>
                    <div class="details-grid">
                        <div class="detail-row">
                            <span class="detail-label">Availability</span>
                            <span class="detail-value">${formatEnumValue(property.scheduleAvailability)}</span>
                        </div>
                        ${property.allDay ? `
                        <div class="detail-row">
                            <span class="detail-label">Timings</span>
                            <span class="detail-value">All Day</span>
                        </div>` : property.scheduleStart && property.scheduleEnd ? `
                        <div class="detail-row">
                            <span class="detail-label">Timings</span>
                            <span class="detail-value">${formatTime(property.scheduleStart)} - ${formatTime(property.scheduleEnd)}</span>
                        </div>` : ''}
                        ${property.whoShows ? `
                        <div class="detail-row">
                            <span class="detail-label">Who Shows</span>
                            <span class="detail-value">${formatEnumValue(property.whoShows)}</span>
                        </div>` : ''}
                    </div>
                </div>` : ''}
            </div>
            
            <div class="sidebar">
                <!-- Price Card -->
                <div class="price-card">
                    <div class="price-label">Monthly Rent</div>
                    <div class="price-amount">₹${formatNumber(property.expectedRent)}</div>
                    <div>
                        <span class="badge ${property.negotiable ? 'badge-negotiable' : 'badge-non-negotiable'}">
                            ${property.negotiable ? 'Negotiable' : 'Non-Negotiable'}
                        </span>
                    </div>
                    <div class="deposit-info">
                        <div class="price-label">Security Deposit</div>
                        <div class="deposit-amount">₹${formatNumber(property.expectedDeposit)}</div>
                    </div>
                </div>
                
                <!-- Contact Card -->
                <div class="contact-card">
                    <div class="availability-info">
                        <i class="fas fa-calendar-check"></i>
                        <div>
                            <strong>Available from</strong><br>
                            ${availableDate}
                        </div>
                    </div>
                    <button class="contact-btn" onclick="contactOwner()">
                        <i class="fas fa-phone"></i>
                        Contact Owner
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Load images
    loadPropertyImages(property.id);
}

/**
 * Load property images
 */
async function loadPropertyImages(propertyId) {
    const imageGallery = document.getElementById('imageGallery');
    
    try {
        const response = await fetch(`http://localhost:8081/api/properties/${propertyId}/images`);
        
        if (!response.ok) {
            throw new Error('Failed to load images');
        }
        
        const images = await response.json();
        
        if (images.length === 0) {
            imageGallery.innerHTML = `
                <div class="no-images">
                    <i class="fas fa-image fa-3x"></i>
                    <p>No images available for this property</p>
                </div>
            `;
            return;
        }
        
        imageGallery.innerHTML = `
            <div class="image-gallery">
                ${images.map((image, index) => `
                    <img src="${image.imageUrl}" 
                         alt="Property Image ${index + 1}" 
                         class="gallery-image"
                         onclick="openImageModal('${image.imageUrl}')"
                         onerror="this.src='img/properties/default.jpg'">
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading images:', error);
        imageGallery.innerHTML = `
            <div class="no-images">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Could not load images</p>
            </div>
        `;
    }
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('propertyDetails');
    container.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <h2>Error</h2>
            <p>${message}</p>
            <a href="properties.html" class="btn-1">Back to Properties</a>
        </div>
    `;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format enum values (replace underscores with spaces and capitalize)
 */
function formatEnumValue(value) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format property age
 */
function formatPropertyAge(age) {
    const ageMap = {
        'UNDER_1_YEAR': 'Under 1 Year',
        'ONE_TO_THREE': '1-3 Years',
        'THREE_TO_FIVE': '3-5 Years',
        'FIVE_TO_TEN': '5-10 Years',
        'OVER_TEN': 'Over 10 Years'
    };
    return ageMap[age] || age;
}

/**
 * Format time
 */
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Open image in modal (can be enhanced with a proper lightbox)
 */
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    modal.innerHTML = `
        <img src="${imageUrl}" 
             style="max-width: 90%; max-height: 90%; object-fit: contain;">
        <button style="position: absolute; top: 20px; right: 20px; background: white; border: none; 
                       width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">
            ×
        </button>
    `;
    
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

/**
 * Contact owner
 */
function contactOwner() {
    if (typeof showNotification === 'function') {
        showNotification('Contact feature coming soon!', 'info');
    } else {
        alert('Contact feature coming soon!');
    }
}

console.log('Property details page initialized');
