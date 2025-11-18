let currentTenantCount = 1;
let propertiesCache = [];
let currentPropertyType = null; // 'FLAT' | 'PG' | null

document.addEventListener('DOMContentLoaded', async function() {
  console.log('[Add Tenant] Page loaded, initializing...');
  // Ensure authenticated and owner role
  const ok = await ensureOwnerSession();
  if (!ok) {
    console.log('[Add Tenant] Authentication failed');
    return;
  }
  console.log('[Add Tenant] Authentication successful');
  await loadOwnerProperties();
  // Hide both main sections until a property is chosen
  toggleSections(null);
  console.log('[Add Tenant] Initialization complete');
});

function onTenantCountChange(count) {
  currentTenantCount = parseInt(count);
  generateTenantForms(currentTenantCount);
  
  // Hide existing tenant section for multiple tenants
  const existingSection = document.querySelector('.existing-tenant-section');
  if (existingSection) {
    existingSection.style.display = currentTenantCount > 1 ? 'none' : 'block';
  }
}

function generateTenantForms(count) {
  const container = document.getElementById('tenantForms');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const tenantForm = createTenantForm(i, count);
    container.appendChild(tenantForm);
  }
  
  // Pre-fill shared lease start date
  const today = new Date().toISOString().split('T')[0];
  const sharedLeaseStartInput = document.querySelector('input[name="sharedLeaseStartDate"]');
  if (sharedLeaseStartInput) {
    sharedLeaseStartInput.value = today;
  }
  
  // Forms no longer include per-tenant property selector; property is chosen at top
}

