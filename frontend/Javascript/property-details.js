/**
 * Property Details Page - 2 Column Layout
 * Handles image gallery, overview sections, amenities, CTA sidebar, and responsive behavior
 */

// Global variables
let currentProperty = null;
let currentImageIndex = 0;
let propertyImages = [];
let isWishlisted = false;
let currentOwnerContact = null; // populated from owner-only endpoint

/**
 * Initialize the property details page
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // Use the global API service instance
    if (typeof apiService === 'undefined') {
        if (typeof ApiService !== 'undefined') {
            window.apiService = new ApiService();
        } else {
            console.error('ApiService class not available. Make sure api.js is included before property-details.js');
            showError('API Service not available. Please refresh the page.');
            return;
        }
    }
    
    
    // Get property ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    
    if (propertyId) {
        loadPropertyDetails(propertyId);
    } else {
        console.error('No property ID found in URL parameters');
        showError('Property ID not found in URL. Please check the link and try again.');
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

/**
 * Load property details from API
 */
async function loadPropertyDetails(propertyId) {
    try {
        
        // Show loading state
        showLoadingState();
        
        // Strictly fetch from backend only (no demo data)
        let property = await fetchPropertyFromBackend(propertyId);
        if (!property) {
            throw new Error('No property data returned from server');
        }
        
        // Normalize field names from API to match what the UI expects
        if (!property.propertyType && property.type) {
            property.propertyType = property.type;
        }
        if (!property.builtUpAreaSqft && property.builtUpArea) {
            property.builtUpAreaSqft = property.builtUpArea;
        }
        if (!property.monthlyMaintenance && (property.maintenanceCharges || property.maintenance)) {
            property.monthlyMaintenance = property.maintenanceCharges || property.maintenance;
        }
        
        currentProperty = property;
        
        // Handle images: always try to fetch full set and merge with any provided
        try {
            // api.js baseURL already includes '/api'
            const images = await apiService.makeRequest(`/properties/${propertyId}/images`, { includeAuth: false });

            // Start with any images present on property payload
            const baseList = [];
            if (Array.isArray(property.images) && property.images.length > 0) {
                for (const u of property.images) {
                    if (typeof u === 'string' && u) baseList.push({ url: u, primary: false, position: 9999, order: 0 });
                }
            } else if (property.primaryImageUrl) {
                baseList.push({ url: property.primaryImageUrl, primary: true, position: 0, order: 0 });
            }

            // Normalize server images (array of strings or array of objects)
            let serverList = [];
            if (Array.isArray(images)) {
                serverList = images.map((img, idx) => {
                    if (typeof img === 'string') {
                        return { url: img, primary: false, position: idx, order: 1 };
                    } else if (img && typeof img === 'object') {
                        return {
                            url: img.url || img.imageUrl || img.path || img.fullPath || '',
                            primary: !!(img.primary || img.primaryImage),
                            position: (img.position !== undefined && img.position !== null) ? img.position : idx,
                            order: 1
                        };
                    }
                    return null;
                }).filter(Boolean).filter(x => !!x.url);
            }

            // Merge and de-duplicate by normalized URL
            const all = [...baseList, ...serverList]
                .map(it => ({
                    ...it,
                    url: typeof it.url === 'string' && it.url.length > 0
                        ? (it.url.startsWith('http') || it.url.startsWith('/') ? it.url : `/${it.url}`)
                        : ''
                }))
                .filter(it => !!it.url);

            const seen = new Set();
            const unique = [];
            for (const it of all) {
                const key = it.url;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(it);
                }
            }

            // Sort: primary first, then by position, then by original order bucket
            unique.sort((a, b) => (b.primary - a.primary) || (a.position - b.position) || (a.order - b.order));

            property.images = unique.map(it => it.url);

            if (!property.images || property.images.length === 0) {
                // Final fallback only if absolutely nothing available
                property.images = ['/img/properties/default.jpg'];
            }

        } catch (imageError) {
            if (!Array.isArray(property.images) || property.images.length === 0) {
                property.images = property.primaryImageUrl ? [property.primaryImageUrl] : ['/img/properties/default.jpg'];
            }
        }
        
        
        // Populate all sections
        populateImageGallery(property);
        populatePropertySummary(property);
        populateOverviewSection(property);
        populateAmenities(property);
        populatePoliciesSection(property);
        populateLocationSection(property);
        populateCTASidebar(property);
        
        // Initialize wishlist state
        initializeWishlistState(propertyId);
        
        // Initialize mobile CTA now that we have property data
        initializeMobileCTA();

    // Load owner contact details from authenticated endpoint (owner-only)
    loadOwnerContact(propertyId).catch(err => {});
        
        // Hide loading state
        hideLoadingState();
        
        // Start tracking property view after page loads
        if (window.propertyViewTracker) {
            const referrer = propertyViewTracker.getReferrerContext();
            propertyViewTracker.startTracking(propertyId, referrer);
        }
        
        // Load and display view count
        loadPropertyViews(propertyId);
        
    } catch (error) {
        console.error('Error loading property details:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            propertyId: propertyId
        });
        showError(`Failed to load property details: ${error.message}. Please try again.`);
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
}

