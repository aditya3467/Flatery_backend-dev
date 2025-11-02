/**
 * Property Details Page — Simple, robust details + images grid (no carousel/lightbox)
 */

// Global state
let propertyId = null;
let propertyData = null;
let propertyImages = [];
let lightboxIndex = 0;
let lightboxKeyHandler = null;

// Utils
const el = (id) => document.getElementById(id);
const safeText = (v, fallback = '—') => (v === null || v === undefined || v === '' ? fallback : v);
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toLocaleString('en-IN');
};
const formatEnumValue = (value) => {
    if (!value || typeof value !== 'string') return '—';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
const formatPropertyAge = (age) => {
    const ageMap = {
        // Older naming
        UNDER_1_YEAR: 'Under 1 Year',
        ONE_TO_THREE: '1-3 Years',
        THREE_TO_FIVE: '3-5 Years',
        FIVE_TO_TEN: '5-10 Years',
        OVER_TEN: 'Over 10 Years',
        // Backend enum in this repo
        Y1_3: '1-3 Years',
        Y3_5: '3-5 Years',
        Y5_10: '5-10 Years',
        Y10_PLUS: '10+ Years',
    };
    return ageMap[age] || formatEnumValue(age);
};
const formatDate = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};
const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = String(time).split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return String(time);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = (hour % 12) || 12;
    return `${display}:${m ?? '00'} ${ampm}`;
};
const toAbsolute = (u) => {
    if (!u) return null;
    const baseOrigin = (window.apiService && apiService.baseURL)
        ? apiService.baseURL.replace(/\/?api\/?$/, '')
        : window.location.origin;
    return u.startsWith('http') ? u : `${baseOrigin}${u.startsWith('/') ? '' : '/'}${u}`;
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        const params = new URLSearchParams(window.location.search);
        propertyId = params.get('id');
        if (!propertyId) {
            showError('Missing property id');
            return;
        }
        loadPropertyDetails();
    } catch (e) {
        showError('Failed to initialize page');
        console.error(e);
    }
});

async function loadPropertyDetails() {
    const container = el('propertyDetails');
    if (!container) return;
    try {
        // Fetch details (public endpoint)
        const details = await apiService.makeRequest(`/properties/${propertyId}`, { includeAuth: false });
        propertyData = details || {};
        hydratePropertyDetails(propertyData);
        // Images after details to allow fallback
        await loadPropertyImages(propertyId, propertyData);
    } catch (err) {
        console.error('Failed to load property details:', err);
        showError(err.message || 'Could not load property');
    }
}

