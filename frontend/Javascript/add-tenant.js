document.addEventListener('DOMContentLoaded', async function() {
  // Ensure authenticated and owner role
  const ok = await ensureOwnerSession();
  if (ok) {
    await loadOwnerProperties();
  }
  // Pre-fill dates
  const today = new Date();
  const iso = today.toISOString().split('T')[0];
  const leaseStart = document.querySelector('input[name="leaseStartDate"]');
  if (leaseStart) leaseStart.value = iso;
});

async function ensureOwnerSession() {
  try {
    if (!apiService.isAuthenticated()) {
      showAlert('error', 'Please log in as an owner to add a tenant.');
      // open login modal if available
      const modal = document.getElementById('loginModal');
      if (modal) modal.classList.add('active');
      disableForm();
      return false;
    }
    // Try to read roles from localStorage first
    let roles = [];
    try { roles = JSON.parse(localStorage.getItem('roles') || '[]'); } catch { roles = []; }
    if (!roles.length) {
      // fallback: fetch /auth/me to populate
      const user = await apiService.getCurrentUser();
      roles = user?.roles ? Array.from(user.roles) : [];
    }
    const isOwner = roles.includes('ADMIN') || roles.includes('SUPERADMIN');
    if (!isOwner) {
      showAlert('error', 'Only owners can add tenants.');
      disableForm();
      return false;
    }
    return true;
  } catch (e) {
    console.error('Auth check failed', e);
    showAlert('error', 'Authentication required. Please log in again.');
    disableForm();
    return false;
  }
}

function disableForm() {
  const form = document.getElementById('addTenantForm');
  if (form) Array.from(form.elements).forEach(el => el.disabled = true);
}

async function loadOwnerProperties() {
  const select = document.getElementById('propertyId');
  try {
    const response = await apiService.getMyProperties(true, 0, 100);
    const properties = response?.content || [];
    if (!properties.length) {
      select.innerHTML = '<option value="">No properties found. Please add a property first.</option>';
      select.disabled = true;
      return;
    }
    select.innerHTML = '<option value="">Select a property</option>';
    properties.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      const name = p.name || (p.type ? p.type : 'Property');
      const loc = p.location || p.city || '';
      option.textContent = `${name} - ${loc}`;
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Failed to load properties', e);
    const msg = e?.message || 'Unauthorized or server error while fetching your properties.';
    select.innerHTML = '<option value="">Error loading properties</option>';
    showAlert('error', msg + ' Make sure you are logged in as an owner.');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('addTenantForm');
  const fd = new FormData(form);
  const rentDueDateDate = fd.get('rentDueDateDate');
  const rentDueDate = rentDueDateDate ? (new Date(rentDueDateDate)).getUTCDate() : null;
  const leaseStartDate = fd.get('leaseStartDate');
  const leaseEndDate = fd.get('leaseEndDate');

  const data = {
    tenantName: (fd.get('tenantName') || '').trim(),
    phoneNumber: (fd.get('phoneNumber') || '').trim(),
    emailAddress: (fd.get('emailAddress') || '').trim() || null,
    propertyId: parseInt(fd.get('propertyId')),
    flatRoomNumber: (fd.get('flatRoomNumber') || '').trim(),
    rentAmount: parseInt(fd.get('rentAmount')),
    securityDeposit: parseInt(fd.get('securityDeposit')),
    rentDueDate: rentDueDate,
    leaseStartDate: leaseStartDate,
    leaseEndDate: leaseEndDate || null,
    temporaryPassword: (fd.get('temporaryPassword') || '').trim() || null,
    status: fd.get('status') || 'ACTIVE'
  };

  if (!data.tenantName || !data.propertyId || isNaN(data.rentAmount) || isNaN(data.securityDeposit) || !data.flatRoomNumber) {
    return showAlert('error', 'Please fill all required fields.');
  }
  if (!/^\d{10}$/.test(data.phoneNumber)) {
    return showAlert('error', 'Phone number must be 10 digits');
  }
  if (!data.rentDueDate || data.rentDueDate < 1 || data.rentDueDate > 31) {
    return showAlert('error', 'Please pick a valid rent due date');
  }
  if (!data.leaseStartDate) {
    return showAlert('error', 'Please select lease start date');
  }
  if (data.leaseEndDate && data.leaseEndDate < data.leaseStartDate) {
    return showAlert('error', 'Lease end date cannot be before lease start date');
  }

  // Final check: verify no duplicate tenancy for this property + phone combination
  try {
    const tenants = await apiService.getTenants();
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return phone.replace(/^\+91/, '').replace(/\D/g, '');
    };
    
    const inputPhone = normalizePhone(data.phoneNumber);
    
    // Check if tenant with same phone already exists for this property
    const duplicate = tenants.find(t => {
      const tenantPhone = normalizePhone(t.phoneNumber);
      return t.propertyId === data.propertyId && tenantPhone === inputPhone;
    });
    
    if (duplicate) {
      return showAlert('error', 'This tenant is already assigned to this property. You can edit the tenancy details instead.');
    }
  } catch (err) {
    console.warn('Could not verify duplicate tenant', err);
    // Continue with submission
  }

  document.getElementById('loadingIndicator').style.display = 'block';
  form.style.display = 'none';
  hideAlert();

  try {
    const res = await apiService.addTenant(data);
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('displayTenantId').textContent = res.tenantId;
    document.getElementById('displayUsername').textContent = res.username || res.tenantId;
    const passwordRow = document.getElementById('passwordRow');
    if (res.temporaryPassword) {
      document.getElementById('displayPassword').textContent = res.temporaryPassword;
      passwordRow.style.display = 'block';
    } else {
      passwordRow.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Optionally trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('tenantAdded', { detail: res }));
  } catch (err) {
    console.error('Add tenant failed', err);
    document.getElementById('loadingIndicator').style.display = 'none';
    form.style.display = 'block';
    showAlert('error', err.message || 'Failed to create tenant');
  }
}

