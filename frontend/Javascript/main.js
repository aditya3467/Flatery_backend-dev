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
  
  // Setup list property button listener
  setupListPropertyButton();

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

  /**
   * Attach Change Password form submit listener
   */
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
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
    // Keep body overflow hidden when switching between modals
    document.body.style.overflow = 'hidden';
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
    const burgerMenu = document.querySelector('.nav-menu') || document.querySelector('.burger-menu');
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

// Function to set up list property button
function setupListPropertyButton() {
    const listPropertyBtn = document.getElementById('listPropertyBtn');
    
    if (listPropertyBtn) {
        listPropertyBtn.removeEventListener('click', handleListPropertyClick);
        listPropertyBtn.addEventListener('click', handleListPropertyClick);
    }
}

// Handle list property button click
function handleListPropertyClick(e) {
    e.preventDefault();
    
    // Check if user is authenticated
    if (typeof apiService !== 'undefined' && apiService.isAuthenticated()) {
    // User is logged in, redirect to add-property page
    const inOwner = window.location.pathname.includes('/owner/');
    window.location.href = inOwner ? 'add-property.html' : 'owner/add-property.html';
    } else {
        // User is not logged in, show login modal
        document.getElementById('loginModal')?.classList.add('active');
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Please login to list your property', 'info');
        }
    }
}

// Make functions globally available for component loader
window.setupLoginButtonListeners = setupLoginButtonListeners;
window.setupListPropertyButton = setupListPropertyButton;
window.handleListPropertyClick = handleListPropertyClick;
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
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function openChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Ensure event listener is attached
    const form = document.getElementById('changePasswordForm');
    if (form) {
        // Remove any existing listeners to prevent duplicates
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleChangePassword);
    }
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    document.getElementById('changePasswordForm').reset();
    const errorDiv = document.getElementById('changePasswordError');
    if (errorDiv) errorDiv.style.display = 'none';
}

window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;

// 🔸 FORGOT PASSWORD HANDLERS
// ========================================================

function openForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    resetForgotPasswordModal();
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
    document.body.style.overflow = '';
    resetForgotPasswordModal();
}

function resetForgotPasswordModal() {
    // Reset to step 1
    document.getElementById('fpStep1').style.display = 'block';
    document.getElementById('fpStep2').style.display = 'none';
    document.getElementById('fpStep3').style.display = 'none';
    
    // Clear forms
    document.getElementById('fpEmailForm').reset();
    document.getElementById('fpOtpForm').reset();
    
    // Clear errors
    document.getElementById('fpEmailError').style.display = 'none';
    document.getElementById('fpVerifyError').style.display = 'none';
    
    // Store email for next step
    window.fpEmail = null;
}

