// Checks user roles and redirects if needed
document.addEventListener('DOMContentLoaded', function() {
    // Wait for components to load first
    setTimeout(async function() {
        console.log('Role checker running...'); // Debug log
        
        // Check authentication token
        if (!apiService.isAuthenticated()) {
            console.log('User not authenticated'); // Debug log
            // If on protected page, redirect to login
            if (window.location.pathname.includes('superadmin-dashboard.html')) {
                window.location.href = '/frontend/index.html';
            }
            return;
        }

    try {
        // Get stored roles first
        const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
        console.log('Stored roles:', storedRoles); // Debug log

        // Get current roles from backend
        const response = await apiService.makeRequest('/auth/me');
        const roles = response.roles || [];
        console.log('Current roles from backend:', roles); // Debug log

        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath); // Debug log

        // Protect superadmin dashboard
        if (currentPath.includes('superadmin-dashboard.html')) {
            if (!roles.includes('SUPERADMIN')) {
                console.log('Non-superadmin trying to access dashboard, redirecting...'); // Debug log
                window.location.href = '/frontend/index.html';
                return;
            }
        }

        // Auto-redirect to appropriate dashboard
        if (!currentPath.includes('superadmin-dashboard.html') && 
            !currentPath.includes('Owner.html') && 
            !currentPath.includes('tenant.html')) {
            if (roles.includes('SUPERADMIN')) {
                console.log('Redirecting to superadmin dashboard...'); // Debug log
                window.location.href = '/frontend/superadmin-dashboard.html';
            } else if (roles.includes('ADMIN')) {
                window.location.href = '/frontend/Owner.html';
            } else if (roles.includes('USER')) {
                window.location.href = '/frontend/tenant.html';
            }
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        // On error, clear auth and redirect to home
        apiService.clearToken();
        window.location.href = '/frontend/index.html';
    }
});