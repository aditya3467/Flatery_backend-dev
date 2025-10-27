/**
 * =======================================================
 * 🌐 main.js — Auth & UI Logic for Arnar Tech Website
 * =======================================================
 *
 * Handles:
 *  - Signup & Login flow (frontend)
 *  - API interactions via apiService
 *  - UI updates based on authentication state
 *  - Modal switching and basic navigation menu logic
 *
 * Dependencies:
 *  - api.js (must define apiService with register, login, logout, isAuthenticated)
 *  - HTML modals with .signup-modal and .login-modal classes
 *  - Buttons with .btn-1 (login/logout) and .burger-btn (menu/user)
 */

document.addEventListener('DOMContentLoaded', function () {
  /**
   * ✅ Ensure API Service is loaded before proceeding
   * apiService is a global object that handles network requests
   */
  if (typeof apiService === 'undefined') {
    console.error('API Service not loaded. Make sure api.js is included before main.js');
    return;
  }

  // Call setupLoginButtonListeners early to ensure buttons are functional
  setupLoginButtonListeners();

  /**
   * ✅ Check authentication state on page load
   * If a user session exists (e.g. stored in localStorage), update UI
   */
  if (apiService.isAuthenticated()) {
    updateUIForLoggedInUser();
  } else {
    // If not authenticated, ensure logout buttons are hidden
    document.querySelectorAll('.logout-btn').forEach(btn => btn.style.display = 'none');
  }

  // =========================
  // 🔹 FORM HANDLERS SETUP
  // =========================

  /**
   * Attach Signup form submit listener
   * - Prevents default HTML submission
   * - Calls handleSignup() for async registration
   */
  const signupForm = document.querySelector('.signup-modal form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSignup(e);
    });
  }

  /**
   * Attach Login form submit listener
   * - Prevents default HTML submission
   * - Calls handleLogin() for async authentication
   */
  const loginForm = document.querySelector('.login-modal form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(e);
    });
  }

  // =========================
  // 🔹 MODAL TOGGLE HELPERS
  // =========================

  /**
   * toggleModals()
   * @param {string} hideId - ID of modal to close
   * @param {string} showId - ID of modal to open
   *
   * Dynamically switches between login and signup modals
   */
  function toggleModals(hideId, showId) {
    document.getElementById(hideId)?.classList.remove('active');
    document.getElementById(showId)?.classList.add('active');
  }

  // Switch from login → signup
  document.querySelector('.login-modal .signup-link a')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleModals('loginModal', 'signupModal');
  });

  // Switch from signup → login
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleModals('signupModal', 'loginModal');
  });

  // =========================
  // 🔹 HAMBURGER MENU LOGIC
  // =========================

  /**
   * Closes hamburger menu when clicking outside of it
   */
  document.addEventListener('click', function (event) {
    const burgerMenu = document.querySelector('.burger-menu');
    const burgerBtn = document.querySelector('.burger-btn');
    const burgerToggle = document.getElementById('burger-toggle'); // Get the checkbox

    // Check if the click is outside the burger menu and the toggle itself
    if (burgerMenu && burgerToggle && burgerToggle.checked && !burgerMenu.contains(event.target) && !event.target.closest('.hamburger')) {
      burgerToggle.checked = false; // Close the menu
    }
  });

  /**
   * Handles profile dropdown toggle
   */
  const profileIcon = document.getElementById('profileIcon');
  const profileDropdown = document.getElementById('profileDropdown');

  if (profileIcon && profileDropdown) {
    profileIcon.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent click from closing the dropdown immediately
      profileDropdown.classList.toggle('active');
      console.log('Profile dropdown toggled:', profileDropdown.classList.contains('active'));
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (e) => {
      if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
        profileDropdown.classList.remove('active');
      }
    });
  } else {
    console.log('Profile icon or dropdown not found on initial load');
  }

});

// ========================================================
// 🔸 GLOBAL FUNCTIONS (accessible outside DOMContentLoaded)
// ========================================================

// Function to set up login button event listeners
function setupLoginButtonListeners() {
    const mainLoginBtn = document.getElementById('mainLoginBtn');
    const burgerLoginBtn = document.getElementById('burgerLoginBtn');

    // Remove any existing listeners to prevent duplicates
    if (mainLoginBtn) {
        mainLoginBtn.removeEventListener('click', openLoginModal);
        mainLoginBtn.addEventListener('click', openLoginModal);
    }
    if (burgerLoginBtn) {
        burgerLoginBtn.removeEventListener('click', openLoginModal);
        burgerLoginBtn.addEventListener('click', openLoginModal);
    }
}

// Make functions globally available for component loader
window.setupLoginButtonListeners = setupLoginButtonListeners;
window.setupProfileDropdown = setupProfileDropdown;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.closeSignupModal = closeSignupModal;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;

