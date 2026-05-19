// API Service for Flatery Backend
// Base URL for your Spring Boot backend
const API_BASE_URL = window.location.origin + '/api';

// API Service Class
class ApiService {
    // Get total active security deposits for owner
    async getOwnerSecurityDeposits() {
        try {
            return await this.makeRequest('/admin/properties/security-deposits');
        } catch (error) {
            throw new Error('Failed to fetch security deposits: ' + error.message);
        }
    }
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
                const errMsg = (errBody && (typeof errBody === 'string' ? errBody : (errBody.message || errBody.error))) || `HTTP error! status: ${response.status}`;
                const error = new Error(errMsg);
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            // Only log errors that are not 404 or 400 (to avoid noise from optional endpoints)
            if (error.status !== 404 && error.status !== 400) {
                console.error('API Request failed:', error);
            }
            throw error;
        }
    }

    // Generic HTTP methods
    async get(endpoint, options = {}) {
        return await this.makeRequest(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return await this.makeRequest(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data, options = {}) {
        return await this.makeRequest(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, options = {}) {
        return await this.makeRequest(endpoint, { ...options, method: 'DELETE' });
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

    // Tenant API methods

    // Property API methods
    async getProperties(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, value);
                }
            });
            const qs = searchParams.toString();
            const url = qs ? `/properties?${qs}` : '/properties';
            return await this.makeRequest(url, { includeAuth: false });
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

    async getFlatProperties(page = 0, size = 10) {
        try {
            const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
            return await this.makeRequest(`/admin/properties/flats?${params}`);
        } catch (error) {
            throw new Error('Failed to fetch flat properties: ' + error.message);
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

    // Floors API starts here
    async getFloors(propertyId) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/floors`);
        } catch (error) {
            throw new Error('Failed to fetch floors: ' + error.message);
        }
    }

    async createFloor(propertyId, { number, name }) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/floors`, {
                method: 'POST',
                body: JSON.stringify({ number, name })
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteFloor(floorId) {
        try {
            return await this.makeRequest(`/admin/properties/floors/${floorId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw error;
        }
    }

    // Units API
    async getUnits(propertyId) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/units`);
        } catch (error) {
            throw new Error('Failed to fetch units: ' + error.message);
        }
    }

    async createUnit(propertyId, payload) {
        try {
            return await this.makeRequest(`/admin/properties/${propertyId}/units`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (error) {
            throw error;
        }
    }

    async updateUnitStatus(unitId, status) {
        try {
            return await this.makeRequest(`/admin/properties/units/${unitId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        } catch (error) {
            throw error;
        }
    }

    async deleteUnit(unitId) {
        try {
            return await this.makeRequest(`/admin/properties/units/${unitId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw error;
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

    async getFlatTenants() {
        try {
            return await this.makeRequest('/tenants/flats');
        } catch (error) {
            throw new Error('Failed to fetch flat tenants: ' + error.message);
        }
    }

    async deactivateTenant(tenantId) {
        try {
            return await this.makeRequest(`/tenants/${tenantId}/deactivate`, {
                method: 'POST'
            });
        } catch (error) {
            throw error;
        }
    }

    // Check if a user has an active tenancy (for single tenancy validation)
    async checkActiveTenancy(phoneNumber, email) {
        try {
            const params = new URLSearchParams();
            if (phoneNumber) params.append('phoneNumber', phoneNumber);
            if (email) params.append('email', email);
            return await this.makeRequest(`/tenants/check-active-tenancy?${params.toString()}`);
        } catch (error) {
            // Return null if no active tenancy found (404 is expected)
            if (error.status === 404) {
                return null;
            }
            throw error;
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

    // ============================
    // TENANT DASHBOARD APIs
    // ============================

    // Get current tenant's active tenancy summary
    async getCurrentTenantSummary() {
        return this.makeRequest('/tenants/me', {
            method: 'GET'
        });
    }

    // Get current tenant's unit details
    async getTenantUnit() {
        return this.makeRequest('/tenants/me/unit', {
            method: 'GET'
        });
    }

    // Get tenant's active stay details
    async getTenantActiveStay() {
        return this.makeRequest('/tenants/me/active-stay', {
            method: 'GET'
        });
    }

    // Get tenant's payment history
    async getTenantPaymentHistory() {
        return this.makeRequest('/tenants/me/payments', {
            method: 'GET'
        });
    }

    // Upload payment proof
    async uploadPaymentProof(formData) {
        const url = `${this.baseURL}/tenants/me/payment-proof`;
        const config = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload payment proof');
        }
        
        return response.json();
    }

    // Get tenant unit details
    async getTenantUnit() {
        return this.makeRequest('/tenants/me/unit', {
            method: 'GET'
        });
    }

    // Get comprehensive tenant property details
    async getTenantPropertyDetails() {
        return this.makeRequest('/tenants/me/property', {
            method: 'GET'
        });
    }

    // Get tenant documents
    async getTenantDocuments() {
        return this.makeRequest('/tenants/me/documents', {
            method: 'GET'
        });
    }

    // Get tenant complaints
    async getTenantComplaints() {
        return this.makeRequest('/tenants/me/complaints', {
            method: 'GET'
        });
    }

    // Get tenant past stays/tenancy history
    async getTenantPastStays() {
        return this.makeRequest('/tenants/me/past-stays', {
            method: 'GET'
        });
    }

    // Get tenant's payment transactions
    async getTenantPayments() {
        return this.makeRequest('/tenant/my-payments', {
            method: 'GET'
        });
    }

    // Submit new complaint
    async submitComplaint(complaintData) {
        return this.makeRequest('/tenants/me/complaints', {
            method: 'POST',
            body: JSON.stringify(complaintData)
        });
    }

    // ========================================
    // NOTIFICATION API METHODS
    // ========================================

    // Get all notifications for current user
    async getAllNotifications() {
        return this.makeRequest('/notifications', {
            method: 'GET'
        });
    }

    // Get unread notifications
    async getUnreadNotifications() {
        return this.makeRequest('/notifications/unread', {
            method: 'GET'
        });
    }

    // Get unread notification count
    async getUnreadNotificationCount() {
        return this.makeRequest('/notifications/count', {
            method: 'GET'
        });
    }

    // Mark a notification as read
    async markNotificationAsRead(notificationId) {
        return this.makeRequest(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead() {
        return this.makeRequest('/notifications/read-all', {
            method: 'PUT'
        });
    }

    // Delete a notification
    async deleteNotification(notificationId) {
        return this.makeRequest(`/notifications/${notificationId}`, {
            method: 'DELETE'
        });
    }

    // Clear all read notifications
    async clearReadNotifications() {
        return this.makeRequest('/notifications/clear-read', {
            method: 'DELETE'
        });
    }

    // Create a notification (admin/system use)
    async createNotification(notificationData) {
        return this.makeRequest('/notifications', {
            method: 'POST',
            body: JSON.stringify(notificationData)
        });
    }

    // ========================================
    // PAYMENT/TRANSACTION API METHODS
    // ========================================

    // Get pending payment submissions for owner
    async getOwnerPendingPayments() {
        return this.makeRequest('/transactions/owner/pending', {
            method: 'GET'
        });
    }

    // Get all payment submissions for owner (any status)
    async getOwnerAllPayments() {
        return this.makeRequest('/transactions/owner/all', {
            method: 'GET'
        });
    }

    // Owner payment info (public) by ownerId – used by tenant dashboard to show QR
    async getOwnerPaymentInfoByOwnerId(ownerId) {
        return this.makeRequest(`/owner-payment-info/public/${ownerId}`, {
            method: 'GET',
            includeAuth: false
        });
    }

    // Get tenant's payment history
    async getTenantPayments() {
        return this.makeRequest('/transactions/tenant/my-payments', {
            method: 'GET'
        });
    }

    // Submit payment (tenant)
    async submitPayment(paymentData) {
        return this.makeRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Verify/Approve payment submission (owner)
    async verifyPaymentSubmission(transactionId) {
        return this.makeRequest(`/transactions/${transactionId}/verify`, {
            method: 'POST'
        });
    }

    // Reject payment submission (owner)
    async rejectPaymentSubmission(transactionId, rejectionReason) {
        return this.makeRequest(`/transactions/${transactionId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: rejectionReason })
        });
    }

    // Withdraw/cancel payment submission (tenant)
    async withdrawPaymentSubmission(transactionId) {
        return this.makeRequest(`/transactions/${transactionId}/withdraw`, {
            method: 'POST'
        });
    }

        // Get tenant's past stays/tenancy history
        async getTenantPastStays() {
            return this.makeRequest('/tenants/me/past-stays', {
                method: 'GET'
            });
        }
}

// Create global API service instance
const apiService = new ApiService();

// Export for use in other files
window.apiService = apiService;

// ============================
// SUPERADMIN EMAIL API METHODS
// ============================
ApiService.prototype.getEmailConfig = function() {
    return this.get('/superadmin/email/config');
};

ApiService.prototype.upsertEmailConfig = function(payload) {
    return this.post('/superadmin/email/config', payload);
};

ApiService.prototype.sendTestEmail = function(to) {
    return this.post('/superadmin/email/config/test', { to });
};

ApiService.prototype.verifyEmailConfig = function() {
    return this.post('/superadmin/email/config/verify', {});
};

ApiService.prototype.listEmailTemplates = function() {
    return this.get('/superadmin/email/templates');
};

ApiService.prototype.upsertEmailTemplate = function(payload) {
    return this.post('/superadmin/email/templates', payload);
};

ApiService.prototype.manualEmailDispatch = function(payload) {
    return this.post('/superadmin/email/dispatch', payload);
};

ApiService.prototype.getRecentEmailLogs = function() {
    return this.get('/superadmin/email/logs/recent');
};
