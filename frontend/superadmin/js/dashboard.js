/**
 * Flatery SuperAdmin Dashboard JavaScript
 * Handles dashboard data loading and interactions
 */

// Global state
let currentPage = {
    owners: 0,
    properties: 0
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupNavigation();
    setupSearchListeners();
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verify SUPERADMIN role
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (!user.roles || !user.roles.includes('SUPERADMIN')) {
                alert('Access denied. SuperAdmin privileges required.');
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
        } catch (e) {
            console.error('Failed to parse user data', e);
            window.location.href = 'login.html';
            return;
        }
    }

    // Load admin info
    loadAdminInfo();

    // Load dashboard stats
    await loadDashboardStats();
}

/**
 * Load admin info
 */
function loadAdminInfo() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = user.firstName || user.username || 'Admin';
            }
        } catch (e) {
            console.error('Failed to parse user data', e);
        }
    }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    const loading = document.getElementById('loading');
    const statsGrid = document.getElementById('statsGrid');
    const propertyBreakdown = document.getElementById('propertyBreakdown');

    try {
        loading.style.display = 'block';
        statsGrid.style.display = 'none';
        propertyBreakdown.style.display = 'none';

        const response = await apiService.makeRequest('/superadmin/dashboard/stats', {
            includeAuth: true
        });

        if (response) {
            updateDashboardUI(response);
            loading.style.display = 'none';
            statsGrid.style.display = 'grid';
            propertyBreakdown.style.display = 'grid';
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        loading.innerHTML = `
            <i class="fas fa-exclamation-circle fa-3x" style="color: #f44336;"></i>
            <p>Failed to load dashboard data</p>
            <button onclick="loadDashboardStats()" style="margin-top: 16px; padding: 8px 16px; background: var(--primary-color); border: none; border-radius: 6px; color: white; cursor: pointer;">
                Retry
            </button>
        `;
    }
}

/**
 * Update dashboard UI with stats
 */
function updateDashboardUI(stats) {
    // Property Stats
    document.getElementById('totalProperties').textContent = formatNumber(stats.totalProperties || 0);
    document.getElementById('liveProperties').textContent = formatNumber(stats.liveProperties || 0);
    document.getElementById('draftProperties').textContent = formatNumber(stats.draftProperties || 0);

    // Owner Stats
    document.getElementById('totalOwners').textContent = formatNumber(stats.totalOwners || 0);
    document.getElementById('activeOwners').textContent = formatNumber(stats.activeOwners || 0);

    // Tenant Stats
    document.getElementById('totalTenants').textContent = formatNumber(stats.totalTenants || 0);
    document.getElementById('activeTenants').textContent = formatNumber(stats.activeTenants || 0);

    // Views Stats
    document.getElementById('viewsToday').textContent = formatNumber(stats.totalViewsToday || 0);
    document.getElementById('views7Days').textContent = formatNumber(stats.totalViewsLast7Days || 0);
    document.getElementById('views30Days').textContent = formatNumber(stats.totalViewsLast30Days || 0);

    // Property Breakdown
    const flatCount = stats.flatCount || 0;
    const pgCount = stats.pgCount || 0;
    const totalProp = flatCount + pgCount || 1; // Avoid division by zero

    document.getElementById('flatCount').textContent = formatNumber(flatCount);
    document.getElementById('pgCount').textContent = formatNumber(pgCount);

    // Animate progress bars
    setTimeout(() => {
        const flatPercentage = (flatCount / totalProp) * 100;
        const pgPercentage = (pgCount / totalProp) * 100;
        
        document.getElementById('flatFill').style.width = flatPercentage + '%';
        document.getElementById('pgFill').style.width = pgPercentage + '%';
    }, 300);
}

