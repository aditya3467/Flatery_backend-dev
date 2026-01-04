/**
 * Home Page JavaScript
 * Loads recommended properties for the homepage and handles search
 */

const HOME_LOCATION_STORAGE_KEY = 'flatery:lastSearchLocation';
const DEFAULT_RADIUS_KM = 5;
let selectedLocation = null; // { lat, lng, label, radiusKm }
let suggestionTimeout = null;

document.addEventListener('DOMContentLoaded', async function() {
    loadRecommendedProperties();
    setupSearchButton();
    initLocationAutocomplete();
});

/**
 * Setup search button click handler
 */
function setupSearchButton() {
    const searchButton = document.getElementById('searchButton');
    const detectButton = document.getElementById('detectLocationBtn');
    const propertyTypeSelect = document.getElementById('propertyTypeSelect');
    const locationInput = document.getElementById('locationInput');

    const goToProperties = () => {
        const propertyType = propertyTypeSelect ? propertyTypeSelect.value : '';
        const cityText = locationInput ? locationInput.value.trim() : '';

        const params = new URLSearchParams();
        if (propertyType) {
            params.append('propertyType', propertyType);
        }

        if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
            persistLocation(selectedLocation);
            if (selectedLocation.label) {
                params.append('city', selectedLocation.label);
            }
        } else if (cityText) {
            clearPersistedLocation();
            params.append('city', cityText);
        } else {
            clearPersistedLocation();
        }

        const queryString = params.toString();
        window.location.href = queryString ? `properties.html?${queryString}` : 'properties.html';
    };

    if (searchButton) {
        searchButton.addEventListener('click', goToProperties);
    }

    if (detectButton) {
        detectButton.addEventListener('click', async () => {
            await detectLocationFromBrowser(locationInput);
            goToProperties();
        });
    }

    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                goToProperties();
            }
        });

        locationInput.addEventListener('input', () => {
            selectedLocation = null;
        });
    }
}

function initLocationAutocomplete() {
    const locationInput = document.getElementById('locationInput');
    const suggestionBox = document.getElementById('locationSuggestions');
    if (!locationInput || !suggestionBox) {
        return;
    }

    locationInput.addEventListener('input', () => {
        const value = locationInput.value.trim();
        selectedLocation = null;
        clearSuggestions();
        if (value.length < 3) {
            return;
        }
        if (suggestionTimeout) {
            clearTimeout(suggestionTimeout);
        }
        suggestionTimeout = setTimeout(() => fetchSuggestions(value), 250);
    });

    locationInput.addEventListener('focus', () => {
        if (suggestionBox.childElementCount > 0) {
            suggestionBox.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!suggestionBox.contains(e.target) && e.target !== locationInput) {
            suggestionBox.style.display = 'none';
        }
    });

    suggestionBox.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        const label = item.dataset.label || locationInput.value.trim();
        selectedLocation = { lat, lng, label, radiusKm: DEFAULT_RADIUS_KM };
        locationInput.value = label;
        clearSuggestions();
    });
}

function clearSuggestions() {
    const suggestionBox = document.getElementById('locationSuggestions');
    if (suggestionBox) {
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'none';
    }
}

async function fetchSuggestions(query) {
    const suggestionBox = document.getElementById('locationSuggestions');
    if (!suggestionBox) return;
    try {
        suggestionBox.innerHTML = '<div class="suggestion-item">Searching...</div>';
        suggestionBox.style.display = 'block';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Geocode failed');
        const results = await res.json();
        if (!Array.isArray(results) || results.length === 0) {
            suggestionBox.innerHTML = '<div class="suggestion-item">No matches found</div>';
            return;
        }
        suggestionBox.innerHTML = results.map((item, idx) => {
            const label = item.display_name || item.name || query;
            return `<div class="suggestion-item" data-lat="${item.lat}" data-lng="${item.lon}" data-label="${label}" role="option" tabindex="${idx}">${label}</div>`;
        }).join('');
        suggestionBox.style.display = 'block';
    } catch (e) {
        suggestionBox.innerHTML = '<div class="suggestion-item">Failed to load suggestions</div>';
    }
}

async function detectLocationFromBrowser(locationInput) {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported in this browser.');
        return;
    }
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            selectedLocation = {
                lat: latitude,
                lng: longitude,
                label: 'Your location',
                radiusKm: DEFAULT_RADIUS_KM
            };
            if (locationInput) {
                locationInput.value = 'Your location';
            }
            persistLocation(selectedLocation);
            clearSuggestions();
            resolve();
        }, (err) => {
            console.error('Geolocation error', err);
            alert('Could not detect your location. Please allow permission or try again.');
            resolve();
        }, { enableHighAccuracy: true, timeout: 8000 });
    });
}

function persistLocation(location) {
    localStorage.setItem(HOME_LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function clearPersistedLocation() {
    localStorage.removeItem(HOME_LOCATION_STORAGE_KEY);
}

/**
 * Load recommended properties from API and display on homepage
 */
async function loadRecommendedProperties() {
    const container = document.getElementById('recommendedPropertiesGrid');
    
    
    if (!container) {
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
        
        // Fetch recommended properties (latest 3) from the API
        const response = await fetch(`${apiService.baseURL}/properties/recommended`);
        
        
        if (!response.ok) {
            throw new Error('Failed to fetch recommended properties');
        }
        
        const properties = await response.json();
        
        if (!properties || properties.length === 0) {
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
