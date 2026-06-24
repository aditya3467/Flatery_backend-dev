/**
 * Search Property Page
 * Compact result page modelled after the attached mobile-first UI.
 */

let searchAllProperties = [];
let searchFilteredProperties = [];
let searchCurrentPage = 1;
let searchMap = null;
let searchMarkers = [];

const SEARCH_ITEMS_PER_PAGE = 8;
const SEARCH_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=60';
const SEARCH_DEFAULT_CITY = 'Pune';
const SEARCH_LOCATION_KEY = 'flatery:lastSearchLocation';

document.addEventListener('DOMContentLoaded', () => {
    initSearchPropertyPage();
});

function initSearchPropertyPage() {
    hydrateSearchLabels();
    bindSearchEvents();
    loadSearchProperties();
}

function bindSearchEvents() {
    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
        searchCurrentPage = 1;
        applySearchFilters();
        toggleMobileFilters(false);
    });

    document.getElementById('clearFiltersBtn')?.addEventListener('click', resetSearchFilters);
    document.getElementById('sortSelect')?.addEventListener('change', () => {
        searchCurrentPage = 1;
        applySearchFilters();
    });

    document.getElementById('gridViewBtn')?.addEventListener('click', () => setSearchView('grid'));
    document.getElementById('compactViewBtn')?.addEventListener('click', () => setSearchView('compact'));
    document.getElementById('openFiltersBtn')?.addEventListener('click', () => toggleMobileFilters(true));
    document.getElementById('closeFiltersBtn')?.addEventListener('click', () => toggleMobileFilters(false));
    document.getElementById('filterBackdrop')?.addEventListener('click', () => toggleMobileFilters(false));

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (searchCurrentPage > 1) {
            searchCurrentPage -= 1;
            renderSearchResults();
        }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(searchFilteredProperties.length / SEARCH_ITEMS_PER_PAGE);
        if (searchCurrentPage < totalPages) {
            searchCurrentPage += 1;
            renderSearchResults();
        }
    });

    document.getElementById('mapToggleBtn')?.addEventListener('click', () => toggleSearchMap());
    document.getElementById('locationSearchBtn')?.addEventListener('click', () => handleSearchLocation());
    document.getElementById('radiusSelect')?.addEventListener('change', () => handleRadiusChange());

    document.getElementById('locationSearchInput')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchLocation();
        }
    });

    document.querySelectorAll('[data-filter-group="bhk"] .filter-pill').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            document.getElementById('applyFiltersBtn')?.classList.add('is-ready');
            searchCurrentPage = 1;
            applySearchFilters();
        });
    });

    document.querySelectorAll('input[name="propertyType"], input[name="amenity"], input[name="availability"], #minRentInput, #maxRentInput').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('applyFiltersBtn')?.classList.add('is-ready');
            searchCurrentPage = 1;
            applySearchFilters();
        });
    });

}

function toggleMobileFilters(open) {
    document.getElementById('searchFilters')?.classList.toggle('open', open);
    document.getElementById('filterBackdrop')?.classList.toggle('open', open);
    document.body.classList.toggle('filters-open', open);
}

function hydrateSearchLabels() {
    const params = new URLSearchParams(window.location.search);
    const storedLocation = readStoredSearchLocation();
    const city = params.get('city') || storedLocation?.city || SEARCH_DEFAULT_CITY;
    const label = params.get('locationLabel') || storedLocation?.label || params.get('keyword') || city;
    const radiusKm = params.get('radiusKm') || storedLocation?.radiusKm || 10;
    setText('toolbarCity', city);
    setLocationSearchValue(label);
    setRadiusValue(radiusKm);
    updateSelectedLocationDisplay({ label, city, radiusKm }, Boolean(params.get('lat') || params.get('city') || params.get('keyword') || storedLocation?.searched));

    const requestedType = params.get('propertyType');
    if (requestedType) {
        document.querySelectorAll('input[name="propertyType"]').forEach(input => {
            input.checked = input.value === requestedType.toUpperCase();
        });
    }

    const minRent = params.get('minRent');
    const maxRent = params.get('maxRent');
    if (minRent) document.getElementById('minRentInput').value = minRent;
    if (maxRent) document.getElementById('maxRentInput').value = maxRent;
}

