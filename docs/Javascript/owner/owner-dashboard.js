/**
 * ========================================================
 * 🏠 owner-dashboard.js - Comprehensive Owner Dashboard
 * ========================================================
 * 
 * This file handles the complete owner dashboard functionality including:
 * 1. Sidebar navigation and responsive behavior
 * 2. Content section routing and dynamic loading
 * 3. Right drawer for detailed views
 * 4. API integration for owner data
 * 5. Mobile menu handling
 * 6. Notification integration
 * 
 * Dependencies: api.js, notifications.js, main.js
 */

class OwnerDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.sidebarCollapsed = false;
        this.mobileMenuOpen = false;
        this.rightDrawerOpen = false;
        this.ownerData = null;
        this.propertiesData = [];
        this.tenantsData = [];
        this.paymentsData = [];
        
        this.init();
    }

    async init() {
        console.log('[OwnerDashboard] Initializing dashboard...');
        
        // Check authentication and role
        if (!this.checkAuth()) {
            return;
        }

        // Initialize components
        this.setupEventListeners();
        this.setupSidebar();
        this.setupMobileMenu();
        this.setupRightDrawer();
        this.setupTooltips();
        
        // Load initial data
        await this.loadOwnerData();
        await this.loadDashboardData();
        
        // Initialize notifications (handled by navbar component)
        this.initializeNotifications();
        
        console.log('[OwnerDashboard] Dashboard initialized successfully');
    }

    checkAuth() {
        if (typeof apiService === 'undefined') {
            console.error('[OwnerDashboard] API Service not loaded');
            alert('API Service not loaded. Please refresh the page.');
            return false;
        }

        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        
        if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
            console.warn('[OwnerDashboard] Access denied - not authenticated or not ADMIN role');
            this.showNotification('Please login as an owner to view the dashboard.', 'warning');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return false;
        }

        return true;
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Mobile menu overlay
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Profile section
        const profileSection = document.getElementById('profileSection');
        if (profileSection) {
            profileSection.addEventListener('click', () => {
                this.toggleProfileMenu();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Quick tools
        const remindAllTenants = document.getElementById('remindAllTenants');
        if (remindAllTenants) {
            remindAllTenants.addEventListener('click', () => {
                this.remindAllTenants();
            });
        }

        const generateReport = document.getElementById('generateReport');
        if (generateReport) {
            generateReport.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Right drawer
        const drawerClose = document.getElementById('drawerClose');
        if (drawerClose) {
            drawerClose.addEventListener('click', () => {
                this.closeRightDrawer();
            });
        }

        const rightDrawerOverlay = document.getElementById('rightDrawerOverlay');
        if (rightDrawerOverlay) {
            rightDrawerOverlay.addEventListener('click', () => {
                this.closeRightDrawer();
            });
        }

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addPropertyBtn')) {
                window.location.href = './add-property.html';
            }
            if (e.target.closest('#addTenantBtn')) {
                window.location.href = './add-tenant.html';
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle initial responsive state
        this.handleResize();
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        
        // Add tooltips to nav items for collapsed state
        document.querySelectorAll('.nav-link').forEach(link => {
            const text = link.querySelector('.nav-text')?.textContent;
            if (text) {
                link.setAttribute('data-tooltip', text);
            }
        });

        document.querySelectorAll('.quick-tool-item').forEach(item => {
            const text = item.querySelector('span')?.textContent;
            if (text) {
                item.setAttribute('data-tooltip', text);
            }
        });
    }

    setupMobileMenu() {
        // Close mobile menu when clicking nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });
    }

    setupRightDrawer() {
        // Setup right drawer for detailed views
        this.setupPropertyDetailHandlers();
        this.setupTenantDetailHandlers();
        this.setupPaymentDetailHandlers();
    }

    setupPropertyDetailHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.property-detail-btn')) {
                const propertyId = e.target.closest('[data-property-id]')?.dataset.propertyId;
                if (propertyId) {
                    this.showPropertyDetails(propertyId);
                }
            }
        });
    }

    setupTenantDetailHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tenant-detail-btn')) {
                const tenantId = e.target.closest('[data-tenant-id]')?.dataset.tenantId;
                if (tenantId) {
                    this.showTenantDetails(tenantId);
                }
            }
        });
    }

    setupPaymentDetailHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.payment-detail-btn')) {
                const paymentId = e.target.closest('[data-payment-id]')?.dataset.paymentId;
                if (paymentId) {
                    this.showPaymentDetails(paymentId);
                }
            }
        });
    }

    setupTooltips() {
        // Enhanced tooltip system for better UX
        const createTooltip = (element, text) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = text;
            document.body.appendChild(tooltip);

            element.addEventListener('mouseenter', (e) => {
                if (this.sidebarCollapsed || window.innerWidth <= 1024) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = e.target.getBoundingClientRect().right + 10 + 'px';
                    tooltip.style.top = e.target.getBoundingClientRect().top + 'px';
                }
            });

            element.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        };
    }

    // Navigation Methods
    navigateToSection(section) {
        console.log(`[OwnerDashboard] Navigating to section: ${section}`);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${section}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update breadcrumb
        this.updateBreadcrumb(section);

        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(contentSection => {
            contentSection.classList.remove('active');
        });

        const targetSection = document.getElementById(`${section}Content`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update current section
        this.currentSection = section;

        // Load section-specific data
        this.loadSectionData(section);
    }

    updateBreadcrumb(section) {
        const breadcrumb = document.getElementById('breadcrumb');
        const sectionNames = {
            dashboard: 'Dashboard',
            properties: 'My Properties',
            tenants: 'Tenants',
            payments: 'Payments',
            maintenance: 'Maintenance',
            reports: 'Reports',
            notifications: 'Notifications',
            settings: 'Settings'
        };

        if (breadcrumb) {
            breadcrumb.innerHTML = `<span class="breadcrumb-item active">${sectionNames[section] || section}</span>`;
        }
    }

    // Sidebar Methods
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
        }

        // Save preference
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    }

    // Mobile Menu Methods
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileMenuOverlay');

        if (sidebar && overlay) {
            sidebar.classList.toggle('mobile-active', this.mobileMenuOpen);
            overlay.classList.toggle('active', this.mobileMenuOpen);
            
            if (this.mobileMenuOpen) {
                overlay.style.display = 'block';
            } else {
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 300);
            }
        }
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileMenuOverlay');

        if (sidebar && overlay) {
            sidebar.classList.remove('mobile-active');
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    // Profile Methods
    toggleProfileMenu() {
        const profileSection = document.getElementById('profileSection');
        const profileMenu = document.getElementById('profileMenu');

        if (profileSection && profileMenu) {
            const isActive = profileSection.classList.toggle('active');
            profileMenu.classList.toggle('active', isActive);
        }
    }

    // Right Drawer Methods
    openRightDrawer(title, content) {
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');
        const drawerTitle = document.getElementById('drawerTitle');
        const drawerContent = document.getElementById('drawerContent');

        if (drawer && overlay && drawerTitle && drawerContent) {
            drawerTitle.textContent = title;
            drawerContent.innerHTML = content;
            
            drawer.classList.add('active');
            overlay.classList.add('active');
            this.rightDrawerOpen = true;

            // Disable body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    closeRightDrawer() {
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');

        if (drawer && overlay) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
            this.rightDrawerOpen = false;

            // Enable body scroll
            document.body.style.overflow = 'auto';
        }
    }

    // Data Loading Methods
    async loadOwnerData() {
        try {
            const response = await apiService.get('/api/users/profile');
            this.ownerData = response;

            // Update profile display
            const ownerName = document.getElementById('ownerName');
            const ownerEmail = document.getElementById('ownerEmail');

            if (ownerName && this.ownerData.firstName) {
                ownerName.textContent = `${this.ownerData.firstName} ${this.ownerData.lastName || ''}`.trim();
            }

            if (ownerEmail && this.ownerData.email) {
                ownerEmail.textContent = this.ownerData.email;
            }

        } catch (error) {
            console.error('[OwnerDashboard] Error loading owner data:', error);
            this.showNotification('Error loading profile data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            console.log('[OwnerDashboard] Loading dashboard metrics...');
            
            // Load flat properties only
            const flatPropertiesResponse = await apiService.getFlatProperties();
            this.propertiesData = (flatPropertiesResponse?.content || flatPropertiesResponse) || [];
            console.log('[OwnerDashboard] Loaded flat properties:', this.propertiesData.length);
            
            // Load tenants
            const tenantsResponse = await apiService.get('/api/tenants');
            this.tenantsData = tenantsResponse || [];
            
            // Load payments
            const paymentsResponse = await apiService.get('/api/transactions/owner');
            this.paymentsData = paymentsResponse || [];

            // Update dashboard metrics
            this.updateDashboardMetrics();
            this.updateRecentActivity();

        } catch (error) {
            console.error('[OwnerDashboard] Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
            this.setDefaultMetrics();
        }
    }

    updateDashboardMetrics() {
        // Update total properties
        const totalPropertiesCount = document.getElementById('totalPropertiesCount');
        if (totalPropertiesCount) {
            totalPropertiesCount.textContent = this.propertiesData.length;
        }

        // Update active tenants
        const activeTenantsCount = document.getElementById('activeTenantsCount');
        if (activeTenantsCount) {
            const activeTenants = this.tenantsData.filter(tenant => tenant.status === 'ACTIVE');
            activeTenantsCount.textContent = activeTenants.length;
        }

        // Update monthly income
        const monthlyIncome = document.getElementById('monthlyIncome');
        if (monthlyIncome) {
            const totalRent = this.tenantsData
                .filter(tenant => tenant.status === 'ACTIVE')
                .reduce((sum, tenant) => sum + (tenant.rentAmount || 0), 0);
            monthlyIncome.textContent = `₹${totalRent.toLocaleString()}`;
        }

        // Update pending payments
        const pendingPayments = document.getElementById('pendingPayments');
        if (pendingPayments) {
            const pending = this.paymentsData.filter(payment => payment.status === 'PENDING');
            pendingPayments.textContent = pending.length;
        }

        // Update navigation badges
        this.updateNavigationBadges();
    }

    updateNavigationBadges() {
        // Update payments badge
        const paymentsBadge = document.getElementById('paymentsBadge');
        if (paymentsBadge) {
            const pendingCount = this.paymentsData.filter(p => p.status === 'PENDING').length;
            paymentsBadge.textContent = pendingCount;
            paymentsBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
        }

        // Update maintenance badge (placeholder)
        const maintenanceBadge = document.getElementById('maintenanceBadge');
        if (maintenanceBadge) {
            maintenanceBadge.textContent = '0';
            maintenanceBadge.style.display = 'none';
        }
    }

    setDefaultMetrics() {
        // Set default values if data loading fails
        const elements = {
            'totalPropertiesCount': '0',
            'activeTenantsCount': '0',
            'monthlyIncome': '₹0',
            'pendingPayments': '0'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateRecentActivity() {
        this.updateRecentPayments();
        this.updatePropertyPerformance();
    }

    updateRecentPayments() {
        const container = document.getElementById('recentPayments');
        if (!container) return;

        const recentPayments = this.paymentsData
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentPayments.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent payments</p>';
            return;
        }

        container.innerHTML = recentPayments.map(payment => `
            <div class="recent-payment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 500;">${payment.tenantName || 'Unknown Tenant'}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">₹${payment.amount?.toLocaleString()}</div>
                    <span class="status-badge ${payment.status?.toLowerCase()}">${payment.status}</span>
                </div>
            </div>
        `).join('');
    }

    updatePropertyPerformance() {
        const container = document.getElementById('propertyPerformance');
        if (!container) return;

        if (this.propertiesData.length === 0) {
            container.innerHTML = '<p class="text-muted">No properties found</p>';
            return;
        }

        container.innerHTML = this.propertiesData.slice(0, 5).map(property => {
            const occupancy = property.occupiedUnits || 0;
            const total = property.totalUnits || 1;
            const occupancyRate = Math.round((occupancy / total) * 100);

            return `
                <div class="property-performance-item" style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div style="font-weight: 500;">${property.name}</div>
                        <div style="font-size: 0.875rem; font-weight: 600;">${occupancyRate}%</div>
                    </div>
                    <div style="background: var(--border-color); height: 4px; border-radius: 2px;">
                        <div style="background: var(--success-color); height: 100%; width: ${occupancyRate}%; border-radius: 2px;"></div>
                    </div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.25rem;">
                        ${occupancy}/${total} units occupied
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadSectionData(section) {
        switch (section) {
            case 'properties':
                await this.loadPropertiesSection();
                break;
            case 'tenants':
                await this.loadTenantsSection();
                break;
            case 'payments':
                await this.loadPaymentsSection();
                break;
            case 'maintenance':
                await this.loadMaintenanceSection();
                break;
            case 'reports':
                await this.loadReportsSection();
                break;
            case 'notifications':
                await this.loadNotificationsSection();
                break;
            case 'settings':
                await this.loadSettingsSection();
                break;
        }
    }

    async loadPropertiesSection() {
        const tableBody = document.getElementById('propertiesTableBody');
        if (!tableBody) return;

        if (this.propertiesData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-building" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>No properties found. <a href="./add-property.html">Add your first property</a></div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.propertiesData.map(property => `
            <tr data-property-id="${property.id}">
                <td>
                    <div style="font-weight: 500;">${property.name}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${property.type || 'Property'}</div>
                </td>
                <td>${property.address || 'N/A'}</td>
                <td>${property.totalUnits || 0}</td>
                <td>
                    <div>${property.occupiedUnits || 0}/${property.totalUnits || 0}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                        ${Math.round(((property.occupiedUnits || 0) / (property.totalUnits || 1)) * 100)}% occupied
                    </div>
                </td>
                <td>₹${(property.monthlyRent || 0).toLocaleString()}</td>
                <td>
                    <span class="status-badge ${property.status?.toLowerCase() || 'active'}">${property.status || 'Active'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary property-detail-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadTenantsSection() {
        const tableBody = document.getElementById('tenantsTableBody');
        if (!tableBody) return;

        if (this.tenantsData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>No tenants found. <a href="./add-tenant.html">Add your first tenant</a></div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.tenantsData.map(tenant => `
            <tr data-tenant-id="${tenant.id}">
                <td>
                    <div style="font-weight: 500;">${tenant.firstName} ${tenant.lastName || ''}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${tenant.phone || 'N/A'}</div>
                </td>
                <td>${tenant.propertyName || 'N/A'}</td>
                <td>${tenant.unitNumber || 'N/A'}</td>
                <td>₹${(tenant.rentAmount || 0).toLocaleString()}</td>
                <td>${tenant.joinDate ? new Date(tenant.joinDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="status-badge ${tenant.paymentStatus?.toLowerCase() || 'pending'}">${tenant.paymentStatus || 'Pending'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary tenant-detail-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadPaymentsSection() {
        const tableBody = document.getElementById('paymentsTableBody');
        if (!tableBody) return;

        if (this.paymentsData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-credit-card" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>No payment records found.</div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.paymentsData.map(payment => `
            <tr data-payment-id="${payment.id}">
                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>${payment.tenantName || 'Unknown Tenant'}</td>
                <td>${payment.propertyName || 'N/A'}</td>
                <td>₹${(payment.amount || 0).toLocaleString()}</td>
                <td>${payment.type || 'Rent'}</td>
                <td>
                    <span class="status-badge ${payment.status?.toLowerCase() || 'pending'}">${payment.status || 'Pending'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary payment-detail-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadMaintenanceSection() {
        // Placeholder for maintenance functionality
        console.log('[OwnerDashboard] Loading maintenance section...');
    }

    async loadReportsSection() {
        // Placeholder for reports functionality
        console.log('[OwnerDashboard] Loading reports section...');
    }

    async loadNotificationsSection() {
        console.log('[OwnerDashboard] Loading notifications section...');
        
        // Setup notification section event listeners
        this.setupNotificationSectionListeners();
        
        // Load notifications if manager is available
        if (window.notificationManager && window.notificationManager.isInitialized) {
            await window.notificationManager.loadNotifications();
            this.displayNotificationsInSection();
        } else {
            // Show loading state
            const container = document.getElementById('notificationsList');
            if (container) {
                container.innerHTML = `
                    <div class="notification-placeholder" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-bell" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>Notifications not available</div>
                    </div>
                `;
            }
        }
    }

    setupNotificationSectionListeners() {
        // Mark all as read button
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsRead();
            });
        }

        // Refresh notifications button
        const refreshNotificationsBtn = document.getElementById('refreshNotificationsBtn');
        if (refreshNotificationsBtn) {
            refreshNotificationsBtn.addEventListener('click', () => {
                this.refreshNotifications();
            });
        }

        // Notification filters
        const typeFilter = document.getElementById('notificationTypeFilter');
        const statusFilter = document.getElementById('notificationStatusFilter');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterNotifications();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterNotifications();
            });
        }
    }

    displayNotificationsInSection() {
        const container = document.getElementById('notificationsList');
        if (!container || !window.notificationManager) return;

        const notifications = window.notificationManager.notifications || [];
        
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-placeholder" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-bell" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <div>No notifications found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="notifications-list">
                ${notifications.map(notification => `
                    <div class="notification-item ${notification.isRead ? '' : 'unread'}" data-id="${notification.id}">
                        <div class="notification-icon">
                            <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title || 'Notification'}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
                        </div>
                        <div class="notification-actions">
                            ${!notification.isRead ? `
                                <button class="btn btn-sm btn-primary mark-read-btn" onclick="ownerDashboard.markNotificationRead(${notification.id})">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-secondary delete-btn" onclick="ownerDashboard.deleteNotification(${notification.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getNotificationIcon(type) {
        const iconMap = {
            'payment': 'credit-card',
            'maintenance': 'wrench',
            'system': 'info-circle',
            'reminder': 'bell',
            'approval': 'check-circle'
        };
        return iconMap[type] || 'bell';
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        
        // More than 1 day
        return date.toLocaleDateString();
    }

    async markAllNotificationsRead() {
        try {
            if (window.notificationManager) {
                await window.notificationManager.markAllAsRead();
                this.displayNotificationsInSection();
                this.updateSidebarNotificationBadges();
                this.showNotification('All notifications marked as read', 'success');
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error marking all notifications as read:', error);
            this.showNotification('Failed to mark notifications as read', 'error');
        }
    }

    async refreshNotifications() {
        try {
            if (window.notificationManager) {
                await window.notificationManager.loadNotifications();
                this.displayNotificationsInSection();
                this.updateSidebarNotificationBadges();
                this.showNotification('Notifications refreshed', 'success');
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error refreshing notifications:', error);
            this.showNotification('Failed to refresh notifications', 'error');
        }
    }

    async markNotificationRead(notificationId) {
        try {
            if (window.notificationManager) {
                await window.notificationManager.markAsRead(notificationId);
                this.displayNotificationsInSection();
                this.updateSidebarNotificationBadges();
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error marking notification as read:', error);
            this.showNotification('Failed to mark notification as read', 'error');
        }
    }

    async deleteNotification(notificationId) {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        try {
            if (window.notificationManager) {
                await window.notificationManager.deleteNotification(notificationId);
                this.displayNotificationsInSection();
                this.updateSidebarNotificationBadges();
                this.showNotification('Notification deleted', 'success');
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error deleting notification:', error);
            this.showNotification('Failed to delete notification', 'error');
        }
    }

    filterNotifications() {
        const typeFilter = document.getElementById('notificationTypeFilter')?.value;
        const statusFilter = document.getElementById('notificationStatusFilter')?.value;
        
        if (!window.notificationManager) return;

        let filteredNotifications = [...window.notificationManager.notifications];
        
        if (typeFilter) {
            filteredNotifications = filteredNotifications.filter(n => n.type === typeFilter);
        }
        
        if (statusFilter === 'read') {
            filteredNotifications = filteredNotifications.filter(n => n.isRead);
        } else if (statusFilter === 'unread') {
            filteredNotifications = filteredNotifications.filter(n => !n.isRead);
        }

        // Temporarily override notifications for display
        const originalNotifications = window.notificationManager.notifications;
        window.notificationManager.notifications = filteredNotifications;
        this.displayNotificationsInSection();
        window.notificationManager.notifications = originalNotifications;
    }

    async loadSettingsSection() {
        // Placeholder for settings functionality
        console.log('[OwnerDashboard] Loading settings section...');
    }

    // Detail Views
    showPropertyDetails(propertyId) {
        const property = this.propertiesData.find(p => p.id == propertyId);
        if (!property) return;

        const content = `
            <div class="property-details">
                <div class="detail-section">
                    <h4>Property Information</h4>
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${property.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Address:</label>
                        <span>${property.address || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type:</label>
                        <span>${property.type || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Units:</label>
                        <span>${property.totalUnits || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Occupied Units:</label>
                        <span>${property.occupiedUnits || 0}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Financial Information</h4>
                    <div class="detail-item">
                        <label>Monthly Rent:</label>
                        <span>₹${(property.monthlyRent || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="window.location.href='./edit-property.html?id=${property.id}'">
                        <i class="fas fa-edit"></i>
                        Edit Property
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='./property-config.html?id=${property.id}'">
                        <i class="fas fa-cog"></i>
                        Configure
                    </button>
                </div>
            </div>
        `;

        this.openRightDrawer(`Property: ${property.name}`, content);
    }

    showTenantDetails(tenantId) {
        const tenant = this.tenantsData.find(t => t.id == tenantId);
        if (!tenant) return;

        const content = `
            <div class="tenant-details">
                <div class="detail-section">
                    <h4>Tenant Information</h4>
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${tenant.firstName} ${tenant.lastName || ''}</span>
                    </div>
                    <div class="detail-item">
                        <label>Phone:</label>
                        <span>${tenant.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${tenant.email || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Tenancy Information</h4>
                    <div class="detail-item">
                        <label>Property:</label>
                        <span>${tenant.propertyName || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Unit:</label>
                        <span>${tenant.unitNumber || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Rent Amount:</label>
                        <span>₹${(tenant.rentAmount || 0).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Join Date:</label>
                        <span>${tenant.joinDate ? new Date(tenant.joinDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                <div class="detail-actions">
                    <button class="btn btn-primary">
                        <i class="fas fa-bell"></i>
                        Send Reminder
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-eye"></i>
                        View Payments
                    </button>
                </div>
            </div>
        `;

        this.openRightDrawer(`Tenant: ${tenant.firstName}`, content);
    }

    showPaymentDetails(paymentId) {
        const payment = this.paymentsData.find(p => p.id == paymentId);
        if (!payment) return;

        const content = `
            <div class="payment-details">
                <div class="detail-section">
                    <h4>Payment Information</h4>
                    <div class="detail-item">
                        <label>Amount:</label>
                        <span>₹${(payment.amount || 0).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Date:</label>
                        <span>${new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${payment.status?.toLowerCase()}">${payment.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type:</label>
                        <span>${payment.type || 'Rent'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Tenant Information</h4>
                    <div class="detail-item">
                        <label>Tenant:</label>
                        <span>${payment.tenantName || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Property:</label>
                        <span>${payment.propertyName || 'N/A'}</span>
                    </div>
                </div>

                <div class="detail-actions">
                    ${payment.status === 'PENDING' ? `
                        <button class="btn btn-success" onclick="ownerDashboard.approvePayment(${payment.id})">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                        <button class="btn btn-danger" onclick="ownerDashboard.rejectPayment(${payment.id})">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                    ` : `
                        <button class="btn btn-primary">
                            <i class="fas fa-download"></i>
                            Download Receipt
                        </button>
                    `}
                </div>
            </div>
        `;

        this.openRightDrawer(`Payment Details`, content);
    }

    // Quick Actions
    async remindAllTenants() {
        try {
            this.showNotification('Sending reminders to all tenants...', 'info');
            
            // API call to send reminders
            await apiService.post('/api/notifications/remind-all-tenants');
            
            this.showNotification('Reminders sent successfully!', 'success');
            
        } catch (error) {
            console.error('[OwnerDashboard] Error sending reminders:', error);
            this.showNotification('Failed to send reminders', 'error');
        }
    }

    async generateReport() {
        try {
            this.showNotification('Generating monthly report...', 'info');
            
            // API call to generate report
            const report = await apiService.get('/api/reports/monthly');
            
            // Download or display report
            this.downloadReport(report);
            
            this.showNotification('Report generated successfully!', 'success');
            
        } catch (error) {
            console.error('[OwnerDashboard] Error generating report:', error);
            this.showNotification('Failed to generate report', 'error');
        }
    }

    downloadReport(reportData) {
        // Create and trigger download
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `monthly-report-${new Date().toISOString().slice(0,7)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Payment Actions
    async approvePayment(paymentId) {
        try {
            await apiService.post(`/api/transactions/${paymentId}/verify`);
            this.showNotification('Payment approved successfully!', 'success');
            this.closeRightDrawer();
            await this.loadDashboardData(); // Refresh data
        } catch (error) {
            console.error('[OwnerDashboard] Error approving payment:', error);
            this.showNotification('Failed to approve payment', 'error');
        }
    }

    async rejectPayment(paymentId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await apiService.post(`/api/transactions/${paymentId}/reject`, { reason });
            this.showNotification('Payment rejected successfully!', 'success');
            this.closeRightDrawer();
            await this.loadDashboardData(); // Refresh data
        } catch (error) {
            console.error('[OwnerDashboard] Error rejecting payment:', error);
            this.showNotification('Failed to reject payment', 'error');
        }
    }

    // Utility Methods
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024;

        if (isMobile) {
            // Mobile: hide sidebar by default
            this.closeMobileMenu();
        } else if (isTablet) {
            // Tablet: collapse sidebar
            if (!this.sidebarCollapsed) {
                this.toggleSidebar();
            }
        } else {
            // Desktop: restore sidebar preference
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState !== null) {
                this.sidebarCollapsed = JSON.parse(savedState);
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
                }
            }
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('roles');
            localStorage.removeItem('userId');
            window.location.href = '../index.html';
        }
    }

    initializeNotifications() {
        // Let the navbar component handle notifications naturally
        console.log('[OwnerDashboard] Allowing navbar component to handle notifications...');
        
        // The notifications.js will be loaded by the navbar component
        // We just need to update our sidebar notification badges
        setTimeout(() => {
            this.updateSidebarNotificationBadges();
        }, 2000); // Wait for navbar and notifications to initialize
        
        // Update sidebar badges periodically
        setInterval(() => {
            this.updateSidebarNotificationBadges();
        }, 30000); // Every 30 seconds
    }

    async updateSidebarNotificationBadges() {
        try {
            // Update notification counts from the notification manager (created by navbar)
            if (window.notificationManager && window.notificationManager.isInitialized) {
                const unreadCount = window.notificationManager.unreadCount;
                
                // Update navigation badge (sidebar only)
                const notificationsBadge = document.getElementById('notificationsBadge');
                if (notificationsBadge) {
                    notificationsBadge.textContent = unreadCount;
                    notificationsBadge.style.display = unreadCount > 0 ? 'inline' : 'none';
                }
            }
        } catch (error) {
            console.error('[OwnerDashboard] Error updating sidebar notification badges:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof window.safeNotify === 'function') {
            window.safeNotify(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ownerDashboard = new OwnerDashboard();
});

// Additional CSS for detail views
const additionalStyles = `
    <style>
        .detail-section {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .detail-section:last-child {
            border-bottom: none;
        }
        
        .detail-section h4 {
            margin-bottom: 1rem;
            color: var(--text-primary);
            font-size: 1rem;
            font-weight: 600;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-item label {
            font-weight: 500;
            color: var(--text-secondary);
            flex-shrink: 0;
            margin-right: 1rem;
        }
        
        .detail-item span {
            text-align: right;
            color: var(--text-primary);
        }
        
        .detail-actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 1.5rem;
        }
        
        .detail-actions .btn {
            flex: 1;
            min-width: 120px;
        }
        
        .custom-tooltip {
            position: fixed;
            background: var(--text-primary);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.8125rem;
            z-index: 10000;
            display: none;
            pointer-events: none;
            white-space: nowrap;
        }

        /* Notification Section Styles */
        .notifications-container {
            background: var(--card-bg);
            border-radius: 0.75rem;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
            overflow: hidden;
        }

        .notifications-list {
            max-height: 600px;
            overflow-y: auto;
        }

        .notification-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s;
            position: relative;
        }

        .notification-item:last-child {
            border-bottom: none;
        }

        .notification-item:hover {
            background: var(--main-bg);
        }

        .notification-item.unread {
            background: rgba(13, 110, 253, 0.02);
            border-left: 4px solid var(--primary-color);
        }

        .notification-item.unread::before {
            content: '';
            position: absolute;
            top: 1rem;
            left: 0.5rem;
            width: 8px;
            height: 8px;
            background: var(--primary-color);
            border-radius: 50%;
        }

        .notification-icon {
            width: 40px;
            height: 40px;
            background: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .notification-content {
            flex: 1;
            min-width: 0;
        }

        .notification-title {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
            font-size: 0.875rem;
        }

        .notification-message {
            color: var(--text-secondary);
            font-size: 0.8125rem;
            line-height: 1.4;
            margin-bottom: 0.5rem;
        }

        .notification-time {
            color: var(--text-muted);
            font-size: 0.75rem;
        }

        .notification-actions {
            display: flex;
            gap: 0.5rem;
            align-items: flex-start;
        }

        .notification-actions .btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }

        .notification-placeholder {
            padding: 3rem 1rem;
        }

        /* Responsive notification styles */
        @media (max-width: 768px) {
            .notification-item {
                padding: 0.75rem;
                gap: 0.75rem;
            }
            
            .notification-icon {
                width: 32px;
                height: 32px;
                font-size: 0.875rem;
            }
            
            .notification-actions {
                flex-direction: column;
                gap: 0.25rem;
            }
        }
    </style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);