// Try multiple backend endpoints in order; return first success, else null
async function fetchPropertyFromBackend(propertyId) {
    // apiService.baseURL already includes '/api', so use endpoints without '/api' prefix
    const endpoints = [
        `/properties/${propertyId}`
    ];
    for (const ep of endpoints) {
        try {
            const data = await apiService.makeRequest(ep, { includeAuth: false });
            if (data) return data;
        } catch (e) {
            continue;
        }
    }
    return null;
}

/**
 * Populate the image gallery section
 */
function populateImageGallery(property) {
    const galleryContainer = document.getElementById('imageGallery');
    if (!galleryContainer) return;
    
    // Get images from property data
    propertyImages = property.images && property.images.length > 0 
        ? property.images 
        : ['/img/properties/default.jpg'];
    
    const galleryHTML = `
        <div class="gallery-container">
            <div class="main-image-container">
                <img id="mainImage" src="${propertyImages[0]}" alt="${property.title}" class="main-image">
                <div class="gallery-nav">
                    <button id="prevBtn" class="nav-btn prev-btn" ${propertyImages.length <= 1 ? 'style="display:none"' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button id="nextBtn" class="nav-btn next-btn" ${propertyImages.length <= 1 ? 'style="display:none"' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <button id="wishlistBtn" class="wishlist-btn">
                    <i class="far fa-heart"></i>
                </button>
                <div class="image-counter">${currentImageIndex + 1} / ${propertyImages.length}</div>
            </div>
            ${propertyImages.length > 1 ? `
                <div class="thumbnail-container">
                    ${propertyImages.map((img, index) => `
                        <img src="${img}" alt="Property ${index + 1}" 
                             class="thumbnail ${index === 0 ? 'active' : ''}" 
                             data-index="${index}">
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    galleryContainer.innerHTML = galleryHTML;
    
    // Add image navigation event listeners
    setupImageGalleryEvents();
}

/**
 * Setup image gallery event listeners
 */
function setupImageGalleryEvents() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Previous/Next buttons
    if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
    if (nextBtn) nextBtn.addEventListener('click', showNextImage);
    
    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => showImageAtIndex(index));
    });
    
    // Main image click for lightbox
    if (mainImage) {
        mainImage.addEventListener('click', openLightbox);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', handleImageKeyNavigation);
}

/**
 * Show previous image
 */
function showPreviousImage() {
    if (propertyImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + propertyImages.length) % propertyImages.length;
    updateMainImage();
}

/**
 * Show next image
 */
function showNextImage() {
    if (propertyImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % propertyImages.length;
    updateMainImage();
}

/**
 * Show image at specific index
 */
function showImageAtIndex(index) {
    currentImageIndex = index;
    updateMainImage();
}

/**
 * Update main image and thumbnails
 */
function updateMainImage() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const counter = document.querySelector('.image-counter');
    
    if (mainImage) {
        mainImage.src = propertyImages[currentImageIndex];
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.style.opacity = '1';
        }, 100);
    }
    
    // Update thumbnail active state
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
    
    // Update counter
    if (counter) {
        counter.textContent = `${currentImageIndex + 1} / ${propertyImages.length}`;
    }
}

/**
 * Handle keyboard navigation for images
 */
function handleImageKeyNavigation(event) {
    if (event.key === 'ArrowLeft') {
        showPreviousImage();
    } else if (event.key === 'ArrowRight') {
        showNextImage();
    } else if (event.key === 'Escape') {
        closeLightbox();
    }
}

/**
 * Open image lightbox
 */
function openLightbox() {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <img src="${propertyImages[currentImageIndex]}" alt="Property Image" class="lightbox-image">
            <button class="lightbox-close">&times;</button>
            ${propertyImages.length > 1 ? `
                <button class="lightbox-nav lightbox-prev"><i class="fas fa-chevron-left"></i></button>
                <button class="lightbox-nav lightbox-next"><i class="fas fa-chevron-right"></i></button>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Add lightbox event listeners
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    if (propertyImages.length > 1) {
        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => {
            showPreviousImage();
            lightbox.querySelector('.lightbox-image').src = propertyImages[currentImageIndex];
        });
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => {
            showNextImage();
            lightbox.querySelector('.lightbox-image').src = propertyImages[currentImageIndex];
        });
    }
}