function createTenantForm(index, totalCount) {
  const formDiv = document.createElement('div');
  formDiv.className = 'tenant-form-container';
  formDiv.style.cssText = 'border: 2px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; position: relative;';
  
  const isPrimary = index === 0; // First tenant is primary by default
  
  formDiv.innerHTML = `
    ${totalCount > 1 ? `
      <div class="tenant-form-header" style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0; color: #333;">
          Tenant ${index + 1} 
          ${isPrimary ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">PRIMARY</span>' : '<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">SECONDARY</span>'}
        </h3>
        <div class="primary-toggle" style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 14px; color: #666;">Primary Tenant:</label>
          <input type="radio" name="primaryTenant" value="${index}" ${isPrimary ? 'checked' : ''} onchange="updatePrimaryTenant(${index})">
        </div>
      </div>
    ` : ''}
    
    <div class="form-row" style="margin-bottom: 0.5rem;">
      <div class="form-group" style="flex:1;">
        <label>Tenant Type</label>
        <div style="display:flex; gap:16px; align-items:center;">
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="radio" name="tenantType_${index}" value="NEW" checked onchange="onTenantTypeChange(${index}, 'NEW')"> New
          </label>
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="radio" name="tenantType_${index}" value="EXISTING" onchange="onTenantTypeChange(${index}, 'EXISTING')"> Existing
          </label>
        </div>
      </div>
    </div>

    <div class="tenant-lookup" id="tenantLookup_${index}" style="display:none; border:1px dashed #e5e7eb; padding:12px; border-radius:8px; margin-bottom:12px;">
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label>Lookup by Phone</label>
          <input type="text" id="lookupPhone_${index}" placeholder="10-digit phone" maxlength="10" />
        </div>
        <div class="form-group" style="flex:1;">
          <label>Lookup by Email</label>
          <input type="email" id="lookupEmail_${index}" placeholder="name@example.com" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label>Lookup by Username (optional)</label>
          <input type="text" id="lookupUsername_${index}" placeholder="username" />
        </div>
      </div>
      <button type="button" class="btn-2" onclick="lookupExistingUserForIndex(${index})">Lookup</button>
      <div id="lookupResult_${index}" style="display:none; margin-top:8px; font-size:14px; color:#333;"></div>
    </div>
    
    <div class="form-row">
      <div class="form-group" style="flex:1;">
        <label>Tenant Name *</label>
        <input type="text" name="tenantName_${index}" required placeholder="Full name" />
      </div>
      <div class="form-group" style="flex:1;">
        <label>Phone Number *</label>
        <input type="tel" name="phoneNumber_${index}" required pattern="[0-9]{10}" placeholder="10 digits" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:1;">
        <label>Email Address</label>
        <input type="email" name="emailAddress_${index}" placeholder="Optional" />
      </div>
      <div class="form-group" style="flex:1;">
        <label>Property</label>
        <input type="text" value="Uses top selection" disabled />
      </div>
    </div>

    <div class="form-group">
      <label>Flat / Room Number</label>
      <input type="text" name="flatRoomNumber_${index}" placeholder="e.g., A-101, Room 5" />
      <small>Optional if unit assignment is used below</small>
    </div>

    <div class="form-group">
      <label>Temporary Password</label>
      <input type="text" name="temporaryPassword_${index}" placeholder="Auto-generated if blank" />
      <small>Default password for tenant login (can be changed later)</small>
    </div>
  `;
  
  return formDiv;
}

function updatePrimaryTenant(primaryIndex) {
  // Update the visual indicators
  document.querySelectorAll('.tenant-form-header h3 span').forEach((span, index) => {
    if (index === primaryIndex) {
      span.textContent = 'PRIMARY';
      span.style.backgroundColor = '#10b981';
    } else {
      span.textContent = 'SECONDARY';
      span.style.backgroundColor = '#6b7280';
    }
  });
}

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
  if (!select) return;
  try {
    const response = await apiService.getMyProperties(true, 0, 100);
    propertiesCache = response?.content || [];
    if (!propertiesCache.length) {
      select.innerHTML = '<option value="">No properties found. Please add a property first.</option>';
      select.disabled = true;
      return;
    }
    select.innerHTML = '<option value="">Select property</option>';
    propertiesCache.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      const name = p.name || (p.type ? p.type : 'Property');
      const loc = p.location || p.city || '';
      option.textContent = `${name} - ${loc}`;
      select.appendChild(option);
    });

    // Auto-select from URL param or single property
    const params = new URLSearchParams(window.location.search);
    const urlPropId = params.get('propertyId') || params.get('id');
    if (urlPropId) {
      const match = propertiesCache.find(p => String(p.id) === String(urlPropId));
      if (match) {
        select.value = String(match.id);
        await onPropertyChanged(select.value);
      }
    } else if (propertiesCache.length === 1) {
      select.value = String(propertiesCache[0].id);
      await onPropertyChanged(select.value);
    }
  } catch (e) {
    console.error('Failed to load properties', e);
    const msg = e?.message || 'Unauthorized or server error while fetching your properties.';
    select.innerHTML = '<option value="">Error loading properties</option>';
    showAlert('error', msg + ' Make sure you are logged in as an owner.');
  }
}

async function onPropertyChanged(propertyId) {
  if (!propertyId) { toggleSections(null); return; }
  const prop = propertiesCache.find(p => String(p.id) === String(propertyId));
  currentPropertyType = (prop?.type || '').toString().toUpperCase();
  // For PG, load units UI; otherwise hide PG UI
  await loadPropertyUnits(propertyId);
  toggleSections(currentPropertyType);
  if (currentPropertyType === 'FLAT') {
    // Ensure at least one tenant form exists for FLAT mode
    const countEl = document.getElementById('tenantCount');
    const count = countEl ? parseInt(countEl.value || '1') : 1;
    onTenantCountChange(count);
  }
}

