document.addEventListener('DOMContentLoaded', initGoogleProfilePage);

async function initGoogleProfilePage() {
    if (typeof apiService === 'undefined') {
        console.error('API service is not available');
        return;
    }

    if (!apiService.isAuthenticated()) {
        showError('Please sign in with Google before completing your profile.');
        setTimeout(() => {
            window.location.href = frontendUrl('/index.html');
        }, 2500);
        return;
    }

    try {
        const userDetails = await apiService.getCurrentUser();
        populateForm(userDetails);
    } catch (error) {
        console.error('Unable to fetch current user for profile completion:', error);
        showError('Could not load your profile. Please sign in again.');
        setTimeout(() => window.location.href = frontendUrl('/index.html'), 2500);
        return;
    }

    const form = document.getElementById('googleProfileForm');
    if (form) {
        form.addEventListener('submit', submitGoogleProfileForm);
    }
}

function populateForm(userDetails) {
    if (!userDetails || !userDetails.email) {
        showError('Google email is required for profile completion.');
        return;
    }

    document.getElementById('google-email').value = userDetails.email;
    document.getElementById('google-username').value = userDetails.username || '';

    if (userDetails.fullName) {
        const parts = userDetails.fullName.split(' ');
        document.getElementById('google-firstname').value = parts[0] || '';
        document.getElementById('google-lastname').value = parts.slice(1).join(' ') || '';
    }

    document.getElementById('google-phone').value = userDetails.phoneNumber || '';
}

async function submitGoogleProfileForm(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('googleProfileError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }

    const username = document.getElementById('google-username').value.trim();
    const firstName = document.getElementById('google-firstname').value.trim();
    const lastName = document.getElementById('google-lastname').value.trim();
    const phoneNumber = document.getElementById('google-phone').value.trim();
    if (!username || !firstName || !lastName) {
        showError('Please complete all required fields before continuing.');
        return;
    }
    if (username.length < 3) {
        showError('Username must be at least 3 characters long.');
        return;
    }

    try {
        await apiService.updateProfile({ username, firstName, lastName, phoneNumber });
        localStorage.setItem('username', username);
        localStorage.setItem('firstName', firstName);

        showSuccess('Your profile is complete. Redirecting...');
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        setTimeout(() => {
            if (roles.includes('SUPERADMIN')) {
                window.location.href = frontendUrl('/superadmin-dashboard.html');
            } else if (roles.includes('ADMIN')) {
                window.location.href = frontendUrl('/owner/owner-dashboard.html');
            } else {
                window.location.href = frontendUrl('/tenant.html');
            }
        }, 1000);
    } catch (error) {
        const msg = error.message || 'Unable to complete profile.';
        if (errorDiv) {
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
        }
        showError(msg);
    }
}