async function handleForgotPasswordEmail(e) {
    e.preventDefault();
    console.log('handleForgotPasswordEmail called');
    
    const email = document.getElementById('fp-email').value.trim();
    const errorDiv = document.getElementById('fpEmailError');
    const btn = document.getElementById('fpSendOtpBtn');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    if (!email) {
        errorDiv.textContent = '❌ Please enter your email address';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        btn.disabled = true;
        btn.textContent = 'Sending OTP...';
        console.log('Sending OTP request for email:', email);
        
        const response = await fetch('/api/auth/password-reset/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            console.log('OTP sent successfully');
            // Store email for next step
            window.fpEmail = email;
            window.fpOtpValidity = data.otpValiditySeconds || 600;
            
            // Clear the email input field
            document.getElementById('fp-email').value = '';
            
            // Move to step 2 - OTP verification
            setTimeout(() => {
                document.getElementById('fpStep1').style.display = 'none';
                document.getElementById('fpStep2').style.display = 'block';
                document.getElementById('fp-otp').focus();
                updateFpOtpValidity();
            }, 300);
            
        } else {
            // Show error message from backend
            const errorMsg = data.message || 'Failed to send OTP. Please try again.';
            console.log('Error from backend:', errorMsg);
            errorDiv.textContent = '❌ ' + errorMsg;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        errorDiv.textContent = '❌ Error: ' + (error.message || 'Network error. Please check your connection.');
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send OTP';
    }
}

function updateFpOtpValidity() {
    if (!window.fpOtpValidity) return;
    
    let remaining = window.fpOtpValidity;
    const validityEl = document.getElementById('fpOtpValidity');
    
    const interval = setInterval(() => {
        remaining--;
        
        if (remaining <= 0) {
            clearInterval(interval);
            validityEl.textContent = 'OTP expired. Please request a new one.';
            validityEl.style.color = '#f44336';
            document.getElementById('fpOtpForm').style.opacity = '0.5';
            document.getElementById('fpOtpForm').style.pointerEvents = 'none';
        } else {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            validityEl.textContent = `OTP valid for ${minutes}:${seconds.toString().padStart(2, '0')}`;
            validityEl.style.color = remaining < 60 ? '#ff9800' : '#666';
        }
    }, 1000);
    
    // Store interval ID to clear on reset
    window.fpValidityInterval = interval;
}

async function handleForgotPasswordOtp(e) {
    e.preventDefault();
    console.log('handleForgotPasswordOtp called');
    
    const otp = document.getElementById('fp-otp').value.trim();
    const newPassword = document.getElementById('fp-new-password').value;
    const confirmPassword = document.getElementById('fp-confirm-password').value;
    const errorDiv = document.getElementById('fpVerifyError');
    const btn = document.getElementById('fpResetBtn');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Validation
    if (!otp || !newPassword || !confirmPassword) {
        errorDiv.textContent = '❌ Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (otp.length !== 6) {
        errorDiv.textContent = '❌ OTP must be exactly 6 digits';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 8) {
        errorDiv.textContent = '❌ Password must be at least 8 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = '❌ Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        btn.disabled = true;
        btn.textContent = 'Resetting Password...';
        console.log('Sending password reset request');
        
        const response = await fetch('/api/auth/password-reset/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: window.fpEmail,
                otp,
                newPassword,
                confirmPassword
            })
        });
        
        console.log('Reset response status:', response.status);
        const data = await response.json();
        console.log('Reset response data:', data);
        
        if (response.ok && data.success) {
            console.log('Password reset successful');
            // Clear interval
            if (window.fpValidityInterval) {
                clearInterval(window.fpValidityInterval);
            }
            
            // Move to step 3 (success)
            document.getElementById('fpStep2').style.display = 'none';
            document.getElementById('fpStep3').style.display = 'block';
            
            // Auto-close after 3 seconds and show login
            setTimeout(() => {
                closeForgotPasswordModal();
                openLoginModal({ preventDefault: () => {} });
            }, 3000);
        } else {
            // Show error message from backend
            const errorMsg = data.message || 'Failed to reset password. Please try again.';
            console.log('Error from reset:', errorMsg);
            errorDiv.textContent = '❌ ' + errorMsg;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        errorDiv.textContent = '❌ Error: ' + (error.message || 'Network error. Please check your connection.');
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Reset Password';
    }
}