function hydratePropertyDetails(d) {
    // Title
    const type = d.type || d.propertyType;
    const bhk = d.bhkType || d.bhk;
    const seater = d.pgSeater || d.seater;
    const location = [d.location, d.city].filter(Boolean).join(', ');
    let title = d.name || d.propertyName;
    if (!title) {
        if (type === 'FLAT' && bhk) {
            title = `${String(bhk).replace('BHK_', '')} BHK in ${d.location || d.city || 'Property'}`;
        } else {
            title = d.location || d.city || 'Property';
        }
    }

    el('propTitle') && (el('propTitle').textContent = safeText(title));
    el('propLocation') && (el('propLocation').textContent = safeText(location));
    if (d.landmark && el('propLandmark')) {
        el('propLandmark').style.display = 'inline';
        el('propLandmark').textContent = `• Near ${d.landmark}`;
    }

    // Meta header
    el('propType') && (el('propType').textContent = formatEnumValue(type));
    if (bhk && type !== 'PG') {
        const val = `${String(bhk).replace('BHK_', '')} BHK`;
        const node = el('propBhk');
        const row = document.getElementById('metaBhk');
        if (row) row.style.display = 'flex';
        if (node) node.textContent = val;
    }
    if ((type === 'PG' && (seater || seater === 0)) || (seater && !bhk)) {
        const node = el('propSeater');
        const row = el('metaSeater');
        if (row) row.style.display = 'flex';
        if (node) node.textContent = `${seater}-Seater`;
    }
    const area = d.builtUpAreaSqft ?? d.builtUpArea;
    if (area || area === 0) el('propArea') && (el('propArea').textContent = `${area} sq ft`);
    if (d.postedOn || d.createdAt) {
        el('propPostedOn') && (el('propPostedOn').textContent = formatDate(d.postedOn || d.createdAt));
    }

    // Description
    if (d.propertyDescription) {
        const sec = el('descriptionSection');
        if (sec) sec.style.display = 'block';
        el('propDescription') && (el('propDescription').textContent = d.propertyDescription);
    }

    // Details grid
    el('detType') && (el('detType').textContent = formatEnumValue(type));
    if (bhk && type !== 'PG') {
        const row = el('detBhkRow');
        if (row) row.style.display = 'flex';
        el('detBhk') && (el('detBhk').textContent = `${String(bhk).replace('BHK_', '')} BHK`);
    }
    if (type === 'PG' && seater) {
        const row = el('detSeaterRow');
        if (row) row.style.display = 'flex';
        el('detSeater') && (el('detSeater').textContent = `${seater}-Seater`);
    }
    const detAreaVal = d.builtUpAreaSqft ?? d.builtUpArea;
    if (detAreaVal || detAreaVal === 0) el('detArea') && (el('detArea').textContent = `${detAreaVal} sq ft`);
    if (d.currentFloor || d.totalFloor) {
        el('detFloor') && (el('detFloor').textContent = [d.currentFloor, d.totalFloor].filter(Boolean).join(' of '));
    }
    const ageVal = d.age ?? d.propertyAge;
    if (ageVal) {
        el('detAge') && (el('detAge').textContent = formatPropertyAge(ageVal));
    }
    if (d.facing) {
        const row = el('detFacingRow');
        if (row) row.style.display = 'flex';
        el('detFacing') && (el('detFacing').textContent = formatEnumValue(d.facing));
    }
    if (d.furnishing) el('detFurnishing') && (el('detFurnishing').textContent = formatEnumValue(d.furnishing));
    if (d.bathrooms || d.bathrooms === 0) el('detBathrooms') && (el('detBathrooms').textContent = String(d.bathrooms));
    if (d.parking) el('detParking') && (el('detParking').textContent = formatEnumValue(d.parking));
    if (d.balcony !== undefined) el('detBalcony') && (el('detBalcony').textContent = d.balcony ? 'Yes' : 'No');
    if (d.monthlyMaintenance || d.monthlyMaintenance === 0) el('detMaintenance') && (el('detMaintenance').textContent = `₹${formatNumber(d.monthlyMaintenance)}`);
    if (d.currentCondition) {
        const row = el('detConditionRow');
        if (row) row.style.display = 'flex';
        el('detCondition') && (el('detCondition').textContent = formatEnumValue(d.currentCondition));
    }

    // Amenities
    if (Array.isArray(d.amenities) && d.amenities.length) {
        const sec = el('amenitiesSection');
        if (sec) sec.style.display = 'block';
        const list = el('amenitiesList');
        if (list) {
            list.innerHTML = d.amenities.map(a => `<span class="amenity-badge"><i class="fas fa-check"></i> ${formatEnumValue(a)}</span>`).join('');
        }
    }

    // Preferred Tenants
    if (Array.isArray(d.preferredTenants) && d.preferredTenants.length) {
        const sec = el('tenantsSection');
        if (sec) sec.style.display = 'block';
        const list = el('tenantsList');
        if (list) {
            list.innerHTML = d.preferredTenants.map(t => `<span class="amenity-badge"><i class="fas fa-user"></i> ${formatEnumValue(t)}</span>`).join('');
        }
    }

    // Viewing Schedule / Availability
    const availabilityText = d.availableFrom ? `From ${formatDate(d.availableFrom)}` : 'Available Now';
    el('detAvailability') && (el('detAvailability').textContent = availabilityText);
    el('availableDate') && (el('availableDate').textContent = availabilityText);

    if ((d.viewingFrom && d.viewingTo) || (d.availableTimeFrom && d.availableTimeTo)) {
        const from = d.viewingFrom || d.availableTimeFrom;
        const to = d.viewingTo || d.availableTimeTo;
        const row = el('detTimingsRow');
        if (row) row.style.display = 'flex';
        el('detTimings') && (el('detTimings').textContent = `${formatTime(from)} - ${formatTime(to)}`);
    }
    if (d.whoShows) {
        const row = el('detWhoShowsRow');
        if (row) row.style.display = 'flex';
        el('detWhoShows') && (el('detWhoShows').textContent = formatEnumValue(d.whoShows));
    }

    // Sidebar pricing
    el('priceAmount') && (el('priceAmount').textContent = `₹${formatNumber(d.expectedRent)}`);
    const badge = el('negotiableBadge');
    if (badge) {
        const isNegotiable = !!d.rentNegotiable || d.negotiable === true || d.isNegotiable === true;
        badge.textContent = isNegotiable ? 'Negotiable' : 'Fixed Price';
        badge.className = `badge ${isNegotiable ? 'badge-negotiable' : 'badge-non-negotiable'}`;
    }
    el('depositAmount') && (el('depositAmount').textContent = `₹${formatNumber(d.expectedDeposit)}`);
}

