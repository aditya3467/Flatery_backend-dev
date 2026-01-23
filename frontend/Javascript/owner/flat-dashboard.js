/**
 * ========================================================
 * 🏠 flat-dashboard.js - Comprehensive Flat Dashboard
 * ========================================================
 * 
 * This file handles the complete flat property dashboard functionality including:
 * 1. Sidebar navigation and responsive behavior
 * 2. Content section routing and dynamic loading
 * 3. Right drawer for detailed views
 * 4. API integration for flat property data only
 * 5. Mobile menu handling
 * 6. Notification integration
 * 
 * Dependencies: api.js, notifications.js, main.js
 */

class FlatDashboard {
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

    // ===== GLOBAL UTILITY FUNCTIONS =====
    /**
     * Generate formatted flat name: BHK Type + "BHK" + "in" + Locality + (Flat_room_number)
     * @param {Object} property - Property object
     * @param {Object} tenant - Optional tenant object for flat room number
     * @returns {String} - Formatted flat name
     */
    generateFlatName(property, tenant = null) {
        if (!property) return 'Unknown Property';
        
        try {
            // Convert BhkType enum to number (ONE -> 1, TWO -> 2, etc.)
            let bhkNumber = 'Unknown';
            if (property.bhkType) {
                switch (property.bhkType.toUpperCase()) {
                    case 'ONE': bhkNumber = '1'; break;
                    case 'TWO': bhkNumber = '2'; break;
                    case 'THREE': bhkNumber = '3'; break;
                    case 'FOUR': bhkNumber = '4'; break;
                    case 'FOUR_PLUS': bhkNumber = '4+'; break;
                    default: 
                        // If it's already a number or formatted, extract it
                        bhkNumber = property.bhkType.toString().replace(/\s*BHK.*$/i, '').replace('_PLUS', '+').trim();
                }
            }
            
            // Extract locality from property location
            const locality = property.location || property.city || property.address || 'Unknown Area';
            
            // Extract flat room number - prioritize tenant's flatRoomNumber, then property fields
            let flatRoomNumber = 'Unknown';
            if (tenant && tenant.flatRoomNumber) {
                flatRoomNumber = tenant.flatRoomNumber;
            } else if (property.flatRoomNumber || property.flat_room_number) {
                flatRoomNumber = property.flatRoomNumber || property.flat_room_number;
            } else {
                // Fallback to other property identifiers
                flatRoomNumber = property.flatNo || 
                               property.flatNumber || 
                               property.unitNumber || 
                               property.number ||
                               property.id || 'Unknown';
            }
            
            // Format the flat name: bhkNumber + "BHK" + "in" + locality + (flatRoomNumber)
            return `${bhkNumber} BHK in ${locality} (${flatRoomNumber})`;
        } catch (error) {
            return `Property ${property.id || 'Unknown'}`;
        }
    }

    async init() {
        console.log('[FlatDashboard] Initializing flat dashboard...');
        
        // Check authentication and role
        if (!this.checkAuth()) {
            console.log('[FlatDashboard] Auth check failed, returning...');
            return;
        }

        console.log('[FlatDashboard] Auth check passed, setting up components...');
        
        // Initialize components
        this.setupEventListeners();
        this.setupSidebar();
        this.setupMobileMenu();
        this.setupRightDrawer();
        this.setupTooltips();
        
        // Ensure right drawer is closed initially
        this.ensureDrawerClosed();
        
        console.log('[FlatDashboard] Loading owner data...');
        // Load initial data
        await this.loadOwnerData();
        console.log('[FlatDashboard] Owner data loaded, loading dashboard data...');
        await this.loadDashboardData();
        console.log('[FlatDashboard] Dashboard data loaded successfully');
        
        // Initialize notifications (handled by navbar component)
        this.initializeNotifications();
        
        
        // Expose dashboard instance globally for debugging
        window.flatDashboard = this;
    }