async function resendOtp() {
    console.log('resendOtp called');
    
    const email = window.fpEmail;
    const errorDiv = document.getElementById('fpVerifyError');
    
    if (!email) {
        console.error('No email stored for resend');
        errorDiv.textContent = '❌ Error: Email not found. Please start over.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        
        console.log('Sending resend OTP request for email:', email);
        
        const response = await fetch('/api/auth/password-reset/resend-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        console.log('Resend OTP response status:', response.status);
        const data = await response.json();
        console.log('Resend OTP response data:', data);
        
        if (response.ok && data.success) {
            console.log('OTP resent successfully');
            
            // Update OTP validity
            window.fpOtpValidity = data.otpValiditySeconds || 600;
            
            // Clear any previous OTP input
            document.getElementById('fp-otp').value = '';
            document.getElementById('fp-otp').focus();
            
            // Restart timer
            if (window.fpValidityInterval) {
                clearInterval(window.fpValidityInterval);
            }
            updateFpOtpValidity();
            
            // Show success message
            errorDiv.textContent = '✅ ' + (data.message || 'New OTP sent to your email');
            errorDiv.style.color = '#4caf50';
            errorDiv.style.display = 'block';
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        } else {
            const errorMsg = data.message || 'Failed to resend OTP. Please try again.';
            console.log('Error from resend OTP:', errorMsg);
            errorDiv.textContent = '❌ ' + errorMsg;
            errorDiv.style.color = '#f44336';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        errorDiv.textContent = '❌ Error: ' + (error.message || 'Network error. Please check your connection.');
        errorDiv.style.color = '#f44336';
        errorDiv.style.display = 'block';
    }
}

window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.resetForgotPasswordModal = resetForgotPasswordModal;
window.handleForgotPasswordEmail = handleForgotPasswordEmail;
window.handleForgotPasswordOtp = handleForgotPasswordOtp;
window.resendOtp = resendOtp;

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
  const firstName = form.querySelector('input[name="firstName"]').value.trim();
  const lastName = form.querySelector('input[name="lastName"]').value.trim();
  const username = form.querySelector('input[name="username"]').value.trim();
  const email = form.querySelector('input[name="email"]').value.trim();
  const phoneNumber = form.querySelector('input[name="phoneNumber"]').value.trim();
  const password = form.querySelector('input[name="password"]').value;
  const role = form.querySelector('input[name="role"]:checked')?.value;

  // Client-side validation
  if (!firstName || !lastName || !username || !email || !password || !role) {
    showError('Please fill in all required fields.');
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
  if (username.length < 3) {
    showError('Username must be at least 3 characters long.');
    return;
  }
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }
  if (password.length > 100) {
    showError('Password must be less than 100 characters.');
    return;
  }

  showLoading(form.querySelector('button[type="submit"]'));

  try {
    await apiService.register({ firstName, lastName, username, email, phoneNumber, password, roles: [role] });
    showSuccess('Signup successful! Logging you in...');
    // Automatically attempt to log in the new user
    await handleLogin({ target: form, credentials: { username, password } }); // Pass credentials directly
  } catch (error) {
    showError(error.message || 'Signup failed. Please check your details and try again.');
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

  // Validate empty fields
  if (!username || !password) {
    showError('Please enter both username and password.');
    return;
  }

  if (form) {
    showLoading(form.querySelector('button[type="submit"]'));
  }

  try {
    const authResponse = await apiService.login({ username, password });
    
    // Fetch user details to get firstName
    const userDetails = await apiService.getCurrentUser();
    
    // Extract first name from fullName
    const firstName = userDetails.fullName ? userDetails.fullName.split(' ')[0] : username;
    
    // Store user data in localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('roles', JSON.stringify(authResponse.roles)); // Store roles for redirection
    
    // Check if password change is required
    if (authResponse.requiresPasswordChange) {
        document.getElementById('loginModal')?.classList.remove('active');
        document.getElementById('signupModal')?.classList.remove('active');
        updateUIForLoggedInUser();
        
        // Mark as new tenant who needs to complete profile
        localStorage.removeItem('profileCompleted');
        localStorage.removeItem('profilePromptSeen');
        
        // Show notification and open change password modal
        showSuccess('Login successful! Please change your temporary password.');
        setTimeout(() => {
            openChangePasswordModal();
        }, 500);
        return;
    }
    
    showSuccess('Login successful! Redirecting...');
    updateUIForLoggedInUser();
    document.getElementById('loginModal')?.classList.remove('active');

    // After login, also close the signup modal in case the flow started from there
    document.getElementById('signupModal')?.classList.remove('active');

    const roles = authResponse.roles || [];
    console.log('User roles:', roles); // Debug log
    console.log('Full auth response:', authResponse); // Debug log
    
    // Immediate redirect based on role
    if (roles.includes('SUPERADMIN')) {
        setTimeout(() => {
            window.location.href = '/frontend/superadmin-dashboard.html';
        }, 100);
        return; // Stop further execution
    } else if (roles.includes('ADMIN')) { // The backend uses 'ADMIN' for owners
        setTimeout(() => {
            window.location.href = '/frontend/owner/owner-dashboard.html';
        }, 100);
        return;
  } else if (roles.includes('USER')) {
    setTimeout(() => {
      window.location.href = '/frontend/index.html';
    }, 100);
    return;
    }
  } catch (error) {
    showError(error.message || 'Login failed. Please check your username and password.');
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

    // Hide dashboard link for non-logged in users
    const dashboardLinkContainer = document.getElementById('dashboardLinkContainer');
    if (dashboardLinkContainer) {
        dashboardLinkContainer.style.display = 'none';
    }

    // Re-setup login button listeners to make them active again
    setupLoginButtonListeners();

  // Redirect to home page after logout (use absolute path to avoid folder-relative issues)
  window.location.href = '/frontend/index.html';

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
  console.log('Updating UI with firstName:', firstName);
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
      console.log('Dropdown username set to:', firstName);
    } else {
      console.log('dropdownUsername element not found (this is expected in some pages)');
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
  const dashboardLink = document.getElementById('dashboardLink'); // Target the dashboard link by ID
  const dashboardLinkContainer = document.getElementById('dashboardLinkContainer');
  
  if (dashboardLink) {
      // Show dashboard link for logged-in users
      if (dashboardLinkContainer) {
          dashboardLinkContainer.style.display = 'block';
      }
      
      if (roles.includes('SUPERADMIN')) {
          dashboardLink.href = '/frontend/superadmin-dashboard.html';
          dashboardLink.textContent = 'Admin Dashboard';
      } else if (roles.includes('ADMIN')) { // ADMIN role is for owners
          dashboardLink.href = '/frontend/owner/owner-dashboard.html';
          dashboardLink.textContent = 'Owner Dashboard';
      } else if (roles.includes('USER')) { // USER role is for tenants
          dashboardLink.href = '/frontend/tenant-dashboard.html';
          dashboardLink.textContent = 'Tenant Dashboard';
      } else {
          dashboardLink.href = '/frontend/tenant-dashboard.html';
          dashboardLink.textContent = 'Dashboard';
      }

      // Show/hide superadmin menu items
      const superadminItems = document.querySelectorAll('.superadmin-only');
      superadminItems.forEach(item => {
          item.style.display = roles.includes('SUPERADMIN') ? 'block' : 'none';
      });
  }

  // Initialize notification manager
  if (window.notificationManager) {
    notificationManager.init();
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

// Change Password Handler
async function handleChangePassword(e) {
  e.preventDefault();
  const form = e.target;
  const currentPassword = form.querySelector('[name="currentPassword"]').value;
  const newPassword = form.querySelector('[name="newPassword"]').value;
  const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
  const errorDiv = document.getElementById('changePasswordError');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Clear previous error
  if (errorDiv) errorDiv.style.display = 'none';

  // Validate new password
  if (newPassword.length < 6) {
    if (errorDiv) {
      errorDiv.textContent = 'New password must be at least 6 characters';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (errorDiv) {
      errorDiv.textContent = 'New passwords do not match';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (currentPassword === newPassword) {
    if (errorDiv) {
      errorDiv.textContent = 'New password must be different from current password';
      errorDiv.style.display = 'block';
    }
    return;
  }

  showLoading(submitBtn);

  try {
    await apiService.changePassword(currentPassword, newPassword);
    showSuccess('Password changed successfully! Redirecting...');
    closeChangePasswordModal();
    form.reset();
    
    // Redirect to appropriate dashboard after password change
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    setTimeout(() => {
      if (roles.includes('USER')) {
        window.location.href = '/frontend/tenant.html';
      } else if (roles.includes('ADMIN')) {
        window.location.href = '/frontend/owner/Owner.html';
      } else if (roles.includes('SUPERADMIN')) {
        window.location.href = '/frontend/superadmin-dashboard.html';
      } else {
        window.location.href = '/frontend/index.html';
      }
    }, 1500);
  } catch (error) {
    const msg = error.message || 'Failed to change password';
    if (errorDiv) {
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
    }
    showError(msg);
  } finally {
    hideLoading(submitBtn);
  }
}

// Google OAuth2 Sign-In
function loginWithGoogle() {
  // Redirect to backend OAuth2 authorization endpoint
  window.location.href = 'http://localhost:8081/oauth2/authorization/google';
}

// Handle OAuth2 callback (token in URL)
function handleOAuth2Callback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const username = urlParams.get('username');
  const email = urlParams.get('email');

  if (token && username && email) {
    // Store authentication data
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);

    // Clean URL (remove query parameters)
    window.history.replaceState({}, document.title, window.location.pathname);

    // Update UI for logged-in user
    updateUIForLoggedInUser();

    // Show success message
    showSuccess('Successfully signed in with Google!');
  }
}

// Call OAuth2 callback handler on page load
document.addEventListener('DOMContentLoaded', function() {
  handleOAuth2Callback();
});
