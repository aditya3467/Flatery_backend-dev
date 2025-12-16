// Checks user roles and redirects if needed
document.addEventListener('DOMContentLoaded', function() {
    // Wait for components to load first
    setTimeout(async function() {
        
        // Explicitly allow homepage without any redirects (defensive guard)
        try {
            const path = window.location.pathname || '';
            const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/frontend') || path.endsWith('/frontend/');
            if (isHome) {
                return;
            }
        } catch (e) {
        }

        // Check authentication token
        if (!apiService.isAuthenticated()) {
            // If on protected page, redirect to login
            if (window.location.pathname.includes('superadmin-dashboard.html')) {
                window.location.href = '/frontend/index.html';
            }
            return;
        }

        try {
            // Get stored roles from localStorage
            const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');

            const currentPath = window.location.pathname;

            // Protect superadmin dashboard
            if (currentPath.includes('superadmin-dashboard.html')) {
                if (!storedRoles.includes('SUPERADMIN')) {
                    window.location.href = '/frontend/index.html';
                    return;
                }
            }

            // No auto-redirect from index.html - allow logged-in users to browse
            // Only dashboard pages are protected above
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }, 500); // Wait 500ms for components to load
});