/**
 * Setup navigation
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const sectionName = item.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            const activeSection = document.getElementById(sectionName + '-section');
            if (activeSection) {
                activeSection.classList.add('active');
            }
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard Overview',
                'owners': 'Owner Management',
                'properties': 'Property Management',
                'subscriptions': 'Subscription Management',
                'complaints': 'Complaints Management',
                'analytics': 'Analytics & Insights',
                'audit': 'Audit Logs'
            };
            
            document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
            
            // Load data for section
            if (sectionName === 'owners') {
                loadOwners();
            } else if (sectionName === 'properties') {
                loadProperties();
            } else if (sectionName === 'subscriptions') {
                loadPlans();
                loadSubscriptions();
            } else if (sectionName === 'complaints') {
                loadComplaintStats();
                loadComplaints();
            } else if (sectionName === 'analytics') {
                loadAnalytics();
            } else if (sectionName === 'audit') {
                loadAuditLogs();
            }
        });
    });
}

/**
 * Setup search listeners
 */
function setupSearchListeners() {
    const ownerSearch = document.getElementById('ownerSearch');
    const propertySearch = document.getElementById('propertySearch');
    
    if (ownerSearch) {
        let timeout;
        ownerSearch.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentPage.owners = 0;
                loadOwners(e.target.value);
            }, 500);
        });
    }
    
    if (propertySearch) {
        let timeout;
        propertySearch.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentPage.properties = 0;
                loadProperties();
            }, 500);
        });
    }
}

/**
 * Refresh dashboard data
 */
async function refreshData() {
    const btn = event.target.closest('.icon-btn');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;
    
    await loadDashboardStats();
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }, 500);
}

/**
 * Logout
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Load owners list
 */
async function loadOwners(search = '') {
    const tbody = document.getElementById('ownersTableBody');
    
    try {
        const params = new URLSearchParams({
            page: currentPage.owners,
            size: 20
        });
        
        if (search) params.append('search', search);
        
        const response = await apiService.makeRequest(`/superadmin/owners?${params}`, {
            includeAuth: true
        });
        
        if (!response || !response.owners) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No owners found</td></tr>';
            return;
        }
        
        // Update stats
        document.getElementById('totalOwnersCount').textContent = formatNumber(response.totalElements);
        
        // Render table
        tbody.innerHTML = response.owners.map(owner => `
            <tr>
                <td>#${owner.id}</td>
                <td>${owner.firstName} ${owner.lastName}</td>
                <td>${owner.email}</td>
                <td>${owner.phoneNumber || 'N/A'}</td>
                <td><strong>${owner.totalProperties || 0}</strong></td>
                <td><strong>${owner.totalTenants || 0}</strong></td>
                <td>${new Date(owner.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn" onclick="viewOwnerDetails(${owner.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Render pagination
        renderPagination('owners', response.totalPages, response.currentPage);
        
    } catch (error) {
        console.error('Failed to load owners:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #f44336;">
            <i class="fas fa-exclamation-circle"></i> Failed to load owners
        </td></tr>`;
    }
}

/**
 * Load properties list
 */