/**
 * Close image lightbox
 */
function closeLightbox() {
    const lightbox = document.querySelector('.lightbox-overlay');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Populate property summary section
 */
function populatePropertySummary(property) {
    const summaryContainer = document.getElementById('propertySummary');
    if (!summaryContainer) return;
    
    // Map backend DTO fields (PropertyResponse) with fallbacks
    const summaryHTML = `
        <div class="property-summary-card">
            <div class="summary-header">
                <h1 class="property-title">${property.title || property.name || 'Property Name'}</h1>
                <div class="property-price">₹${formatPrice(property.expectedRent || 0)} / month</div>
            </div>
            <div class="summary-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${[property.location, property.city].filter(Boolean).join(', ') || 'Location not specified'}</span>
            </div>
            <div class="summary-views" id="summaryViewsSection">
                <div class="view-count-display">
                    <i class="fas fa-eye"></i>
                    <span id="viewCountText">Loading views...</span>
                </div>
            </div>
            <div class="summary-highlights">
                <div class="highlight-item">
                    <span class="highlight-label">Type:</span>
                    <span class="highlight-value">${property.propertyType || 'N/A'}</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label">Built-up:</span>
                    <span class="highlight-value">${property.builtUpAreaSqft || 'N/A'} sqft</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label">Deposit:</span>
                    <span class="highlight-value">₹${formatPrice(property.expectedDeposit || 0)}</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label">Floor:</span>
                    <span class="highlight-value">${property.currentFloor ? `${property.currentFloor} of ${property.totalFloor || '?'}` : 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
}

/**
 * Populate overview section
 */
function populateOverviewSection(property) {
    const overviewContainer = document.getElementById('propertyOverview');
    if (!overviewContainer) return;

    const overviewHTML = `
        <div class="overview-section">
            <h2 class="section-title">📄 Overview</h2>
            <div class="overview-description">
                <p>${property.description || 'No description available.'}</p>
            </div>
            <div class="overview-grid">
                <div class="overview-item">
                    <span class="overview-label">Type</span>
                    <span class="overview-value">${property.propertyType || 'N/A'}</span>
                </div>
                <div class="overview-item">
                    <span class="overview-label">Built-up Area</span>
                    <span class="overview-value">${property.builtUpAreaSqft || 'N/A'} sqft</span>
                </div>
                <div class="overview-item">
                    <span class="overview-label">Furnishing</span>
                    <span class="overview-value">${property.furnishing || property.furnishingStatus || 'N/A'}</span>
                </div>
                <div class="overview-item">
                    <span class="overview-label">Floor</span>
                    <span class="overview-value">${property.currentFloor ? `${property.currentFloor} of ${property.totalFloor || '?'}` : 'N/A'}</span>
                </div>
                <div class="overview-item">
                    <span class="overview-label">Maintenance</span>
                    <span class="overview-value">₹${formatPrice(property.monthlyMaintenance || 0)}/month</span>
                </div>
                ${property.availableFrom ? `
                <div class="overview-item">
                    <span class="overview-label">Available From</span>
                    <span class="overview-value">${property.availableFrom}</span>
                </div>` : ''}
                ${property.bedrooms || property.totalBedrooms ? `
                <div class="overview-item">
                    <span class="overview-label">Bedrooms</span>
                    <span class="overview-value">${property.bedrooms || property.totalBedrooms || 'N/A'}</span>
                </div>` : ''}
                ${property.bathrooms || property.totalBathrooms ? `
                <div class="overview-item">
                    <span class="overview-label">Bathrooms</span>
                    <span class="overview-value">${property.bathrooms || property.totalBathrooms || 'N/A'}</span>
                </div>` : ''}
                <div class="overview-item">
                    <span class="overview-label">Built Year</span>
                    <span class="overview-value">${property.builtYear || property.constructionYear || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;

    overviewContainer.innerHTML = overviewHTML;
}

/**
 * Populate amenities section
 */
function populateAmenities(property) {
    const amenitiesContainer = document.getElementById('propertyAmenities');
    if (!amenitiesContainer) return;
    
    const amenities = property.amenities || [];
    const amenityIcons = {
        'WiFi': '🛜',
        'Parking': '🚗',
        'Cleaning': '🧹',
        'Laundry': '🧺',
        'Food': '🍽️',
        'Security': '🔒',
        'Power Backup': '⚡',
        'Water Supply': '💧',
        'AC': '❄️',
        'Gym': '🏋️',
        'Swimming Pool': '🏊',
        'Garden': '🌳',
        'Elevator': '🛗',
        'CCTV': '📹'
    };
    
    const amenitiesHTML = `
        <div class="amenities-section">
            <h2 class="section-title">✨ Amenities</h2>
            <div class="amenities-grid">
                ${amenities.length > 0 ? amenities.map(amenity => `
                    <div class="amenity-item">
                        <span class="amenity-icon">${amenityIcons[amenity] || '🔹'}</span>
                        <span class="amenity-label">${amenity}</span>
                    </div>
                `).join('') : '<p class="no-amenities">No amenities listed</p>'}
            </div>
        </div>
    `;
    
    amenitiesContainer.innerHTML = amenitiesHTML;
}

/**
 * Populate policies section
 */
function populatePoliciesSection(property) {
    const policiesContainer = document.getElementById('propertyPolicies');
    if (!policiesContainer) return;
    
    const policies = property.policies || [
        'Rent due on 1st of every month',
        '1-month notice before vacating',
        'Visitors allowed till 9 PM',
        'Pets not allowed'
    ];
    
    const policiesHTML = `
        <div class="policies-section">
            <h2 class="section-title">📜 Policies</h2>
            <ul class="policies-list">
                ${policies.map(policy => `
                    <li class="policy-item">${policy}</li>
                `).join('')}
            </ul>
        </div>
    `;
    
    policiesContainer.innerHTML = policiesHTML;
}

/**
 * Populate location section
 */
function populateLocationSection(property) {
    const locationContainer = document.getElementById('propertyLocation');
    if (!locationContainer) return;
    
    const hasCoords = property.latitude !== undefined && property.latitude !== null &&
                      property.longitude !== undefined && property.longitude !== null;

    const locationHTML = `
        <div class="location-section">
            <h2 class="section-title">📍 Location</h2>
            <div class="location-details">
                <p class="location-address">${property.location || property.city || 'Location not specified'}</p>
                <div class="map-container">
                    <div id="propertyMap" class="map-placeholder${hasCoords ? ' has-map' : ''}">
                        ${hasCoords ? '' : `
                        <i class="fas fa-map-marker-alt"></i>
                        <p>Map view will be displayed here</p>
                        `}
                    </div>
                </div>
                <button class="directions-btn" id="directionsBtn" ${hasCoords ? '' : 'disabled'}>
                    Get Directions
                </button>
            </div>
        </div>
    `;
    
    locationContainer.innerHTML = locationHTML;

    if (hasCoords) {
        // Initialize map after DOM update
        setTimeout(() => initPropertyLocationMap(property), 50);
    }
}

/**
 * Initialize Leaflet map for property location
 */
function initPropertyLocationMap(property) {
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded for property map');
        return;
    }

    const mapEl = document.getElementById('propertyMap');
    if (!mapEl) return;

    const lat = parseFloat(property.latitude);
    const lng = parseFloat(property.longitude);
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates for property map');
        return;
    }

    // Ensure map element has height
    if (!mapEl.style.height) {
        mapEl.style.height = '320px';
    }

    // Create map
    const map = L.map(mapEl).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    const title = property.name || property.location || property.city || 'Property';
    marker.bindPopup(`<b>${title}</b><br>${property.location || ''}`).openPopup();

    // Hook directions button
    const btn = document.getElementById('directionsBtn');
    if (btn) {
        btn.disabled = false;
        btn.addEventListener('click', () => {
            const label = encodeURIComponent(title);
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving&dir_action=navigate&query=${label}`,'_blank');
        });
    }

    // Fix tile sizing after render
    setTimeout(() => map.invalidateSize(), 200);
}

/**
 * Populate CTA sidebar
 */
function populateCTASidebar(property) {
    const ctaContainer = document.getElementById('ctaSidebar');
    if (!ctaContainer) return;
    
    const ctaHTML = `
        <div class="cta-sidebar">
            <!-- Rent Summary -->
            <div class="rent-summary">
                <div class="rent-price">💰 ₹${formatPrice(property.expectedRent || property.baseRent || property.rent || 0)} / month</div>
                <div class="rent-details">
                    <div class="detail-item">
                        <span>Deposit:</span>
                        <span>₹${formatPrice(property.expectedDeposit || property.securityDeposit || property.deposit || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Maintenance:</span>
                        <span>₹${formatPrice(property.monthlyMaintenance || property.maintenanceCharges || property.maintenance || 0)}/month</span>
                    </div>
                </div>
            </div>

            <!-- Owner Info -->
            <div class="owner-info">
                <h3 class="owner-title">👤 Owner Contact</h3>
                <div class="owner-details">
                    <div class="owner-name" id="ownerName">${property.ownerName || property.contactPerson || 'Property Owner'}</div>
                    <div class="owner-contact">
                        <div id="ownerPhoneText">📞 ${apiService.isAuthenticated() ? (property.ownerPhone || property.contactNumber || '—') : 'Login to view'}</div>
                        <div id="ownerEmailText">✉️ ${apiService.isAuthenticated() ? (property.ownerEmail || property.contactEmail || '—') : 'Login to view'}</div>
                    </div>
                    <div class="owner-actions">
                        <button class="cta-btn call-btn" id="callOwnerBtn" disabled>
                            📞 Call Owner
                        </button>
                        <button class="cta-btn whatsapp-btn" id="whatsappOwnerBtn" disabled>
                            💬 WhatsApp
                        </button>
                    </div>
                    <p class="owner-contact-hint" id="ownerContactHint">Contact details hidden. ${apiService.isAuthenticated() ? 'You are not authorized for this property.' : 'Login to view owner contact.'}</p>
                </div>
            </div>

            <!-- Book Visit Form -->
            <div class="book-visit">
                <h3 class="visit-title">📅 Schedule a Visit</h3>
                <form id="bookVisitForm" class="visit-form">
                    <input type="text" id="visitorName" placeholder="Your Name" required>
                    <input type="tel" id="visitorPhone" placeholder="Phone Number" required>
                    <input type="date" id="visitDate" min="${new Date().toISOString().split('T')[0]}" required>
                    <button type="submit" class="cta-btn book-btn">Book Visit</button>
                </form>
            </div>

            <!-- Wishlist Button -->
            <button id="ctaWishlistBtn" class="cta-btn wishlist-cta-btn">
                <i class="far fa-heart"></i>
                <span>Add to Wishlist</span>
            </button>

            <!-- Key Stats -->
            <div class="key-stats">
                <div class="stat-item" id="ctaViewsSection">
                    <span class="stat-label">👁️ Views:</span>
                    <span class="stat-value" id="ctaViewCount">Loading...</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">👥 Recent Bookings:</span>
                    <span class="stat-value">${property.recentBookings || 14}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">🕒 Updated:</span>
                    <span class="stat-value">${property.lastUpdated || '2 days ago'}</span>
                </div>
            </div>
        </div>
    `;
    
    ctaContainer.innerHTML = ctaHTML;
    
    // Initialize CTA event listeners
    initializeCTAEvents();

    // Wire initial owner buttons with any value we may already have
    const callBtn = document.getElementById('callOwnerBtn');
    const waBtn = document.getElementById('whatsappOwnerBtn');
    if (callBtn) callBtn.addEventListener('click', () => callOwner((currentOwnerContact && currentOwnerContact.phone) || property.ownerPhone || property.contactNumber || ''));
    if (waBtn) waBtn.addEventListener('click', () => whatsappOwner((currentOwnerContact && currentOwnerContact.phone) || property.ownerPhone || property.contactNumber || ''));
}

/**
 * Load owner contact from authenticated endpoint (owner-only)
 * Uses admin "my property" endpoint so only the owner can see contact
 */
async function loadOwnerContact(propertyId) {
    try {
        // We attempt tenant endpoint first regardless; unauth will 401 which we catch.
        const hintEl = document.getElementById('ownerContactHint');
        if (!apiService.isAuthenticated()) {
            enhanceOwnerFallbackFromPublic();
            if (hintEl) hintEl.textContent = 'Login to view owner contact.';
            return;
        }

        if (hintEl) hintEl.textContent = '';
        // First try tenant context: /api/tenants/me/property (used in tenant-dashboard)
        try {
            const tenantProp = await apiService.getTenantPropertyDetails();
            if (tenantProp && (String(tenantProp.propertyId) === String(propertyId))) {
                const ownerName = tenantProp.ownerName || 'Property Owner';
                const phone = tenantProp.ownerPhone || '';
                const email = tenantProp.ownerEmail || '';

                currentOwnerContact = { name: ownerName, phone, email };
                updateOwnerContactDOM(ownerName, phone, email);
                return; // Done
            }
        } catch (e) {
            // Silently fail - user might not be a tenant
            console.log('User is not a tenant, trying owner context...');
        }

        // Fallback to owner context: /api/admin/properties/{id}
        try {
            if (!apiService.isAuthenticated()) {
                enhanceOwnerFallbackFromPublic();
                if (hintEl) hintEl.textContent = 'Login to view full owner contact.';
                return;
            }
            const myProperty = await apiService.getMyProperty(propertyId);
            if (!myProperty) {
                enhanceOwnerFallbackFromPublic();
                if (hintEl) hintEl.textContent = apiService.isAuthenticated() ? 'Owner contact unavailable.' : 'Login to view owner contact.';
                return;
            }

            const ownerName = myProperty.ownerName || myProperty.contactPerson || (myProperty.owner && (myProperty.owner.name || myProperty.owner.fullName)) || 'Property Owner';
            const phone = myProperty.ownerPhone || myProperty.contactNumber || (myProperty.owner && (myProperty.owner.phone || myProperty.owner.mobile)) || '';
            const email = myProperty.ownerEmail || myProperty.contactEmail || (myProperty.owner && (myProperty.owner.email)) || '';

            currentOwnerContact = { name: ownerName, phone, email };
            updateOwnerContactDOM(ownerName, phone, email);
            if (hintEl) hintEl.textContent = phone ? 'Owner contact loaded.' : 'Owner contact partially available.';
        } catch(ownerErr) {
            enhanceOwnerFallbackFromPublic();
            if (hintEl) hintEl.textContent = apiService.isAuthenticated() ? 'Owner contact restricted.' : 'Login to view owner contact.';
        }
    } catch (err) {
        // Non-owner or protected route; don't block page rendering
        enhanceOwnerFallbackFromPublic();
        const hintEl2 = document.getElementById('ownerContactHint');
        if (hintEl2) hintEl2.textContent = apiService.isAuthenticated() ? 'Owner contact unavailable.' : 'Login to view owner contact.';
    }
}

function updateOwnerContactDOM(ownerName, phone, email) {
    const nameEl = document.getElementById('ownerName');
    const phoneEl = document.getElementById('ownerPhoneText');
    const emailEl = document.getElementById('ownerEmailText');
    const callBtn = document.getElementById('callOwnerBtn');
    const waBtn = document.getElementById('whatsappOwnerBtn');

    if (nameEl) nameEl.textContent = ownerName || 'Property Owner';
    if (phoneEl) phoneEl.textContent = `📞 ${phone || '—'}`;
    if (emailEl) emailEl.textContent = `✉️ ${email || '—'}`;
    if (callBtn) callBtn.disabled = !phone;
    if (waBtn) waBtn.disabled = !phone;
}

// If public payload includes an owner name but no phone/email, reflect that
function enhanceOwnerFallbackFromPublic() {
    if (!currentProperty) return;
    const publicName = currentProperty.ownerName || currentProperty.contactPerson || null;
    if (!publicName) return; // nothing to show
    const nameEl = document.getElementById('ownerName');
    if (nameEl && nameEl.textContent === 'Property Owner') {
        nameEl.textContent = publicName;
    }
}

/**
 * Initialize CTA event listeners
 */
function initializeCTAEvents() {
    // Book visit form
    const bookVisitForm = document.getElementById('bookVisitForm');
    if (bookVisitForm) {
        bookVisitForm.addEventListener('submit', handleBookVisit);
    }
    
    // Wishlist button
    const ctaWishlistBtn = document.getElementById('ctaWishlistBtn');
    if (ctaWishlistBtn) {
        ctaWishlistBtn.addEventListener('click', toggleWishlist);
    }
    
    // Sync wishlist buttons
    syncWishlistButtons();
}

/**
 * Handle book visit form submission
 */
async function handleBookVisit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        propertyId: currentProperty.id,
        visitorName: form.visitorName.value,
        visitorPhone: form.visitorPhone.value,
        visitDate: form.visitDate.value
    };
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('.book-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Booking...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/book-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast('Visit booked successfully! You will receive a confirmation call.', 'success');
            form.reset();
        } else {
            throw new Error('Failed to book visit');
        }
        
    } catch (error) {
        console.error('Error booking visit:', error);
        showToast('Failed to book visit. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = form.querySelector('.book-btn');
        submitBtn.textContent = 'Book Visit';
        submitBtn.disabled = false;
    }
}

/**
 * Initialize wishlist state
 */
function initializeWishlistState(propertyId) {
    // Check if property is in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    isWishlisted = wishlist.includes(propertyId);
    updateWishlistButtons();
}

/**
 * Toggle wishlist state
 */
function toggleWishlist() {
    if (!currentProperty) return;
    
    const propertyId = currentProperty.id;
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isWishlisted) {
        // Remove from wishlist
        wishlist = wishlist.filter(id => id !== propertyId);
        showToast('Removed from wishlist', 'info');
    } else {
        // Add to wishlist
        wishlist.push(propertyId);
        showToast('Added to wishlist', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    isWishlisted = !isWishlisted;
    updateWishlistButtons();
}

/**
 * Update wishlist button states
 */
function updateWishlistButtons() {
    const wishlistBtns = document.querySelectorAll('#wishlistBtn, #ctaWishlistBtn');
    
    wishlistBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        
        if (isWishlisted) {
            icon.className = 'fas fa-heart';
            btn.classList.add('wishlisted');
            if (text) text.textContent = 'Remove from Wishlist';
        } else {
            icon.className = 'far fa-heart';
            btn.classList.remove('wishlisted');
            if (text) text.textContent = 'Add to Wishlist';
        }
    });
}

/**
 * Load and display property view statistics
 */
async function loadPropertyViews(propertyId) {
    try {
        const response = await fetch(`${apiService.baseURL}/properties/${propertyId}/views`);
        if (!response.ok) {
            // Show 0 views if API fails
            displayViewBadge({ totalViews: 0, uniqueViewers: 0 });
            return;
        }
        
        const data = await response.json();
        displayViewBadge(data);
    } catch (error) {
        console.log('Could not load view stats:', error);
        // Show 0 views on error
        displayViewBadge({ totalViews: 0, uniqueViewers: 0 });
    }
}

/**
 * Display view count in UI sections
 */
function displayViewBadge(viewData) {
    const viewsText = `${viewData.totalViews} ${viewData.totalViews === 1 ? 'view' : 'views'}`;
    const uniqueText = viewData.uniqueViewers ? ` (${viewData.uniqueViewers} unique)` : '';
    
    // Update summary section
    const viewCountText = document.getElementById('viewCountText');
    if (viewCountText) {
        viewCountText.textContent = `${viewsText}${uniqueText}`;
    }
    
    // Update CTA sidebar
    const ctaViewCount = document.getElementById('ctaViewCount');
    if (ctaViewCount) {
        ctaViewCount.textContent = viewsText;
    }
}

/**
 * Sync wishlist buttons (both gallery and CTA)
 */
function syncWishlistButtons() {
    const galleryWishlistBtn = document.getElementById('wishlistBtn');
    const ctaWishlistBtn = document.getElementById('ctaWishlistBtn');
    
    if (galleryWishlistBtn) {
        galleryWishlistBtn.addEventListener('click', toggleWishlist);
    }
}

/**
 * Call owner function
 */
function callOwner(phone) {
    if (!apiService.isAuthenticated()) {
        showToast('Please login to contact the owner', 'error');
        setTimeout(() => {
            document.getElementById('mainLoginBtn')?.click();
        }, 1000);
        return;
    }
    
    if (phone && phone !== '98765xxxxx') {
        window.location.href = `tel:${phone}`;
    } else {
        showToast('Phone number not available', 'error');
    }
}

/**
 * WhatsApp owner function
 */
function whatsappOwner(phone) {
    if (!apiService.isAuthenticated()) {
        showToast('Please login to contact the owner', 'error');
        setTimeout(() => {
            document.getElementById('mainLoginBtn')?.click();
        }, 1000);
        return;
    }
    
    if (phone && phone !== '98765xxxxx') {
        const property = currentProperty;
        const propertyTitle = property.title || property.name || 'Property';
        const propertyType = property.propertyType || property.type || '';
        const location = `${property.location || ''}, ${property.city || ''}`.trim().replace(/^,\s*/, '');
        const rent = property.expectedRent || property.baseRent || property.rent || 0;
        const bhk = property.bhkType || property.bhk || '';
        const seater = property.pgSeater || property.seater || '';
        const area = property.builtUpAreaSqft || property.builtUpArea || '';
        
        // Build property details string
        let propertyDetails = `*${propertyTitle}*\n\n`;
        if (propertyType) propertyDetails += `Type: ${propertyType}\n`;
        if (location) propertyDetails += `Location: ${location}\n`;
        if (propertyType === 'PG' && seater) {
            propertyDetails += `Seater: ${seater}\n`;
        } else if (bhk) {
            propertyDetails += `BHK: ${bhk.replace('BHK_', '')}\n`;
        }
        if (area) propertyDetails += `Area: ${area} sqft\n`;
        propertyDetails += `Rent: ₹${formatPrice(rent)}/month\n\n`;
        propertyDetails += `I'm interested in this property. Can you provide more details?`;
        
        const message = encodeURIComponent(propertyDetails);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
        showToast('Phone number not available', 'error');
    }
}

/**
 * Initialize mobile CTA behavior
 */
function initializeMobileCTA() {
    // Create mobile sticky CTA footer only if we have property data
    if (!currentProperty) {
        return; // Will be called again after property loads
    }
    
    const mobileCtaHTML = `
        <div id="mobileCTA" class="mobile-cta-footer">
            <div class="mobile-cta-content">
                <div class="mobile-cta-price">
                    <span class="mobile-price">₹${formatPrice(currentProperty.expectedRent || currentProperty.baseRent || currentProperty.rent || 0)}</span>
                    <span class="mobile-period">/month</span>
                </div>
                <div class="mobile-cta-actions">
                    <button class="mobile-cta-btn call-btn" onclick="callOwner('${(currentOwnerContact && currentOwnerContact.phone) || currentProperty.ownerPhone || currentProperty.contactNumber || ''}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button class="mobile-cta-btn whatsapp-btn" onclick="whatsappOwner('${(currentOwnerContact && currentOwnerContact.phone) || currentProperty.ownerPhone || currentProperty.contactNumber || ''}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body if on mobile and not already present
    if (window.innerWidth <= 768 && !document.getElementById('mobileCTA')) {
        document.body.insertAdjacentHTML('beforeend', mobileCtaHTML);
    }
    
    // Handle window resize
    window.addEventListener('resize', handleMobileLayout);
}

/**
 * Handle mobile layout changes
 */
function handleMobileLayout() {
    const mobileCtaFooter = document.getElementById('mobileCTA');
    
    if (window.innerWidth <= 768 && !mobileCtaFooter) {
        initializeMobileCTA();
    } else if (window.innerWidth > 768 && mobileCtaFooter) {
        mobileCtaFooter.remove();
    }
}

/**
 * Open mobile booking modal
 */
function openMobileBookingModal() {
    const modalHTML = `
        <div class="mobile-modal-overlay">
            <div class="mobile-modal-content">
                <div class="mobile-modal-header">
                    <h3>📅 Schedule a Visit</h3>
                    <button class="mobile-modal-close">&times;</button>
                </div>
                <form id="mobileBookVisitForm" class="mobile-visit-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="tel" placeholder="Phone Number" required>
                    <input type="date" min="${new Date().toISOString().split('T')[0]}" required>
                    <button type="submit" class="mobile-book-btn">Book Visit</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    const overlay = document.querySelector('.mobile-modal-overlay');
    const closeBtn = overlay.querySelector('.mobile-modal-close');
    const form = overlay.querySelector('#mobileBookVisitForm');
    
    closeBtn.addEventListener('click', closeMobileModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeMobileModal();
    });
    form.addEventListener('submit', handleMobileBookVisit);
}

/**
 * Close mobile booking modal
 */
function closeMobileModal() {
    const modal = document.querySelector('.mobile-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Handle mobile book visit
 */
async function handleMobileBookVisit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        propertyId: currentProperty.id,
        visitorName: form.querySelector('input[type="text"]').value,
        visitorPhone: form.querySelector('input[type="tel"]').value,
        visitDate: form.querySelector('input[type="date"]').value
    };
    
    try {
        const submitBtn = form.querySelector('.mobile-book-btn');
        submitBtn.textContent = 'Booking...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/book-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast('Visit booked successfully!', 'success');
            closeMobileModal();
        } else {
            throw new Error('Failed to book visit');
        }
        
    } catch (error) {
        console.error('Error booking visit:', error);
        showToast('Failed to book visit. Please try again.', 'error');
    }
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Scroll event for sticky sidebar effects
    window.addEventListener('scroll', handleSidebarScroll);
    
    // Window resize for responsive behavior
    window.addEventListener('resize', handleMobileLayout);
}

/**
 * Handle sidebar scroll effects
 */
function handleSidebarScroll() {
    const sidebar = document.querySelector('.cta-sidebar');
    if (!sidebar) return;
    
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Add shadow effect when scrolled
    if (scrollTop > 100) {
        sidebar.classList.add('scrolled');
    } else {
        sidebar.classList.remove('scrolled');
    }
}

/**
 * Utility Functions
 */

/**
 * Format price with commas
 */
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    return starsHTML;
}

// Clean, correct helper implementations (removed corrupted template fragments)
function showLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        hideLoadingState();
    } else {
        alert('Error: ' + message);
        console.error('Error container not found, showing alert:', message);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