function showAlert(type, message) {
  const alert = document.getElementById('alertMessage');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  alert.style.display = 'block';
}

function hideAlert() {
  const alert = document.getElementById('alertMessage');
  if (alert) alert.style.display = 'none';
}

// Expose submit handler
window.handleSubmit = handleSubmit;

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  let s = '';
  for (let i=0;i<10;i++) s += chars[Math.floor(Math.random()*chars.length)];
  const input = document.querySelector('input[name="temporaryPassword"]');
  if (input) input.value = s;
}
window.generateTempPassword = generateTempPassword;

// Existing user toggle & lookup
let existingUser = null;

function onExistingToggleChange(checked) {
  const lookup = document.getElementById('existingLookup');
  const tempRow = document.getElementById('tempPasswordRow');
  const tempInput = document.querySelector('input[name="temporaryPassword"]');
  if (checked) {
    lookup.style.display = 'block';
    tempRow.style.display = 'none';
    if (tempInput) tempInput.value = '';
  } else {
    lookup.style.display = 'none';
    tempRow.style.display = 'flex';
    existingUser = null;
    // Re-enable fields
    setFormFieldsDisabled(false);
    document.getElementById('lookupResult').style.display = 'none';
  }
}

async function lookupExistingUser() {
  try {
    const phone = (document.getElementById('lookupPhone').value || '').trim();
    const email = (document.getElementById('lookupEmail').value || '').trim();
    const username = (document.getElementById('lookupUsername').value || '').trim();
    if (!phone && !email && !username) {
      return showAlert('error', 'Enter phone, email, or username to lookup');
    }
    hideAlert();
    const user = await apiService.findUser({ phone, email, username });
    existingUser = user;
    // Autofill
    const name = [user.firstName || '', user.lastName || ''].filter(Boolean).join(' ').trim();
    if (name) document.querySelector('input[name="tenantName"]').value = name;
    if (user.phoneNumber) {
      // Strip country code if present (e.g., +91 for India)
      let phone = user.phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      document.querySelector('input[name="phoneNumber"]').value = phone;
    }
    if (user.email) document.querySelector('input[name="emailAddress"]').value = user.email;
    // Lock fields to avoid accidental changes
    setFormFieldsDisabled(true, ['propertyId','flatRoomNumber','rentAmount','securityDeposit','rentDueDateDate','leaseStartDate','leaseEndDate','status']);

    const resEl = document.getElementById('lookupResult');
    resEl.style.display = 'block';
    resEl.textContent = `Found user: ${user.username} (${user.email || 'no email'})`;
    
    // Check if this user already has a tenancy - wait for property selection
    checkDuplicateTenancy(user);
  } catch (err) {
    console.warn('Lookup failed', err);
    existingUser = null;
    const resEl = document.getElementById('lookupResult');
    resEl.style.display = 'block';
    if (err && err.status === 404) {
      resEl.textContent = 'No matching user found.';
    } else if (err && err.message) {
      resEl.textContent = 'Lookup failed: ' + err.message;
    } else {
      resEl.textContent = 'Lookup failed. Please try again.';
    }
  }
}

function setFormFieldsDisabled(disabled, exceptions = []) {
  const form = document.getElementById('addTenantForm');
  const except = new Set(exceptions);
  Array.from(form.elements).forEach(el => {
    if (el.name && except.has(el.name)) return;
    // keep buttons active
    if (el.tagName === 'BUTTON') return;
    // Use readonly instead of disabled so fields are still submitted
    if (el.type === 'text' || el.type === 'email' || el.type === 'tel' || el.tagName === 'TEXTAREA') {
      el.readOnly = disabled;
      if (disabled) {
        el.style.backgroundColor = '#f3f4f6';
        el.style.cursor = 'not-allowed';
      } else {
        el.style.backgroundColor = '';
        el.style.cursor = '';
      }
    } else {
      el.disabled = disabled;
    }
  });
}

// Check if user already has tenancy for selected property
async function checkDuplicateTenancy(user) {
  const propertySelect = document.getElementById('propertyId');
  
  // Add listener for property selection changes
  const checkHandler = async () => {
    const selectedPropertyId = parseInt(propertySelect.value);
    if (!selectedPropertyId || !user) return;
    
    try {
      // Fetch all tenants for this owner
      const tenants = await apiService.getTenants();
      
      // Normalize phone for comparison
      const normalizePhone = (phone) => {
        if (!phone) return '';
        return phone.replace(/^\+91/, '').replace(/\D/g, '');
      };
      
      const userPhone = normalizePhone(user.phoneNumber);
      
      // Check if this user already has a tenancy for the selected property
      const existingTenancy = tenants.find(t => {
        const tenantPhone = normalizePhone(t.phoneNumber);
        return tenantPhone === userPhone && t.propertyId === selectedPropertyId;
      });
      
      if (existingTenancy) {
        showAlert('error', `⚠️ Tenant already assigned to this property! You can edit the tenancy details instead.`);
        // Disable submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
      } else {
        hideAlert();
        // Re-enable submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      console.warn('Failed to check for duplicate tenancy', err);
    }
  };
  
  // Check immediately if property is already selected
  if (propertySelect.value) {
    checkHandler();
  }
  
  // Add listener for future changes
  propertySelect.removeEventListener('change', checkHandler); // Remove any previous listener
  propertySelect.addEventListener('change', checkHandler);
}

window.onExistingToggleChange = onExistingToggleChange;
window.lookupExistingUser = lookupExistingUser;
