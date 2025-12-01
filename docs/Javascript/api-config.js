// API Configuration for Frontend
// This file helps manage API endpoints between development and production

const API_CONFIG = {
    // Automatically detect environment and use appropriate backend URL
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8081/api'  // Local development
        : 'https://flatery-backend-dev.onrender.com',  // Production backend
    
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout'
        },
        PROPERTIES: '/properties',
        TENANTS: '/tenants',
        COMPLAINTS: '/complaints',
        NOTIFICATIONS: '/notifications',
        PAYMENTS: '/payments',
        USERS: '/users'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

// Example usage in your JavaScript files:
// fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {...})
// fetch(getApiUrl('/properties'), {...})

console.log('API Base URL:', API_CONFIG.BASE_URL);