async function handleSearchLocation() {
    const input = document.getElementById('locationSearchInput');
    const query = input?.value.trim();
    if (!query) {
        input?.focus();
        setStatus('Enter a city, area, or landmark to search.');
        return;
    }

    const radiusKm = getSelectedRadiusKm();
    setStatus('Searching that location...');

    try {
        const result = await geocodeSearchLocation(query);
        if (!result) {
            setStatus('No matching location found. Try a nearby landmark or city.');
            return;
        }

        const city = getCityFromGeocode(result) || query;
        const location = {
            city,
            label: result.display_name || query,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            radiusKm,
            searched: true
        };

        persistSearchLocation(location);
        writeSearchLocationToUrl(location);
        updateSelectedLocationDisplay(location, true);
        setLocationSearchValue(location.label);
        setText('toolbarCity', city);
        searchCurrentPage = 1;
        await loadSearchProperties();
    } catch (error) {
        console.error('Location search failed:', error);
        setStatus('Could not search that location. Please try again.');
    }
}

async function handleRadiusChange() {
    const params = new URLSearchParams(window.location.search);
    const storedLocation = readStoredSearchLocation();
    const radiusKm = getSelectedRadiusKm();

    if (!params.get('lat') && !storedLocation?.lat) {
        updateSelectedLocationDisplay({ label: document.getElementById('locationSearchInput')?.value || SEARCH_DEFAULT_CITY, radiusKm }, false);
        return;
    }

    const location = {
        ...storedLocation,
        city: params.get('city') || storedLocation?.city || SEARCH_DEFAULT_CITY,
        label: params.get('locationLabel') || storedLocation?.label || storedLocation?.city || SEARCH_DEFAULT_CITY,
        lat: parseFloat(params.get('lat') || storedLocation?.lat),
        lng: parseFloat(params.get('lng') || storedLocation?.lng),
        radiusKm
    };

    location.searched = true;
    persistSearchLocation(location);
    writeSearchLocationToUrl(location);
    updateSelectedLocationDisplay(location, true);
    searchCurrentPage = 1;
    await loadSearchProperties();
}

