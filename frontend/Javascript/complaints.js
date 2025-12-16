/**
 * Complaint Management System - Shared JavaScript Library
 * Handles complaint operations for both owners and tenants
 */

class ComplaintManager {
    constructor() {
        this.currentComplaint = null;
        this.complaints = [];
        this.stats = {};
    }

    // ===================== UTILITY FUNCTIONS =====================

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    /**
     * Format datetime for display
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const statusClasses = {
            'OPEN': 'status-open',
            'IN_PROGRESS': 'status-progress',
            'RESOLVED': 'status-resolved',
            'CLOSED': 'status-closed',
            'REOPENED': 'status-reopened'
        };
        
        return `<span class="status-badge ${statusClasses[status] || ''}">${status}</span>`;
    }

    /**
     * Get priority badge HTML
     */
    getPriorityBadge(priority) {
        const priorityClasses = {
            'LOW': 'priority-low',
            'MEDIUM': 'priority-medium',
            'HIGH': 'priority-high',
            'URGENT': 'priority-urgent'
        };
        
        return `<span class="priority-badge ${priorityClasses[priority] || ''}">${priority}</span>`;
    }

    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            'WATER': 'fas fa-tint',
            'ELECTRICITY': 'fas fa-bolt',
            'CLEANING': 'fas fa-broom',
            'MAINTENANCE': 'fas fa-tools',
            'PEST_CONTROL': 'fas fa-bug',
            'SECURITY': 'fas fa-shield-alt',
            'OTHERS': 'fas fa-question-circle'
        };
        
        return icons[category] || 'fas fa-wrench';
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    /**
     * Show loading state
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        }
    }

    // ===================== API FUNCTIONS =====================

    /**
     * Create new complaint (tenant only)
     */
    async createComplaint(formData) {
        try {
            const response = await fetch('http://localhost:8081/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification('Complaint submitted successfully!', 'success');
                return result;
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to create complaint');
            }
        } catch (error) {
            console.error('Error creating complaint:', error);
            this.showNotification('Error creating complaint: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Get complaints (role-based)
     */
    async getComplaints(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.category) queryParams.append('category', filters.category);

            const endpoint = this.isOwner() ? 'http://localhost:8081/api/complaints/owner/my-complaints' : 'http://localhost:8081/api/complaints/tenant/my-complaints';
            const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.complaints = await response.json();
                return this.complaints;
            } else {
                throw new Error('Failed to fetch complaints');
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
            this.showNotification('Error fetching complaints: ' + error.message, 'error');
            return [];
        }
    }

    /**
     * Get complaint details
     */
    async getComplaintDetails(complaintId) {
        try {
            const response = await fetch(`http://localhost:8081/api/complaints/${complaintId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentComplaint = await response.json();
                return this.currentComplaint;
            } else {
                throw new Error('Failed to fetch complaint details');
            }
        } catch (error) {
            console.error('Error fetching complaint details:', error);
            this.showNotification('Error fetching complaint details: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * Update complaint status (owner only)
     */
    async updateComplaintStatus(complaintId, status, comment = '') {
        try {
            const response = await fetch(`http://localhost:8081/api/complaints/${complaintId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newStatus: status,
                    message: comment || undefined
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification('Status updated successfully!', 'success');
                return result;
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showNotification('Error updating status: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Add response/comment to complaint
     */
    async addComplaintResponse(complaintId, message) {
        try {
            const response = await fetch(`http://localhost:8081/api/complaints/${complaintId}/responses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: message,
                    responseType: 'COMMENT'
                })
            });

            if (response.ok) {
                this.showNotification('Response added successfully!', 'success');
                return true;
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to add response');
            }
        } catch (error) {
            console.error('Error adding response:', error);
            this.showNotification('Error adding response: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Verify complaint resolution (tenant only)
     */
    async verifyComplaint(complaintId) {
        try {
            const response = await fetch(`http://localhost:8081/api/complaints/${complaintId}/verify`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showNotification('Complaint verified successfully!', 'success');
                return true;
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to verify complaint');
            }
        } catch (error) {
            console.error('Error verifying complaint:', error);
            this.showNotification('Error verifying complaint: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Reopen complaint (tenant only)
     */
    async reopenComplaint(complaintId, reason) {
        try {
            const response = await fetch(`http://localhost:8081/api/complaints/${complaintId}/reopen`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (response.ok) {
                this.showNotification('Complaint reopened successfully!', 'success');
                return true;
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to reopen complaint');
            }
        } catch (error) {
            console.error('Error reopening complaint:', error);
            this.showNotification('Error reopening complaint: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Get complaint statistics
     */
    async getComplaintStats() {
        try {
            const endpoint = this.isOwner() ? 'http://localhost:8081/api/complaints/owner/stats' : 'http://localhost:8081/api/complaints/tenant/stats';
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.stats = await response.json();
                return this.stats;
            } else {
                throw new Error('Failed to fetch statistics');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                totalComplaints: 0,
                openComplaints: 0,
                resolvedComplaints: 0,
                averageResolutionTimeHours: 0
            };
        }
    }

    // ===================== HELPER FUNCTIONS =====================

    /**
     * Check if current user is owner
     */
    isOwner() {
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        return roles.includes('ADMIN') || roles.includes('SUPERADMIN');
    }

    /**
     * Check if current user is tenant
     */
    isTenant() {
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        return roles.includes('USER');
    }

    /**
     * Get attachment URL
     */
    getAttachmentUrl(complaintId, attachmentUrl) {
        if (!attachmentUrl) return null;
        
        // Extract filename from URL path
        const filename = attachmentUrl.split('/').pop();
        return `http://localhost:8081/api/complaints/uploads/complaints/${complaintId}/${filename}`;
    }

    // ===================== UI RENDERING FUNCTIONS =====================

    /**
     * Render complaints table
     */
    renderComplaintsTable(complaints, tableBodyId) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        if (!complaints || complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No complaints found</td></tr>';
            return;
        }

        tbody.innerHTML = complaints.map(complaint => `
            <tr>
                <td>${complaint.complaintId}</td>
                <td>
                    <span class="category-badge">
                        <i class="${this.getCategoryIcon(complaint.category)}"></i>
                        ${complaint.category}
                    </span>
                </td>
                <td>${complaint.title}</td>
                ${this.isOwner() ? `<td>${complaint.tenantName || 'N/A'}</td>` : ''}
                <td>${this.getPriorityBadge(complaint.priority)}</td>
                <td>${this.getStatusBadge(complaint.status)}</td>
                <td>${this.formatDate(complaint.submittedAt)}</td>
                <td>
                    <button class="btn-action view" onclick="complaintManager.viewComplaint(${complaint.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render complaint stats
     */
    renderComplaintStats(stats, prefix = '') {
        const elements = {
            [`${prefix}totalComplaints`]: stats.totalComplaints || 0,
            [`${prefix}openComplaints`]: stats.openComplaints || 0,
            [`${prefix}resolvedComplaints`]: stats.resolvedComplaints || 0,
            [`${prefix}avgResolutionTime`]: Math.round(stats.averageResolutionTimeHours / 24) || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Render complaint responses
     */
    renderComplaintResponses(responses, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!responses || responses.length === 0) {
            container.innerHTML = '<div class="no-responses">No communication yet</div>';
            return;
        }

        container.innerHTML = responses.map(response => `
            <div class="response-item ${response.isOwnerResponse ? 'owner-response' : 'tenant-response'}">
                <div class="response-header">
                    <span class="responder">${response.isOwnerResponse ? 'Owner' : 'Tenant'}</span>
                    <span class="response-time">${this.formatDateTime(response.respondedAt)}</span>
                </div>
                <div class="response-message">${response.message}</div>
                ${response.responseType !== 'COMMENT' ? `<div class="response-type">${response.responseType}</div>` : ''}
            </div>
        `).join('');
    }

    // ===================== MODAL FUNCTIONS =====================

    /**
     * View complaint details
     */
    async viewComplaint(complaintId) {
        const complaint = await this.getComplaintDetails(complaintId);
        if (!complaint) return;

        // Populate complaint details based on current page
        if (window.location.pathname.includes('tenant-dashboard')) {
            this.populateTenantComplaintModal(complaint);
        } else if (window.location.pathname.includes('flat-dashboard')) {
            this.populateFlatComplaintModal(complaint);
        } else {
            this.populateOwnerComplaintModal(complaint);
        }
    }

    /**
     * Populate owner complaint modal (property-config)
     */
    populateOwnerComplaintModal(complaint) {
        const modal = document.getElementById('complaintDetailModal');
        if (!modal) return;

        // Populate basic details
        document.getElementById('detailComplaintId').textContent = complaint.complaintId;
        document.getElementById('detailComplaintStatus').innerHTML = this.getStatusBadge(complaint.status);
        document.getElementById('detailComplaintPriority').innerHTML = this.getPriorityBadge(complaint.priority);
        document.getElementById('detailComplaintCategory').textContent = complaint.category;
        document.getElementById('detailComplaintSubmitted').textContent = this.formatDateTime(complaint.submittedAt);
        document.getElementById('detailComplaintSLA').textContent = this.formatDateTime(complaint.slaDeadline);
        document.getElementById('detailComplaintTitle').textContent = complaint.title;
        document.getElementById('detailComplaintDescription').textContent = complaint.description;

        // Handle attachment
        const attachmentSection = document.getElementById('complaintAttachment');
        if (complaint.attachmentUrl) {
            const img = document.getElementById('complaintAttachmentImage');
            img.src = this.getAttachmentUrl(complaint.complaintId, complaint.attachmentUrl);
            attachmentSection.style.display = 'block';
        } else {
            attachmentSection.style.display = 'none';
        }

        // Render responses
        this.renderComplaintResponses(complaint.responses, 'responsesList');

        // Setup form with current complaint ID
        const statusForm = document.getElementById('statusUpdateForm');
        if (statusForm) {
            statusForm.dataset.complaintId = complaint.id;
        }

        const responseForm = document.getElementById('addResponseForm');
        if (responseForm) {
            responseForm.dataset.complaintId = complaint.id;
        }

        modal.style.display = 'block';
    }

    /**
     * Populate flat complaint modal
     */
    populateFlatComplaintModal(complaint) {
        const modal = document.getElementById('flatComplaintModal');
        if (!modal) return;

        // Populate basic details
        document.getElementById('flatDetailComplaintId').textContent = complaint.complaintId;
        document.getElementById('flatDetailComplaintStatus').innerHTML = this.getStatusBadge(complaint.status);
        document.getElementById('flatDetailComplaintPriority').innerHTML = this.getPriorityBadge(complaint.priority);
        document.getElementById('flatDetailComplaintCategory').textContent = complaint.category;
        document.getElementById('flatDetailComplaintSubmitted').textContent = this.formatDateTime(complaint.submittedAt);
        document.getElementById('flatDetailComplaintSLA').textContent = this.formatDateTime(complaint.slaDeadline);
        document.getElementById('flatDetailComplaintTitle').textContent = complaint.title;
        document.getElementById('flatDetailComplaintDescription').textContent = complaint.description;

        // Handle attachment
        const attachmentSection = document.getElementById('flatComplaintAttachment');
        if (complaint.attachmentUrl) {
            const img = document.getElementById('flatComplaintAttachmentImage');
            img.src = this.getAttachmentUrl(complaint.complaintId, complaint.attachmentUrl);
            attachmentSection.style.display = 'block';
        } else {
            attachmentSection.style.display = 'none';
        }

        // Render responses
        this.renderComplaintResponses(complaint.responses, 'flatResponsesList');

        modal.style.display = 'block';
    }

    /**
     * Populate tenant complaint modal
     */
    populateTenantComplaintModal(complaint) {
        const modal = document.getElementById('complaintDetailModal');
        if (!modal) return;

        // Populate basic details
        document.getElementById('tenantDetailComplaintId').textContent = complaint.complaintId;
        document.getElementById('tenantDetailComplaintStatus').innerHTML = this.getStatusBadge(complaint.status);
        document.getElementById('tenantDetailComplaintPriority').innerHTML = this.getPriorityBadge(complaint.priority);
        document.getElementById('tenantDetailComplaintCategory').textContent = complaint.category;
        document.getElementById('tenantDetailComplaintSubmitted').textContent = this.formatDateTime(complaint.submittedAt);
        document.getElementById('tenantDetailComplaintSLA').textContent = this.formatDateTime(complaint.slaDeadline);
        document.getElementById('tenantDetailComplaintTitle').textContent = complaint.title;
        document.getElementById('tenantDetailComplaintDescription').textContent = complaint.description;

        // Handle attachment
        const attachmentSection = document.getElementById('tenantComplaintAttachment');
        if (complaint.attachmentUrl) {
            const img = document.getElementById('tenantComplaintAttachmentImage');
            img.src = this.getAttachmentUrl(complaint.complaintId, complaint.attachmentUrl);
            attachmentSection.style.display = 'block';
        } else {
            attachmentSection.style.display = 'none';
        }

        // Render responses
        this.renderComplaintResponses(complaint.responses, 'tenantResponsesList');

        // Show/hide response form based on status
        const responseForm = document.getElementById('tenantResponseForm');
        const canRespond = ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(complaint.status);
        responseForm.style.display = canRespond ? 'block' : 'none';

        // Setup action buttons
        this.setupTenantActionButtons(complaint);

        modal.style.display = 'block';
    }

    /**
     * Setup tenant action buttons
     */
    setupTenantActionButtons(complaint) {
        const container = document.getElementById('complaintActionButtons');
        if (!container) return;

        let buttons = '';

        if (complaint.status === 'RESOLVED') {
            buttons += `
                <button class="btn-primary" onclick="complaintManager.verifyComplaint(${complaint.id})">
                    <i class="fas fa-check"></i> Verify Resolution
                </button>
                <button class="btn-secondary" onclick="complaintManager.showReopenForm(${complaint.id})">
                    <i class="fas fa-undo"></i> Reopen
                </button>
            `;
        }

        container.innerHTML = buttons;
    }

    // Add more modal population methods for owner dashboards...
    // (Similar structure for flat and property-config dashboards)
}

// Global instance
const complaintManager = new ComplaintManager();

// ===================== GLOBAL FUNCTIONS =====================

// Tenant Functions
function openRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    if (modal) modal.style.display = 'block';
}

function closeRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    if (modal) modal.style.display = 'none';
    
    // Reset form
    const form = document.getElementById('raiseComplaintForm');
    if (form) form.reset();
}

function closeComplaintDetailModal() {
    const modal = document.getElementById('complaintDetailModal');
    if (modal) modal.style.display = 'none';
}

async function submitComplaint(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        await complaintManager.createComplaint(formData);
        closeRaiseComplaintModal();
        
        // Reload complaints if we're on the complaints section
        if (typeof loadTenantComplaints === 'function') {
            loadTenantComplaints();
        }
    } catch (error) {
        console.error('Failed to submit complaint:', error);
    }
}

// Owner Functions
function closeComplaintDetailModal() {
    const modal = document.getElementById('complaintDetailModal');
    if (modal) modal.style.display = 'none';
}

function closeFlatComplaintModal() {
    const modal = document.getElementById('flatComplaintModal');
    if (modal) modal.style.display = 'none';
}

async function updateComplaintStatus(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const status = formData.get('status');
    const comment = formData.get('comment');
    
    if (!complaintManager.currentComplaint) return;
    
    try {
        await complaintManager.updateComplaintStatus(complaintManager.currentComplaint.id, status, comment);
        closeComplaintDetailModal();
        
        // Reload complaints
        if (typeof loadOwnerComplaints === 'function') {
            loadOwnerComplaints();
        }
    } catch (error) {
        console.error('Failed to update status:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
});