function toggleSections(type) {
  const single = document.getElementById('singleTenantSection');
  const multi = document.getElementById('multiTenantSection');
  const pgUnit = document.getElementById('pgUnitSection');
  const flatRoomGroup = document.getElementById('flatRoomGroup');
  const flatBtn = document.getElementById('flatSubmitBtn');
  const pgBtn = document.getElementById('pgSubmitBtn');
  const defaultBtn = document.getElementById('defaultSubmitBtn');
  
  if (!type) {
    if (single) single.style.display = 'none';
    if (multi) multi.style.display = 'none';
    if (pgUnit) pgUnit.style.display = 'none';
    if (flatBtn) flatBtn.style.display = 'none';
    if (pgBtn) pgBtn.style.display = 'none';
    if (defaultBtn) defaultBtn.style.display = 'none';
    return;
  }
  if (type === 'PG') {
    if (single) single.style.display = 'block';
    if (multi) multi.style.display = 'none';
    if (pgUnit) pgUnit.style.display = 'block';
    if (flatRoomGroup) flatRoomGroup.style.display = 'block';
    if (flatBtn) flatBtn.style.display = 'none';
    if (pgBtn) pgBtn.style.display = 'block';
    if (defaultBtn) defaultBtn.style.display = 'none';
  } else if (type === 'FLAT') {
    if (single) single.style.display = 'none';
    if (multi) multi.style.display = 'block';
    if (pgUnit) pgUnit.style.display = 'none';
    if (flatRoomGroup) flatRoomGroup.style.display = 'block';
    if (flatBtn) flatBtn.style.display = 'block';
    if (pgBtn) pgBtn.style.display = 'none';
    if (defaultBtn) defaultBtn.style.display = 'none';
  } else {
    if (single) single.style.display = 'block';
    if (multi) multi.style.display = 'none';
    if (pgUnit) pgUnit.style.display = 'none';
    if (flatBtn) flatBtn.style.display = 'none';
    if (pgBtn) pgBtn.style.display = 'block';
    if (defaultBtn) defaultBtn.style.display = 'none';
  }
}

async function handleSubmit(e) {
  if (e) e.preventDefault();
  console.log('[Add Tenant] Form submit triggered');
  
  // Check if apiService is available
  if (typeof apiService === 'undefined') {
    console.error('[Add Tenant] apiService is not available!');
    showAlert('error', 'API service is not loaded. Please refresh the page.');
    return;
  }
  
  const propertyId = document.getElementById('propertyId') ? document.getElementById('propertyId').value : '';
  if (!propertyId) { 
    console.log('[Add Tenant] No property selected');
    showAlert('error','Please select a property first.'); 
    return; 
  }
  
  console.log('[Add Tenant] Submit. Property:', propertyId, 'Type:', currentPropertyType, 'Tenants:', currentTenantCount);
  
  const form = document.getElementById('addTenantForm');
  const fd = new FormData(form);
  
  if (currentPropertyType === 'PG') {
    await handlePGSubmit(fd);
    return;
  }
  
  if (currentTenantCount === 1) {
    await handleSingleTenantSubmit(fd);
  } else {
    await handleMultipleTenantSubmit(fd);
  }
}