async function loadSearchProperties() {
    const resultsEl = document.getElementById('propertyResults');
    setStatus('Finding homes near your selected location...');

    try {
        const params = new URLSearchParams(window.location.search);
        const location = await resolveSearchLocation(params);
        persistSearchLocation(location);
        updateSelectedLocationDisplay(location, Boolean(location.searched));
        setLocationSearchValue(location.label || location.city || SEARCH_DEFAULT_CITY);
        setRadiusValue(location.radiusKm || 10);
        setText('toolbarCity', location.city || SEARCH_DEFAULT_CITY);

        const response = await fetchSearchPropertyPage(location);
        const baseProperties = normalizeSearchResponse(response).filter(property => {
            const status = (property.status || 'ACTIVE').toUpperCase();
            return status === 'ACTIVE';
        });

        searchAllProperties = filterPropertiesBySelectedRadius(
            baseProperties.map(normalizeSearchProperty),
            location
        );
        updateSearchCounts(searchAllProperties);
        await enrichSearchProperties(searchAllProperties.slice(0, 24));
        applySearchFilters();
        setStatus(searchAllProperties.length ? '' : 'No homes were returned for this location yet.');
    } catch (error) {
        console.error('Search property load failed:', error);
        if (resultsEl) {
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div>
                        <i class="fas fa-triangle-exclamation"></i>
                        <h3>Could not load properties</h3>
                        <p>Please try again in a moment.</p>
                    </div>
                </div>
            `;
        }
        setStatus('');
    }
}

async function resolveSearchLocation(params) {
    const stored = readStoredSearchLocation();
    const city = params.get('city') || stored?.city || SEARCH_DEFAULT_CITY;
    const canUseStoredCoords = !params.get('city') || !stored?.city || stored.city.toLowerCase() === city.toLowerCase();
    const lat = parseFloat(params.get('lat') || (canUseStoredCoords ? stored?.lat : ''));
    const lng = parseFloat(params.get('lng') || (canUseStoredCoords ? stored?.lng : ''));
    const radiusKm = parseFloat(params.get('radiusKm') || stored?.radiusKm || 10);
    const keywordLocation = params.get('keyword') || params.get('locality') || '';
    const label = params.get('locationLabel') || (canUseStoredCoords ? stored?.label : '') || keywordLocation || city;
    const searched = Boolean(params.get('lat') || params.get('city') || params.get('keyword') || params.get('locationLabel') || stored?.searched);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { city, label, lat, lng, radiusKm, searched };
    }

    try {
        const geocodeQuery = keywordLocation ? `${keywordLocation}, ${city}` : city;
        const geocoded = await geocodeSearchLocation(geocodeQuery);
        if (geocoded) {
            return {
                city,
                label: geocoded.display_name || city,
                lat: parseFloat(geocoded.lat),
                lng: parseFloat(geocoded.lon),
                radiusKm,
                searched
            };
        }
    } catch (error) {
        console.warn('Geocoding unavailable, falling back to city query:', error);
    }

    return { city, label: city, radiusKm, searched };
}

async function fetchSearchPropertyPage(location) {
    if (!window.apiService) {
        throw new Error('API service is not available');
    }

    if (location.lat && location.lng) {
        return window.apiService.getProperties({
            lat: location.lat,
            lng: location.lng,
            radiusKm: location.radiusKm || 10
        });
    }

    return window.apiService.getProperties({ city: location.city });
}

function normalizeSearchResponse(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.properties)) return response.properties;
    return [];
}

function normalizeSearchProperty(property) {
    const normalizedType = getSearchPropertyType(property);
    return {
        ...property,
        id: property.id || property.propertyId,
        type: normalizedType,
        name: property.name || property.propertyName,
        expectedRent: Number(property.expectedRent || property.rent || property.monthlyRent || 0),
        city: property.city || '',
        location: property.location || property.locality || property.landmark || '',
        bhkType: normalizeSearchBhk(property.bhkType || property.bhk || property.bedrooms || property.totalBedrooms),
        pgSeater: property.pgSeater || property.seater || property.sharingType,
        furnishing: property.furnishing || property.furnishingStatus,
        amenities: normalizeList(property.amenities),
        preferredTenants: normalizeList(property.preferredTenants),
        primaryImageUrl: normalizeSearchImageUrl(property.primaryImageUrl || property.imageUrl || property.image),
        latitude: property.latitude,
        longitude: property.longitude,
        availableFrom: property.availableFrom || property.availabilityDate,
        createdAt: property.createdAt || property.updatedAt
    };
}

function filterPropertiesBySelectedRadius(properties, location) {
    if (!location?.lat || !location?.lng || !location?.radiusKm) {
        return properties;
    }

    return properties.filter(property => {
        const distance = getPropertyDistanceKm(property, location);
        if (distance === null) return !location.searched;
        property.distanceKm = distance;
        return distance <= location.radiusKm;
    });
}

function getPropertyDistanceKm(property, location) {
    if (typeof property.distanceKm === 'number') return property.distanceKm;
    if (typeof property.distance === 'number') return property.distance;

    const lat = parseFloat(property.latitude);
    const lng = parseFloat(property.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return calculateSearchDistanceKm(location.lat, location.lng, lat, lng);
}

function calculateSearchDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
    return value * Math.PI / 180;
}

async function enrichSearchProperties(properties) {
    if (!window.apiService || !properties.length) return;

    await Promise.all(properties.map(async property => {
        if (!property.id) return;
        try {
            const details = await window.apiService.makeRequest(`/properties/${property.id}`, { includeAuth: false });
            Object.assign(property, normalizeSearchProperty({ ...property, ...details }));
        } catch (error) {
            // Details are nice-to-have for public cards.
        }

        try {
            const images = await window.apiService.makeRequest(`/properties/${property.id}/images`, { includeAuth: false });
            const normalized = Array.isArray(images)
                ? images.map(img => ({
                    url: normalizeSearchImageUrl(img.url || img.imageUrl || img.path),
                    primary: !!(img.primaryImage || img.primary),
                    position: img.position ?? 999
                })).filter(img => img.url)
                : [];
            normalized.sort((a, b) => (b.primary - a.primary) || (a.position - b.position));
            if (normalized.length) {
                property.images = normalized.map(img => img.url);
                property.primaryImageUrl = property.images[0];
            }
        } catch (error) {
            if (property.primaryImageUrl) {
                property.images = [property.primaryImageUrl];
            }
        }
    }));
}

function applySearchFilters() {
    const params = new URLSearchParams(window.location.search);
    const keyword = (params.get('keyword') || params.get('locality') || '').toLowerCase();
    const selectedTypes = getCheckedValues('propertyType');
    const selectedBhk = Array.from(document.querySelectorAll('[data-filter-group="bhk"] .filter-pill.active')).map(btn => btn.dataset.value);
    const selectedAmenities = getCheckedValues('amenity');
    const availability = document.querySelector('input[name="availability"]:checked')?.value || '';
    const minRent = Number(document.getElementById('minRentInput')?.value || 0);
    const maxRent = Number(document.getElementById('maxRentInput')?.value || Infinity);

    searchFilteredProperties = searchAllProperties.filter(property => {
        const rent = Number(property.expectedRent || 0);
        const text = `${property.name || ''} ${property.location || ''} ${property.city || ''} ${property.type || ''}`.toLowerCase();
        const propertyAmenities = normalizeList(property.amenities).map(item => item.toLowerCase());

        const matchesKeyword = !keyword || text.includes(keyword);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(property.type);
        const matchesRent = rent >= minRent && rent <= maxRent;
        const matchesBhk = matchesBhkSelection(property, selectedBhk);
        const matchesAmenities = selectedAmenities.every(amenity => {
            if (amenity === 'Furnished') {
                return String(property.furnishing || '').toLowerCase().includes('furnished');
            }
            return propertyAmenities.some(item => item.includes(amenity.toLowerCase()));
        });
        const matchesAvailability = matchesAvailabilityFilter(property, availability);

        return matchesKeyword && matchesType && matchesRent && matchesBhk && matchesAmenities && matchesAvailability;
    });

    sortSearchProperties();
    renderSearchResults();
    refreshSearchMap();
}

function matchesBhkSelection(property, selectedBhk) {
    if (!selectedBhk.length) return true;
    if (property.type === 'PG') return selectedBhk.includes('PG');
    return selectedBhk.includes(normalizeSearchBhk(property.bhkType));
}

function matchesAvailabilityFilter(property, value) {
    if (!value) return true;
    if (!property.availableFrom) return value === 'now';
    const available = new Date(property.availableFrom);
    if (Number.isNaN(available.getTime())) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (value === 'now') return available <= today;
    const days = Number(value);
    const latest = new Date(today);
    latest.setDate(today.getDate() + days);
    return available <= latest;
}

function sortSearchProperties() {
    const sort = document.getElementById('sortSelect')?.value || 'best';
    searchFilteredProperties.sort((a, b) => {
        if (sort === 'rent_low_high') return (a.expectedRent || 0) - (b.expectedRent || 0);
        if (sort === 'rent_high_low') return (b.expectedRent || 0) - (a.expectedRent || 0);
        if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        const aScore = Number(Boolean(a.primaryImageUrl)) + Number(Boolean(a.latitude && a.longitude));
        const bScore = Number(Boolean(b.primaryImageUrl)) + Number(Boolean(b.latitude && b.longitude));
        return bScore - aScore;
    });
}

function renderSearchResults() {
    const resultsEl = document.getElementById('propertyResults');
    if (!resultsEl) return;

    const total = searchFilteredProperties.length;
    const city = document.getElementById('toolbarCity')?.textContent || SEARCH_DEFAULT_CITY;
    setText('resultsTotal', `${total} ${total === 1 ? 'home' : 'homes'}`);
    setText('mapSummary', `${total} ${total === 1 ? 'property' : 'properties'} across ${city}`);

    if (!total) {
        resultsEl.innerHTML = `
            <div class="empty-state">
                <div>
                    <i class="fas fa-search"></i>
                    <h3>No homes found</h3>
                    <p>Try another area, price range, or fewer filters.</p>
                </div>
            </div>
        `;
        renderSearchPagination();
        return;
    }

    const start = (searchCurrentPage - 1) * SEARCH_ITEMS_PER_PAGE;
    const pageItems = searchFilteredProperties.slice(start, start + SEARCH_ITEMS_PER_PAGE);
    resultsEl.innerHTML = pageItems.map(createSearchPropertyCard).join('');
    renderSearchPagination();
}

function createSearchPropertyCard(property) {
    const title = getSearchPropertyTitle(property);
    const location = [property.location, property.city].filter(Boolean).join(', ') || 'Location available on request';
    const tags = getSearchTags(property).slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
    const imageUrl = property.primaryImageUrl || property.images?.[0] || '';
    const image = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" onerror="this.replaceWith(createSearchPlaceholder())">`
        : `<span class="image-placeholder"><i class="fas fa-building"></i></span>`;
    const favorites = readFavorites();
    const isFavorite = favorites.includes(Number(property.id));
    const availableText = property.availableFrom ? `Available ${formatSearchDate(property.availableFrom)}` : 'Available now';
    const verified = (property.verified || property.isVerified) ? 'Verified' : 'Unverified';

    return `
        <article class="property-card" data-property-id="${escapeHtml(String(property.id || ''))}" onclick="openSearchPropertyDetails('${escapeHtml(String(property.id || ''))}')">
            <div class="property-media">
                ${image}
                <span class="verified-badge">${verified}</span>
                <button type="button" class="heart-btn ${isFavorite ? 'active' : ''}" onclick="toggleSearchFavorite(event, ${Number(property.id) || 0})" aria-label="Save property">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="property-body">
                <div class="property-kind">${escapeHtml(getSearchKindLabel(property))}</div>
                <h3 class="property-title">${escapeHtml(title)}</h3>
                <div class="property-location"><i class="fas fa-location-dot"></i> ${escapeHtml(location)}</div>
                <div class="tag-row">${tags}</div>
                <div class="rent-row">&#8377;${formatSearchNumber(property.expectedRent || 0)} <span>/mo</span></div>
            </div>
            <footer class="card-foot">
                <span class="rating"><i class="fas fa-star"></i> 4.8 (124)</span>
                <span class="availability">&bull; ${escapeHtml(availableText)}</span>
            </footer>
        </article>
    `;
}

function renderSearchPagination() {
    const strip = document.getElementById('paginationStrip');
    if (!strip) return;

    const totalPages = Math.ceil(searchFilteredProperties.length / SEARCH_ITEMS_PER_PAGE);
    strip.hidden = totalPages <= 1;
    setText('pageLabel', `Page ${searchCurrentPage} of ${Math.max(totalPages, 1)}`);
    document.getElementById('prevPageBtn').disabled = searchCurrentPage <= 1;
    document.getElementById('nextPageBtn').disabled = searchCurrentPage >= totalPages;
}

function setSearchView(view) {
    const results = document.getElementById('propertyResults');
    results?.classList.toggle('compact', view === 'compact');
    document.getElementById('gridViewBtn')?.classList.toggle('active', view === 'grid');
    document.getElementById('compactViewBtn')?.classList.toggle('active', view === 'compact');
}

function resetSearchFilters() {
    document.querySelectorAll('input[name="propertyType"]').forEach(input => input.checked = input.value === 'FLAT');
    document.querySelectorAll('input[name="amenity"]').forEach(input => input.checked = false);
    document.querySelectorAll('[data-filter-group="bhk"] .filter-pill').forEach(button => button.classList.remove('active'));
    document.querySelector('input[name="availability"][value=""]').checked = true;
    document.getElementById('minRentInput').value = 0;
    document.getElementById('maxRentInput').value = 25000;
    document.getElementById('applyFiltersBtn')?.classList.remove('is-ready');
    searchCurrentPage = 1;
    applySearchFilters();
    toggleMobileFilters(false);
}

function toggleSearchMap() {
    const panel = document.getElementById('mapPanel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
        refreshSearchMap();
        setTimeout(() => searchMap?.invalidateSize(), 50);
    }
}

function refreshSearchMap() {
    const panel = document.getElementById('mapPanel');
    if (!panel || panel.hidden || typeof L === 'undefined') return;

    if (!searchMap) {
        searchMap = L.map('searchPropertyMap').setView([18.5204, 73.8567], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(searchMap);
    }

    searchMarkers.forEach(marker => marker.remove());
    searchMarkers = [];

    searchFilteredProperties.forEach(property => {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        const marker = L.marker([lat, lng]).addTo(searchMap);
        marker.bindPopup(`<strong>${escapeHtml(getSearchPropertyTitle(property))}</strong><br>&#8377;${formatSearchNumber(property.expectedRent || 0)}/mo`);
        searchMarkers.push(marker);
    });

    if (searchMarkers.length) {
        searchMap.fitBounds(L.featureGroup(searchMarkers).getBounds().pad(0.16));
    }
}

async function geocodeSearchLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=in`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Geocode failed');
    const data = await response.json();
    return Array.isArray(data) ? data[0] : null;
}

function getCityFromGeocode(result) {
    const address = result?.address || {};
    return address.city || address.town || address.village || address.county || address.state || '';
}

function getSelectedRadiusKm() {
    const value = parseFloat(document.getElementById('radiusSelect')?.value || 10);
    return Number.isNaN(value) ? 10 : value;
}

function setRadiusValue(radiusKm) {
    const select = document.getElementById('radiusSelect');
    if (!select) return;
    const value = String(radiusKm || 10);
    const optionExists = Array.from(select.options).some(option => option.value === value);
    select.value = optionExists ? value : '10';
}

function setLocationSearchValue(value) {
    const input = document.getElementById('locationSearchInput');
    if (input && value) {
        input.value = value;
    }
}

function updateSelectedLocationDisplay(location, show) {
    const wrap = document.getElementById('selectedLocationWrap');
    if (!wrap) return;

    const label = location?.label || location?.city || SEARCH_DEFAULT_CITY;
    const radiusKm = location?.radiusKm || getSelectedRadiusKm();
    setText('selectedLocationLabel', label);
    setText('selectedRadiusLabel', `${radiusKm} km`);
    wrap.hidden = !show;
}

function writeSearchLocationToUrl(location) {
    const params = new URLSearchParams(window.location.search);
    params.set('city', location.city || SEARCH_DEFAULT_CITY);
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
    params.set('radiusKm', String(location.radiusKm || 10));
    params.set('locationLabel', location.label || location.city || SEARCH_DEFAULT_CITY);
    params.delete('keyword');
    params.delete('locality');
    history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
}

function getSearchPropertyType(property) {
    const raw = String(property.propertyType || property.type || '').toUpperCase();
    if (raw.includes('PG') || raw.includes('HOSTEL')) return 'PG';
    if (raw.includes('STUDIO')) return 'STUDIO';
    if (raw.includes('VILLA') || raw.includes('INDEPENDENT')) return 'VILLA';
    return 'FLAT';
}

function getSearchPropertyTitle(property) {
    if ((property.type === 'PG' || property.type === 'STUDIO' || property.type === 'VILLA') && property.name) {
        return property.name;
    }
    const bhk = getSearchBhkLabel(property);
    const area = property.location || property.city || 'Pune';
    return bhk ? `${bhk} in ${area}` : `${getSearchKindLabel(property)} in ${area}`;
}

function getSearchBhkLabel(property) {
    if (property.type === 'PG') {
        return property.pgSeater ? `${property.pgSeater} Sharing` : 'PG';
    }
    const normalized = normalizeSearchBhk(property.bhkType);
    if (normalized === 'RK_1') return '1 RK';
    const bhk = String(normalized || '').replace('BHK_', '').replace('_PLUS', '+');
    if (!bhk) return '';
    return `${bhk} BHK`;
}

function normalizeSearchBhk(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return '';
    if (raw.includes('RK')) return 'RK_1';
    if (raw.startsWith('BHK_')) return raw;
    if (raw.includes('FOUR_PLUS') || raw.includes('4+') || raw.includes('4 PLUS')) return 'BHK_4_PLUS';
    if (raw.includes('ONE')) return 'BHK_1';
    if (raw.includes('TWO')) return 'BHK_2';
    if (raw.includes('THREE')) return 'BHK_3';
    if (raw.includes('FOUR')) return 'BHK_4';
    const match = raw.match(/[1-4]/);
    return match ? `BHK_${match[0]}` : raw;
}

function getSearchKindLabel(property) {
    if (property.type === 'PG') return 'PG';
    if (property.type === 'STUDIO') return 'Studio';
    if (property.type === 'VILLA') return 'Villa';
    return 'Flat';
}

function getSearchTags(property) {
    const tags = [];
    if (property.furnishing) tags.push(formatSearchEnum(property.furnishing));
    normalizeList(property.amenities).forEach(item => {
        if (tags.length < 4) tags.push(formatSearchEnum(item));
    });
    if (!tags.length) tags.push('Ready to visit');
    return tags;
}

function updateSearchCounts(properties) {
    const counts = properties.reduce((acc, property) => {
        acc[property.type] = (acc[property.type] || 0) + 1;
        return acc;
    }, {});
    setText('countFlat', counts.FLAT || 0);
    setText('countPg', counts.PG || 0);
    setText('countStudio', counts.STUDIO || 0);
    setText('countVilla', counts.VILLA || 0);
}

function normalizeSearchImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    if (window.apiService?.baseURL) {
        return `${window.apiService.baseURL.replace('/api', '')}/${url}`;
    }
    return url;
}

function normalizeList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim()) return value.split(',').map(item => item.trim()).filter(Boolean);
    return [];
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
}

function readStoredSearchLocation() {
    try {
        return JSON.parse(localStorage.getItem(SEARCH_LOCATION_KEY) || 'null');
    } catch (error) {
        return null;
    }
}

function persistSearchLocation(location) {
    try {
        localStorage.setItem(SEARCH_LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
        // Storage is optional.
    }
}

function readFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favoriteProperties') || '[]').map(Number);
    } catch (error) {
        return [];
    }
}

function toggleSearchFavorite(event, propertyId) {
    event.stopPropagation();
    if (!propertyId) return;
    let favorites = readFavorites();
    if (favorites.includes(propertyId)) {
        favorites = favorites.filter(id => id !== propertyId);
    } else {
        favorites.push(propertyId);
    }
    localStorage.setItem('favoriteProperties', JSON.stringify(favorites));
    renderSearchResults();
}

function openSearchPropertyDetails(propertyId) {
    if (!propertyId) return;
    window.location.href = `property-details.html?id=${encodeURIComponent(propertyId)}`;
}

function createSearchPlaceholder() {
    const span = document.createElement('span');
    span.className = 'image-placeholder';
    span.innerHTML = '<i class="fas fa-building"></i>';
    return span;
}

function formatSearchNumber(num) {
    return Number(num || 0).toLocaleString('en-IN');
}

function formatSearchEnum(value) {
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function formatSearchDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'soon';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date <= today) return 'now';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setStatus(message) {
    setText('statusLine', message);
}

window.toggleSearchFavorite = toggleSearchFavorite;
window.openSearchPropertyDetails = openSearchPropertyDetails;
window.createSearchPlaceholder = createSearchPlaceholder;
