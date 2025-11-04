// API Service for Flatery Backend
// Base URL for your Spring Boot backend
const API_BASE_URL = 'http://localhost:8082/api';

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

        console.log('Making API request:', { url, config });

        try {
            const response = await fetch(url, config);
            console.log('Response received:', { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()) });
            
            // Try parse JSON first
            let data = null;
            let text = null;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (e) {
                // not JSON, capture raw text
                try { text = await response.text(); } catch (e2) { text = null; }
                console.log('Response text:', text);
            }

            if (!response.ok) {
                const errBody = data || text;
                const errMsg = (errBody && (typeof errBody === 'string' ? errBody : (errBody.message || errBody.error))) || `HTTP error! status: ${response.status}`;
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
            // Re-throw the original error to preserve status code and message
            throw error;
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
            // Re-throw the original error
            throw error;
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
            return await this.makeRequest('/admin/properties', {
                method: 'POST',
                body: JSON.stringify(propertyData)
            });
        } catch (error) {
            throw error; // Re-throw original error to preserve status and message
        }
    }

    async getMyProperties(all = false, page = 0, size = 10) {
        try {
            const params = new URLSearchParams({ all: all.toString(), page: page.toString(), size: size.toString() });
            return await this.makeRequest(`/admin/properties?${params}`);
        } catch (error) {
            throw new Error('Failed to fetch my properties: ' + error.message);
        }
    }

    async updateProperty(id, propertyData) {
        try {
            return await this.makeRequest(`/admin/properties/${id}`, {
                method: 'PUT',
                body: JSON.stringify(propertyData)
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteProperty(id) {
        try {
            return await this.makeRequest(`/admin/properties/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw new Error('Failed to delete property: ' + error.message);
        }
    }

    // Upload images for a property
    async uploadPropertyImages(propertyId, files) {
        try {
            if (!this.token) {
                throw new Error('You are not authenticated. Please log in again.');
            }
            const formData = new FormData();
            for (let file of files) {
                formData.append('files', file);
            }

            const url = `${this.baseURL}/admin/properties/${propertyId}/images`;
            console.log('Uploading images:', { propertyId, filesCount: files?.length });
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                    // Don't set Content-Type - browser will set it with boundary for multipart
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    // Get images for a property
    async getPropertyImages(propertyId) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/images`);
        } catch (error) {
            throw new Error('Failed to fetch property images: ' + error.message);
        }
    }

    // Delete a property image
    async deletePropertyImage(propertyId, imageId) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/images/${imageId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw new Error('Failed to delete image: ' + error.message);
        }
    }

    // Set primary image for a property
    async setPrimaryPropertyImage(propertyId, imageId) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/images/${imageId}/primary`, {
                method: 'PUT',
                body: JSON.stringify({}) // Some servers require a body for PUT requests
            });
        } catch (error) {
            throw new Error('Failed to set primary image: ' + error.message);
        }
    }

    // Get one of my properties (admin)
    async getMyProperty(id) {
        try {
            return await this.makeRequest(`/admin/properties/${id}`);
        } catch (error) {
            throw new Error('Failed to fetch property: ' + error.message);
        }
    }

    // Tenant Management API methods
    async addTenant(tenantData) {
        try {
            return await this.makeRequest('/tenants', {
                method: 'POST',
                body: JSON.stringify(tenantData)
            });
        } catch (error) {
            throw error;
        }
    }

    async getTenants() {
        try {
            return await this.makeRequest('/tenants');
        } catch (error) {
            throw new Error('Failed to fetch tenants: ' + error.message);
        }
    }

    // User lookup for owners adding tenants
    async findUser({ username, email, phone }) {
        try {
            const params = new URLSearchParams();
            if (username) params.append('username', username);
            if (email) params.append('email', email);
            if (phone) params.append('phone', phone);
            return await this.makeRequest(`/users/search?${params.toString()}`);
        } catch (error) {
            // surface 404 as an error for the caller to handle
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            return await this.makeRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
        } catch (error) {
            throw error;
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