async function handleSingleTenantSubmit(fd) {
  // For FLAT properties, use shared fields; for PG properties, use individual fields
  const isFlat = currentPropertyType === 'FLAT';
  
  console.log('[Single Tenant] Property type:', currentPropertyType, 'isFlat:', isFlat);
  console.log('[Single Tenant] Form data entries:');
  for (let [key, value] of fd.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  const data = {
    tenantName: (fd.get('tenantName_0') || '').trim(),
    phoneNumber: (fd.get('phoneNumber_0') || '').trim(),
    emailAddress: (fd.get('emailAddress_0') || '').trim() || null,
    propertyId: parseInt(document.getElementById('propertyId').value),
    flatRoomNumber: (fd.get('flatRoomNumber_0') || fd.get('flatRoomNumber') || '').trim(),
    unitId: fd.get('unitId_0') ? parseInt(fd.get('unitId_0')) : null,
    bedIndex: fd.get('bedIndex_0') ? parseInt(fd.get('bedIndex_0')) : null,
    rentAmount: isFlat ? parseInt(fd.get('sharedRentAmount')) : parseInt(fd.get('rentAmount_0')),
    securityDeposit: isFlat ? parseInt(fd.get('sharedSecurityDeposit')) : parseInt(fd.get('securityDeposit_0')),
    rentDueDate: isFlat ? parseInt(fd.get('sharedRentDueDate')) : parseInt(fd.get('rentDueDate_0')),
    leaseStartDate: isFlat ? fd.get('sharedLeaseStartDate') : fd.get('leaseStartDate_0'),
    leaseEndDate: isFlat ? (fd.get('sharedLeaseEndDate') || null) : (fd.get('leaseEndDate_0') || null),
    temporaryPassword: (fd.get('temporaryPassword_0') || '').trim() || null,
    status: 'ACTIVE',
    primary: true // Single tenant is always primary
  };

  if (!validateTenantData(data, 0)) return;

  console.log('[Single Tenant] Validation passed, data:', data);

  // Check for existing active tenancy before adding
  console.log('[Single Tenant] Checking for existing active tenancy...');
  try {
    const activeTenancyCheck = await apiService.checkActiveTenancy(data.phoneNumber, data.emailAddress);
    if (activeTenancyCheck) {
      // Extract first name for more personal message
      const firstName = data.tenantName.trim().split(' ')[0];
      const message = `${firstName} is already added to a property (${activeTenancyCheck.propertyName}). Please ask them to leave that property first before adding to a new one.`;
      showAlert('error', message);
      return;
    }
  } catch (error) {
    // If error is not 404 (no active tenancy), it's an actual error
    if (error.status && error.status !== 404) {
      console.error('[Single Tenant] Error checking active tenancy:', error);
      showAlert('error', 'Error checking tenant status. Please try again.');
      return;
    }
    // 404 means no active tenancy found, which is good - continue with adding tenant
  }

  try {
    console.log('[Add Tenant] Calling API with data:', data);
    showAlert('info', 'Adding tenant...');
    const response = await apiService.post('/tenants', data);
    console.log('[Add Tenant] Success:', response);
    showAlert('success', `Tenant added successfully! Username: ${response.username}${response.temporaryPassword ? ', Password: ' + response.temporaryPassword : ''}`);
    
    // Reset form
    document.getElementById('addTenantForm').reset();
    generateTenantForms(1);
    document.getElementById('tenantCount').value = '1';
    currentTenantCount = 1;
  } catch (error) {
    console.error('[Add Tenant] Error:', error);
    console.error('[Add Tenant] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      response: error.response
    });
    showAlert('error', error.message || 'Failed to add tenant');
  }
}

