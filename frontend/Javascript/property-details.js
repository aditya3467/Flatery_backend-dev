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
        // Fetch property details from API (use shared apiService)
        propertyData = await apiService.makeRequest(`/properties/${propertyId}`, { includeAuth: false });
        hydratePropertyDetails(propertyData);
        
    } catch (error) {
        console.error('Error loading property:', error);
        showError('Failed to load property details');
    }
}

/**
 * Display property details
 */
function hydratePropertyDetails(property) {
    // Compute title
    const bhkType = property.bhkType || property.bhk;
    const seater = property.pgSeater || property.seater;
    let title;
    if (property.type === 'PG' && property.name) {
        title = property.name;
    } else {
        const firstWord = property.location ? property.location.trim().split(/\s+/)[0] : (property.city || 'Property');
        title = bhkType ? `${firstWord} ${String(bhkType).replace('BHK_', '')} BHK` : firstWord;
    }

    // Header
    document.getElementById('propTitle').textContent = title;
    document.getElementById('propLocation').textContent = `${property.location}, ${property.city}`;
    if (property.landmark) {
        const lm = document.getElementById('propLandmark');
        lm.textContent = `• ${property.landmark}`;
        lm.style.display = '';
    }
    document.getElementById('propType').textContent = property.type;
    document.getElementById('propArea').textContent = `${property.builtUpAreaSqft} sq.ft`;
    if (property.postedOn) {
        document.getElementById('propPostedOn').textContent = `Posted on ${new Date(property.postedOn).toLocaleDateString('en-IN')}`;
    }
    if (bhkType) {
        document.getElementById('metaBhk').style.display = '';
        document.getElementById('propBhk').textContent = `${String(bhkType).replace('BHK_', '')} BHK`;
    }
    if (seater) {
        document.getElementById('metaSeater').style.display = '';
        document.getElementById('propSeater').textContent = `${seater} Seater`;
    }

    // Description
    if (property.description) {
        document.getElementById('descriptionSection').style.display = '';
        document.getElementById('propDescription').textContent = property.description;
    }

    // Details grid
    document.getElementById('detType').textContent = property.type;
    if (bhkType) { document.getElementById('detBhkRow').style.display = ''; document.getElementById('detBhk').textContent = `${String(bhkType).replace('BHK_', '')} BHK`; }
    if (seater) { document.getElementById('detSeaterRow').style.display = ''; document.getElementById('detSeater').textContent = `${seater} Seater`; }
    document.getElementById('detArea').textContent = `${property.builtUpAreaSqft} sq.ft`;
    document.getElementById('detFloor').textContent = `${property.currentFloor} of ${property.totalFloor}`;
    document.getElementById('detAge').textContent = formatPropertyAge(property.age);
    if (property.facing) { document.getElementById('detFacingRow').style.display = ''; document.getElementById('detFacing').textContent = property.facing; }
    document.getElementById('detFurnishing').textContent = property.furnishing;
    document.getElementById('detBathrooms').textContent = property.bathrooms;
    document.getElementById('detParking').textContent = property.parking;
    document.getElementById('detBalcony').textContent = property.balcony ? 'Yes' : 'No';
    document.getElementById('detMaintenance').textContent = `₹${formatNumber(property.monthlyMaintenance)}`;
    if (property.currentCondition) { document.getElementById('detConditionRow').style.display = ''; document.getElementById('detCondition').textContent = formatEnumValue(property.currentCondition); }

    // Amenities
    if (Array.isArray(property.amenities) && property.amenities.length > 0) {
        document.getElementById('amenitiesSection').style.display = '';
        const list = document.getElementById('amenitiesList');
        list.innerHTML = '';
        property.amenities.forEach(a => {
            const chip = document.createElement('div');
            chip.className = 'amenity-badge';
            chip.innerHTML = `<i class="fas fa-check"></i> ${formatEnumValue(a)}`;
            list.appendChild(chip);
        });
    }

    // Preferred tenants
    if (Array.isArray(property.preferredTenants) && property.preferredTenants.length > 0) {
        document.getElementById('tenantsSection').style.display = '';
        const tlist = document.getElementById('tenantsList');
        tlist.innerHTML = '';
        property.preferredTenants.forEach(t => {
            const chip = document.createElement('div');
            chip.className = 'amenity-badge';
            chip.innerHTML = `<i class="fas fa-user"></i> ${formatEnumValue(t)}`;
            tlist.appendChild(chip);
        });
    }

    // Schedule
    if (property.scheduleAvailability) {
        document.getElementById('scheduleSection').style.display = '';
        document.getElementById('detAvailability').textContent = formatEnumValue(property.scheduleAvailability);
        const timingsRow = document.getElementById('detTimingsRow');
        if (property.allDay) {
            timingsRow.style.display = '';
            document.getElementById('detTimings').textContent = 'All Day';
        } else if (property.scheduleStart && property.scheduleEnd) {
            timingsRow.style.display = '';
            document.getElementById('detTimings').textContent = `${formatTime(property.scheduleStart)} - ${formatTime(property.scheduleEnd)}`;
        }
        if (property.whoShows) {
            document.getElementById('detWhoShowsRow').style.display = '';
            document.getElementById('detWhoShows').textContent = formatEnumValue(property.whoShows);
        }
    }

    // Sidebar pricing
    document.getElementById('priceAmount').textContent = `₹${formatNumber(property.expectedRent)}`;
    const badge = document.getElementById('negotiableBadge');
    if (property.negotiable) { badge.classList.add('badge-negotiable'); badge.textContent = 'Negotiable'; }
    else { badge.classList.add('badge-non-negotiable'); badge.textContent = 'Non-Negotiable'; }
    document.getElementById('depositAmount').textContent = `₹${formatNumber(property.expectedDeposit)}`;
    if (property.availableFrom) {
        document.getElementById('availableDate').textContent = new Date(property.availableFrom).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });
    }

    // Images
    loadPropertyImages(property.id);
}

/**
 * Load property images
 */
async function loadPropertyImages(propertyId) {
    const imageGallery = document.getElementById('imageGallery');
    const baseOrigin = (window.apiService && apiService.baseURL)
        ? apiService.baseURL.replace(/\/?api\/?$/, '')
        : 'http://localhost:8081';
    const toAbsolute = (u) => {
        if (!u) return null;
        return u.startsWith('http') ? u : `${baseOrigin}${u.startsWith('/') ? '' : '/'}${u}`;
    };
    
    // WORKAROUND: Skip gallery endpoint (403 issue) and use primary image directly from details
    // The /api/properties/{id}/images endpoint is returning 403 even though it's public
    // Until backend permissions are fixed, just show the primary image
    if (propertyData && propertyData.primaryImageUrl) {
        const primaryAbs = toAbsolute(propertyData.primaryImageUrl);
        imageGallery.innerHTML = `
            <div class="image-gallery">
                <img src="${primaryAbs}" 
                     alt="Property Image" 
                     class="gallery-image"
                     onclick="openImageModal('${primaryAbs}')"
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'">
            </div>
        `;
        return;
    }
    
    // No primary image available
    imageGallery.innerHTML = `
        <div class="no-images">
            <i class="fas fa-image fa-3x"></i>
            <p>No images available for this property</p>
        </div>
    `;
}/**
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
