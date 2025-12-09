/**
 * ========================================================
 * 🏠 PREMIUM OWNER DASHBOARD - JavaScript
 * ========================================================
 * 
 * Modern dashboard with visual property management
 * Dependencies: api.js, Chart.js
 */

class PremiumOwnerDashboard {
    constructor() {
        this.ownerData = null;
        this.propertiesData = [];
        this.tenantsData = [];
        this.paymentsData = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        console.log('[PremiumOwnerDashboard] Initializing...');
        
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadAllData();
        
        console.log('[PremiumOwnerDashboard] Initialization complete');
    }

    checkAuth() {
        if (typeof apiService === 'undefined') {
            console.error('[PremiumOwnerDashboard] API Service not loaded');
            alert('API Service not loaded. Please refresh the page.');
            return false;
        }

        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        
        if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
            console.warn('[PremiumOwnerDashboard] Access denied');
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
        window.navigateToPGCRM = () => window.location.href = 'flat-dashboard.html?type=pg';
    }

    navigateTo(section) {
        // Navigation logic - can be expanded based on your app structure
        console.log(`Navigating to: ${section}`);
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
            console.error('[PremiumOwnerDashboard] Error loading data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadOwnerProfile() {
        try {
            const response = await apiService.get('/users/profile');
            this.ownerData = response;
            console.log('[PremiumOwnerDashboard] Owner profile loaded:', this.ownerData);
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error loading profile:', error);
        }
    }

    async loadProperties() {
        try {
            const response = await apiService.getFlatProperties();
            this.propertiesData = Array.isArray(response) ? response : [];
            console.log('[PremiumOwnerDashboard] Properties loaded:', this.propertiesData.length);
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error loading properties:', error);
            this.propertiesData = [];
        }
    }

    async loadTenants() {
        try {
            const response = await apiService.get('/tenants');
            this.tenantsData = Array.isArray(response) ? response : [];
            console.log('[PremiumOwnerDashboard] Tenants loaded:', this.tenantsData.length);
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error loading tenants:', error);
            this.tenantsData = [];
        }
    }

    async loadPayments() {
        try {
            const response = await apiService.get('/transactions/owner');
            this.paymentsData = Array.isArray(response) ? response : [];
            console.log('[PremiumOwnerDashboard] Payments loaded:', this.paymentsData.length);
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error loading payments:', error);
            this.paymentsData = [];
        }
    }

    updateMetrics() {
        // Total Properties
        const totalProperties = this.propertiesData.length;
        document.getElementById('totalPropertiesMetric').textContent = totalProperties;

        // Active Tenants
        const activeTenants = this.tenantsData.filter(t => t.status === 'ACTIVE' || !t.status).length;
        document.getElementById('activeTenantsMetric').textContent = activeTenants;

        // Pending Requests
        const pendingPayments = this.paymentsData.filter(p => p.status === 'PENDING').length;
        document.getElementById('pendingRequestsMetric').textContent = pendingPayments;

        // Pending Payments Amount
        const pendingAmount = this.paymentsData
            .filter(p => p.status === 'PENDING')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        document.getElementById('pendingPaymentsMetric').textContent = `₹${this.formatNumber(pendingAmount)}`;

        // Occupancy Rate
        const totalUnits = this.propertiesData.reduce((sum, p) => sum + (p.totalUnits || 1), 0);
        const occupiedUnits = this.tenantsData.length;
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
            const imageUrl = property.primaryImageUrl || property.imageUrl || '../img/properties/default.jpg';
            const title = property.name || `${property.propertyName || 'Property'} - ${property.flatNumber || property.unitNumber || ''}`;
            const bhkType = property.bhkType || property.bhk;
            const tenants = this.tenantsData.filter(t => t.flatId === property.id || t.propertyId === property.id);
            const monthlyRent = property.expectedRent || property.rent || 0;

            return `
                <div class="property-universe-card" onclick="window.location.href='flat-dashboard.html?id=${property.id}'">
                    <img src="${imageUrl}" alt="${title}" class="property-bg-image" 
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'">
                    <div class="property-universe-content">
                        <h3 class="property-universe-title">${title}</h3>
                        <div class="property-chips">
                            <span class="property-chip">
                                <i class="fas fa-building"></i>
                                ${property.type || 'Flat'}
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
                        <button class="manage-crm-btn" onclick="event.stopPropagation(); window.location.href='flat-dashboard.html?id=${property.id}'">
                            Manage CRM <i class="fas fa-arrow-right"></i>
                        </button>
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
            const imageUrl = property.primaryImageUrl || property.imageUrl || '../img/properties/default.jpg';
            const title = property.name || property.propertyName || `Property ${property.id}`;

            return `
                <div class="polaroid-card" onclick="window.location.href='flat-dashboard.html?id=${property.id}'">
                    <img src="${imageUrl}" alt="${title}" class="polaroid-image"
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300'">
                    <div class="polaroid-caption">${title}</div>
                </div>
            `;
        }).join('');
    }

    async sendBulkReminder() {
        try {
            const confirmed = confirm('Send payment reminder to all tenants with pending payments?');
            if (!confirmed) return;

            await apiService.post('/notifications/remind-all-tenants');
            this.showSuccess('Reminders sent successfully!');
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error sending reminders:', error);
            this.showError('Failed to send reminders');
        }
    }

    async generateMonthlyReport() {
        try {
            const report = await apiService.get('/reports/monthly');
            this.showSuccess('Report generated successfully!');
            // Handle report download/display
            console.log('Report:', report);
        } catch (error) {
            console.error('[PremiumOwnerDashboard] Error generating report:', error);
            this.showError('Failed to generate report');
        }
    }

    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    showLoading() {
        console.log('[PremiumOwnerDashboard] Loading...');
    }

    showSuccess(message) {
        alert(message); // Replace with better notification system
    }

    showError(message) {
        alert('Error: ' + message); // Replace with better notification system
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API service to be ready
    if (typeof apiService !== 'undefined') {
        new PremiumOwnerDashboard();
    } else {
        console.error('[PremiumOwnerDashboard] API Service not available');
    }
});