async function handleMultipleTenantSubmit(fd) {
  const tenants = [];
  const primaryTenantIndex = parseInt(fd.get('primaryTenant') || '0');
  
  // Get shared values
  const sharedRentAmount = parseInt(fd.get('sharedRentAmount'));
  const sharedSecurityDeposit = parseInt(fd.get('sharedSecurityDeposit'));
  const sharedRentDueDate = parseInt(fd.get('sharedRentDueDate'));
  const sharedLeaseStartDate = fd.get('sharedLeaseStartDate');
  const sharedLeaseEndDate = fd.get('sharedLeaseEndDate') || null;
  
  // Validate shared values
  if (isNaN(sharedRentAmount) || isNaN(sharedSecurityDeposit) || !sharedLeaseStartDate) {
    return showAlert('error', 'Please fill all required shared fields (rent amount, security deposit, lease start date).');
  }
  
  // Collect data for all tenants
  for (let i = 0; i < currentTenantCount; i++) {
    const isExisting = (fd.get(`tenantType_${i}`) || 'NEW') === 'EXISTING';
    const tenantData = {
      tenantName: (fd.get(`tenantName_${i}`) || '').trim(),
      phoneNumber: (fd.get(`phoneNumber_${i}`) || '').trim(),
      emailAddress: (fd.get(`emailAddress_${i}`) || '').trim() || null,
      propertyId: parseInt(document.getElementById('propertyId').value),
      flatRoomNumber: (fd.get(`flatRoomNumber_${i}`) || '').trim(),
      unitId: fd.get(`unitId_${i}`) ? parseInt(fd.get(`unitId_${i}`)) : null,
      bedIndex: fd.get(`bedIndex_${i}`) ? parseInt(fd.get(`bedIndex_${i}`)) : null,
      rentAmount: sharedRentAmount,
      securityDeposit: sharedSecurityDeposit,
      rentDueDate: sharedRentDueDate,
      leaseStartDate: sharedLeaseStartDate,
      leaseEndDate: sharedLeaseEndDate,
      temporaryPassword: isExisting ? null : ((fd.get(`temporaryPassword_${i}`) || '').trim() || null),
      status: 'ACTIVE',
      primary: i === primaryTenantIndex
    };

    if (!validateTenantData(tenantData, i)) return;
    
    // Check for existing active tenancy
    console.log(`[Multiple Tenants] Checking active tenancy for tenant ${i + 1}...`);
    try {
      const activeTenancyCheck = await apiService.checkActiveTenancy(tenantData.phoneNumber, tenantData.emailAddress);
      if (activeTenancyCheck) {
        // Extract first name for more personal message
        const firstName = tenantData.tenantName.trim().split(' ')[0];
        const message = `${firstName} is already added to a property (${activeTenancyCheck.propertyName}). Please ask them to leave that property first before adding to a new one.`;
        showAlert('error', message);
        return;
      }
    } catch (error) {
      // If error is not 404 (no active tenancy), it's an actual error
      if (error.status && error.status !== 404) {
        console.error(`[Multiple Tenants] Error checking active tenancy for tenant ${i + 1}:`, error);
        showAlert('error', `Error checking status for tenant ${i + 1}. Please try again.`);
        return;
      }
      // 404 means no active tenancy found, which is good - continue
    }
    
    tenants.push(tenantData);
  }

  // Validate all tenants belong to same property
  const propertyIds = [...new Set(tenants.map(t => t.propertyId))];
  if (propertyIds.length > 1) {
    return showAlert('error', 'All tenants must belong to the same property');
  }

  try {
    console.log('[Add Multiple Tenants] Calling API with tenants:', { tenants });
    showAlert('info', `Adding ${tenants.length} tenants...`);
    const response = await apiService.post('/tenants/multiple', { tenants });
    console.log('[Add Multiple Tenants] Success:', response);
    
    let successMessage = `${tenants.length} tenants added successfully!\n\n`;
    response.forEach((tenant, index) => {
      const phone = tenants[index]?.phoneNumber || '';
      successMessage += `${tenant.tenantName} (${phone}): ${tenant.username}${tenant.temporaryPassword ? ' (Password: ' + tenant.temporaryPassword + ')' : ''}\n`;
    });
    
    showAlert('success', successMessage);
    
    // Reset form
    document.getElementById('addTenantForm').reset();
    generateTenantForms(1);
    document.getElementById('tenantCount').value = '1';
    currentTenantCount = 1;
    toggleSections(currentPropertyType);
  } catch (error) {
    console.error('[Add Multiple Tenants] Error:', error);
    console.error('[Add Multiple Tenants] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      response: error.response
    });
    showAlert('error', error.message || 'Failed to add tenants');
  }
}

function validateTenantData(data, index) {
  console.log(`[Validation] Tenant ${index + 1} data:`, data);
  
  if (!data.tenantName || !data.propertyId || isNaN(data.rentAmount) || isNaN(data.securityDeposit)) {
    console.log(`[Validation] Failed basic validation - tenantName: '${data.tenantName}', propertyId: ${data.propertyId}, rentAmount: ${data.rentAmount}, securityDeposit: ${data.securityDeposit}`);
    showAlert('error', `Tenant ${index + 1}: Please fill all required fields (name, property, rent, deposit).`);
    return false;
  }
  
  if (!data.flatRoomNumber && !data.unitId) {
    // For FLAT properties, flatRoomNumber is optional if it's provided at the top level
    if (currentPropertyType === 'FLAT') {
      // Check if there's a top-level flatRoomNumber
      const topLevelFlatRoom = document.querySelector('input[name="flatRoomNumber"]')?.value?.trim();
      if (topLevelFlatRoom) {
        console.log(`[Validation] Using top-level flat room number: '${topLevelFlatRoom}'`);
        data.flatRoomNumber = topLevelFlatRoom; // Update the data object
      } else {
        console.log(`[Validation] Failed room/unit validation - flatRoomNumber: '${data.flatRoomNumber}', unitId: ${data.unitId}`);
        showAlert('error', `Tenant ${index + 1}: Please provide a Flat/Room Number.`);
        return false;
      }
    } else {
      console.log(`[Validation] Failed room/unit validation - flatRoomNumber: '${data.flatRoomNumber}', unitId: ${data.unitId}`);
      showAlert('error', `Tenant ${index + 1}: Please provide either a Flat/Room Number or assign a PG Unit.`);
      return false;
    }
  }
  
  
  if (!data.rentDueDate || data.rentDueDate < 1 || data.rentDueDate > 31) {
    console.log(`[Validation] Failed rent due date validation - rentDueDate: ${data.rentDueDate}`);
    showAlert('error', `Tenant ${index + 1}: Please pick a valid rent due date`);
    return false;
  }
  
  if (!data.leaseStartDate) {
    console.log(`[Validation] Failed lease start date validation - leaseStartDate: '${data.leaseStartDate}'`);
    showAlert('error', `Tenant ${index + 1}: Please select lease start date`);
    return false;
  }
  
  if (data.leaseEndDate && data.leaseEndDate < data.leaseStartDate) {
    showAlert('error', `Tenant ${index + 1}: Lease end date cannot be before lease start date`);
    return false;
  }

  return true;
}

