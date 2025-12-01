// Checks user roles and redirects if needed
document.addEventListener('DOMContentLoaded', function() {
    // Wait for components to load first
    setTimeout(async function() {
        console.log('Role checker running...'); // Debug log
        
        // Explicitly allow homepage without any redirects (defensive guard)
        try {
            const path = window.location.pathname || '';
            const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/frontend') || path.endsWith('/frontend/');
            if (isHome) {
                console.log('On homepage, skip any role-based redirects');
                return;
            }
        } catch (e) {
            console.warn('Path check failed:', e);
        }

        // Check authentication token
        if (!apiService.isAuthenticated()) {
            console.log('User not authenticated'); // Debug log
            // If on protected page, redirect to login
            if (window.location.pathname.includes('superadmin-dashboard.html')) {
                const basePath = window.BASE_PATH || '';
                window.location.href = `${basePath}/docs/index.html`;
            }
            return;
        }

        try {
            // Get stored roles from localStorage
            const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
            console.log('Stored roles:', storedRoles); // Debug log

            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath); // Debug log

            // Protect superadmin dashboard
            if (currentPath.includes('superadmin-dashboard.html')) {
                if (!storedRoles.includes('SUPERADMIN')) {
                    console.log('Non-superadmin trying to access dashboard, redirecting...'); // Debug log
                    const basePath = window.BASE_PATH || '';
                    window.location.href = `${basePath}/docs/index.html`;
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