// Function to set up profile dropdown
function setupProfileDropdown() {
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileIcon && profileDropdown) {
        // Remove old listener by cloning
        const newProfileIcon = profileIcon.cloneNode(true);
        profileIcon.parentNode.replaceChild(newProfileIcon, profileIcon);
        
        newProfileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
            console.log('Profile dropdown active:', profileDropdown.classList.contains('active'));
        });

        // Setup click outside listener
        const handleOutsideClick = (e) => {
            if (!profileDropdown.contains(e.target) && !newProfileIcon.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        
        console.log('Profile dropdown handlers setup complete');
    } else {
        console.warn('Profile icon or dropdown not found');
    }
}

function openLoginModal(e) {
    e.preventDefault();
    // Only open login modal if user is NOT logged in
    if (!apiService.isAuthenticated()) {
        document.getElementById('loginModal').classList.add('active');
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
}

// 🔸 AUTH HANDLERS
// ========================================================

/**
 * handleSignup()
 * @param {Event} e - form submit event
 *
 * Registers a new user via apiService, then auto-logs them in.
 * Steps:
 *  1. Extracts name/email/password
 *  2. Shows loading state
 *  3. Calls apiService.register()
 *  4. On success → calls handleLogin() automatically
 */
async function handleSignup(e) {
  const form = e.target;
  const firstName = form.querySelector('input[name="firstName"]').value;
  const lastName = form.querySelector('input[name="lastName"]').value;
  const username = form.querySelector('input[name="username"]').value;
  const email = form.querySelector('input[name="email"]').value;
  const phoneNumber = form.querySelector('input[name="phoneNumber"]').value;
  const password = form.querySelector('input[name="password"]').value;
  const role = form.querySelector('input[name="role"]:checked').value;

  // Client-side validation
  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }
  if (password.length > 100) {
    showError('Password must be less than 100 characters.');
    return;
  }
  if (username.length < 3) {
    showError('Username must be at least 3 characters long.');
    return;
  }
  if (firstName.length < 2) {
    showError('First name must be at least 2 characters long.');
    return;
  }
  if (lastName.length < 2) {
    showError('Last name must be at least 2 characters long.');
    return;
  }

  showLoading(form.querySelector('button[type="submit"]'));

  try {
    await apiService.register({ firstName, lastName, username, email, phoneNumber, password, roles: [role] });
    showSuccess('Signup successful! Logging you in...');
    // Automatically attempt to log in the new user
    await handleLogin({ target: form, credentials: { username, password } }); // Pass credentials directly
  } catch (error) {
    showError(error.message || 'Signup failed. Try again.');
  } finally {
    hideLoading(form.querySelector('button[type="submit"]'));
  }
}

/**
 * handleLogin()
 * @param {Event} e - form submit event
 *
 * Authenticates an existing user and updates UI accordingly.
 * Steps:
 *  1. Reads credentials
 *  2. Calls apiService.login()
 *  3. Stores user info in localStorage
 *  4. Closes modal and updates UI
 */
async function handleLogin(e) { // e can be a form event or an object with credentials
  let username, password, form;
  
  // Determine the source of credentials and the form to use for UI feedback
  if (e.credentials && e.credentials.username) { // Prioritize credentials for auto-login
    username = e.credentials.username;
    password = e.credentials.password;
    form = e.target; // The form is passed in the 'target' property from signup
  } else if (e.target) { // Manual login from the login form
    form = e.target;
    username = form.querySelector('input[name="username"]').value;
    password = form.querySelector('input[name="password"]').value;
  } else {
    showError('Login failed: Invalid call to handleLogin.');
    return;
  }

  showLoading(form?.querySelector('button[type="submit"]'));

  try {
    const authResponse = await apiService.login({ username, password });
    // Store user data in localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('firstName', authResponse.firstName || username); // Store first name
    localStorage.setItem('roles', JSON.stringify(authResponse.roles)); // Store roles for redirection
    showSuccess('Login successful!');
    updateUIForLoggedInUser();
    document.getElementById('loginModal')?.classList.remove('active');

    // After login, also close the signup modal in case the flow started from there
    document.getElementById('signupModal')?.classList.remove('active');

    const roles = authResponse.roles || [];
    if (roles.includes('ADMIN')) { // The backend uses 'ADMIN' for owners
        window.location.href = 'Owner.html';
    }
  } catch (error) {
    showError(error.message || 'Login failed. Please try again.');
  } finally {
    if (form) { // Ensure form exists before trying to hide loading
      hideLoading(form.querySelector('button[type="submit"]'));
    }
  }
}

