/**
 * Flat Dashboard Debug Helper
 * Use these functions in the browser console to debug issues
 */

window.debugFlatDashboard = {
    // Check if tenant data is loaded
    checkTenantData: function() {
        console.log('=== TENANT DATA DEBUG ===');
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        console.log('✅ Dashboard found');
        console.log('📊 Tenant data count:', dashboard.tenantsData?.length || 0);
        console.log('📋 Tenant data sample:', dashboard.tenantsData?.slice(0, 2) || []);
        
        // Check if data has expected fields
        if (dashboard.tenantsData?.length > 0) {
            const firstTenant = dashboard.tenantsData[0];
            console.log('🔍 Field mapping analysis:');
            console.log('  - tenantName:', firstTenant.tenantName || 'Missing');
            console.log('  - phoneNumber:', firstTenant.phoneNumber || 'Missing');  
            console.log('  - propertyName:', firstTenant.propertyName || 'Missing');
            console.log('  - flatRoomNumber:', firstTenant.flatRoomNumber || 'Missing');
            console.log('  - rentAmount:', firstTenant.rentAmount || 'Missing');
            console.log('  - leaseStartDate:', firstTenant.leaseStartDate || 'Missing');
            console.log('  - status:', firstTenant.status || 'Missing');
            console.log('  - primary:', firstTenant.primary || false);
        }
        
        // Check table element
        const tableBody = document.getElementById('tenantsTableBody');
        if (tableBody) {
            console.log('✅ tenantsTableBody element found');
            console.log('📝 Current table content:', tableBody.innerHTML ? 'Has content' : 'Empty');
            console.log('📏 Table content length:', tableBody.innerHTML.length);
        } else {
            console.error('❌ tenantsTableBody element not found!');
        }
    },
    
    // Check if properties data is loaded
    checkPropertiesData: function() {
        console.log('=== PROPERTIES DATA DEBUG ===');
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        console.log('✅ Dashboard found');
        console.log('📊 Properties data count:', dashboard.propertiesData?.length || 0);
        console.log('📋 Properties data sample:', dashboard.propertiesData?.slice(0, 2) || []);
        
        // Check if data has expected fields
        if (dashboard.propertiesData?.length > 0) {
            const firstProperty = dashboard.propertiesData[0];
            console.log('🔍 Property field mapping analysis:');
            console.log('  - id:', firstProperty.id || 'Missing');
            console.log('  - type:', firstProperty.type || 'Missing');
            console.log('  - location:', firstProperty.location || 'Missing');
            console.log('  - city:', firstProperty.city || 'Missing');
            console.log('  - bhkType:', firstProperty.bhkType || 'Missing');
            console.log('  - expectedRent:', firstProperty.expectedRent || 'Missing');
            console.log('  - name field:', firstProperty.name || 'Not available (expected)');
            console.log('  - address field:', firstProperty.address || 'Not available');
        }
        
        // Check table element
        const tableBody = document.getElementById('propertiesTableBody');
        if (tableBody) {
            console.log('✅ propertiesTableBody element found');
            console.log('📝 Current table content:', tableBody.innerHTML ? 'Has content' : 'Empty');
            console.log('📏 Table content length:', tableBody.innerHTML.length);
        } else {
            console.error('❌ propertiesTableBody element not found!');
        }
    },
    
    // Check if payments data is loaded
    checkPaymentsData: function() {
        console.log('=== PAYMENTS DATA DEBUG ===');
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        console.log('✅ Dashboard found');
        console.log('📊 Payments data count:', dashboard.paymentsData?.length || 0);
        console.log('📋 Payments data sample:', dashboard.paymentsData?.slice(0, 2) || []);
        
        // Check if data has expected fields
        if (dashboard.paymentsData?.length > 0) {
            const firstPayment = dashboard.paymentsData[0];
            console.log('🔍 Payment field mapping analysis:');
            console.log('  - id:', firstPayment.id || 'Missing');
            console.log('  - paymentDate:', firstPayment.paymentDate || 'Missing');
            console.log('  - createdAt:', firstPayment.createdAt || 'Not available');
            console.log('  - tenantName:', firstPayment.tenantName || 'Missing');
            console.log('  - propertyName:', firstPayment.propertyName || 'Not available');
            console.log('  - propertyId:', firstPayment.propertyId || 'Missing');
            console.log('  - amount:', firstPayment.amount || 'Missing');
            console.log('  - status:', firstPayment.status || 'Missing');
            console.log('  - paymentMode:', firstPayment.paymentMode || 'Missing');
            console.log('  - type field:', firstPayment.type || 'Not available');
            console.log('  - All available fields:', Object.keys(firstPayment));
        }
        
        // Check table element
        const tableBody = document.getElementById('paymentsTableBody');
        if (tableBody) {
            console.log('✅ paymentsTableBody element found');
            console.log('📝 Current table content:', tableBody.innerHTML ? 'Has content' : 'Empty');
            console.log('📏 Table content length:', tableBody.innerHTML.length);
        } else {
            console.error('❌ paymentsTableBody element not found!');
        }
        
        // Check flat property IDs for filtering
        const flatPropertyIds = dashboard.propertiesData?.map(p => p.id) || [];
        console.log('🏠 Flat property IDs for filtering:', flatPropertyIds);
    },
    
    // Manually refresh tenant data and section
    refreshTenants: function() {
        console.log('🔄 Manually refreshing tenant data...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshTenants) {
            dashboard.debugRefreshTenants();
        } else {
            console.error('❌ Dashboard or debugRefreshTenants method not found!');
        }
    },
    
    // Manually refresh properties data and section
    refreshProperties: function() {
        console.log('🔄 Manually refreshing properties data...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshProperties) {
            dashboard.debugRefreshProperties();
        } else {
            console.error('❌ Dashboard or debugRefreshProperties method not found!');
        }
    },
    
    // Manually refresh payments data and section
    refreshPayments: function() {
        console.log('🔄 Manually refreshing payments data...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshPayments) {
            dashboard.debugRefreshPayments();
        } else {
            console.error('❌ Dashboard or debugRefreshPayments method not found!');
        }
    },
    
    // Check right drawer elements
    checkRightDrawer: function() {
        console.log('=== RIGHT DRAWER DEBUG ===');
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');
        
        if (drawer) {
            console.log('✅ Right drawer element found');
            console.log('📍 Has active class:', drawer.classList.contains('active'));
            const computedStyles = window.getComputedStyle(drawer);
            console.log('🎨 Current styles:', {
                display: computedStyles.display,
                right: computedStyles.right,
                zIndex: computedStyles.zIndex,
                visibility: computedStyles.visibility,
                opacity: computedStyles.opacity,
                width: computedStyles.width
            });
            console.log('📏 Bounding box:', drawer.getBoundingClientRect());
        } else {
            console.error('❌ Right drawer element not found!');
        }
        
        if (overlay) {
            console.log('✅ Drawer overlay element found');
            console.log('📍 Has active class:', overlay.classList.contains('active'));
            const overlayStyles = window.getComputedStyle(overlay);
            console.log('👁️ Overlay styles:', {
                opacity: overlayStyles.opacity,
                pointerEvents: overlayStyles.pointerEvents,
                zIndex: overlayStyles.zIndex
            });
        } else {
            console.error('❌ Drawer overlay element not found!');
        }
    },
    
    // Test right drawer
    testRightDrawer: function() {
        console.log('🧪 Testing right drawer...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugShowRightDrawer) {
            dashboard.debugShowRightDrawer();
        } else {
            console.error('❌ Dashboard or debugShowRightDrawer method not found!');
        }
    },
    
    // Close right drawer
    closeDrawer: function() {
        console.log('🔒 Closing right drawer...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.closeRightDrawer) {
            dashboard.closeRightDrawer();
            console.log('✅ Drawer close method called');
        } else {
            console.error('❌ Dashboard or closeRightDrawer method not found!');
        }
    },
    
    // Force hide right drawer (emergency method)
    forceHideDrawer: function() {
        console.log('🚨 Force hiding right drawer...');
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');
        
        if (drawer) {
            drawer.classList.remove('active');
            drawer.style.right = '-450px';
            drawer.style.visibility = 'hidden';
            drawer.style.opacity = '0';
            console.log('✅ Drawer force hidden');
        } else {
            console.error('❌ Right drawer element not found!');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            console.log('✅ Overlay force hidden');
        } else {
            console.error('❌ Overlay element not found!');
        }
    },
    
    // Navigate to tenants section
    goToTenants: function() {
        console.log('🧭 Navigating to tenants section...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('tenants');
            console.log('✅ Navigation called');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Navigate to properties section
    goToProperties: function() {
        console.log('🧭 Navigating to properties section...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('properties');
            console.log('✅ Navigation called');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Navigate to payments section
    goToPayments: function() {
        console.log('🧭 Navigating to payments section...');
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('payments');
            console.log('✅ Navigation called');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Show help
    help: function() {
        console.log('=== FLAT DASHBOARD DEBUG COMMANDS ===');
        console.log('🔍 debugFlatDashboard.checkTenantData() - Check tenant data status');
        console.log('🏠 debugFlatDashboard.checkPropertiesData() - Check properties data status');
        console.log('� debugFlatDashboard.checkPaymentsData() - Check payments data status');
        console.log('�🔄 debugFlatDashboard.refreshTenants() - Refresh tenant data');
        console.log('🔄 debugFlatDashboard.refreshProperties() - Refresh properties data');
        console.log('🔄 debugFlatDashboard.refreshPayments() - Refresh payments data');
        console.log('👁️  debugFlatDashboard.checkRightDrawer() - Check right drawer status');
        console.log('🧪 debugFlatDashboard.testRightDrawer() - Test opening right drawer');
        console.log('🔒 debugFlatDashboard.closeDrawer() - Close right drawer');
        console.log('🚨 debugFlatDashboard.forceHideDrawer() - Force hide right drawer');
        console.log('🧭 debugFlatDashboard.goToTenants() - Navigate to tenants section');
        console.log('🧭 debugFlatDashboard.goToProperties() - Navigate to properties section');
        console.log('🧭 debugFlatDashboard.goToPayments() - Navigate to payments section');
        console.log('❓ debugFlatDashboard.help() - Show this help');
    }
};

// Auto-check on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('🚀 Flat Dashboard Debug Helper Loaded!');
            console.log('💡 Type debugFlatDashboard.help() for available commands');
        }, 2000);
    });
} else {
    setTimeout(() => {
        console.log('🚀 Flat Dashboard Debug Helper Loaded!');
        console.log('💡 Type debugFlatDashboard.help() for available commands');
    }, 2000);
}