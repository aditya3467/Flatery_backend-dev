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
            // Get stored roles from localStorage
            const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
            console.log('Stored roles:', storedRoles); // Debug log

            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath); // Debug log

            // Protect superadmin dashboard
            if (currentPath.includes('superadmin-dashboard.html')) {
                if (!storedRoles.includes('SUPERADMIN')) {
                    console.log('Non-superadmin trying to access dashboard, redirecting...'); // Debug log
                    window.location.href = '/frontend/index.html';
                    return;
                }
            }

            // Auto-redirect to appropriate dashboard on index page ONLY
            const isIndexPage = currentPath.includes('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/frontend');
            const isOnCorrectPage = (storedRoles.includes('SUPERADMIN') && currentPath.includes('superadmin-dashboard.html')) ||
                                   (storedRoles.includes('ADMIN') && currentPath.includes('Owner.html')) ||
                                   (storedRoles.includes('USER') && currentPath.includes('tenant.html'));
            
            if (isIndexPage && !isOnCorrectPage) {
                if (storedRoles.includes('SUPERADMIN')) {
                    console.log('Redirecting to superadmin dashboard...'); // Debug log
                    window.location.href = '/frontend/superadmin-dashboard.html';
                } else if (storedRoles.includes('ADMIN')) {
                    console.log('Redirecting to owner dashboard...'); // Debug log
                    window.location.href = '/frontend/Owner.html';
                } else if (storedRoles.includes('USER')) {
                    console.log('Redirecting to tenant dashboard...'); // Debug log
                    window.location.href = '/frontend/tenant.html';
                }
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }, 500); // Wait 500ms for components to load
});