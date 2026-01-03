/**
 * ========================================================
 * 🏠 OWNER DASHBOARD - JavaScript
 * ========================================================
 * 
 * Modern dashboard with visual property management
 * Dependencies: api.js, Chart.js
 */

class OwnerDashboard {
    constructor() {
        this.ownerData = null;
        this.propertiesData = [];
        this.tenantsData = [];
        this.paymentsData = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadAllData();
        
    }

    checkAuth() {
        if (typeof apiService === 'undefined') {
            console.error('[OwnerDashboard] API Service not loaded');
            alert('API Service not loaded. Please refresh the page.');
            return false;
        }

        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        
        if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return false;
        }

        return true;
    }

    setupEventListeners() {
        // Metric cards navigation
        document.querySelectorAll('.metric-card.clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                const nav = card.dataset.nav;
                if (nav) {
                    this.navigateTo(nav);
                }
            });
        });

        // Quick action buttons
        const quickActions = {
            sendBulkReminder: () => this.sendBulkReminder(),
            generateMonthlyReport: () => this.generateMonthlyReport()
        };

        // Make quick actions globally available
        window.sendBulkReminder = quickActions.sendBulkReminder;
        window.generateMonthlyReport = quickActions.generateMonthlyReport;
        window.navigateToFlatCRM = () => window.location.href = 'flat-dashboard.html';
        window.navigateToPGCRM = () => window.location.href = 'pg-list.html';
    }

    navigateTo(section) {
        // Navigation logic - can be expanded based on your app structure
        // For now, just log. You can implement actual navigation later
    }

    async loadAllData() {
        try {
            // Show loading state
            this.showLoading();

            // Load data in parallel
            await Promise.all([
                this.loadOwnerProfile(),
                this.loadProperties(),
                this.loadTenants(),
                this.loadPayments()
            ]);

            // Update UI
            this.updateMetrics();
            this.renderPropertyGalaxy();
            this.updateControlDeck();
            this.renderInsights();
            this.renderNotificationRibbon();
            this.renderPropertyPhotoStrip();

        } catch (error) {
            console.error('[OwnerDashboard] Error loading data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadOwnerProfile() {
        try {
            const response = await apiService.makeRequest('/users/profile');
            this.ownerData = response;
        } catch (error) {
            // Silently handle missing profile endpoint (404) - use localStorage fallback
            if (error.status !== 404) {
                console.error('[OwnerDashboard] Error loading profile:', error);
            }
            // Set basic data from localStorage as fallback
            this.ownerData = {
                firstName: localStorage.getItem('firstName') || 'Owner',
                email: localStorage.getItem('username') || 'owner@flatery.com'
            };
        }
    }

    async loadProperties() {
        try {
            // Try to get all properties using the admin properties endpoint
            const response = await apiService.getMyProperties(true, 0, 1000);
            
            // Handle both array and paginated response formats
            if (Array.isArray(response)) {
                this.propertiesData = response;
            } else if (response && response.content && Array.isArray(response.content)) {
                this.propertiesData = response.content;
            } else if (response && response.properties && Array.isArray(response.properties)) {
                this.propertiesData = response.properties;
            } else {
                this.propertiesData = [];
            }
            
        } catch (error) {
            console.error('[OwnerDashboard] Error loading properties:', error);
            this.propertiesData = [];
        }
    }

    async loadTenants() {
        try {
            const response = await apiService.getTenants();
            
            // Handle both array and object response formats
            if (Array.isArray(response)) {
                this.tenantsData = response;
            } else if (response && response.tenants && Array.isArray(response.tenants)) {
                this.tenantsData = response.tenants;
            } else if (response && response.content && Array.isArray(response.content)) {
                this.tenantsData = response.content;
            } else {
                this.tenantsData = [];
            }
            
        } catch (error) {
            console.error('[OwnerDashboard] Error loading tenants:', error);
            this.tenantsData = [];
        }
    }

    async loadPayments() {
        try {
            const response = await apiService.makeRequest('/transactions/owner');
            
            // Handle both array and object response formats
            if (Array.isArray(response)) {
                this.paymentsData = response;
            } else if (response && response.transactions && Array.isArray(response.transactions)) {
                this.paymentsData = response.transactions;
            } else if (response && response.content && Array.isArray(response.content)) {
                this.paymentsData = response.content;
            } else {
                this.paymentsData = [];
            }
            
        } catch (error) {
            // Silently handle missing transactions endpoint (404)
            if (error.status !== 404) {
                console.error('[OwnerDashboard] Error loading payments:', error);
            }
            this.paymentsData = [];
        }
    }

    updateMetrics() {
        // Total Properties
        const totalProperties = this.propertiesData.length;
        document.getElementById('totalPropertiesMetric').textContent = totalProperties;

        // Active Tenants - consider both ACTIVE status and no status (default to active)
        const activeTenants = this.tenantsData.filter(t => 
            !t.status || 
            t.status === 'ACTIVE' || 
            t.status === 'active' ||
            t.isActive === true
        ).length;
        document.getElementById('activeTenantsMetric').textContent = activeTenants;

        // Pending Requests - count pending payments
        const pendingRequests = this.paymentsData.filter(p => 
            p.status === 'PENDING' || 
            p.status === 'pending' ||
            p.status === 'SUBMITTED'
        ).length;
        document.getElementById('pendingRequestsMetric').textContent = pendingRequests;

        // Pending Payments Amount
        const pendingAmount = this.paymentsData
            .filter(p => p.status === 'PENDING' || p.status === 'pending' || p.status === 'SUBMITTED')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        document.getElementById('pendingPaymentsMetric').textContent = `₹${this.formatNumber(pendingAmount)}`;

        // Occupancy Rate
        const totalUnits = this.propertiesData.reduce((sum, p) => sum + (p.totalUnits || p.totalBeds || 1), 0);
        const occupiedUnits = activeTenants;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
        document.getElementById('occupancyRateMetric').textContent = `${occupancyRate}%`;
    }

    renderPropertyGalaxy() {
        const container = document.getElementById('propertyGalaxy');
        
        
        if (this.propertiesData.length === 0) {
            container.innerHTML = `
                <div class="galaxy-loading">
                    <i class="fas fa-home"></i>
                    <p>No properties found. <a href="add-property.html">Add your first property</a></p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.propertiesData.map(property => {
            // Temporary debug logging
            if (property.type === 'PG') {
                console.log('PG Property Object:', JSON.stringify(property, null, 2));
            }
            
            // Handle image URLs - check for full URL or relative path
            let imageUrl = property.primaryImageUrl || property.imageUrl;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = `../${imageUrl}`;
            }
            if (!imageUrl) {
                imageUrl = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500';
            }
            
            // Build property title
            const isPG = property.type === 'PG' || property.type === 'Hostel' || property.propertyType === 'PG' || property.propertyType === 'Hostel';
            const bhkType = property.bhkType || property.bhk;
            
            let title = '';
            if (isPG) {
                // For PG: show PG name (property.name field)
                const pgName = property.name && property.name.trim() ? property.name.trim() : null;
                title = pgName || property.propertyName || `PG Property ${property.id}`;
            } else if (property.type === 'FLAT') {
                // For FLAT: Always show format "Flat [number] - [BHK] BHK, [location]"
                const flatNum = property.flatNumber || property.id;
                const bhkPart = bhkType ? `${bhkType} BHK` : 'Flat';
                const locationPart = property.location ? `, ${property.location}` : '';
                
                if (property.flatNumber) {
                    title = `Flat ${property.flatNumber} - ${bhkPart}${locationPart}`;
                } else {
                    title = bhkType ? `${bhkPart}${locationPart}` : `Flat ${property.id}`;
                }
            } else if (property.type === 'APARTMENT') {
                // For APARTMENT: show building name with BHK if available
                title = property.name || property.propertyName || `Apartment ${property.id}`;
                if (bhkType) {
                    title += ` - ${bhkType} BHK`;
                }
            } else {
                // Fallback
                title = property.name || property.propertyName || `Property ${property.id}`;
            }
            
            const tenants = this.tenantsData.filter(t => 
                t.flatId === property.id || t.propertyId === property.id || t.propertyId === property.propertyId
            );
            const monthlyRent = property.expectedRent || property.rent || property.monthlyRent || 0;
            const propertyType = property.type || (bhkType ? 'Flat' : 'Property');
            
            // Check status field with extensive logging
            const rawStatus = property.status;
            const propertyStatus = rawStatus ? rawStatus.toString().toUpperCase() : 'ACTIVE';
            const isActive = propertyStatus === 'ACTIVE';
            
            
            // Determine CRM link based on property type
            const crmLink = isPG ? `property-config.html?id=${property.id}` : `flat-dashboard.html?id=${property.id}`;

            return `
                <div class="property-universe-card ${!isActive ? 'inactive-property' : ''}" onclick="${!isActive ? 'event.preventDefault(); return false;' : `window.location.href='${crmLink}'`}" style="position: relative; ${!isActive ? 'pointer-events: none;' : ''}">
                    ${!isActive ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 3; pointer-events: none; border-radius: 15px;"><div style="background: #DC2626; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px;"><i class="fas fa-eye-slash"></i> DEACTIVATED</div></div>` : ''}
                    <img src="${imageUrl}" alt="${this.escapeHtml(title)}" class="property-bg-image" 
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'" style="${!isActive ? 'filter: grayscale(60%) brightness(0.7);' : ''}">
                    <div class="property-universe-content">
                        <h3 class="property-universe-title">${this.escapeHtml(title)}</h3>
                        <div class="property-chips">
                            <span class="property-chip">
                                <i class="fas fa-building"></i>
                                ${propertyType}
                            </span>
                            ${bhkType ? `
                                <span class="property-chip">
                                    <i class="fas fa-bed"></i>
                                    ${bhkType} BHK
                                </span>
                            ` : ''}
                            <span class="property-chip">
                                <i class="fas fa-users"></i>
                                ${tenants.length} Tenant${tenants.length !== 1 ? 's' : ''}
                            </span>
                            <span class="property-chip">
                                <i class="fas fa-rupee-sign"></i>
                                ₹${this.formatNumber(monthlyRent)}/mo
                            </span>
                        </div>
                        <div class="property-action-buttons" style="position: relative; z-index: 10; pointer-events: auto;">
                            <button class="manage-crm-btn" onclick="event.stopPropagation(); ${!isActive ? 'return false;' : `window.location.href='${crmLink}'`}" style="${!isActive ? 'pointer-events: none; opacity: 0.5; cursor: not-allowed;' : ''}">
                                Manage CRM <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="edit-property-btn" 
                                    onclick="event.stopPropagation(); window.location.href='edit-property.html?id=${property.id}'"
                                    title="Edit property details">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="toggle-status-btn ${isActive ? 'deactivate' : 'activate'}" 
                                    onclick="event.stopPropagation(); if(window.ownerDashboard) { window.ownerDashboard.togglePropertyStatus(${property.id}, '${propertyStatus}'); } else { alert('Dashboard not ready'); }"
                                    title="${isActive ? 'Deactivate this listing' : 'Activate this listing'}"
                                    style="position: relative; z-index: 20; pointer-events: auto !important; opacity: 1 !important; filter: none !important;">
                                <i class="fas ${isActive ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                                ${isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateControlDeck() {
        // Separate flats and PGs
        const flats = this.propertiesData.filter(p => p.type !== 'PG' && p.type !== 'Hostel');
        const pgs = this.propertiesData.filter(p => p.type === 'PG' || p.type === 'Hostel');

        // Flats stats
        const flatTenants = this.tenantsData.filter(t => {
            const property = this.propertiesData.find(p => p.id === t.flatId || p.id === t.propertyId);
            return property && property.type !== 'PG' && property.type !== 'Hostel';
        });
        const totalFlatsUnits = flats.reduce((sum, p) => sum + (p.totalUnits || 1), 0);
        const vacantFlats = totalFlatsUnits - flatTenants.length;

        document.getElementById('totalFlatsCount').textContent = flats.length;
        document.getElementById('activeFlatTenantsCount').textContent = flatTenants.length;
        document.getElementById('vacantFlatsCount').textContent = Math.max(0, vacantFlats);

        // PGs stats
        const pgTenants = this.tenantsData.filter(t => {
            const property = this.propertiesData.find(p => p.id === t.flatId || p.id === t.propertyId);
            return property && (property.type === 'PG' || property.type === 'Hostel');
        });
        const totalBeds = pgs.reduce((sum, p) => sum + (p.totalBeds || p.totalUnits || 0), 0);
        const pgPendingDues = this.paymentsData.filter(p => {
            const tenant = this.tenantsData.find(t => t.id === p.tenantId);
            if (!tenant) return false;
            const property = this.propertiesData.find(pr => pr.id === tenant.flatId || pr.id === tenant.propertyId);
            return property && (property.type === 'PG' || property.type === 'Hostel') && p.status === 'PENDING';
        }).length;

        document.getElementById('totalBedsCount').textContent = totalBeds;
        document.getElementById('occupiedBedsCount').textContent = pgTenants.length;
        document.getElementById('pgPendingDuesCount').textContent = pgPendingDues;
    }

    renderInsights() {
        // Payment insights
        const totalExpected = this.tenantsData.reduce((sum, t) => sum + (t.rent || 0), 0);
        const approvedPayments = this.paymentsData.filter(p => p.status === 'APPROVED');
        const received = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pending = totalExpected - received;
        const percentage = totalExpected > 0 ? Math.round((received / totalExpected) * 100) : 0;

        document.getElementById('paymentPercentage').textContent = `${percentage}%`;
        document.getElementById('receivedAmount').textContent = `₹${this.formatNumber(received)}`;
        document.getElementById('pendingAmountTotal').textContent = `₹${this.formatNumber(Math.max(0, pending))}`;
        document.getElementById('totalExpected').textContent = `₹${this.formatNumber(totalExpected)}`;

        // Mini stats
        const today = new Date().toDateString();
        const todayPayments = approvedPayments.filter(p => new Date(p.createdAt).toDateString() === today).length;
        document.getElementById('todayPayments').textContent = todayPayments;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekPayments = approvedPayments.filter(p => new Date(p.createdAt) >= weekAgo).length;
        document.getElementById('weekPayments').textContent = weekPayments;

        const overduePayments = this.paymentsData.filter(p => {
            if (p.status !== 'PENDING') return false;
            const dueDate = new Date(p.dueDate || p.createdAt);
            return dueDate < new Date();
        }).length;
        document.getElementById('overduePayments').textContent = overduePayments;

        // Render payment chart
        this.renderPaymentChart(percentage);

        // Activity stats
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const newTenants = this.tenantsData.filter(t => new Date(t.createdAt) >= monthAgo).length;
        document.getElementById('newTenantsCount').textContent = newTenants;

        const twoMonthsLater = new Date();
        twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
        const expiringLeases = this.tenantsData.filter(t => {
            const leaseEnd = new Date(t.leaseEndDate);
            return leaseEnd <= twoMonthsLater && leaseEnd >= new Date();
        }).length;
        document.getElementById('expiringLeasesCount').textContent = expiringLeases;

        // Placeholder for complaints (would need complaints API)
        document.getElementById('recentComplaintsCount').textContent = 0;
        document.getElementById('duesCount').textContent = this.paymentsData.filter(p => p.status === 'PENDING').length;

        // Render activity chart
        this.renderActivityChart();
    }

    renderPaymentChart(percentage) {
        const canvas = document.getElementById('paymentProgressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear existing chart
        if (this.charts.payment) {
            this.charts.payment.destroy();
        }

        this.charts.payment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Collected', 'Pending'],
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: ['#1C64F2', '#E5E7EB'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    renderActivityChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear existing chart
        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        // Generate last 7 days data
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Count activities for this day (payments + new tenants)
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));
            const dayPayments = this.paymentsData.filter(p => {
                const pDate = new Date(p.createdAt);
                return pDate >= dayStart && pDate <= dayEnd;
            }).length;
            const dayTenants = this.tenantsData.filter(t => {
                const tDate = new Date(t.createdAt);
                return tDate >= dayStart && tDate <= dayEnd;
            }).length;
            
            data.push(dayPayments + dayTenants * 2); // Weight new tenants more
        }

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity',
                    data: data,
                    borderColor: '#FECF52',
                    backgroundColor: 'rgba(254, 207, 82, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#FECF52'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    renderNotificationRibbon() {
        const container = document.getElementById('notificationRibbon');
        
        // Create notifications from pending payments and recent activities
        const notifications = [];

        // Pending payments
        const pendingPayments = this.paymentsData.filter(p => p.status === 'PENDING');
        if (pendingPayments.length > 0) {
            notifications.push({
                type: 'warning',
                icon: 'fas fa-credit-card',
                text: `${pendingPayments.length} rent payment${pendingPayments.length !== 1 ? 's' : ''} pending approval`
            });
        }

        // Recent tenants
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentTenants = this.tenantsData.filter(t => new Date(t.createdAt) >= weekAgo);
        if (recentTenants.length > 0) {
            notifications.push({
                type: 'success',
                icon: 'fas fa-user-plus',
                text: `${recentTenants.length} new tenant${recentTenants.length !== 1 ? 's' : ''} added this week`
            });
        }

        // Overdue payments
        const overdue = this.paymentsData.filter(p => {
            if (p.status !== 'PENDING') return false;
            const dueDate = new Date(p.dueDate || p.createdAt);
            dueDate.setDate(dueDate.getDate() + 5); // 5 days grace period
            return dueDate < new Date();
        });
        if (overdue.length > 0) {
            notifications.push({
                type: 'error',
                icon: 'fas fa-exclamation-triangle',
                text: `${overdue.length} payment${overdue.length !== 1 ? 's' : ''} overdue`
            });
        }

        // Expiring leases
        const twoMonths = new Date();
        twoMonths.setMonth(twoMonths.getMonth() + 2);
        const expiring = this.tenantsData.filter(t => {
            const leaseEnd = new Date(t.leaseEndDate);
            return leaseEnd <= twoMonths && leaseEnd >= new Date();
        });
        if (expiring.length > 0) {
            notifications.push({
                type: 'warning',
                icon: 'fas fa-calendar-times',
                text: `${expiring.length} lease${expiring.length !== 1 ? 's' : ''} expiring soon`
            });
        }

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="ribbon-notification success">
                    <i class="fas fa-check-circle"></i>
                    <div class="ribbon-notification-content">
                        <div class="ribbon-notification-text">All caught up! No pending actions.</div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="ribbon-notification ${notif.type}">
                <i class="${notif.icon}"></i>
                <div class="ribbon-notification-content">
                    <div class="ribbon-notification-text">${notif.text}</div>
                </div>
            </div>
        `).join('');
    }

    renderPropertyPhotoStrip() {
        const container = document.getElementById('propertyPhotoStrip');
        
        if (this.propertiesData.length === 0) {
            container.innerHTML = `
                <div class="strip-loading">
                    <i class="fas fa-images"></i>
                    <p>No properties to display</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.propertiesData.map(property => {
            // Handle image URLs
            let imageUrl = property.primaryImageUrl || property.imageUrl;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = `../${imageUrl}`;
            }
            if (!imageUrl) {
                imageUrl = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300';
            }
            
            const title = property.name || property.propertyName || 
                         (property.flatNumber ? `Flat ${property.flatNumber}` : `Property ${property.id}`);

            return `
                <div class="polaroid-card" onclick="window.location.href='flat-dashboard.html?id=${property.id}'">
                    <img src="${imageUrl}" alt="${this.escapeHtml(title)}" class="polaroid-image"
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300'">
                    <div class="polaroid-caption">${this.escapeHtml(title)}</div>
                </div>
            `;
        }).join('');
    }

    async sendBulkReminder() {
        try {
            const confirmed = confirm('Send payment reminder to all tenants with pending payments?');
            if (!confirmed) return;

            await apiService.makeRequest('/notifications/remind-all-tenants', {
                method: 'POST'
            });
            this.showSuccess('Reminders sent successfully!');
        } catch (error) {
            console.error('[OwnerDashboard] Error sending reminders:', error);
            this.showError('Failed to send reminders. This feature may not be available yet.');
        }
    }

    async generateMonthlyReport() {
        try {
            const report = await apiService.makeRequest('/reports/monthly');
            this.showSuccess('Report generated successfully!');
            // Handle report download/display
            
            // If report has a download URL, open it
            if (report && report.downloadUrl) {
                window.open(report.downloadUrl, '_blank');
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error generating report:', error);
            this.showError('Failed to generate report. This feature may not be available yet.');
        }
    }

    async togglePropertyStatus(propertyId, currentStatus) {
        try {
            
            // Show loading feedback
            const btn = event?.target?.closest('.toggle-status-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            const response = await apiService.put(`/admin/properties/${propertyId}/status`, {});
            
            
            const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            this.showSuccess(`Property ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`);
            
            // Reload properties to reflect the change
            await this.loadProperties();
            this.renderPropertyGalaxy();
            this.updateMetrics();
            
        } catch (error) {
            console.error('[OwnerDashboard] Error toggling property status:', error);
            console.error('[OwnerDashboard] Error details:', error.message || error);
            this.showError(`Failed to update property status: ${error.message || 'Please try again.'}`);
            
            // Re-render to restore button state
            this.renderPropertyGalaxy();
        }
    }

    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
    }

    showSuccess(message) {
        if (typeof showSuccess === 'function') {
            showSuccess(message);
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (typeof showError === 'function') {
            showError(message);
        } else {
            alert('Error: ' + message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API service to be ready
    const initDashboard = () => {
        if (typeof apiService !== 'undefined') {
            window.ownerDashboard = new OwnerDashboard();
        } else {
            setTimeout(initDashboard, 100);
        }
    };
    
    initDashboard();
});
