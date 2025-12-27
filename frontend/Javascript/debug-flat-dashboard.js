/**
 * Flat Dashboard Debug Helper
 * Use these functions in the browser console to debug issues
 */

window.debugFlatDashboard = {
    // Check if tenant data is loaded
    checkTenantData: function() {
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        
        // Check if data has expected fields
        if (dashboard.tenantsData?.length > 0) {
            const firstTenant = dashboard.tenantsData[0];
        }
        
        // Check table element
        const tableBody = document.getElementById('tenantsTableBody');
        if (tableBody) {
        } else {
            console.error('❌ tenantsTableBody element not found!');
        }
    },
    
    // Check if properties data is loaded
    checkPropertiesData: function() {
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        
        // Check if data has expected fields
        if (dashboard.propertiesData?.length > 0) {
            const firstProperty = dashboard.propertiesData[0];
        }
        
        // Check table element
        const tableBody = document.getElementById('propertiesTableBody');
        if (tableBody) {
        } else {
            console.error('❌ propertiesTableBody element not found!');
        }
    },
    
    // Check if payments data is loaded
    checkPaymentsData: function() {
        const dashboard = window.flatDashboard;
        if (!dashboard) {
            console.error('❌ Dashboard not found! Make sure flat-dashboard.js is loaded.');
            return;
        }
        
        
        // Check if data has expected fields
        if (dashboard.paymentsData?.length > 0) {
            const firstPayment = dashboard.paymentsData[0];
        }
        
        // Check table element
        const tableBody = document.getElementById('paymentsTableBody');
        if (tableBody) {
        } else {
            console.error('❌ paymentsTableBody element not found!');
        }
        
        // Check flat property IDs for filtering
        const flatPropertyIds = dashboard.propertiesData?.map(p => p.id) || [];
    },
    
    // Manually refresh tenant data and section
    refreshTenants: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshTenants) {
            dashboard.debugRefreshTenants();
        } else {
            console.error('❌ Dashboard or debugRefreshTenants method not found!');
        }
    },
    
    // Manually refresh properties data and section
    refreshProperties: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshProperties) {
            dashboard.debugRefreshProperties();
        } else {
            console.error('❌ Dashboard or debugRefreshProperties method not found!');
        }
    },
    
    // Manually refresh payments data and section
    refreshPayments: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugRefreshPayments) {
            dashboard.debugRefreshPayments();
        } else {
            console.error('❌ Dashboard or debugRefreshPayments method not found!');
        }
    },
    
    // Check right drawer elements
    checkRightDrawer: function() {
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');
        
        if (drawer) {
            const computedStyles = window.getComputedStyle(drawer);
            console.log('Right drawer styles:', {
                display: computedStyles.display,
                right: computedStyles.right,
                zIndex: computedStyles.zIndex,
                visibility: computedStyles.visibility,
                opacity: computedStyles.opacity,
                width: computedStyles.width
            });
        } else {
            console.error('❌ Right drawer element not found!');
        }
        
        if (overlay) {
            const overlayStyles = window.getComputedStyle(overlay);
            console.log('Overlay styles:', {
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
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.debugShowRightDrawer) {
            dashboard.debugShowRightDrawer();
        } else {
            console.error('❌ Dashboard or debugShowRightDrawer method not found!');
        }
    },
    
    // Close right drawer
    closeDrawer: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.closeRightDrawer) {
            dashboard.closeRightDrawer();
        } else {
            console.error('❌ Dashboard or closeRightDrawer method not found!');
        }
    },
    
    // Force hide right drawer (emergency method)
    forceHideDrawer: function() {
        const drawer = document.getElementById('rightDrawer');
        const overlay = document.getElementById('rightDrawerOverlay');
        
        if (drawer) {
            drawer.classList.remove('active');
            drawer.style.right = '-450px';
            drawer.style.visibility = 'hidden';
            drawer.style.opacity = '0';
        } else {
            console.error('❌ Right drawer element not found!');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        } else {
            console.error('❌ Overlay element not found!');
        }
    },
    
    // Navigate to tenants section
    goToTenants: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('tenants');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Navigate to properties section
    goToProperties: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('properties');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Navigate to payments section
    goToPayments: function() {
        const dashboard = window.flatDashboard;
        if (dashboard && dashboard.navigateToSection) {
            dashboard.navigateToSection('payments');
        } else {
            console.error('❌ Dashboard or navigateToSection method not found!');
        }
    },
    
    // Show help
    help: function() {
    }
};

// Auto-check on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
        }, 2000);
    });
} else {
    setTimeout(() => {
    }, 2000);
}