async function loadProperties() {
    const tbody = document.getElementById('propertiesTableBody');
    
    try {
        const params = new URLSearchParams({
            page: currentPage.properties,
            size: 20
        });
        
        const search = document.getElementById('propertySearch')?.value;
        const status = document.getElementById('propertyStatusFilter')?.value;
        const type = document.getElementById('propertyTypeFilter')?.value;
        const verified = document.getElementById('verifiedFilter')?.value;
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        if (verified) params.append('verified', verified);
        
        const response = await apiService.makeRequest(`/superadmin/properties?${params}`, {
            includeAuth: true
        });
        
        if (!response || !response.properties) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No properties found</td></tr>';
            return;
        }
        
        // Render table
        tbody.innerHTML = response.properties.map(property => `
            <tr>
                <td>#${property.id}</td>
                <td>${property.title}</td>
                <td>${property.type}</td>
                <td>${property.ownerName}</td>
                <td>${property.city}, ${property.state}</td>
                <td>₹${formatNumber(property.monthlyRent)}</td>
                <td><span class="status-badge ${property.status.toLowerCase()}">${property.status}</span></td>
                <td>${property.verified ? '<span class="status-badge verified">✓ Verified</span>' : '<span style="color: var(--text-secondary);">Unverified</span>'}</td>
                <td>${formatNumber(property.totalViews || 0)}</td>
                <td>
                    <button class="action-btn" onclick="viewPropertyDetails(${property.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${!property.verified ? `<button class="action-btn success" onclick="verifyProperty(${property.id}, true)">
                        <i class="fas fa-check"></i> Verify
                    </button>` : ''}
                    ${property.status === 'ACTIVE' ? `<button class="action-btn danger" onclick="updatePropertyStatus(${property.id}, 'INACTIVE')">
                        <i class="fas fa-ban"></i> Block
                    </button>` : ''}
                </td>
            </tr>
        `).join('');
        
        // Render pagination
        renderPagination('properties', response.totalPages, response.currentPage);
        
    } catch (error) {
        console.error('Failed to load properties:', error);
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: #f44336;">
            <i class="fas fa-exclamation-circle"></i> Failed to load properties
        </td></tr>`;
    }
}

/**
 * Render pagination
 */
function renderPagination(type, totalPages, currentPageNum) {
    const container = document.getElementById(type + 'Pagination');
    if (!container) return;
    
    let html = '';
    
    // Previous button
    html += `<button ${currentPageNum === 0 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPageNum - 1})">
        <i class="fas fa-chevron-left"></i> Previous
    </button>`;
    
    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        if (i < 3 || i >= totalPages - 3 || Math.abs(i - currentPageNum) <= 1) {
            html += `<button class="${i === currentPageNum ? 'active' : ''}" onclick="changePage('${type}', ${i})">
                ${i + 1}
            </button>`;
        } else if (i === 3 || i === totalPages - 4) {
            html += '<span style="color: var(--text-secondary);">...</span>';
        }
    }
    
    // Next button
    html += `<button ${currentPageNum >= totalPages - 1 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPageNum + 1})">
        Next <i class="fas fa-chevron-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

/**
 * Change page
 */
function changePage(type, page) {
    currentPage[type] = page;
    if (type === 'owners') {
        loadOwners();
    } else if (type === 'properties') {
        loadProperties();
    }
}

/**
 * Refresh owners
 */
function refreshOwners() {
    currentPage.owners = 0;
    loadOwners();
}

/**
 * Filter properties
 */
function filterProperties() {
    currentPage.properties = 0;
    loadProperties();
}

/**
 * View owner details
 */
function viewOwnerDetails(ownerId) {
    alert('Owner details view - Coming in Phase 2.1\nOwner ID: ' + ownerId);
}

/**
 * View property details
 */
function viewPropertyDetails(propertyId) {
    window.open(`/property-details.html?id=${propertyId}`, '_blank');
}

/**
 * Update property status
 */
async function updatePropertyStatus(propertyId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus === 'INACTIVE' ? 'block' : 'activate'} this property?`)) {
        return;
    }
    
    try {
        await apiService.makeRequest(`/superadmin/properties/${propertyId}/status?status=${newStatus}`, {
            method: 'PUT',
            includeAuth: true
        });
        
        alert('Property status updated successfully!');
        loadProperties();
    } catch (error) {
        console.error('Failed to update property status:', error);
        alert('Failed to update property status: ' + error.message);
    }
}

/**
 * Verify property
 */
async function verifyProperty(propertyId, verified) {
    try {
        await apiService.makeRequest(`/superadmin/properties/${propertyId}/verify?verified=${verified}`, {
            method: 'PUT',
            includeAuth: true
        });
        
        alert('Property verified successfully!');
        loadProperties();
    } catch (error) {
        console.error('Failed to verify property:', error);
        alert('Failed to verify property: ' + error.message);
    }
}

// ============================================
// SUBSCRIPTIONS MANAGEMENT
// ============================================

/**
 * Load subscription plans
 */
async function loadPlans() {
    try {
        const response = await apiService.makeRequest('/superadmin/subscriptions/plans', {
            method: 'GET',
            includeAuth: true
        });
        
        displayPlans(response);
    } catch (error) {
        console.error('Failed to load plans:', error);
        document.getElementById('plansGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load plans</p>
            </div>
        `;
    }
}