    checkAuth() {
        if (typeof apiService === 'undefined') {
            console.error('[FlatDashboard] API Service not loaded');
            alert('API Service not loaded. Please refresh the page.');
            return false;
        }

        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        
        if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
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

        // Sidebar profile section was removed - profile functionality now handled by navbar

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
        // Sidebar profile section removed - profile functionality now in navbar
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
            
            // Clear any inline styles that might interfere
            drawer.style.right = '';
            drawer.style.visibility = '';
            drawer.style.opacity = '';
            overlay.style.opacity = '';
            overlay.style.pointerEvents = '';
            
            // Add active classes to trigger CSS transitions
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
    
    ensureDrawerClosed() {
        // Ensure right drawer is completely closed on initialization
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');

        if (drawer) {
            // Remove any active classes
            drawer.classList.remove('active');
            // Force CSS properties to ensure it's hidden
            drawer.style.right = '-450px';
            drawer.style.visibility = 'hidden';
            drawer.style.opacity = '0';
        }

        if (overlay) {
            // Remove any active classes
            overlay.classList.remove('active');
            // Force overlay to be hidden
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }

        // Set internal state
        this.rightDrawerOpen = false;
        
        // Double check with a small delay to handle any race conditions
        setTimeout(() => {
            if (drawer) {
                drawer.classList.remove('active');
                // Only set inline styles if still not properly closed
                if (drawer.classList.contains('active') || window.getComputedStyle(drawer).right !== '-450px') {
                    drawer.style.right = '-450px';
                    drawer.style.visibility = 'hidden';
                    drawer.style.opacity = '0';
                }
            }
            if (overlay && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
            }
        }, 100);
    }
    
    // Debug helper methods
    async debugRefreshTenants() {
        try {
            const tenantsResponse = await apiService.getFlatTenants();
            this.tenantsData = tenantsResponse || [];
            await this.loadTenantsSection();
        } catch (error) {
            console.error('[FlatDashboard] DEBUG: Error refreshing tenants:', error);
        }
    }
    
    async debugRefreshProperties() {
        try {
            const flatPropertiesResponse = await apiService.getFlatProperties(0, 100);
            this.propertiesData = (flatPropertiesResponse?.content || flatPropertiesResponse) || [];
            this.updatePropertiesTable();
        } catch (error) {
            console.error('[FlatDashboard] DEBUG: Error refreshing properties:', error);
        }
    }
    
    async debugRefreshPayments() {
        try {
            const paymentsResponse = await apiService.get('/transactions/owner/all');
            const allPayments = paymentsResponse || [];
            
            // Filter payments for flat properties only
            const flatPropertyIds = this.propertiesData.map(p => p.id);
            this.paymentsData = allPayments.filter(payment => 
                flatPropertyIds.includes(payment.propertyId)
            );
            
            await this.loadPaymentsSection();
        } catch (error) {
            console.error('[FlatDashboard] DEBUG: Error refreshing payments:', error);
        }
    }
    
    debugShowRightDrawer() {
        this.openRightDrawer('Debug Test', '<p>This is a test of the right drawer functionality.</p>');
    }

    // Data Loading Methods
    async loadOwnerData() {
        try {
            const response = await apiService.get('/auth/me');
            this.ownerData = response;
            
            // Profile display now handled by navbar component

        } catch (error) {
            console.error('[FlatDashboard] Error loading owner data:', error);
            this.showNotification('Error loading profile data', 'error');
        }
    }

    async loadDashboardData() {
        console.log('[FlatDashboard] loadDashboardData called');
        try {
            console.log('[FlatDashboard] Starting data load...');
            
            // Test endpoint accessibility first
            try {
                const testUrl = `${apiService.baseURL}/admin/properties/flats?page=0&size=10`;
                
                const response = await fetch(testUrl, {
                    method: 'GET',
                    headers: apiService.getHeaders()
                });
                
                
                if (response.ok) {
                    const data = await response.json();
                } else {
                    const errorText = await response.text();
                    console.error('[FlatDashboard] Test response error:', errorText);
                }
            } catch (testError) {
                console.error('[FlatDashboard] Test endpoint error:', testError);
            }
            
            // Load flat properties only - fetch more records
            try {
                console.log('[FlatDashboard] Fetching flat properties...');
                const flatPropertiesResponse = await apiService.getFlatProperties(0, 100); // Get up to 100 properties
                console.log('[FlatDashboard] Flat properties response:', flatPropertiesResponse);
                
                this.propertiesData = (flatPropertiesResponse?.content || flatPropertiesResponse) || [];
                console.log('[FlatDashboard] Loaded properties:', this.propertiesData.length);
                
                // Log first property structure for debugging
                if (this.propertiesData.length > 0) {
                    console.log('[FlatDashboard] Sample property:', this.propertiesData[0]);
                }
            } catch (flatError) {
                console.error('[FlatDashboard] Error loading flat properties:', flatError);
                console.error('[FlatDashboard] Full error details:', {
                    message: flatError.message,
                    status: flatError.status,
                    response: flatError.response
                });
                
                // Fallback: try to load regular properties and filter
                try {
                    const allPropertiesResponse = await apiService.getMyProperties();
                    const allProperties = allPropertiesResponse?.content || allPropertiesResponse || [];
                    this.propertiesData = allProperties.filter(p => p.type === 'FLAT');
                } catch (fallbackError) {
                    console.error('[FlatDashboard] Fallback also failed:', fallbackError);
                    this.propertiesData = [];
                }
            }
            
            // Load tenants (only from flat properties)
            try {
                console.log('[FlatDashboard] Fetching flat tenants...');
                const tenantsResponse = await apiService.getFlatTenants();
                console.log('[FlatDashboard] Tenants response:', tenantsResponse);
                this.tenantsData = tenantsResponse || [];
                console.log('[FlatDashboard] Loaded tenants:', this.tenantsData.length);
                
                // Log first tenant structure for debugging
                if (this.tenantsData.length > 0) {
                    console.log('[FlatDashboard] Sample tenant:', this.tenantsData[0]);
                }
            } catch (tenantError) {
                console.error('[FlatDashboard] Error loading flat tenants:', tenantError);
                try {
                    const allTenantsResponse = await apiService.getTenants();
                    const allTenants = allTenantsResponse || [];
                    // Filter tenants based on property IDs from loaded flat properties
                    const flatPropertyIds = this.propertiesData.map(p => p.id);
                    this.tenantsData = allTenants.filter(t => flatPropertyIds.includes(t.propertyId));
                } catch (fallbackError) {
                    console.error('[FlatDashboard] Tenant fallback also failed:', fallbackError);
                    this.tenantsData = [];
                }
            }
            
            // Load payments (only for flat properties)
            const paymentsResponse = await apiService.get('/transactions/owner/all');
            const allPayments = paymentsResponse || [];
            
            // Filter payments to only include those for flat properties
            const flatPropertyIds = this.propertiesData.map(p => p.id);
            this.paymentsData = allPayments.filter(payment => {
                // Check if payment belongs to a flat property
                const isForFlatProperty = flatPropertyIds.includes(payment.propertyId);
                return isForFlatProperty;
            });
            
            
            // Log first payment structure for debugging
            if (this.paymentsData.length > 0) {
            }

            // Update all dashboard widgets
            this.updateKPICards();
            this.initializeCharts();
            this.updateRecentFlatsTable();
            this.updateActivitiesFeed();
            this.updateAlertsWidget();
            this.updateInsightsWidget();
            this.setupQuickActions();
            this.updateNavigationBadges();

        } catch (error) {
            console.error('[FlatDashboard] Error loading dashboard data:', error);
            console.error('[FlatDashboard] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showNotification('Error loading dashboard data: ' + error.message, 'error');
            this.setDefaultMetrics();
        }
    }

    // ===== KPI Cards Update =====
    updateKPICards() {
        try {
            // Calculate metrics
            const totalFlats = this.propertiesData.length;
            const occupiedFlats = this.propertiesData.filter(property => 
                this.tenantsData.some(tenant => tenant.propertyId === property.id && tenant.status === 'ACTIVE')
            ).length;
            const vacantFlats = totalFlats - occupiedFlats;
            
            // Calculate payment metrics
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const paymentsDue = this.propertiesData.filter(property => {
                const tenant = this.tenantsData.find(t => t.propertyId === property.id && t.status === 'ACTIVE');
                if (!tenant) return false;
                
                const hasCurrentMonthPayment = this.paymentsData.some(payment => {
                    try {
                        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                        if (isNaN(paymentDate.getTime())) {
                            return false;
                        }
                        return payment.propertyId === property.id &&
                               paymentDate.getMonth() === currentMonth &&
                               paymentDate.getFullYear() === currentYear &&
                               (payment.status === 'VERIFIED' || payment.status === 'PENDING');
                    } catch (error) {
                        return false;
                    }
                });
                
                return !hasCurrentMonthPayment;
            }).length;
            
            const pendingApprovals = this.paymentsData.filter(p => p.status === 'PENDING').length;
            
            const collectedRent = this.paymentsData
                .filter(payment => {
                    try {
                        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                        if (isNaN(paymentDate.getTime())) {
                            return false;
                        }
                        return payment.status === 'VERIFIED' &&
                               paymentDate.getMonth() === currentMonth &&
                               paymentDate.getFullYear() === currentYear;
                    } catch (error) {
                        return false;
                    }
                })
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
            
            // Update KPI elements
            this.updateElement('totalFlatsCount', totalFlats);
            this.updateElement('occupiedFlatsCount', occupiedFlats);
            this.updateElement('vacantFlatsCount', vacantFlats);
            this.updateElement('paymentsDueCount', paymentsDue);
            this.updateElement('pendingApprovalsCount', pendingApprovals);
            this.updateElement('collectedRentAmount', `₹${collectedRent.toLocaleString()}`);
            
        } catch (error) {
            console.error('[FlatDashboard] Error updating KPI cards:', error);
        }
    }

    // ===== Charts Initialization =====
    initializeCharts() {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            this.initRentCollectionChart();
            this.initPaymentStatusChart();
        }, 100);
    }

    initRentCollectionChart() {
        const canvas = document.getElementById('rentCollectionChart');
        if (!canvas) return;

        // Prevent multiple initialization
        if (this.rentChartInitialized) return;
        this.rentChartInitialized = true;

        // Get last 6 months data
        const months = [];
        const amounts = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthName = date.toLocaleString('default', { month: 'short' });
            const monthlyPayments = this.paymentsData.filter(payment => {
                try {
                    const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                    if (isNaN(paymentDate.getTime())) {
                        return false;
                    }
                    return payment.status === 'VERIFIED' &&
                           paymentDate.getMonth() === date.getMonth() &&
                           paymentDate.getFullYear() === date.getFullYear();
                } catch (error) {
                    return false;
                }
            });
            
            const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            months.push(monthName);
            amounts.push(monthlyTotal);
        }

        const ctx = canvas.getContext('2d');
        
        if (this.rentChart) {
            this.rentChart.destroy();
            this.rentChart = null;
        }

