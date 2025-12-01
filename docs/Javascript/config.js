// Global API Configuration
// This should be loaded before any other JavaScript files
window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : 'https://flatery-backend-dev.onrender.com/api';

// Backend base URL (without /api) for images and static files
window.BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081'
    : 'https://flatery-backend-dev.onrender.com';

// Base path for navigation - GitHub Pages needs /Flatery_backend-dev/ prefix
window.BASE_PATH = window.location.hostname === 'localhost' 
    ? '' 
    : '/Flatery_backend-dev';

// Helper function to convert relative image URLs to absolute backend URLs
window.getImageUrl = function(imageUrl) {
    if (!imageUrl) return 'img/properties/default.jpg';
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    // If relative path starting with /, prepend backend URL
    if (imageUrl.startsWith('/')) {
        return window.BACKEND_URL + imageUrl;
    }
    // Otherwise return as is (relative to current page)
    return imageUrl;
};

console.log('API Base URL configured:', window.API_BASE_URL);
console.log('Backend URL configured:', window.BACKEND_URL);
console.log('Base Path configured:', window.BASE_PATH);
