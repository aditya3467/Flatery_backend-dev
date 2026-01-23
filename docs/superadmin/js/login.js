/**
 * SuperAdmin Login JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    checkExistingSession();

    // Setup form handler
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Enter key support
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

/**
 * Check if user is already logged in
 */
function checkExistingSession() {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            // Check if user has SUPERADMIN role
            if (user.roles && user.roles.includes('SUPERADMIN')) {
                window.location.href = 'dashboard.html';
            }
        } catch (e) {
            console.error('Failed to parse user data', e);
        }
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    errorMessage.style.display = 'none';
    
    try {
        // Call login API
            const apiBase = window.location.hostname === 'localhost'
                ? 'http://localhost:8081/api'
                : 'https://flatery-backend-dev.onrender.com/api';
            const response = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Invalid credentials');
        }
        
        const data = await response.json();
        
        // Verify SUPERADMIN role
        if (!data.roles || !data.roles.includes('SUPERADMIN')) {
            throw new Error('Access denied. SuperAdmin privileges required.');
        }
        
        // Store auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles
        }));
        
        // Success - redirect to dashboard
        showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorMessage.style.background = 'rgba(76, 175, 80, 0.1)';
    errorMessage.style.borderColor = 'rgba(76, 175, 80, 0.3)';
    errorMessage.style.color = '#4CAF50';
    errorText.textContent = message;
    errorMessage.querySelector('i').className = 'fas fa-check-circle';
    errorMessage.style.display = 'flex';
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}
