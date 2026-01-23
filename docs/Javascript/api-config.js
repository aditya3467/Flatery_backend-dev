// API Configuration - Environment aware
// Automatically switches between localhost and production

const API_CONFIG = {
    // Determine if running locally or in production
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Set API base URL based on environment
    getBaseUrl: function() {
        if (this.isLocal) {
            return 'http://localhost:8081/api';
        } else {
            // Production URL - change this to your actual Render URL
            return 'https://flatery-backend-dev.onrender.com/api';
        }
    },
    
    // Get the base URL
    baseUrl: function() {
        return this.getBaseUrl();
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