/**
 * handleLogout()
 *
 * Logs out the user:
 *  - Clears localStorage
 *  - Calls apiService.logout() if available
 *  - Updates UI back to logged-out state
 */
async function handleLogout() {
  try {
    await apiService.logout();
    localStorage.removeItem('authToken'); // Clear token
    localStorage.removeItem('username');
    localStorage.removeItem('firstName');
    localStorage.removeItem('roles');

    showSuccess('Logged out successfully.');
    
    // Reset UI elements
    const loginNavItem = document.getElementById('loginNavItem');
    const profileSection = document.getElementById('profileSection');
    const burgerLoginBtn = document.getElementById('burgerLoginBtn');
    const logoutBtns = document.querySelectorAll('.logout-btn');

    // Show login button, hide profile section
    if (loginNavItem) {
      loginNavItem.style.display = '';
    }
    if (profileSection) {
      profileSection.style.display = 'none';
    }

    // Handle hamburger menu login/logout buttons
    if (burgerLoginBtn) {
        burgerLoginBtn.textContent = 'Login';
        burgerLoginBtn.classList.remove('logged-in');
        burgerLoginBtn.style.display = ''; // Show login button
    }
    logoutBtns.forEach(btn => btn.style.display = 'none'); // Hide logout buttons

    // Re-setup login button listeners to make them active again
    setupLoginButtonListeners();

    // Redirect to home page after logout
    window.location.href = 'index.html';

  } catch (error) {
    showError('Logout failed: ' + error.message);
  }
}

// ========================================================
// 🔸 UI HANDLERS
// ========================================================

/**
 * updateUIForLoggedInUser() - Updates UI after login
 *  - Hides login buttons
 *  - Shows logout buttons with username and attaches handler
 *  - Updates dashboard link based on user role
 */
function updateUIForLoggedInUser() {
  const username = localStorage.getItem('username') || 'User';
  const firstName = localStorage.getItem('firstName') || username;
  const loginNavItem = document.getElementById('loginNavItem');
  const profileSection = document.getElementById('profileSection');
  const burgerLoginBtn = document.getElementById('burgerLoginBtn');
  const logoutBtns = document.querySelectorAll('.logout-btn');

  // Hide main login button and show profile section
  if (loginNavItem) {
    loginNavItem.style.display = 'none';
  }
  if (profileSection) {
    profileSection.style.display = 'flex'; // Use flex to align icon
    const dropdownUsername = document.getElementById('dropdownUsername');
    if (dropdownUsername) {
      dropdownUsername.textContent = `${firstName}`;
    }
    // Setup profile dropdown handlers after showing the profile section
    setTimeout(() => {
      if (typeof setupProfileDropdown === 'function') {
        setupProfileDropdown();
      }
    }, 100);
  }

  // Hide hamburger login button
  if (burgerLoginBtn) {
    burgerLoginBtn.style.display = 'none';
  }

  // Show logout buttons and attach handler
  logoutBtns.forEach(btn => {
    btn.style.display = ''; // Show the logout button
    btn.removeEventListener('click', handleLogout); // Prevent duplicate listeners
    btn.addEventListener('click', handleLogout);
  });

  // Update Dashboard link in hamburger menu based on user role
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const dashboardLink = document.querySelector('.nav-menu ul li a[href="#Dashboard"]'); // Assuming this is the dashboard link
  if (dashboardLink) {
      if (roles.includes('ADMIN')) {
          dashboardLink.href = 'Owner.html';
          dashboardLink.textContent = 'Owner Dashboard';
      } else if (roles.includes('USER')) {
          dashboardLink.href = 'tenant.html';
          dashboardLink.textContent = 'Tenant Dashboard';
      } else {
          dashboardLink.href = 'index.html'; // Default or hide
          dashboardLink.textContent = 'Dashboard';
      }
  }
}

// ========================================================
// 🔸 UTILITIES
// ========================================================

/**
 * showLoading()
 * @param {HTMLElement} button - the button to disable
 *
 * Disables button during async operation to prevent duplicate clicks.
 */
function showLoading(button) {
  if (button) button.disabled = true;
}

/**
 * hideLoading()
 * @param {HTMLElement} button - the button to re-enable
 */
function hideLoading(button) {
  if (button) button.disabled = false;
}

/**
 * showNotification()
 * @param {string} message - text to display
 * @param {'success'|'error'|'info'} type - notification style
 *
 * Displays a temporary notification box at the bottom of the screen.
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out'); // Add fade-out class
    notification.addEventListener('transitionend', () => notification.remove()); // Remove after transition
  }, 3000);
}

/** Shortcut for success message */
function showSuccess(msg) {
  showNotification(msg, 'success');
}

/** Shortcut for error message */
function showError(msg) {
  showNotification(msg, 'error');
}
