// API Integration for Flatery Backend
// Include the API service
document.addEventListener('DOMContentLoaded', function() {
  // Initialize API service
  if (typeof apiService === 'undefined') {
    console.error('API Service not loaded. Make sure api.js is included before main.js');
  }

  // Check if user is already logged in
  if (apiService.isAuthenticated()) {
    updateUIForLoggedInUser();
  }
  
    // Ensure forms are wired to handlers even if inline onsubmit doesn't run
    try {
        const signupForm = document.querySelector('.signup-modal form');
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('signupForm submit listener triggered');
                handleSignup(e);
            });
        }

        const loginForm = document.querySelector('.login-modal form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('loginForm submit listener triggered');
                handleLogin(e);
            });
        }
    } catch (err) {
        console.error('Error wiring auth form listeners', err);
    }
});

// Login button event listeners
document.querySelector('.btn-1').addEventListener('click', function(e) {
    e.preventDefault();
    // Only open login modal if user is NOT logged in
    if (!apiService.isAuthenticated()) {
        document.getElementById('loginModal').classList.add('active');
    }
});

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
}
// Signup link in login modal
// Use event delegation to ensure it works after DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
  var signupLink = document.querySelector('.login-modal .signup-link a');
  if (signupLink) {
    signupLink.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('loginModal').classList.remove('active');
      document.getElementById('signupModal').classList.add('active');
    });
  }
  var showLogin = document.getElementById('showLogin');
  if (showLogin) {
    showLogin.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('signupModal').classList.remove('active');
      document.getElementById('loginModal').classList.add('active');
    });
  }
});


// Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    // Try to read by name attributes (preferred), fall back to type/placeholders used in index.html
    const usernameEl = form.querySelector('input[name="username"]') || form.querySelector('input[placeholder="Username or Email"]') || form.querySelector('input[type="text"]');
    const passwordEl = form.querySelector('input[name="password"]') || form.querySelector('input[placeholder="Password"]') || form.querySelector('input[type="password"]');
    const username = usernameEl ? usernameEl.value : '';
    const password = passwordEl ? passwordEl.value : '';
    
    try {
        showLoading(form.querySelector('.login-btn'));
        
        const response = await apiService.login({
            username: username,
            password: password
        });
        
        // Save username and roles locally so the UI can show the logged-in user
        localStorage.setItem('username', username);
        const roles = response.roles || [];
        try {
            localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : Array.from(roles)));
        } catch (e) {
            localStorage.setItem('roles', JSON.stringify([]));
        }

        showSuccess('Login successful!');
        closeLoginModal();
        updateUIForLoggedInUser();

        // After login, redirect to homepage
        window.location.href = 'index.html';
        
    } catch (error) {
        const status = error.status ? ` (${error.status})` : '';
        showError('Login failed' + status + ': ' + error.message);
    } finally {
        hideLoading(form.querySelector('.login-btn'));
    }
}

async function handleSignup(event) {
    event.preventDefault();
    console.log('handleSignup invoked');
    
    // event.target might be the submit button; find the closest form as a robust fallback
    let form = event.target;
    if (form && form.closest) {
        form = form.closest('form') || form;
    }
    if (!form || form.tagName !== 'FORM') {
        form = document.querySelector('.signup-modal form') || document.querySelector('#signupModal form');
    }

    const usernameEl = form ? form.querySelector('input[name="username"]') : null;
    const emailEl = form ? form.querySelector('input[name="email"]') : null;
    const passwordEl = form ? form.querySelector('input[name="password"]') : null;
    const phoneNumberInput = form ? form.querySelector('input[name="phoneNumber"]') : null;
    const username = usernameEl ? usernameEl.value : '';
    const email = emailEl ? emailEl.value : '';
    const password = passwordEl ? passwordEl.value : '';
    const phoneNumber = phoneNumberInput ? phoneNumberInput.value : null;
    // Read role from any control named 'role' (select or hidden input)
    const roleEl = form ? form.querySelector('[name="role"]') : null;
    const userType = roleEl ? roleEl.value : null;
    // If role is intentionally missing, backend will default; but validate presence for clarity
    if (!userType) {
        showError('Please select a user type');
        return;
    }

    // Validate required fields
    if (!username) { showError('Username is required'); return; }
    if (!email) { showError('Email is required'); return; }
    if (!password) { showError('Password is required'); return; }
    
    try {
        showLoading(form.querySelector('.signup-btn'));
        
        const payload = {
            username: username,
            email: email,
            password: password,
            role: userType
        };
        console.log('Register payload:', payload);
        if (phoneNumber) payload.phoneNumber = phoneNumber;

        await apiService.register(payload);
        // After successful registration, auto-login the new user
        try {
            const loginResp = await apiService.login({ username: username, password: password });
            // store username and roles
            localStorage.setItem('username', username);
            const rolesResp = loginResp.roles || [];
            try { localStorage.setItem('roles', JSON.stringify(Array.isArray(rolesResp) ? rolesResp : Array.from(rolesResp))); } catch (e) { localStorage.setItem('roles', JSON.stringify([])); }
            showSuccess('Registration successful! Logged in.');
            closeSignupModal();
            updateUIForLoggedInUser();
            window.location.href = 'index.html';
            return;
        } catch (e) {
            // If auto-login fails, inform user to login manually
            showSuccess('Registration successful! Please login.');
            closeSignupModal();
            return;
        }
        
    } catch (error) {
        const status = error.status ? ` (${error.status})` : '';
        showError('Registration failed' + status + ': ' + error.message);
    } finally {
        hideLoading(form.querySelector('.signup-btn'), 'Sign Up');
    }
}

