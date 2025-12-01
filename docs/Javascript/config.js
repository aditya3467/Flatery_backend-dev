// Global API Configuration
// This should be loaded before any other JavaScript files
window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : 'https://flatery-backend-dev.onrender.com/';

console.log('API Base URL configured:', window.API_BASE_URL);