/**
 * Display subscription plans
 */
function displayPlans(plans) {
    const grid = document.getElementById('plansGrid');
    
    if (!plans || plans.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-crown fa-3x"></i>
                <p>No subscription plans found</p>
                <button class="primary-btn" onclick="openPlanModal()" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Create First Plan
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = plans.map(plan => `
        <div class="plan-card ${!plan.isActive ? 'inactive' : ''}">
            <div class="plan-header">
                <h3>${plan.planName}</h3>
                <div class="plan-price">
                    <span class="price">₹${plan.priceMonthly}</span>
                    <span class="period">/month</span>
                </div>
            </div>
            <p class="plan-description">${plan.description || 'No description'}</p>
            <ul class="plan-features">
                <li><i class="fas fa-check"></i> ${plan.maxProperties} Properties</li>
                <li><i class="fas fa-check"></i> ${plan.maxTenants} Tenants</li>
                <li><i class="fas fa-check"></i> ${plan.maxImages} Images</li>
                ${plan.allowPremiumSupport ? '<li><i class="fas fa-check"></i> Premium Support</li>' : ''}
                ${plan.allowAnalytics ? '<li><i class="fas fa-check"></i> Analytics</li>' : ''}
                ${plan.allowCustomBranding ? '<li><i class="fas fa-check"></i> Custom Branding</li>' : ''}
            </ul>
            <div class="plan-footer">
                <span class="subscribers">${plan.totalSubscribers || 0} subscribers</span>
                <span class="status-badge ${plan.isActive ? 'active' : 'inactive'}">
                    ${plan.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="plan-actions" style="margin-top: 16px; display: flex; gap: 8px;">
                <button class="action-btn primary" onclick="editPlan(${plan.id})" title="Edit Plan">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deletePlan(${plan.id})" title="Delete Plan">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

let currentEditingPlanId = null;

/**
 * Open plan modal
 */
function openPlanModal(plan = null) {
    const modal = document.getElementById('planModal');
    const form = document.getElementById('planForm');
    form.reset();
    
    if (plan) {
        currentEditingPlanId = plan.id;
        document.getElementById('planModalTitle').textContent = 'Edit Subscription Plan';
        document.getElementById('planName').value = plan.planName;
        document.getElementById('planDescription').value = plan.description || '';
        document.getElementById('planPriceMonthly').value = plan.priceMonthly;
        document.getElementById('planPriceYearly').value = plan.priceYearly;
        document.getElementById('planMaxProperties').value = plan.maxProperties;
        document.getElementById('planMaxTenants').value = plan.maxTenants;
        document.getElementById('planMaxImages').value = plan.maxImages;
        document.getElementById('planAllowPremiumSupport').checked = plan.allowPremiumSupport;
        document.getElementById('planAllowAnalytics').checked = plan.allowAnalytics;
        document.getElementById('planAllowCustomBranding').checked = plan.allowCustomBranding;
        document.getElementById('planIsActive').value = plan.isActive.toString();
    } else {
        currentEditingPlanId = null;
        document.getElementById('planModalTitle').textContent = 'Add Subscription Plan';
    }
    
    modal.classList.add('active');
}

/**
 * Close plan modal
 */
function closePlanModal() {
    const modal = document.getElementById('planModal');
    modal.classList.remove('active');
    currentEditingPlanId = null;
}

/**
 * Save plan
 */
async function savePlan(event) {
    event.preventDefault();
    
    const planData = {
        id: currentEditingPlanId,
        planName: document.getElementById('planName').value,
        description: document.getElementById('planDescription').value,
        priceMonthly: parseFloat(document.getElementById('planPriceMonthly').value),
        priceYearly: parseFloat(document.getElementById('planPriceYearly').value),
        maxProperties: parseInt(document.getElementById('planMaxProperties').value),
        maxTenants: parseInt(document.getElementById('planMaxTenants').value),
        maxImages: parseInt(document.getElementById('planMaxImages').value),
        allowPremiumSupport: document.getElementById('planAllowPremiumSupport').checked,
        allowAnalytics: document.getElementById('planAllowAnalytics').checked,
        allowCustomBranding: document.getElementById('planAllowCustomBranding').checked,
        isActive: document.getElementById('planIsActive').value === 'true'
    };
    
    try {
        await apiService.makeRequest('/superadmin/subscriptions/plans', {
            method: 'POST',
            includeAuth: true,
            body: JSON.stringify(planData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        alert('Plan saved successfully!');
        closePlanModal();
        loadPlans();
    } catch (error) {
        console.error('Failed to save plan:', error);
        alert('Failed to save plan: ' + error.message);
    }
}

/**
 * Edit plan
 */
async function editPlan(planId) {
    try {
        const plans = await apiService.makeRequest('/superadmin/subscriptions/plans', {
            method: 'GET',
            includeAuth: true
        });
        
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            openPlanModal(plan);
        }
    } catch (error) {
        console.error('Failed to load plan:', error);
        alert('Failed to load plan');
    }
}

/**
 * Delete plan
 */
async function deletePlan(planId) {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    
    try {
        await apiService.makeRequest(`/superadmin/subscriptions/plans/${planId}`, {
            method: 'DELETE',
            includeAuth: true
        });
        
        alert('Plan deleted successfully!');
        loadPlans();
    } catch (error) {
        console.error('Failed to delete plan:', error);
        alert('Failed to delete plan: ' + error.message);
    }
}

/**
 * Load subscriptions
 */
async function loadSubscriptions(page = 0) {
    try {
        const status = document.getElementById('subscriptionStatusFilter')?.value || '';
        let url = `/superadmin/subscriptions/users?page=${page}&size=20`;
        
        if (status) {
            url = `/superadmin/subscriptions/users/status/${status}?page=${page}&size=20`;
        }
        
        const response = await apiService.makeRequest(url, {
            method: 'GET',
            includeAuth: true
        });
        
        displaySubscriptions(response.content);
        updatePagination('subscriptions', response);
    } catch (error) {
        console.error('Failed to load subscriptions:', error);
        document.getElementById('subscriptionsTableBody').innerHTML = `
            <tr><td colspan="9" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p>Failed to load subscriptions</p>
            </td></tr>
        `;
    }
}

/**
 * Display subscriptions
 */
function displaySubscriptions(subscriptions) {
    const tbody = document.getElementById('subscriptionsTableBody');
    
    if (!subscriptions || subscriptions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">No subscriptions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.username}</td>
            <td>${sub.userEmail}</td>
            <td><span class="badge primary">${sub.planName}</span></td>
            <td><span class="status-badge ${sub.status.toLowerCase()}">${sub.status}</span></td>
            <td>${formatDate(sub.startDate)}</td>
            <td>${formatDate(sub.endDate)}</td>
            <td>${sub.daysRemaining} days</td>
            <td>${sub.autoRenew ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>
                <button class="action-btn danger" onclick="cancelSubscription(${sub.id})" 
                        ${sub.status !== 'ACTIVE' ? 'disabled' : ''}>
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter subscriptions
 */
function filterSubscriptions() {
    loadSubscriptions(0);
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
        await apiService.makeRequest(`/superadmin/subscriptions/${subscriptionId}/cancel`, {
            method: 'PUT',
            includeAuth: true
        });
        
        alert('Subscription cancelled successfully!');
        loadSubscriptions();
    } catch (error) {
        console.error('Failed to cancel subscription:', error);
        alert('Failed to cancel subscription');
    }
}

// ============================================
// COMPLAINTS MANAGEMENT
// ============================================

/**
 * Load complaint statistics
 */
async function loadComplaintStats() {
    try {
        const stats = await apiService.makeRequest('/superadmin/complaints/statistics', {
            method: 'GET',
            includeAuth: true
        });
        
        document.getElementById('totalComplaints').textContent = stats.total || 0;
        document.getElementById('pendingComplaints').textContent = stats.pending || 0;
        document.getElementById('resolvedComplaints').textContent = stats.resolved || 0;
        document.getElementById('highPriorityComplaints').textContent = stats.highPriority || 0;
    } catch (error) {
        console.error('Failed to load complaint stats:', error);
    }
}

/**
 * Load complaints
 */
async function loadComplaints(page = 0) {
    try {
        const status = document.getElementById('complaintStatusFilter')?.value || '';
        const priority = document.getElementById('complaintPriorityFilter')?.value || '';
        const search = document.getElementById('complaintSearch')?.value || '';
        
        let url = `/superadmin/complaints?page=${page}&size=20`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await apiService.makeRequest(url, {
            method: 'GET',
            includeAuth: true
        });
        
        displayComplaints(response.content);
        updatePagination('complaints', response);
    } catch (error) {
        console.error('Failed to load complaints:', error);
        document.getElementById('complaintsTableBody').innerHTML = `
            <tr><td colspan="8" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p>Failed to load complaints</p>
            </td></tr>
        `;
    }
}

/**
 * Display complaints
 */
function displayComplaints(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No complaints found</td></tr>';
        return;
    }
    
    tbody.innerHTML = complaints.map(complaint => `
        <tr>
            <td>#${complaint.complaintId || complaint.id}</td>
            <td>${complaint.subject}</td>
            <td>${complaint.username}<br/><small>${complaint.userEmail}</small></td>
            <td><span class="badge">${complaint.category}</span></td>
            <td><span class="priority-badge ${complaint.priority.toLowerCase()}">${complaint.priority}</span></td>
            <td><span class="status-badge ${complaint.status.toLowerCase()}">${complaint.status}</span></td>
            <td>${formatDate(complaint.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <select class="action-select" onchange="updateComplaintStatus(${complaint.id}, this.value); this.selectedIndex = 0;">
                        <option value="">Change Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <select class="action-select" onchange="updateComplaintPriority(${complaint.id}, this.value); this.selectedIndex = 0;">
                        <option value="">Change Priority</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter complaints
 */
function filterComplaints() {
    loadComplaints(0);
}

/**
 * Update complaint status
 */
async function updateComplaintStatus(complaintId, status) {
    if (!status) return;
    
    try {
        await apiService.makeRequest(`/superadmin/complaints/${complaintId}/status?status=${status}`, {
            method: 'PUT',
            includeAuth: true
        });
        
        alert('Complaint status updated successfully!');
        loadComplaints();
        loadComplaintStats();
    } catch (error) {
        console.error('Failed to update complaint status:', error);
        alert('Failed to update complaint status');
    }
}

/**
 * Update complaint priority
 */
async function updateComplaintPriority(complaintId, priority) {
    if (!priority) return;
    
    try {
        await apiService.makeRequest(`/superadmin/complaints/${complaintId}/priority?priority=${priority}`, {
            method: 'PUT',
            includeAuth: true
        });
        
        alert('Complaint priority updated successfully!');
        loadComplaints();
    } catch (error) {
        console.error('Failed to update complaint priority:', error);
        alert('Failed to update complaint priority');
    }
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Load analytics
 */
async function loadAnalytics() {
    try {
        const days = document.getElementById('analyticsTimeRange')?.value || 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const url = `/superadmin/analytics/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        const analytics = await apiService.makeRequest(url, {
            method: 'GET',
            includeAuth: true
        });
        
        displayAnalyticsOverview(analytics);
        loadCityAnalytics();
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

/**
 * Display analytics overview
 */
function displayAnalyticsOverview(analytics) {
    document.getElementById('userGrowth').textContent = analytics.totalNewUsers || 0;
    document.getElementById('userGrowthRate').textContent = `${(analytics.userGrowthRate || 0).toFixed(1)}%`;
    document.getElementById('propertyGrowth').textContent = analytics.totalNewProperties || 0;
    document.getElementById('propertyGrowthRate').textContent = `${(analytics.propertyGrowthRate || 0).toFixed(1)}%`;
    document.getElementById('totalViews').textContent = analytics.totalPropertyViews || 0;
    document.getElementById('avgViews').textContent = `${(analytics.averageViewsPerProperty || 0).toFixed(1)} avg/property`;
    document.getElementById('avgPropertyValue').textContent = `₹${(analytics.averagePropertyValue || 0).toFixed(0)}`;
}

/**
 * Load city analytics
 */
async function loadCityAnalytics() {
    try {
        const cityData = await apiService.makeRequest('/superadmin/analytics/cities', {
            method: 'GET',
            includeAuth: true
        });
        
        displayCityAnalytics(cityData);
    } catch (error) {
        console.error('Failed to load city analytics:', error);
    }
}

/**
 * Display city analytics
 */
function displayCityAnalytics(cities) {
    const tbody = document.getElementById('cityAnalyticsTableBody');
    
    if (!cities || cities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = cities.map(city => `
        <tr>
            <td><strong>${city.cityName}</strong></td>
            <td>${city.totalProperties}</td>
            <td>${city.activeProperties}</td>
            <td>${city.totalOwners}</td>
            <td>${city.totalViews}</td>
            <td>₹${(city.averageRent || 0).toFixed(0)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${city.occupancyRate}%"></div>
                    <span>${city.occupancyRate.toFixed(1)}%</span>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// AUDIT LOGS
// ============================================

/**
 * Load audit logs
 */
async function loadAuditLogs(page = 0) {
    try {
        const username = document.getElementById('auditUsernameFilter')?.value || '';
        const action = document.getElementById('auditActionFilter')?.value || '';
        const startDate = document.getElementById('auditStartDate')?.value || '';
        const endDate = document.getElementById('auditEndDate')?.value || '';
        
        let url = `/superadmin/audit-logs?page=${page}&size=50`;
        if (username) url += `&username=${encodeURIComponent(username)}`;
        if (action) url += `&action=${encodeURIComponent(action)}`;
        if (startDate) url += `&startDate=${startDate}T00:00:00`;
        if (endDate) url += `&endDate=${endDate}T23:59:59`;
        
        const response = await apiService.makeRequest(url, {
            method: 'GET',
            includeAuth: true
        });
        
        displayAuditLogs(response.content);
        updatePagination('auditLogs', response);
    } catch (error) {
        console.error('Failed to load audit logs:', error);
        document.getElementById('auditLogsTableBody').innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p>Failed to load audit logs</p>
            </td></tr>
        `;
    }
}

/**
 * Display audit logs
 */
function displayAuditLogs(logs) {
    const tbody = document.getElementById('auditLogsTableBody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No audit logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDateTime(log.createdAt || log.timestamp)}</td>
            <td>${log.adminName}</td>
            <td><span class="badge primary">${log.actionType}</span></td>
            <td>${log.entityType}</td>
            <td>${log.entityId || '-'}</td>
            <td>${log.description}</td>
            <td><small>${log.ipAddress || 'N/A'}</small></td>
        </tr>
    `).join('');
}

/**
 * Filter audit logs
 */
function filterAuditLogs() {
    loadAuditLogs(0);
}

/**
 * Update pagination controls
 */
function updatePagination(section, pageData) {
    // For now, just log pagination info
    // You can implement full pagination UI later if needed
    console.log(`${section} pagination:`, {
        page: pageData.number || 0,
        size: pageData.size || pageData.content?.length || 0,
        total: pageData.totalElements || pageData.content?.length || 0
    });
}

/**
 * Format date time
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
