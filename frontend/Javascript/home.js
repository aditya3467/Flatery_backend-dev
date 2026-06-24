/**
 * Home Page JavaScript
 * Loads recommended properties for the homepage and handles search
 */

const HOME_LOCATION_STORAGE_KEY = 'flatery:lastSearchLocation';
const DEFAULT_RADIUS_KM = 5;
let selectedLocation = null; // { lat, lng, label, radiusKm }
let suggestionTimeout = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Auto-detect location and load nearby properties
    await autoDetectAndLoadProperties();
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
        const citySelect = document.getElementById('citySelect');
        const locationInput = document.getElementById('locationInput');

    const goToProperties = () => {
        const propertyType = propertyTypeSelect ? propertyTypeSelect.value : '';
            const selectedCity = citySelect ? citySelect.value : '';
            const localityText = locationInput ? locationInput.value.trim() : '';

            // Validate that city is selected
            if (!selectedCity) {
                alert('Please select a city before searching.');
                citySelect?.focus();
                return;
            }

        const params = new URLSearchParams();
        
            // Always add selected city
            params.append('city', selectedCity);
        
        if (propertyType) {
            if (propertyType.toLowerCase().includes('pg')) {
                params.append('propertyType', 'PG');
            } else if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
                params.append('propertyType', 'FLAT');
            }
        }

            // If user has selected a specific location with coordinates, use it
            if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
                persistLocation({
                    ...selectedLocation,
                    city: selectedCity // Ensure city is part of stored location
                });
                if (localityText) {
                    params.append('keyword', localityText);
                }
            } else if (localityText) {
                // User entered locality text without selecting from suggestions
            clearPersistedLocation();
                params.append('keyword', localityText);
        } else {
            clearPersistedLocation();
        }

        const queryString = params.toString();
            window.location.href = `search-property.html?${queryString}`;
    };

    if (searchButton) {
        searchButton.addEventListener('click', goToProperties);
    }

    if (detectButton) {
        detectButton.addEventListener('click', async () => {
                const detectedCity = await detectLocationFromBrowser(locationInput);
                if (detectedCity && citySelect) {
                    // Try to set the city select to the detected city
                    const cityOptions = Array.from(citySelect.options);
                    const matchingOption = cityOptions.find(opt => 
                        opt.value.toLowerCase() === detectedCity.toLowerCase()
                    );
                    if (matchingOption) {
                        citySelect.value = matchingOption.value;
                    }
                }
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
/**
 * Auto-detect user location and load nearby properties sorted by views
 */
async function autoDetectAndLoadProperties() {
    const container = document.getElementById('recommendedPropertiesGrid');
    
    if (!container) return;
    
    try {
        // Show loading state
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                <p style="margin-top: 10px;">Detecting your location...</p>
            </div>
        `;
        
        // Try to get user's location
        let userLat = null;
        let userLng = null;
        
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });
                
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                console.log('Location detected:', userLat, userLng);
            } catch (geoError) {
                console.log('Geolocation failed, falling back to all properties:', geoError);
            }
        }
        
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                <p style="margin-top: 10px;">Loading nearby properties...</p>
            </div>
        `;
        
        // Fetch properties (nearby if location available, otherwise all)
        let properties = [];
        if (userLat && userLng) {
            // Fetch nearby properties within 10km
            const response = await fetch(`${apiService.baseURL}/properties?lat=${userLat}&lng=${userLng}&radiusKm=10`);
            if (response.ok) {
                const data = await response.json();
                properties = data.content || [];
            }
        }
        
        // Fallback to all properties if no nearby properties or no location
        if (properties.length === 0) {
            const response = await fetch(`${apiService.baseURL}/properties`);
            if (response.ok) {
                const data = await response.json();
                properties = data.content || [];
            }
        }
        
        if (properties.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; width: 100%;">
                    <i class="fas fa-home" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="margin-top: 10px;">No properties available yet.</p>
                </div>
            `;
            return;
        }
        
        // Fetch view counts for all properties
        const viewCountsPromises = properties.map(property => 
            fetch(`${apiService.baseURL}/properties/${property.id}/views`)
                .then(res => res.ok ? res.json() : { totalViews: 0 })
                .catch(() => ({ totalViews: 0 }))
        );
        
        const viewCounts = await Promise.all(viewCountsPromises);
        
        // Add view counts to properties
        properties.forEach((property, index) => {
            property.viewCount = viewCounts[index].totalViews || 0;
        });
        
        // Sort by view count (most viewed first)
        properties.sort((a, b) => b.viewCount - a.viewCount);
        
        // Display top 3 properties
        const topProperties = properties.slice(0, 3);
        container.innerHTML = topProperties.map(property => createPropertyCard(property)).join('');
        
    } catch (error) {
        console.error('Error loading properties:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f44336;"></i>
                <p style="margin-top: 10px;">Failed to load properties. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Load recommended properties (legacy function, replaced by autoDetectAndLoadProperties)
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
    const location = property.location || '';
    const city = property.city || '';
    
    // Format title like properties.js does
    let title;
    if ((property.type === 'PG' || property.type === 'APARTMENT') && property.name) {
        title = property.name;
    } else if (property.type === 'FLAT' && bhkType) {
        const bhkNumber = bhkType.replace('BHK_', '');
        const locationName = location || city || 'Property';
        title = `${bhkNumber} BHK in ${locationName}`;
    } else {
        title = location || city || 'Property';
    }
    
    // Format location line like "Ansal Api landran, Mohali"
    const locationLine = [location, city].filter(Boolean).join(', ');
    
    const imageUrl = property.primaryImageUrl || 'img/properties/default.jpg';
    
    // Get property details with proper fallbacks
    const area = property.builtUpAreaSqft || property.builtUpArea || null;
    const bathrooms = property.bathrooms || property.bathroom || null;
    const hasBalcony = property.balcony === true;
    
    // Format bedroom/seater info
    let bedroomInfo = '';
    if (property.type === 'PG' || seater) {
        bedroomInfo = seater ? `${seater} Seater` : null;
    } else {
        bedroomInfo = bhkType ? bhkType.replace('BHK_', '') + ' BHK' : null;
    }
    
    // Build description parts
    const descParts = [];
    if (bedroomInfo) descParts.push(bedroomInfo);
    if (bathrooms) descParts.push(`${bathrooms} Bath${bathrooms !== 1 ? 's' : ''}`);
    if (hasBalcony) descParts.push('Balcony');
    if (area) descParts.push(`${area} sqft`);
    
    const description = descParts.length > 0 ? descParts.join(' • ') : 'Details not available';
    
    return `
        <div class="property-card" onclick="viewProperty(${property.id})">
            <div class="property-image">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='img/properties/1.jpeg'">
            </div>
            <div class="property-details">
                <h3>${title}</h3>
                ${locationLine ? `<p style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;"><i class="fas fa-map-marker-alt"></i> ${locationLine}</p>` : ''}
                <p>${description}</p>
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