async function loadPropertyImages(id, details) {
    const container = el('imageCarouselContainer');
    if (!container) return;
    try {
        const images = await apiService.makeRequest(`/properties/${id}/images`, { includeAuth: false });
        let imgs = Array.isArray(images) ? images : [];
        if (imgs.length > 0) {
            // Normalize and sort: primary first then by position
            const normalized = imgs.map(img => ({
                id: img.id,
                url: toAbsolute(img.url || img.imageUrl || img.path),
                primary: !!(img.primaryImage || img.primary),
                position: (img.position !== undefined && img.position !== null) ? img.position : 9999,
            })).filter(x => !!x.url);

            normalized.sort((a, b) => (b.primary - a.primary) || (a.position - b.position));

            propertyImages = normalized;
            renderImageGrid(propertyImages);
            return;
        }
    } catch (e) {
        console.warn('Failed to fetch images, falling back to primary image', e);
    }

    // Fallback to primary image from property details
    if (details && details.primaryImageUrl) {
        propertyImages = [{ id: 'primary', url: toAbsolute(details.primaryImageUrl), primary: true, position: 0 }];
        renderImageGrid(propertyImages);
    } else {
        showNoImages();
    }
}

function renderImageGrid(images) {
    const container = el('imageCarouselContainer');
    if (!container) return;
    if (!images || images.length === 0) {
        showNoImages();
        return;
    }
    container.innerHTML = `
        <div class="image-gallery">
            ${images.map((img, idx) => `
                <img class="gallery-image" src="${img.url}" alt="Property Image ${idx+1}"
                     onclick="openLightbox(${idx})"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'" />
            `).join('')}
        </div>
    `;
}

function showNoImages() {
    const container = el('imageCarouselContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="no-images">
            <i class="fas fa-image fa-3x"></i>
            <p>No images available for this property</p>
        </div>
    `;
}

function showError(message) {
    const container = el('propertyDetails');
    if (!container) return;
    container.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <h2>Error</h2>
            <p>${message}</p>
            <a href="properties.html" class="btn-1">Back to Properties</a>
        </div>
    `;
}

function contactOwner() {
    if (typeof showNotification === 'function') {
        showNotification('Contact feature coming soon!', 'info');
    } else {
        alert('Contact feature coming soon!');
    }
}

// ==========================
// Lightbox logic
// ==========================
function openLightbox(index = 0) {
    if (!propertyImages || propertyImages.length === 0) return;
    lightboxIndex = Math.max(0, Math.min(index, propertyImages.length - 1));
    const overlay = el('lightboxOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    updateLightboxUI();
    // Keyboard controls
    lightboxKeyHandler = (e) => {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') lightboxNext();
        else if (e.key === 'ArrowLeft') lightboxPrev();
    };
    document.addEventListener('keydown', lightboxKeyHandler);
}

function closeLightbox() {
    const overlay = el('lightboxOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (lightboxKeyHandler) {
        document.removeEventListener('keydown', lightboxKeyHandler);
        lightboxKeyHandler = null;
    }
}

function lightboxNext() {
    if (!propertyImages || propertyImages.length === 0) return;
    lightboxIndex = (lightboxIndex + 1) % propertyImages.length;
    updateLightboxUI();
}

function lightboxPrev() {
    if (!propertyImages || propertyImages.length === 0) return;
    lightboxIndex = (lightboxIndex - 1 + propertyImages.length) % propertyImages.length;
    updateLightboxUI();
}

function goToLightbox(i) {
    if (!propertyImages || propertyImages.length === 0) return;
    lightboxIndex = Math.max(0, Math.min(i, propertyImages.length - 1));
    updateLightboxUI();
}

function updateLightboxUI() {
    const imgEl = el('lightboxImage');
    const dotsEl = el('lightboxDots');
    if (!imgEl || !dotsEl) return;
    const current = propertyImages[lightboxIndex];
    imgEl.src = current.url;
    imgEl.onerror = function(){ this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'; };
    // dots
    dotsEl.innerHTML = propertyImages.map((_, idx) =>
        `<span class="lightbox-dot ${idx === lightboxIndex ? 'active' : ''}" onclick="goToLightbox(${idx})"></span>`
    ).join('');
}

// Expose globals used by HTML
window.contactOwner = contactOwner;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.lightboxNext = lightboxNext;
window.lightboxPrev = lightboxPrev;
window.goToLightbox = goToLightbox;
console.log('Property details script loaded');
