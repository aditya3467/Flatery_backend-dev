// API Service for Flatery Backend
// Base URL for your Spring Boot backend
const API_BASE_URL = 'http://localhost:8081/api';

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Get headers for API requests
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        try {
            const response = await fetch(url, config);
            // Try parse JSON first
            let data = null;
            let text = null;
            try {
                data = await response.json();
            } catch (e) {
                // not JSON, capture raw text
                try { text = await response.text(); } catch (e2) { text = null; }
            }

            if (!response.ok) {
                const errBody = data || text;
                const errMsg = (errBody && (typeof errBody === 'string' ? errBody : errBody.message)) || `HTTP error! status: ${response.status}`;
                const error = new Error(errMsg);
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication API methods
    async login(credentials) {
        try {
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
                includeAuth: false
            });
            
            if (response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    async register(userData) {
        try {
            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                includeAuth: false
            });
            
            return response;
        } catch (error) {
            throw new Error('Registration failed: ' + error.message);
        }
    }

    async logout() {
        this.clearToken();
        // You can add a logout API call here if your backend has one
    }

    // User API methods
    async getCurrentUser() {
        try {
            return await this.makeRequest('/auth/me');
        } catch (error) {
            throw new Error('Failed to get user data: ' + error.message);
        }
    }

    // Property API methods
    async getProperties() {
        try {
            return await this.makeRequest('/properties');
        } catch (error) {
            throw new Error('Failed to fetch properties: ' + error.message);
        }
    }

    async createProperty(propertyData) {
        try {
            return await this.makeRequest('/properties', {
                method: 'POST',
                body: JSON.stringify(propertyData)
            });
        } catch (error) {
            throw new Error('Failed to create property: ' + error.message);
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Get token
    getToken() {
        return this.token;
    }
}

// Create global API service instance
const apiService = new ApiService();

// Export for use in other files
window.apiService = apiService;