function onTenantTypeChange(index, type) {
  const box = document.getElementById(`tenantLookup_${index}`);
  if (box) box.style.display = type === 'EXISTING' ? 'block' : 'none';
}

async function lookupExistingUserForIndex(index) {
  try {
    const phone = (document.getElementById(`lookupPhone_${index}`)?.value || '').trim();
    const email = (document.getElementById(`lookupEmail_${index}`)?.value || '').trim();
    const username = (document.getElementById(`lookupUsername_${index}`)?.value || '').trim();
    if (!phone && !email && !username) {
      return showAlert('error', `Tenant ${index+1}: Enter phone, email, or username to lookup`);
    }
    hideAlert();
    const user = await apiService.findUser({ phone, email, username });
    // Autofill
    const name = [user.firstName || '', user.lastName || ''].filter(Boolean).join(' ').trim();
    if (name) document.querySelector(`input[name="tenantName_${index}"]`).value = name;
    if (user.phoneNumber) {
      let p = user.phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      document.querySelector(`input[name="phoneNumber_${index}"]`).value = p;
    }
    if (user.email) document.querySelector(`input[name="emailAddress_${index}"]`).value = user.email;
    const resEl = document.getElementById(`lookupResult_${index}`);
    if (resEl) { resEl.style.display = 'block'; resEl.textContent = `Found user: ${user.username} (${user.email || 'no email'})`; }
  } catch (err) {
    const resEl = document.getElementById(`lookupResult_${index}`);
    if (resEl) {
      resEl.style.display = 'block';
      resEl.textContent = (err && err.status === 404) ? 'No matching user found.' : ('Lookup failed' + (err?.message ? (': ' + err.message) : '.'));
    }
  }
}