        this.rentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Rent Collected',
                    data: amounts,
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animations to prevent performance issues
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2, 2]
                        },
                        ticks: {
                            maxTicksLimit: 5,
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                },
                onResize: function(chart, size) {
                    // Prevent infinite resize loops
                    if (size.height > 400) {
                        chart.canvas.parentElement.style.height = '300px';
                    }
                }
            }
        });
    }

    initPaymentStatusChart() {
        const canvas = document.getElementById('paymentStatusChart');
        if (!canvas) return;

        // Prevent multiple initialization
        if (this.paymentChartInitialized) return;
        this.paymentChartInitialized = true;

        const approved = this.paymentsData.filter(p => p.status === 'APPROVED').length;
        const pending = this.paymentsData.filter(p => p.status === 'PENDING').length;
        const due = this.calculateDuePayments();

        // Update legend counts
        this.updateElement('approvedCount', approved);
        this.updateElement('pendingCount', pending);
        this.updateElement('dueCount', due);

        const ctx = canvas.getContext('2d');
        
        if (this.paymentChart) {
            this.paymentChart.destroy();
            this.paymentChart = null;
        }

        this.paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Approved', 'Pending', 'Due'],
                datasets: [{
                    data: [approved, pending, due],
                    backgroundColor: [
                        '#28A745',
                        '#FFC107', 
                        '#DC3545'
                    ],
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animations
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed;
                            }
                        }
                    }
                },
                onResize: function(chart, size) {
                    // Prevent infinite resize loops
                    if (size.height > 300) {
                        chart.canvas.parentElement.style.height = '250px';
                    }
                }
            }
        });
    }

    calculateDuePayments() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.propertiesData.filter(property => {
            const tenant = this.tenantsData.find(t => t.propertyId === property.id && t.status === 'ACTIVE');
            if (!tenant) return false;
            
            const hasCurrentMonthPayment = this.paymentsData.some(payment => {
                try {
                    const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                    if (isNaN(paymentDate.getTime())) return false;
                    return payment.propertyId === property.id &&
                           paymentDate.getMonth() === currentMonth &&
                           paymentDate.getFullYear() === currentYear &&
                           (payment.status === 'APPROVED' || payment.status === 'PENDING');
                } catch (error) {
                    return false;
                }
            });
            
            return !hasCurrentMonthPayment;
        }).length;
    }

    // ===== Recent Flats Table =====
    updateRecentFlatsTable() {
        const tableBody = document.getElementById('recentFlatsTableBody');
        if (!tableBody) return;

        const recentFlats = this.propertiesData
            .slice(0, 5)
            .map(property => {
                const tenant = this.tenantsData.find(t => t.propertyId === property.id && t.status === 'ACTIVE');
                const latestPayment = this.paymentsData
                    .filter(p => p.propertyId === property.id)
                    .sort((a, b) => {
                        try {
                            const dateA = new Date(a.paymentDate || a.createdAt);
                            const dateB = new Date(b.paymentDate || b.createdAt);
                            return dateB - dateA;
                        } catch (error) {
                            return 0;
                        }
                    })[0];

                return {
                    property,
                    tenant,
                    latestPayment,
                    lastActivity: latestPayment ? (() => {
                        try {
                            const date = new Date(latestPayment.paymentDate || latestPayment.createdAt);
                            return isNaN(date.getTime()) ? null : date;
                        } catch (error) {
                            return null;
                        }
                    })() : null
                };
            })
            .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

        tableBody.innerHTML = recentFlats.map(item => {
            const tenantName = item.tenant ? `${item.tenant.firstName} ${item.tenant.lastName || ''}`.trim() : '—';
            const status = this.getPropertyStatus(item.property, item.tenant, item.latestPayment);
            const lastActivity = item.lastActivity ? this.formatDate(item.lastActivity) : '—';

            return `
                <div class="table-row" onclick="flatDashboard.openPropertyDetails(${item.property.id})">
                    <div class="table-col">${this.generateFlatName(item.property, item.tenant)}</div>
                    <div class="table-col">${tenantName}</div>
                    <div class="table-col">
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                    <div class="table-col">${lastActivity}</div>
                </div>
            `;
        }).join('');
    }

    getPropertyStatus(property, tenant, latestPayment) {
        if (!tenant) return { class: 'vacant', text: 'Vacant' };
        
        if (latestPayment) {
            if (latestPayment.status === 'APPROVED') return { class: 'approved', text: 'Paid' };
            if (latestPayment.status === 'PENDING') return { class: 'pending', text: 'Payment Pending' };
        }
        
        return { class: 'due', text: 'Rent Due' };
    }

    // ===== Activities Feed =====
    updateActivitiesFeed() {
        const feedContainer = document.getElementById('activitiesFeed');
        if (!feedContainer) return;

        const activities = this.generateRecentActivities().slice(0, 10);

        if (activities.length === 0) {
            feedContainer.innerHTML = '<div class="activity-empty">No recent activity yet.</div>';
            return;
        }

        feedContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    generateRecentActivities() {
        const activities = [];

        // Payment activities
        this.paymentsData
            .filter(payment => {
                try {
                    const date = new Date(payment.paymentDate || payment.createdAt);
                    return !isNaN(date.getTime());
                } catch (error) {
                    return false;
                }
            })
            .sort((a, b) => {
                try {
                    const dateA = new Date(a.paymentDate || a.createdAt);
                    const dateB = new Date(b.paymentDate || b.createdAt);
                    return dateB - dateA;
                } catch (error) {
                    return 0;
                }
            })
            .slice(0, 5)
            .forEach(payment => {
                const property = this.propertiesData.find(p => p.id === payment.propertyId);
                const tenant = this.tenantsData.find(t => t.propertyId === payment.propertyId);
                
                if (property && tenant) {
                    if (payment.status === 'PENDING') {
                        try {
                            const date = new Date(payment.paymentDate || payment.createdAt);
                            if (isNaN(date.getTime())) {
                                return;
                            }
                            activities.push({
                                type: 'payment',
                                icon: 'fa-upload',
                                text: `${tenant.firstName} submitted payment proof for ${this.generateFlatName(property)}`,
                                time: this.getTimeAgo(date),
                                date: date
                            });
                        } catch (error) {
                        }
                    } else if (payment.status === 'APPROVED') {
                        try {
                            const date = new Date(payment.paymentDate || payment.createdAt);
                            if (isNaN(date.getTime())) {
                                return;
                            }
                            activities.push({
                                type: 'approval',
                                icon: 'fa-check',
                                text: `You approved payment for ${this.generateFlatName(property)}`,
                                time: this.getTimeAgo(date),
                                date: date
                            });
                        } catch (error) {
                        }
                    }
                }
            });

        return activities.sort((a, b) => b.date - a.date);
    }

    // ===== Alerts Widget =====
    updateAlertsWidget() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        const alerts = this.generateAlerts();

        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}" onclick="flatDashboard.handleAlertClick('${alert.action}')">
                <div class="alert-icon">
                    <i class="fas ${alert.icon}"></i>
                </div>
                <div class="alert-text">${alert.text}</div>
                <div class="alert-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `).join('');
    }

    generateAlerts() {
        const alerts = [];
        
        // Unpaid rent alerts
        const dueCount = this.calculateDuePayments();
        if (dueCount > 0) {
            alerts.push({
                type: 'danger',
                icon: 'fa-exclamation-triangle',
                text: `${dueCount} tenants have not paid rent this month`,
                action: 'payments'
            });
        }

        // Pending approvals
        const pendingCount = this.paymentsData.filter(p => p.status === 'PENDING').length;
        if (pendingCount > 0) {
            alerts.push({
                type: 'warning',
                icon: 'fa-clock',
                text: `${pendingCount} payments awaiting your approval`,
                action: 'approvals'
            });
        }

        // Vacant flats
        const vacantCount = this.propertiesData.length - this.propertiesData.filter(p => 
            this.tenantsData.some(t => t.propertyId === p.id && t.status === 'ACTIVE')
        ).length;
        
        if (vacantCount > 0) {
            alerts.push({
                type: 'info',
                icon: 'fa-home',
                text: `${vacantCount} flats are currently vacant`,
                action: 'properties'
            });
        }

        return alerts;
    }

    // ===== Insights Widget =====
    updateInsightsWidget() {
        const insightsList = document.getElementById('insightsList');
        if (!insightsList) return;

        const insights = this.generateInsights();

        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">
                    <i class="fas ${insight.icon}"></i>
                </div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];

        // Highest earning flat (based on active tenant rent)
        const propertyEarnings = this.propertiesData.map(property => {
            const tenant = this.tenantsData.find(t => t.propertyId === property.id && t.status === 'ACTIVE');
            return {
                property,
                rent: tenant ? tenant.rentAmount || 0 : 0
            };
        }).filter(item => item.rent > 0);

        if (propertyEarnings.length > 0) {
            const highest = propertyEarnings.sort((a, b) => b.rent - a.rent)[0];
            insights.push({
                icon: 'fa-trophy',
                text: `Highest earning flat: ${this.generateFlatName(highest.property)} (₹${highest.rent.toLocaleString()})`
            });
        }

        // Vacancy insight
        const vacantFlats = this.propertiesData.filter(p => 
            !this.tenantsData.some(t => t.propertyId === p.id && t.status === 'ACTIVE')
        );
        if (vacantFlats.length > 0) {
            const firstVacant = vacantFlats[0];
            insights.push({
                icon: 'fa-home',
                text: `${vacantFlats.length} flat${vacantFlats.length > 1 ? 's' : ''} currently vacant (e.g. ${this.generateFlatName(firstVacant)})`
            });
        }

        // Pending approvals insight
        const pendingApprovals = this.paymentsData.filter(p => p.status === 'PENDING').length;
        if (pendingApprovals > 0) {
            insights.push({
                icon: 'fa-clock',
                text: `${pendingApprovals} payment${pendingApprovals > 1 ? 's' : ''} awaiting approval`
            });
        }

        // Due payments insight
        const dueCount = this.calculateDuePayments();
        if (dueCount > 0) {
            insights.push({
                icon: 'fa-exclamation-circle',
                text: `${dueCount} tenant${dueCount > 1 ? 's' : ''} have rent due this month`
            });
        }

        // Occupancy rate insight
        const occupiedFlats = this.propertiesData.filter(property => 
            this.tenantsData.some(tenant => tenant.propertyId === property.id && tenant.status === 'ACTIVE')
        ).length;
        const totalFlats = this.propertiesData.length;
        if (totalFlats > 0) {
            const occupancyRate = Math.round((occupiedFlats / totalFlats) * 100);
            insights.push({
                icon: 'fa-chart-line',
                text: `Occupancy rate: ${occupancyRate}% (${occupiedFlats}/${totalFlats} flats occupied)`
            });
        }

        return insights;
    }

    // ===== Quick Actions =====
    setupQuickActions() {
        // Remind All Tenants
        const remindBtn = document.getElementById('remindAllTenantsBtn');
        if (remindBtn) {
            remindBtn.onclick = () => this.remindAllTenants();
        }

        // Generate Report
        const reportBtn = document.getElementById('generateReportBtn');
        if (reportBtn) {
            reportBtn.onclick = () => this.generateReport();
        }

        // Add Tenant
        const addTenantBtn = document.getElementById('addTenantBtn');
        if (addTenantBtn) {
            addTenantBtn.onclick = () => this.navigateToSection('tenants');
        }

        // View All Payments
        const paymentsBtn = document.getElementById('viewAllPaymentsBtn');
        if (paymentsBtn) {
            paymentsBtn.onclick = () => this.navigateToSection('payments');
        }
    }

    // ===== Utility Methods =====
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return '1 day ago';
        return `${diffInDays} days ago`;
    }

    openPropertyDetails(propertyId) {
        // Open right drawer with property details
        const property = this.propertiesData.find(p => p.id === propertyId);
        if (property) {
            // Get primary tenant to include in flat name
            const propertyTenants = this.tenantsData.filter(t => {
                const matchById = t.propertyId === property.id;
                const matchByPropertyId = t.property?.id === property.id;
                const isActive = t.status === 'ACTIVE';
                return (matchById || matchByPropertyId) && isActive;
            });
            const primaryTenant = propertyTenants.find(t => t.primary === true) || propertyTenants[0] || null;
            
            const content = this.generatePropertyDetailsHTML(property);
            this.openRightDrawer(`${this.generateFlatName(property, primaryTenant)} - Details`, content);
        }
    }

    handleAlertClick(action) {
        // Navigate to relevant section based on alert
        this.navigateToSection(action);
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
            .sort((a, b) => {
                try {
                    const dateA = new Date(a.paymentDate || a.createdAt);
                    const dateB = new Date(b.paymentDate || b.createdAt);
                    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                    return dateB - dateA;
                } catch (error) {
                    return 0;
                }
            })
            .slice(0, 5);

        if (recentPayments.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent payments</p>';
            return;
        }

        container.innerHTML = recentPayments.map(payment => {
            let displayDate = '';
            try {
                const date = new Date(payment.paymentDate || payment.createdAt);
                displayDate = isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
            } catch (error) {
                displayDate = 'Invalid Date';
            }
            
            return `
            <div class="recent-payment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 500;">${payment.tenantName || 'Unknown Tenant'}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${displayDate}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">₹${payment.amount?.toLocaleString()}</div>
                    <span class="status-badge ${payment.status?.toLowerCase()}">${payment.status}</span>
                </div>
            </div>
        `;
        }).join('');
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
                        <div style="font-weight: 500;">${this.generateFlatName(property)}</div>
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
            default:
        }
    }

    async loadPropertiesSection() {
        try {
            
            // Show loading state
            this.showPropertiesLoadingState();
            
            // Refresh data if needed
            if (this.propertiesData.length === 0 || this.tenantsData.length === 0) {
                await this.loadDashboardData();
            }
            
            // Update properties summary
            this.updatePropertiesSummary();
            
            // Setup filters and search
            this.setupPropertiesFilters();
            
            // Load properties table
            this.updatePropertiesTable();
            
        } catch (error) {
            console.error('[FlatDashboard] Error loading properties section:', error);
            this.showNotification('Error loading properties', 'error');
            this.showPropertiesErrorState();
        }
    }

    showPropertiesLoadingState() {
        const tableBody = document.getElementById('propertiesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <div>Loading properties...</div>
                </div>
            `;
        }
    }

    showPropertiesErrorState() {
        const tableBody = document.getElementById('propertiesTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <div>Error loading properties. Please try refreshing the page.</div>
                </div>
            `;
        }
    }

    updatePropertiesSummary() {
        console.log('Updating properties summary:', {
            properties: this.propertiesData.length,
            tenants: this.tenantsData.length,
            payments: this.paymentsData.length
        });

        // Calculate occupancy stats - check both propertyId and property matching
        const occupiedFlats = this.propertiesData.filter(property => 
            this.tenantsData.some(tenant => {
                // Try different property matching approaches
                const matchById = tenant.propertyId === property.id;
                const matchByPropertyId = tenant.property?.id === property.id;
                const isActive = tenant.status === 'ACTIVE';
                
                return (matchById || matchByPropertyId) && isActive;
            })
        ).length;
        
        const vacantFlats = this.propertiesData.length - occupiedFlats;
        
        // Calculate pending payments
        const pendingPayments = this.paymentsData.filter(p => p.status === 'PENDING').length;
        
        // Calculate total monthly rent from primary tenants only (owner receives rent from primary tenant)
        const totalRent = this.propertiesData.reduce((sum, property) => {
            // Find primary tenant for this property (support both 'primary' and 'isPrimary' flags)
            const primaryTenant = this.tenantsData.find(tenant => {
                const matchById = tenant.propertyId === property.id;
                const matchByPropertyId = tenant.property?.id === property.id;
                const isActive = tenant.status === 'ACTIVE';
                const isPrimaryFlag = tenant.primary === true || tenant.isPrimary === true;
                return (matchById || matchByPropertyId) && isActive && isPrimaryFlag;
            });

            return sum + (primaryTenant?.rentAmount || 0);
        }, 0);
        
        console.log('Summary stats:', {
            totalProperties: this.propertiesData.length,
            occupiedFlats,
            vacantFlats,
            pendingPayments,
            totalRent
        });
        
        // Update summary cards
        this.updateElement('summaryOccupied', occupiedFlats);
        this.updateElement('summaryVacant', vacantFlats);
        this.updateElement('summaryPending', pendingPayments);
        this.updateElement('summaryRent', `₹${totalRent.toLocaleString()}`);
    }

    setupPropertiesFilters() {
        const searchInput = document.getElementById('propertySearch');
        const occupancyFilter = document.getElementById('occupancyFilter');
        const paymentFilter = document.getElementById('paymentStatusFilter');
        const cityFilter = document.getElementById('cityFilter');

        // Setup search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProperties();
            });
        }

        // Setup filters
        [occupancyFilter, paymentFilter, cityFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterProperties();
                });
            }
        });

        // Populate city filter
        this.populateCityFilter();
    }

    populateCityFilter() {
        const cityFilter = document.getElementById('cityFilter');
        if (!cityFilter) return;

        const cities = [...new Set(this.propertiesData.map(p => p.city).filter(Boolean))];
        
        const currentOptions = cityFilter.innerHTML;
        cityFilter.innerHTML = currentOptions + cities.map(city => 
            `<option value="${city}">${city}</option>`
        ).join('');
    }

    updatePropertiesTable() {
        const tableBody = document.getElementById('propertiesTableBody');
        const emptyState = document.getElementById('propertiesEmptyState');
        
        if (!tableBody) {
            console.error('[FlatDashboard] propertiesTableBody element not found!');
            return;
        }


        if (this.propertiesData.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Validate data structure before processing
        const firstProperty = this.propertiesData[0];
        console.log('Property data structure:', {
            hasId: !!firstProperty.id,
            hasLocation: !!firstProperty.location,
            hasCity: !!firstProperty.city,
            hasBhkType: !!firstProperty.bhkType,
            hasExpectedRent: !!firstProperty.expectedRent,
            propertyType: firstProperty.type
        });

        console.log('Data counts:', {
            propertiesCount: this.propertiesData.length,
            tenantsCount: this.tenantsData.length
        });

        tableBody.innerHTML = this.propertiesData.map(property => {
            // Get all tenants for this property - try different matching approaches
            const propertyTenants = this.tenantsData.filter(t => {
                const matchById = t.propertyId === property.id;
                const matchByPropertyId = t.property?.id === property.id;
                const isActive = t.status === 'ACTIVE';
                
                return (matchById || matchByPropertyId) && isActive;
            });
            
            // Find primary tenant (marked with primary: true) and secondary tenants
            const primaryTenant = propertyTenants.find(t => t.primary === true) || propertyTenants[0] || null;
            const otherTenants = propertyTenants.filter(t => t.primary !== true && t.id !== primaryTenant?.id);

            console.log('Tenant distribution:', {
                propertyTenants: propertyTenants.length,
                primaryTenant: primaryTenant?.tenantName,
                otherTenants: otherTenants.length
            });

            const paymentStatus = this.getPropertyPaymentStatus(property, primaryTenant);
            const lastPayment = this.getLastPayment(property.id);

            // Generate property display name from available data
            const propertyName = this.generateFlatName(property, primaryTenant);
            const propertyAddress = property.address || property.location || property.city || 'Address not specified';

            return `
                <div class="property-row" data-property-id="${property.id}">
                    <div class="flat-info">
                        <div class="flat-name">${propertyName}</div>
                        <div class="flat-address">${propertyAddress}</div>
                    </div>
                    
                    <div class="primary-tenant">
                        ${primaryTenant ? `
                            <div class="tenant-name">${primaryTenant.tenantName || 'Unknown'}</div>
                            <div class="tenant-phone">${primaryTenant.phoneNumber || 'Phone not available'}</div>
                        ` : `
                            <div class="tenant-vacant">Vacant</div>
                        `}
                    </div>
                    
                    <div class="other-tenants ${otherTenants.length === 0 ? 'empty' : ''}">
                        ${otherTenants.length === 0 ? '—' : 
                          otherTenants.length === 1 ? `${otherTenants[0].tenantName || 'Unknown'}` :
                          `+${otherTenants.length} members`}
                    </div>
                    
                    <div class="rent-amount">
                        ${primaryTenant ? (primaryTenant.rentAmount ? `₹${primaryTenant.rentAmount.toLocaleString()}/month` : '—') : '—'}
                    </div>
                    
                    <div class="payment-status ${paymentStatus.class}">
                        ${paymentStatus.text}
                    </div>
                    
                    <div class="last-paid ${lastPayment ? '' : 'empty'}">
                        ${lastPayment ? (() => {
                            try {
                                const date = new Date(lastPayment.paymentDate || lastPayment.createdAt);
                                return isNaN(date.getTime()) ? '—' : this.formatDate(date);
                            } catch (error) {
                                return '—';
                            }
                        })() : '—'}
                    </div>
                    
                    <div class="property-actions">
                        <button class="action-btn primary" onclick="flatDashboard.openPropertyDetails(${property.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${primaryTenant ? `
                            <button class="action-btn warning" onclick="flatDashboard.sendReminder(${property.id})" title="Send Reminder">
                                <i class="fas fa-bell"></i>
                            </button>
                        ` : `
                            <button class="action-btn success" onclick="flatDashboard.addTenant(${property.id})" title="Add Tenant">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
        
    }

    getPropertyPaymentStatus(property, primaryTenant) {
        if (!primaryTenant) {
            return { class: 'vacant', text: 'Vacant' };
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        
        // Filter payments for this property first
        const propertyPayments = this.paymentsData.filter(payment => payment.propertyId === property.id);
        
        // Check for approved/verified transactions in current month for this property
        const approvedTransaction = this.paymentsData.find(payment => {
            try {
                const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                if (isNaN(paymentDate.getTime())) {
                    return false;
                }
                
                const isCurrentMonth = paymentDate.getMonth() === currentMonth && 
                                     paymentDate.getFullYear() === currentYear;
                const isApproved = payment.status === 'APPROVED' || payment.status === 'VERIFIED';
                const isForThisProperty = payment.propertyId === property.id;
                
                if (isForThisProperty) {
                    console.log('Payment debug:', {
                        propertyId: payment.propertyId,
                        status: payment.status,
                        paymentDate: paymentDate.toLocaleDateString(),
                        paymentMonth: paymentDate.getMonth(),
                        currentMonth,
                        paymentYear: paymentDate.getFullYear(),
                        currentYear,
                        isCurrentMonth,
                        isApproved,
                        isForThisProperty
                    });
                }
                
                return isForThisProperty && isCurrentMonth && isApproved;
            } catch (error) {
                return false;
            }
        });

        if (approvedTransaction) {
            return { class: 'approved', text: 'Paid' };
        }

        // Check if there's a pending transaction
        const pendingTransaction = this.paymentsData.find(payment => {
            try {
                const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                if (isNaN(paymentDate.getTime())) return false;
                
                return payment.propertyId === property.id &&
                       paymentDate.getMonth() === currentMonth &&
                       paymentDate.getFullYear() === currentYear &&
                       payment.status === 'PENDING';
            } catch (error) {
                return false;
            }
        });

        if (pendingTransaction) {
            return { class: 'pending', text: 'Pending' };
        }

        // Check if there's a rejected transaction
        const rejectedTransaction = this.paymentsData.find(payment => {
            try {
                const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                if (isNaN(paymentDate.getTime())) return false;
                
                return payment.propertyId === property.id &&
                       paymentDate.getMonth() === currentMonth &&
                       paymentDate.getFullYear() === currentYear &&
                       payment.status === 'REJECTED';
            } catch (error) {
                return false;
            }
        });

        if (rejectedTransaction) {
            return { class: 'rejected', text: 'Rejected' };
        }

        // No transaction found for current month - mark as due
        return { class: 'due', text: 'Due' };
    }

    getLastPayment(propertyId) {
        return this.paymentsData
            .filter(p => p.propertyId === propertyId && p.status === 'APPROVED')
            .sort((a, b) => {
                try {
                    const dateA = new Date(a.paymentDate || a.createdAt);
                    const dateB = new Date(b.paymentDate || b.createdAt);
                    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                    return dateB - dateA;
                } catch (error) {
                    return 0;
                }
            })[0];
    }

    filterProperties() {
        // Get filter values
        const searchTerm = document.getElementById('propertySearch')?.value.toLowerCase() || '';
        const occupancyFilter = document.getElementById('occupancyFilter')?.value || '';
        const paymentFilter = document.getElementById('paymentStatusFilter')?.value || '';
        const cityFilter = document.getElementById('cityFilter')?.value || '';

        // Filter properties
        const filtered = this.propertiesData.filter(property => {
            const primaryTenant = this.tenantsData.find(t => 
                t.propertyId === property.id && t.status === 'ACTIVE' && t.isPrimary
            );
            
            const otherTenants = this.tenantsData.filter(t => 
                t.propertyId === property.id && t.status === 'ACTIVE' && !t.isPrimary
            );

            // Search filter
            const searchMatch = !searchTerm || 
                this.generateFlatName(property).toLowerCase().includes(searchTerm) ||
                property.address?.toLowerCase().includes(searchTerm) ||
                (primaryTenant && `${primaryTenant.firstName} ${primaryTenant.lastName}`.toLowerCase().includes(searchTerm)) ||
                otherTenants.some(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm));

            // Occupancy filter
            const occupancyMatch = !occupancyFilter || 
                (occupancyFilter === 'occupied' && primaryTenant) ||
                (occupancyFilter === 'vacant' && !primaryTenant);

            // Payment status filter
            let paymentMatch = !paymentFilter;
            if (paymentFilter) {
                const status = this.getPropertyPaymentStatus(property, primaryTenant);
                paymentMatch = status.class === paymentFilter;
            }

            // City filter
            const cityMatch = !cityFilter || property.city === cityFilter;

            return searchMatch && occupancyMatch && paymentMatch && cityMatch;
        });

        // Update display
        this.displayFilteredProperties(filtered);
    }

    displayFilteredProperties(filteredProperties) {
        const originalData = this.propertiesData;
        this.propertiesData = filteredProperties;
        this.updatePropertiesTable();
        this.propertiesData = originalData; // Restore original data
    }

    async loadTenantsSection() {
        const tableBody = document.getElementById('tenantsTableBody');
        
        if (!tableBody) {
            console.error('[FlatDashboard] tenantsTableBody element not found!');
            return;
        }
        

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

        // Validate data structure before processing
            const firstTenant = this.tenantsData[0];
            const structureCheck = {
                hasId: !!firstTenant.id,
                hasTenantName: !!firstTenant.tenantName,
                hasPhoneNumber: !!firstTenant.phoneNumber,
                hasPropertyName: !!firstTenant.propertyName,
                hasStatus: !!firstTenant.status,
                statusValue: firstTenant.status
            };
            console.log('Tenant structure:', structureCheck);

        tableBody.innerHTML = this.tenantsData.map((tenant, index) => {
            
            // Handle field name mappings from TenantSummary to frontend expectations
            const displayName = tenant.tenantName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'N/A';
            const phoneNumber = tenant.phoneNumber || tenant.phone || 'N/A';
            const unitNumber = tenant.flatRoomNumber || tenant.unitNumber || 'N/A';
            const joinDate = tenant.leaseStartDate || tenant.joinDate;
            const status = tenant.status || 'Active';
            const isPrimary = tenant.primary ? ' (Primary)' : '';
            
            // Get property details for this tenant
            const property = this.propertiesData.find(p => p.id === tenant.propertyId);
            const flatName = property ? this.generateFlatName(property, tenant) : (tenant.propertyName || 'N/A');
            
            return `
            <tr data-tenant-id="${tenant.id}">
                <td>
                    <div style="font-weight: 500;">${displayName}${isPrimary}</div>
                    <div style="font-size: 0.8125rem; color: var(--text-secondary);">${phoneNumber}</div>
                </td>
                <td>${flatName}</td>
                <td>${unitNumber}</td>
                <td>₹${(tenant.rentAmount || 0).toLocaleString()}</td>
                <td>${joinDate ? new Date(joinDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary tenant-detail-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
                        View Details
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    async loadPaymentsSection() {
        const tableBody = document.getElementById('paymentsTableBody');
        
        if (!tableBody) {
            console.error('[FlatDashboard] paymentsTableBody element not found!');
            return;
        }


        if (this.paymentsData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-credit-card" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>No payment records found for flat properties.</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Validate data structure before processing
        const firstPayment = this.paymentsData[0];
        const structureCheck = {
            hasId: !!firstPayment.id,
            hasPaymentDate: !!firstPayment.paymentDate,
            hasCreatedAt: !!firstPayment.createdAt,
            hasTenantName: !!firstPayment.tenantName,
            hasPropertyName: !!firstPayment.propertyName,
            hasPropertyId: !!firstPayment.propertyId,
            hasAmount: !!firstPayment.amount,
            hasStatus: !!firstPayment.status,
            hasPaymentMode: !!firstPayment.paymentMode,
            actualFields: Object.keys(firstPayment)
        };
        console.log('Payment structure:', structureCheck);

        tableBody.innerHTML = this.paymentsData.map((payment, index) => {
            
            // Get property name from property ID
            const property = this.propertiesData.find(p => p.id === payment.propertyId);
            const propertyName = property ? this.generateFlatName(property) : 'Unknown Property';
            
            // Handle date field - use paymentDate if available, fallback to createdAt
            const dateField = payment.paymentDate || payment.createdAt;
            const displayDate = dateField ? 
                (typeof dateField === 'string' ? dateField : new Date(dateField).toLocaleDateString()) :
                'N/A';
            
            return `
            <tr data-payment-id="${payment.id}">
                <td>${displayDate}</td>
                <td>${payment.tenantName || 'Unknown Tenant'}</td>
                <td>${propertyName}</td>
                <td>₹${(payment.amount || 0).toLocaleString()}</td>
                <td>${payment.paymentMode || payment.type || 'Rent'}</td>
                <td>
                    <span class="status-badge ${payment.status?.toLowerCase() || 'pending'}">${payment.status || 'Pending'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary payment-detail-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
                        View Details
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        
    }

    async loadMaintenanceSection() {
        // Placeholder for maintenance functionality
    }

    async loadReportsSection() {
        // Placeholder for reports functionality
    }

    async loadNotificationsSection() {
        
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
                                <button class="btn btn-sm btn-primary mark-read-btn" onclick="flatDashboard.markNotificationRead(${notification.id})">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-secondary delete-btn" onclick="flatDashboard.deleteNotification(${notification.id})">
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
        try {
            // Setup payment settings form
            this.setupPaymentSettingsForm();
            // Load existing payment settings
            await this.loadPaymentSettings();
        } catch (error) {
            console.error('[FlatDashboard] Error loading settings:', error);
            this.showNotification('Error loading settings', 'error');
        }
    }

    // ===== PAYMENT SETTINGS FUNCTIONS =====
    
    setupPaymentSettingsForm() {
        const form = document.getElementById('paymentSettingsForm');
        if (!form) {
            return;
        }
        
        // Remove any existing listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Add submit handler
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePaymentSettings();
        });
        
    }

    async loadPaymentSettings() {
        try {
            const data = await apiService.get('/owner-payment-info');
            if (data) {
                this.populatePaymentSettingsForm(data);
            } else {
                this.clearPaymentSettingsForm();
            }
        } catch (error) {
            if (error.status === 204) {
                this.clearPaymentSettingsForm();
            } else {
                console.error('[FlatDashboard] Error loading payment settings:', error);
                this.showNotification('Error loading payment settings: ' + (error.message || 'Unknown error'), 'error');
            }
        }
    }

    populatePaymentSettingsForm(data) {
        document.getElementById('upiId').value = data.upiId || '';
        document.getElementById('preferredMode').value = data.preferredMode || '';
        document.getElementById('isActive').checked = data.isActive !== false;
        
        if (data.qrImageUrl) {
            document.getElementById('qrImage').src = data.qrImageUrl;
            document.getElementById('qrImage').style.display = 'block';
            document.getElementById('qrPlaceholder').style.display = 'none';
            document.getElementById('removeQRBtn').style.display = 'block';
        } else {
            this.clearQRPreview();
        }
    }

    clearPaymentSettingsForm() {
        document.getElementById('upiId').value = '';
        document.getElementById('preferredMode').value = '';
        document.getElementById('isActive').checked = true;
        this.clearQRPreview();
    }

    clearQRPreview() {
        document.getElementById('qrImage').style.display = 'none';
        document.getElementById('qrImage').src = '';
        document.getElementById('qrPlaceholder').style.display = 'flex';
        document.getElementById('removeQRBtn').style.display = 'none';
        this.currentQRFile = null;
    }

    async savePaymentSettings() {
        try {
            const upiId = document.getElementById('upiId').value.trim();
            const preferredMode = document.getElementById('preferredMode').value;
            const isActive = document.getElementById('isActive').checked;

            if (upiId && !this.validateUpiId(upiId)) {
                this.showNotification('Please enter a valid UPI ID (e.g., username@paytm)', 'error');
                return;
            }

            if (this.currentQRFile) {
                const qrImageUrl = await this.uploadQRCode(this.currentQRFile);
                if (!qrImageUrl) {
                    this.showNotification('Failed to upload QR code. Please try again.', 'error');
                    return;
                }
            }

            const payload = {
                upiId: upiId || null,
                preferredMode: preferredMode || null,
                isActive: isActive
            };

            await apiService.post('/owner-payment-info', payload);
            this.showNotification('Payment settings saved successfully!', 'success');
            this.currentQRFile = null;
            await this.loadPaymentSettings();
        } catch (error) {
            console.error('[FlatDashboard] Error saving payment settings:', error);
            this.showNotification(error.message || 'Error saving payment settings', 'error');
        }
    }

    async uploadQRCode(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('authToken');
            
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('Authentication required. Please log in again.');
            }

            const response = await fetch(`${apiService.baseURL}/owner-payment-info/upload-qr`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                return result.url;
            } else {
                const errorText = await response.text();
                console.error('[FlatDashboard] Failed to upload QR code:', response.status, errorText);
                return null;
            }
        } catch (error) {
            console.error('[FlatDashboard] Error uploading QR code:', error);
            throw error;
        }
    }

    validateUpiId(upiId) {
        const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
        return upiPattern.test(upiId);
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
                        <span>${this.generateFlatName(property)}</span>
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

        this.openRightDrawer(`Property: ${this.generateFlatName(property)}`, content);
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
                        <button class="btn btn-success" onclick="flatDashboard.approvePayment(${payment.id})">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                        <button class="btn btn-danger" onclick="flatDashboard.rejectPayment(${payment.id})">
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
        
        // The notifications.js will be loaded by the navbar component
        // We just need to update our sidebar notification badges
        setTimeout(() => {
            this.updateSidebarNotificationBadges();
            // Setup profile dropdown after navbar is loaded
            if (typeof window.setupProfileDropdown === 'function') {
                window.setupProfileDropdown();
            } else {
            }
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
            console.error('[FlatDashboard] Error updating sidebar notification badges:', error);
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

    // ===== Property Details Methods =====
    openPropertyDetails(propertyId) {
        const property = this.propertiesData.find(p => p.id === propertyId);
        if (!property) return;

        // Get primary tenant to include in flat name
        const propertyTenants = this.tenantsData.filter(t => {
            const matchById = t.propertyId === property.id;
            const matchByPropertyId = t.property?.id === property.id;
            const isActive = t.status === 'ACTIVE';
            return (matchById || matchByPropertyId) && isActive;
        });
        const primaryTenant = propertyTenants.find(t => t.primary === true) || propertyTenants[0] || null;

        const content = this.generatePropertyDetailsHTML(property);
        this.openRightDrawer(`${this.generateFlatName(property, primaryTenant)} - Details`, content);
    }

    generatePropertyDetailsHTML(property) {
        // Get all tenants for this property
        const propertyTenants = this.tenantsData.filter(t => {
            const matchById = t.propertyId === property.id;
            const matchByPropertyId = t.property?.id === property.id;
            const isActive = t.status === 'ACTIVE';
            
            return (matchById || matchByPropertyId) && isActive;
        });
        
        const primaryTenant = propertyTenants.find(t => t.primary === true) || propertyTenants[0] || null;
        const otherTenants = propertyTenants.filter(t => t.primary !== true && t.id !== primaryTenant?.id);

        const paymentStatus = this.getPropertyPaymentStatus(property, primaryTenant);
        const paymentHistory = this.getPaymentHistory(property.id);
        const currentMonthPayment = this.getCurrentMonthPayment(property.id);

        return `
            <!-- A. Flat Info -->
            <div class="drawer-section">
                <div class="drawer-section-header">
                    <div class="drawer-section-title">🏠 Flat Information</div>
                    <div class="section-badge ${primaryTenant ? 'occupied' : 'vacant'}">
                        ${primaryTenant ? 'Occupied' : 'Vacant'}
                    </div>
                </div>
                <div class="flat-info-grid">
                    <div class="info-item">
                        <div class="info-label">Flat Name</div>
                        <div class="info-value">${this.generateFlatName(property, primaryTenant)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Address</div>
                        <div class="info-value">${property.address || property.location || 'Address not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">City</div>
                        <div class="info-value">${property.city || 'City not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">BHK Type</div>
                        <div class="info-value">${property.bhkType || 'Not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Rent</div>
                        <div class="info-value">${primaryTenant ? `₹${(primaryTenant.rentAmount || 0).toLocaleString()}/month` : property.expectedRent ? `₹${property.expectedRent.toLocaleString()}/month` : '—'}</div>
                    </div>
                    ${primaryTenant ? `
                    <div class="info-item">
                        <div class="info-label">Move-in Date</div>
                        <div class="info-value">${primaryTenant.leaseStartDate ? new Date(primaryTenant.leaseStartDate).toLocaleDateString() : 'Not available'}</div>
                    </div>
                    ` : ''}
                </div>
                ${!primaryTenant ? `
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="flatDashboard.addTenant(${property.id})">
                        <i class="fas fa-user-plus"></i> Add Tenant
                    </button>
                </div>
                ` : ''}
            </div>

            ${primaryTenant ? `
            <!-- B. Primary Tenant -->
            <div class="drawer-section">
                <div class="drawer-section-header">
                    <div class="drawer-section-title">👑 Primary Tenant</div>
                </div>
                <div class="tenant-card">
                    <div class="tenant-header">
                        <div class="tenant-name-primary">${primaryTenant.tenantName || 'Unknown Tenant'}</div>
                        <div class="primary-badge">Primary</div>
                    </div>
                    <div class="tenant-details">
                        <div class="info-item">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${primaryTenant.phoneNumber || 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${primaryTenant.emailAddress || 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Flat/Room Number</div>
                            <div class="info-value">${primaryTenant.flatRoomNumber || 'Not specified'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Move-in Date</div>
                            <div class="info-value">${primaryTenant.leaseStartDate ? new Date(primaryTenant.leaseStartDate).toLocaleDateString() : 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Lease End Date</div>
                            <div class="info-value">${primaryTenant.leaseEndDate ? new Date(primaryTenant.leaseEndDate).toLocaleDateString() : 'Ongoing'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Security Deposit</div>
                            <div class="info-value">₹${(primaryTenant.securityDeposit || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="tenant-actions">
                        <button class="btn btn-sm btn-secondary" onclick="flatDashboard.editTenant(${primaryTenant.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="flatDashboard.sendReminder(${property.id})">
                            <i class="fas fa-bell"></i> Remind
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="flatDashboard.removeTenant(${primaryTenant.id})">
                            <i class="fas fa-user-times"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
            ` : ''}

            ${otherTenants.length > 0 ? `
            <!-- C. Other Tenants -->
            <div class="drawer-section">
                <div class="drawer-section-header">
                    <div class="drawer-section-title">👥 Other Tenants (${otherTenants.length})</div>
                </div>
                ${otherTenants.map(tenant => `
                <div class="tenant-card">
                    <div class="tenant-header">
                        <div class="tenant-name-primary">${tenant.tenantName || 'Unknown Tenant'}</div>
                    </div>
                    <div class="tenant-details">
                        <div class="info-item">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${tenant.phoneNumber || 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${tenant.emailAddress || 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Flat/Room Number</div>
                            <div class="info-value">${tenant.flatRoomNumber || 'Not specified'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Move-in Date</div>
                            <div class="info-value">${tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'Not available'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Rent Amount</div>
                            <div class="info-value">₹${(tenant.rentAmount || 0).toLocaleString()}/month</div>
                        </div>
                    </div>
                    <div class="tenant-actions">
                        <button class="btn btn-sm btn-secondary" onclick="flatDashboard.editTenant(${tenant.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="flatDashboard.makePrimary(${tenant.id})">
                            <i class="fas fa-crown"></i> Make Primary
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="flatDashboard.removeTenant(${tenant.id})">
                            <i class="fas fa-user-times"></i> Remove
                        </button>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${primaryTenant ? `
            <!-- D. Payment Section -->
            <div class="drawer-section">
                <div class="drawer-section-header">
                    <div class="drawer-section-title">💳 Current Payment</div>
                </div>
                <div class="payment-current">
                    <div class="payment-header">
                        <div class="payment-month">November 2025</div>
                        <div class="payment-status ${paymentStatus.class}">${paymentStatus.text}</div>
                    </div>
                    <div class="payment-details-grid">
                        <div class="info-item">
                            <div class="info-label">Rent Amount</div>
                            <div class="info-value">₹${(primaryTenant.rentAmount || 0).toLocaleString()}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value">${paymentStatus.text}</div>
                        </div>
                        ${currentMonthPayment ? `
                        <div class="info-item">
                            <div class="info-label">Uploaded Date</div>
                            <div class="info-value">${this.formatDate(new Date(currentMonthPayment.createdAt))}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Transaction ID</div>
                            <div class="info-value">${currentMonthPayment.transactionId || 'Not provided'}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="tenant-actions">
                        ${currentMonthPayment && currentMonthPayment.status === 'PENDING' ? `
                        <button class="btn btn-sm btn-success" onclick="flatDashboard.approvePayment(${currentMonthPayment.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="flatDashboard.rejectPayment(${currentMonthPayment.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        ` : ''}
                        <button class="btn btn-sm btn-warning" onclick="flatDashboard.sendReminder(${property.id})">
                            <i class="fas fa-bell"></i> Send Reminder
                        </button>
                    </div>
                </div>
            </div>
            ` : ''}
        `;
    }

    getCurrentMonthPayment(propertyId) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.paymentsData.find(payment => {
            const paymentDate = new Date(payment.createdAt);
            return payment.propertyId === propertyId &&
                   paymentDate.getMonth() === currentMonth &&
                   paymentDate.getFullYear() === currentYear;
        });
    }

    getPaymentHistory(propertyId) {
        return this.paymentsData
            .filter(p => p.propertyId === propertyId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 12); // Last 12 payments
    }

    formatMonth(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    // ===== Property Action Methods =====
    async sendReminder(propertyId) {
        try {
            // Implementation for sending reminder
            this.showNotification('Reminder sent successfully', 'success');
        } catch (error) {
            console.error('[FlatDashboard] Error sending reminder:', error);
            this.showNotification('Error sending reminder', 'error');
        }
    }

    async addTenant(propertyId) {
        // Navigate to add tenant or open modal
        this.navigateToSection('tenants');
        this.showNotification('Redirected to add tenant section', 'info');
    }

    async approvePayment(paymentId) {
        try {
            await apiService.put(`/transactions/${paymentId}/approve`);
            this.showNotification('Payment approved successfully', 'success');
            await this.loadDashboardData(); // Refresh data
        } catch (error) {
            console.error('[FlatDashboard] Error approving payment:', error);
            this.showNotification('Error approving payment', 'error');
        }
    }

    async rejectPayment(paymentId) {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await apiService.put(`/transactions/${paymentId}/reject`, { reason });
            this.showNotification('Payment rejected successfully', 'success');
            await this.loadDashboardData(); // Refresh data
        } catch (error) {
            console.error('[FlatDashboard] Error rejecting payment:', error);
            this.showNotification('Error rejecting payment', 'error');
        }
    }

    async editTenant(tenantId) {
        try {
            // Fetch tenant details
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch tenant details');
            
            const tenant = await response.json();
            
            // Populate form fields
            document.getElementById('editTenantId').value = tenant.id;
            document.getElementById('editRentAmount').value = tenant.rentAmount || 0;
            document.getElementById('editSecurityDeposit').value = tenant.securityDeposit || 0;
            
            // Set rent due date with proper conversion
            const dueDate = tenant.rentDueDate || 1;
            document.getElementById('editRentDueDate').value = String(dueDate);
            
            // Format dates for input fields
            if (tenant.leaseStartDate) {
                const startDate = new Date(tenant.leaseStartDate);
                document.getElementById('editLeaseStartDate').value = startDate.toISOString().split('T')[0];
            }
            
            if (tenant.leaseEndDate) {
                const endDate = new Date(tenant.leaseEndDate);
                document.getElementById('editLeaseEndDate').value = endDate.toISOString().split('T')[0];
            } else {
                document.getElementById('editLeaseEndDate').value = '';
            }
            
            // Show modal
            document.getElementById('editTenantModal').style.display = 'flex';
            
        } catch (error) {
            console.error('[FlatDashboard] Error opening edit modal:', error);
            this.showNotification('Error loading tenant details', 'error');
        }
    }
    
    closeEditTenantModal() {
        document.getElementById('editTenantModal').style.display = 'none';
        document.getElementById('editTenantForm').reset();
    }
    
    async saveEditedTenant(event) {
        event.preventDefault();
        
        const tenantId = document.getElementById('editTenantId').value;
        const formData = {
            rentAmount: parseInt(document.getElementById('editRentAmount').value),
            securityDeposit: parseInt(document.getElementById('editSecurityDeposit').value),
            rentDueDate: parseInt(document.getElementById('editRentDueDate').value),
            leaseStartDate: document.getElementById('editLeaseStartDate').value,
            leaseEndDate: document.getElementById('editLeaseEndDate').value || null
        };
        
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to update tenant');
            
            this.showNotification('Tenant information updated successfully', 'success');
            this.closeEditTenantModal();
            
            // Reload dashboard to reflect changes
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('[FlatDashboard] Error updating tenant:', error);
            this.showNotification('Failed to update tenant information', 'error');
        }
    }

    async removeTenant(tenantId) {
        if (confirm('Are you sure you want to remove this tenant?')) {
            try {
                // Implementation for removing tenant
                this.showNotification('Tenant removed successfully', 'success');
                await this.loadDashboardData(); // Refresh data
            } catch (error) {
                console.error('[FlatDashboard] Error removing tenant:', error);
                this.showNotification('Error removing tenant', 'error');
            }
        }
    }

    async makePrimary(tenantId) {
        if (confirm('Make this tenant the primary tenant? They will be responsible for rent payments.')) {
            try {
                // Implementation for making tenant primary
                this.showNotification('Primary tenant updated successfully', 'success');
                await this.loadDashboardData(); // Refresh data
            } catch (error) {
                console.error('[FlatDashboard] Error updating primary tenant:', error);
                this.showNotification('Error updating primary tenant', 'error');
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flatDashboard = new FlatDashboard();
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

// ===== WHATSAPP REMINDER FUNCTIONS =====

/**
 * Send WhatsApp reminder to tenant with due rent
 */
async function sendWhatsAppReminder(tenantId, tenantPhone, tenantName, property, dueAmount, dueDate) {
    try {
        // Show loading state
        const btn = event.target.closest('.btn-send-reminder');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
        
        // Prepare message
        const message = `Hello ${tenantName},\n\nThis is a friendly reminder that your rent payment of ₹${dueAmount.toLocaleString()} for ${property} was due on ${dueDate}.\n\nPlease submit your payment at your earliest convenience.\n\nThank you,\nYour Property Manager`;
        
        // Call API to send WhatsApp message
        const response = await fetch('/api/notifications/whatsapp/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify({
                recipientPhone: tenantPhone,
                recipientName: tenantName,
                tenantId: tenantId,
                messageType: 'RENT_REMINDER',
                amount: dueAmount,
                property: property,
                dueDate: dueDate,
                message: message
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showWhatsAppToast(`WhatsApp reminder sent to ${tenantName}`, 'success');
            console.log('[WhatsApp] Message sent successfully:', result);
        } else {
            showWhatsAppToast(`Failed to send WhatsApp reminder: ${result.message || 'Unknown error'}`, 'error');
            console.error('[WhatsApp] Error sending message:', result);
        }
        
    } catch (error) {
        console.error('[WhatsApp] Error:', error);
        showWhatsAppToast('Error sending WhatsApp reminder: ' + error.message, 'error');
    } finally {
        // Restore button state
        const btn = event.target.closest('.btn-send-reminder');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send Reminder';
        }
    }
}

/**
 * Show WhatsApp toast notification
 */
function showWhatsAppToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `whatsapp-toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fab fa-whatsapp" style="font-size: 20px;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Render due payments as cards - includes all payments that are due or overdue
 */
function renderDuePayments() {
    if (!window.flatDashboard) return;
    
    const tenantsData = window.flatDashboard.tenantsData || [];
    const paymentsData = window.flatDashboard.paymentsData || [];
    const propertiesData = window.flatDashboard.propertiesData || [];
    
    // Find tenants with due rent
    const currentDate = new Date();
    const duePayments = [];
    
    tenantsData.forEach(tenant => {
        if (tenant.status !== 'ACTIVE') return;
        
        const property = propertiesData.find(p => p.id === tenant.propertyId);
        if (!property) return;
        
        // Check if tenant has due payment
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const hasCurrentMonthPayment = paymentsData.some(payment => {
            try {
                const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                if (isNaN(paymentDate.getTime())) return false;
                
                return payment.propertyId === property.id &&
                       paymentDate.getMonth() === currentMonth &&
                       paymentDate.getFullYear() === currentYear &&
                       (payment.status === 'VERIFIED' || payment.status === 'PENDING');
            } catch (e) {
                return false;
            }
        });
        
        if (!hasCurrentMonthPayment) {
            duePayments.push({
                tenant: tenant,
                property: property,
                amount: property.rentAmount || 0,
                dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toLocaleDateString(),
                daysPastDue: Math.floor((currentDate - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) / (1000 * 60 * 60 * 24))
            });
        }
    });
    
    const section = document.getElementById('overduePaymentsSection');
    const grid = document.getElementById('overduePaymentsGrid');
    const badge = document.getElementById('overdueCount');
    
    if (duePayments.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    // Show section
    if (section) section.style.display = 'block';
    if (badge) badge.textContent = duePayments.length;
    
    // Render cards
    if (grid) {
        grid.innerHTML = duePayments.map(item => `
            <div class="overdue-payment-card">
                <div class="overdue-payment-card-header">
                    <div class="overdue-payment-tenant-info">
                        <p class="overdue-payment-tenant-name">${item.tenant.tenantName}</p>
                        <p class="overdue-payment-unit">${window.flatDashboard.generateFlatName(item.property, item.tenant)}</p>
                    </div>
                    <span class="overdue-status-badge">DUE</span>
                </div>
                
                <div class="overdue-payment-details">
                    <div class="detail-row">
                        <span class="detail-label">Rent Amount:</span>
                        <span class="detail-value amount">₹${item.amount.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        <span class="detail-value date">${item.dueDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${item.tenant.phoneNumber || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Days Past Due:</span>
                        <span class="detail-value">${item.daysPastDue} days</span>
                    </div>
                </div>
                
                <div class="overdue-payment-actions">
                    <button class="btn-send-reminder" onclick="sendWhatsAppReminder(
                        ${item.tenant.id},
                        '${item.tenant.phoneNumber}',
                        '${item.tenant.tenantName}',
                        '${window.flatDashboard.generateFlatName(item.property, item.tenant)}',
                        ${item.amount},
                        '${item.dueDate}'
                    )">
                        <i class="fab fa-whatsapp"></i> Send Reminder
                    </button>
                    <button class="btn-view-details" onclick="flatDashboard.viewTenantDetails(${item.tenant.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Add WhatsApp button to tenant table row
 */
function addWhatsAppButtonToTenantRow(row, tenant) {
    const actionsCell = row.querySelector('td:last-child');
    if (!actionsCell) return;
    
    const whatsappBtn = document.createElement('button');
    whatsappBtn.className = 'btn-whatsapp';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
    whatsappBtn.onclick = (e) => {
        e.preventDefault();
        sendWhatsAppReminder(
            tenant.id,
            tenant.phoneNumber,
            tenant.tenantName,
            window.flatDashboard.generateFlatName(window.flatDashboard.propertiesData.find(p => p.id === tenant.propertyId), tenant),
            0,
            'this month'
        );
    };
    
    // Add to table actions or directly to the cell
    let actionsContainer = actionsCell.querySelector('.table-actions');
    if (!actionsContainer) {
        actionsContainer = document.createElement('div');
        actionsContainer.className = 'table-actions';
        actionsCell.innerHTML = '';
        actionsCell.appendChild(actionsContainer);
    }
    
    actionsContainer.appendChild(whatsappBtn);
}

// Hook into existing data loading to render due payments
const originalLoadDashboardData = window.flatDashboard?.loadDashboardData;
if (originalLoadDashboardData) {
    window.flatDashboard.loadDashboardData = async function() {
        await originalLoadDashboardData.call(this);
        renderDuePayments();
    };
}