function updateUIForLoggedInUser() {
    // Update login button to show user is logged in
    const loginBtn = document.querySelector('.btn-1');
    if (loginBtn) {
        const username = localStorage.getItem('username');
        loginBtn.textContent = username || 'Dashboard';
        // When logged in, disable the button's link functionality
        loginBtn.onclick = null;
        loginBtn.classList.add('logged-in');
    }
    
    // Also update hamburger/menu login control for mobile
    const burgerBtn = document.querySelector('.nav-menu .burger-btn') || document.querySelector('.burger-btn');
    if (burgerBtn) {
        const username = localStorage.getItem('username');
        burgerBtn.textContent = username || 'Login';
        if (localStorage.getItem('username')) {
            burgerBtn.onclick = null; // Disable click when logged in
            burgerBtn.classList.add('logged-in');
        } else {
            burgerBtn.onclick = () => document.getElementById('loginModal').classList.add('active');
        }
    }

    // Add logout functionality in both desktop and mobile menu
    addLogoutButton();

    // Update Dashboard link in hamburger menu based on user role

}

function addLogoutButton() {
    // The logout buttons are now in the HTML, hidden by default.
    // We just need to show them and attach the event handler.
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.style.display = 'inline-block';
        // Remove existing listener to avoid duplicates, then add it.
        btn.removeEventListener('click', handleLogout);
        btn.addEventListener('click', handleLogout);
    });
}

async function handleLogout() {
    try {
        await apiService.logout();
        showSuccess('Logged out successfully!');
        
        // Reset UI
        const loginBtn = document.querySelector('.btn-1');
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.onclick = function() {
                document.getElementById('loginModal').classList.add('active');
            };
            loginBtn.classList.remove('logged-in');
        }
        
        // Also reset hamburger menu button
        const burgerBtn = document.querySelector('.nav-menu .burger-btn') || document.querySelector('.burger-btn');
        if (burgerBtn) {
            burgerBtn.textContent = 'Login';
            burgerBtn.onclick = function() {
                document.getElementById('loginModal').classList.add('active');
            };
            burgerBtn.classList.remove('logged-in');
        }
        
        // Remove logout button
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.style.display = 'none';
        });
        // Clear stored user data
        localStorage.removeItem('username');
        localStorage.removeItem('roles');
        
    } catch (error) {
        showError('Logout failed: ' + error.message);
    }
}

// Utility functions
function showLoading(button) {
    button.disabled = true;
    button.textContent = 'Loading...';
}

function hideLoading(button, originalText = 'Login') {
    button.disabled = false;
    button.textContent = originalText;
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Closing hamburger if clicked outside
document.addEventListener('click', function(e) {
    const burgerToggle = document.getElementById('burger-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const burgerContainer = document.querySelector('.burger-container');
    // Only close if menu is open and click is outside both menu and burger icon
    if (burgerToggle && burgerToggle.checked) {
      if (!navMenu.contains(e.target) && !burgerContainer.contains(e.target) && e.target !== burgerToggle) {
        burgerToggle.checked = false;
      }
    }
  });