// Handle PG single-tenant submission using original single-tenant fields
async function handlePGSubmit(fd) {
  const rentDueDateDate = fd.get('rentDueDateDate');
  const rentDueDate = rentDueDateDate ? (new Date(rentDueDateDate)).getUTCDate() : null;
  const data = {
    tenantName: (fd.get('tenantName') || '').trim(),
    phoneNumber: (fd.get('phoneNumber') || '').trim(),
    emailAddress: (fd.get('emailAddress') || '').trim() || null,
    propertyId: parseInt(document.getElementById('propertyId').value),
    flatRoomNumber: (fd.get('flatRoomNumber') || '').trim(),
    unitId: fd.get('unitId') ? parseInt(fd.get('unitId')) : null,
    bedIndex: fd.get('bedIndex') ? parseInt(fd.get('bedIndex')) : null,
    rentAmount: parseInt(fd.get('rentAmount')),
    securityDeposit: parseInt(fd.get('securityDeposit')),
    rentDueDate: rentDueDate,
    leaseStartDate: fd.get('leaseStartDate'),
    leaseEndDate: fd.get('leaseEndDate') || null,
    temporaryPassword: (fd.get('temporaryPassword') || '').trim() || null,
    status: fd.get('status') || 'ACTIVE'
  };

  if (!validateTenantData({ ...data, rentDueDate: data.rentDueDate, leaseStartDate: data.leaseStartDate }, 0)) return;

  try {
    console.log('[Add Tenant PG] Calling API with data:', data);
    showAlert('info', 'Adding tenant...');
    const response = await apiService.post('/tenants', data);
    console.log('[Add Tenant PG] Success:', response);
    showAlert('success', `Tenant added successfully! Username: ${response.username}${response.temporaryPassword ? ', Password: ' + response.temporaryPassword : ''}`);
    document.getElementById('addTenantForm').reset();
    toggleSections(currentPropertyType);
  } catch (error) {
    console.error('[Add Tenant PG] Error:', error);
    showAlert('error', error.message || 'Failed to add tenant');
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
    // Lock fields to avoid accidental changes, but keep PG unit fields enabled
    setFormFieldsDisabled(true, ['propertyId','flatRoomNumber','rentAmount','securityDeposit','rentDueDateDate','leaseStartDate','leaseEndDate','status','unitId','bedIndex']);

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
  
  // Explicitly handle PG unit selection elements (they may not be in form.elements)
  const pgElements = ['floorSelect', 'unitSelect', 'bedIndex'];
  pgElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = false; // Always keep PG fields enabled
      el.style.backgroundColor = '';
      el.style.cursor = '';
    }
  });
  
  Array.from(form.elements).forEach(el => {
    // Skip if in exceptions list
    if (el.name && except.has(el.name)) return;
    // Skip if it's a PG field by ID
    if (el.id && pgElements.includes(el.id)) return;
    // keep buttons active
    if (el.tagName === 'BUTTON') return;
    // Use readonly instead of disabled so fields are still submitted
    if (el.type === 'text' || el.type === 'email' || el.type === 'tel' || el.type === 'number' || el.tagName === 'TEXTAREA') {
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
      
      // Check if this user already has an ACTIVE tenancy for the selected property
      const existingTenancy = tenants.find(t => {
        const tenantPhone = normalizePhone(t.phoneNumber);
        // Only block if status is ACTIVE - allow reassigning VACATED tenants
        return tenantPhone === userPhone && t.propertyId === selectedPropertyId && String(t.status).toUpperCase() === 'ACTIVE';
      });
      
      if (existingTenancy) {
        showAlert('error', `⚠️ Tenant already has an ACTIVE tenancy for this property! Deactivate the existing tenancy first, or edit it instead.`);
        // Disable submit button only for this specific property with active tenancy
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.title = 'Active tenancy exists for this property';
        }
      } else {
        hideAlert();
        // Re-enable submit button - no active tenancy for this property
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.title = '';
        }
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

// Load floors and units for PG properties
async function loadPropertyUnits(propertyId) {
  try {
    // If no property selected, hide PG section and reset dependent fields
    if (!propertyId) {
      const pgSection = document.getElementById('pgUnitSection');
      if (pgSection) pgSection.style.display = 'none';
      const flatRoomGroup = document.getElementById('flatRoomGroup');
      if (flatRoomGroup) flatRoomGroup.style.display = '';
      const floorSelect = document.getElementById('floorSelect');
      const unitSelect = document.getElementById('unitSelect');
      const unitInfo = document.getElementById('unitStatusInfo');
      if (floorSelect) floorSelect.innerHTML = '<option value="">Select Floor</option>';
      if (unitSelect) unitSelect.innerHTML = '<option value="">Select Unit</option>';
      if (unitInfo) unitInfo.textContent = 'Select a unit to see availability';
      return;
    }

    const property = await apiService.getMyProperty(propertyId);
    const isPG = (property?.type || '').toString().toUpperCase() === 'PG';
    
    const pgSection = document.getElementById('pgUnitSection');
    if (!isPG) {
      pgSection.style.display = 'none';
      // Show Flat/Room for non-PG
      const flatRoomGroup = document.getElementById('flatRoomGroup');
      if (flatRoomGroup) flatRoomGroup.style.display = '';
      // Reset PG selectors if previously set
      const floorSelect = document.getElementById('floorSelect');
      const unitSelect = document.getElementById('unitSelect');
      const unitInfo = document.getElementById('unitStatusInfo');
      if (floorSelect) floorSelect.innerHTML = '<option value="">Select Floor</option>';
      if (unitSelect) unitSelect.innerHTML = '<option value="">Select Unit</option>';
      if (unitInfo) unitInfo.textContent = 'Select a unit to see availability';
      return;
    }
    
    pgSection.style.display = 'block';
    // Hide Flat/Room for PG and clear any previous value
    const flatRoomGroup = document.getElementById('flatRoomGroup');
    if (flatRoomGroup) {
      flatRoomGroup.style.display = 'none';
      const frInput = flatRoomGroup.querySelector('input[name="flatRoomNumber"]');
      if (frInput) frInput.value = '';
    }
    
    // Load floors
    const floors = await apiService.getFloors(propertyId);
    const floorSelect = document.getElementById('floorSelect');
  floorSelect.innerHTML = "<option value=\"\">Select Floor</option>";
    floors.forEach(floor => {
      const opt = document.createElement('option');
      opt.value = floor.id;
      opt.textContent = floor.name || `Floor ${floor.number}`;
      floorSelect.appendChild(opt);
    });
    
    // Load all units for the property
    const units = await apiService.getUnits(propertyId);
    window.propertyUnits = units; // Store for filtering by floor
    
    // Add floor change listener
    floorSelect.addEventListener('change', () => {
      const floorId = parseInt(floorSelect.value);
      populateUnitsByFloor(floorId);
    });
    
    // Add unit change listener to show unit info
    const unitSelect = document.getElementById('unitSelect');
    unitSelect.addEventListener('change', () => {
      const unitId = parseInt(unitSelect.value);
      showUnitInfo(unitId);
    });
    
  } catch (err) {
    console.error('Failed to load property units', err);
    showAlert('error', 'Failed to load floors/units: ' + (err.message || 'Unknown error'));
  }
}

function populateUnitsByFloor(floorId) {
  const unitSelect = document.getElementById('unitSelect');
  unitSelect.innerHTML = "<option value=\"\">Select Unit</option>";
  
  if (!floorId || !window.propertyUnits) return;
  
  const floorUnits = window.propertyUnits.filter(u => u.floorId === floorId);
  floorUnits.forEach(unit => {
    const opt = document.createElement('option');
    opt.value = unit.id;
    const statusLabel = unit.status || 'UNKNOWN';
    opt.textContent = `${unit.code} - ${statusLabel} (${unit.capacity} beds)`;
    opt.disabled = unit.status === 'OCCUPIED' || unit.status === 'MAINTENANCE';
    unitSelect.appendChild(opt);
  });
  
  document.getElementById('unitStatusInfo').textContent = floorUnits.length 
    ? `${floorUnits.length} unit(s) on this floor` 
    : 'No units on this floor';
}

function showUnitInfo(unitId) {
  const infoDiv = document.getElementById('unitStatusInfo');
  if (!unitId || !window.propertyUnits) {
    infoDiv.textContent = 'Select a unit to see availability';
    return;
  }
  
  const unit = window.propertyUnits.find(u => u.id === unitId);
  if (!unit) return;
  
  const statusColors = {
    AVAILABLE: '#10b981',
    PARTIAL: '#f59e0b',
    OCCUPIED: '#ef4444',
    RESERVED: '#8b5cf6',
    MAINTENANCE: '#6b7280'
  };
  
  const color = statusColors[unit.status] || '#666';
  infoDiv.innerHTML = `
    <div style="color:${color}; font-weight:600;">${unit.status}</div>
    <div style="font-size:12px; margin-top:4px;">
      Capacity: ${unit.capacity} bed(s) | Rent: ?${unit.rentAmount || 0}
    </div>
  `;
  
  // Suggest bed index if partial
  const bedInput = document.getElementById('bedIndex');
  if (unit.status === 'PARTIAL' && bedInput) {
    bedInput.placeholder = 'Auto-assign next available bed';
  }
}

window.onExistingToggleChange = onExistingToggleChange;
window.lookupExistingUser = lookupExistingUser;
window.lookupExistingUserForIndex = lookupExistingUserForIndex;
window.onTenantTypeChange = onTenantTypeChange;
window.onPropertyChanged = onPropertyChanged;
window.loadPropertyUnits = loadPropertyUnits;
window.populateUnitsByFloor = populateUnitsByFloor;
window.showUnitInfo = showUnitInfo;



