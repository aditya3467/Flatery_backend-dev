/**
 * ========================================================
 * 🏠 owner.js - Owner Dashboard & Property Management
 * ========================================================
 * 
 * This file handles:
 * 1. Owner Dashboard (owner-dashboard.html) - Display property listings
 * 2. Edit Property Page (edit-property.html) - Edit property details
 * 
 * Previously: edit-property.js was separate
 * Merged: November 3, 2025 - Consolidated for easier maintenance
 * 
 * Dependencies: api.js, main.js, component-loader.js
 */

// Owner Dashboard logic: fetch and display total properties for the logged-in owner

(function () {
  document.addEventListener('DOMContentLoaded', async function () {
    try {
      // Ensure apiService is available
      if (typeof apiService === 'undefined') {
        console.error('API Service not loaded. Make sure api.js is included before owner.js');
        return;
      }

      // Guard: Only authenticated ADMINs should access owner dashboard
      const roles = JSON.parse(localStorage.getItem('roles') || '[]');
      if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
        // Notify and redirect
        safeNotify('Please login as an owner to view the dashboard.', 'info');
        window.location.href = 'index.html';
        return;
      }

      // Load dashboard metrics and properties
      await loadDashboardMetrics();
      await loadOwnerProperties();
    } catch (err) {
      console.error('Failed to load owner dashboard:', err);
      safeNotify(err.message || 'Failed to load dashboard data.', 'error');
    }
  });

  // Listen for tenant added event and reload metrics
  window.addEventListener('tenantAdded', async () => {
    console.log('Tenant added event received, reloading metrics...');
    await loadDashboardMetrics();
  });

  // Also reload when page becomes visible (user returns from another tab/page)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && apiService.isAuthenticated()) {
      console.log('Page became visible, reloading metrics...');
      await loadDashboardMetrics();
    }
  });

  async function loadDashboardMetrics() {
    try {
      const totalEl = document.getElementById('totalPropertiesCount');
      const tenantsEl = document.getElementById('activeTenantsCount');
      const depositsEl = document.getElementById('totalSecurityDeposits');

      if (totalEl) totalEl.textContent = '…';
      if (tenantsEl) tenantsEl.textContent = '…';
      if (depositsEl) depositsEl.textContent = '…';

      // Fetch a minimal page to read totalElements
      const page = await apiService.getMyProperties(false, 0, 1);
      const total = (page && (page.totalElements ?? page.total ?? page.total_items)) || 0;
      if (totalEl) totalEl.textContent = Number.isFinite(total) ? String(total) : '0';

      // Fetch active tenants count
      try {
        const tenants = await apiService.getTenants();
        const activeTenants = Array.isArray(tenants) 
          ? tenants.filter(t => t.status === 'ACTIVE').length 
          : 0;
        if (tenantsEl) tenantsEl.textContent = String(activeTenants);
      } catch (tenantErr) {
        if (tenantsEl) tenantsEl.textContent = '0';
      }

      // Fetch total security deposits
      try {
        const deposits = await apiService.getOwnerSecurityDeposits();
        if (depositsEl) depositsEl.textContent = `₹${Number(deposits).toLocaleString()}`;
      } catch (depositsErr) {
        if (depositsEl) depositsEl.textContent = '₹0';
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      const totalEl = document.getElementById('totalPropertiesCount');
      const tenantsEl = document.getElementById('activeTenantsCount');
      if (totalEl) totalEl.textContent = '0';
      if (tenantsEl) tenantsEl.textContent = '0';
      throw err;
    }
  }

  async function loadOwnerProperties() {
    try {
      const propertiesRow = document.querySelector('.properties-row');
      if (!propertiesRow) return;

      // Show loading state
      propertiesRow.innerHTML = '<div style="text-align: center; padding: 20px; width: 100%;">Loading properties...</div>';

      // Fetch all owner's properties
      const page = await apiService.getMyProperties(false, 0, 50);
      const properties = page.content || [];

      if (properties.length === 0) {
        propertiesRow.innerHTML = `
          <div style="text-align: center; padding: 40px; width: 100%;">
            <p style="font-size: 16px; color: #666;">No properties found.</p>
            <a href="add-property.html" style="color: #007bff; text-decoration: none;">Add your first property</a>
          </div>
        `;
        return;
      }

      // Clear and populate with actual properties
      propertiesRow.innerHTML = '';
      properties.forEach(property => {
        const card = createPropertyCard(property);
        propertiesRow.appendChild(card);
      });
    } catch (err) {
      console.error('Failed to load owner properties:', err);
      const propertiesRow = document.querySelector('.properties-row');
      if (propertiesRow) {
        propertiesRow.innerHTML = `
          <div style="text-align: center; padding: 20px; width: 100%; color: #f44336;">
            Failed to load properties. Please try again later.
          </div>
        `;
      }
      throw err;
    }
  }

  function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';

    // Build image URL - use primary image or placeholder
    const imageUrl = property.primaryImageUrl || 
                     'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60';

    // Format location
    const location = [property.location, property.city].filter(Boolean).join(', ') || 'Location not specified';

    // Compute property name:
    // For PG: use name field if present
    // For others: use first word of location + BHK type
    let propertyTitle;
    if (property.type === 'PG' && property.name) {
      propertyTitle = property.name;
    } else {
      // Get first word of location
      const firstWord = property.location ? property.location.trim().split(/\s+/)[0] : (property.city || 'Property');
      
      // Add BHK type if available
      if (property.bhkType) {
        const bhkNumber = property.bhkType.replace('BHK_', '');
        propertyTitle = `${firstWord} ${bhkNumber} BHK`;
      } else {
        propertyTitle = firstWord;
      }
    }

    // Get rent value
    const rent = property.expectedRent || property.rent || 0;

    const isPG = (property.type || '').toString().toUpperCase() === 'PG';
    const overlayLabel = isPG ? 'Manage PG' : 'Open Dashboard';

    card.innerHTML = `
      <div class="property-image" style="position:relative;">
        <img src="${imageUrl}" alt="${propertyTitle}" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'">
        <div class="manage-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s ease; pointer-events:none;">
          <span style="color:#fff; font-size:24px; font-weight:700; text-transform:uppercase; letter-spacing:2px;">${overlayLabel}</span>
        </div>
      </div>
      <div class="property-details">
        <h3>${propertyTitle}</h3>
        <p>${property.type || 'Property'}</p>
        <p>${location}</p>
        <p style="font-weight: 600; color: #007bff; margin-top: 8px;">₹${rent > 0 ? rent.toLocaleString() : 'N/A'}/month</p>
        <div class="property-actions" style="display:flex; gap:8px; margin-top:10px;">
          <button class="owner-btn edit-btn" title="Edit property" style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:8px; border:1px solid #007bff; background:#007bff; color:#fff; cursor:pointer; font-weight:500; transition: all 0.2s ease;"><i class="fas fa-edit"></i><span>Edit</span></button>
          <button class="owner-btn deactivate-btn" title="Deactivate listing" style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:8px; border:1px solid #e0e0e0; background:#fff; color:#dc3545; cursor:pointer; font-weight:500; transition: all 0.2s ease;"><i class="fas fa-power-off"></i><span>Deactivate</span></button>
        </div>
      </div>
    `;

    // Add hover effect for manage overlay
    const manageOverlay = card.querySelector('.manage-overlay');
    const propertyImage = card.querySelector('.property-image');
    
    if (propertyImage && manageOverlay) {
      propertyImage.addEventListener('mouseenter', () => {
        manageOverlay.style.opacity = '1';
      });
      propertyImage.addEventListener('mouseleave', () => {
        manageOverlay.style.opacity = '0';
      });
    }

      // Add click handler: PG -> property-config, others -> property-details (placeholder for future dashboards)
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        const type = (property.type || '').toString().toUpperCase();
        if (type === 'PG') {
          window.location.href = `owner/property-config.html?id=${property.id}`;
        } else {
          window.location.href = `property-details.html?id=${property.id}`;
        }
    });

    // Wire action buttons
    const deactivateBtn = card.querySelector('.deactivate-btn');
    const editBtn = card.querySelector('.edit-btn');
    if (deactivateBtn) {
      deactivateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeactivate(property, card, deactivateBtn);
      });
    }
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEdit(property);
      });
    }

    return card;
  }

  function handleDeactivate(property, card, btn) {
    const isInactive = card.classList.contains('is-inactive');
    const action = isInactive ? 'Activate' : 'Deactivate';
    const confirmed = confirm(`${action} this listing?`);
    if (!confirmed) return;

    // Placeholder: simulate server update and update UI state
    const imageWrap = card.querySelector('.property-image');
    let badge = imageWrap && imageWrap.querySelector('.status-badge');
    if (!badge && imageWrap) {
      badge = document.createElement('span');
      badge.className = 'status-badge';
      badge.style.cssText = 'position:absolute;top:10px;left:10px;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;';
      imageWrap.appendChild(badge);
    }

    if (isInactive) {
      // Activate
      card.classList.remove('is-inactive');
      card.style.opacity = '1';
      if (badge) { badge.textContent = 'Active'; badge.style.background = '#28a745'; badge.style.color = '#fff'; }
      btn.innerHTML = '<i class="fas fa-power-off"></i><span>Deactivate</span>';
      safeNotify('Listing activated (placeholder)', 'success');
    } else {
      // Deactivate
      card.classList.add('is-inactive');
      card.style.opacity = '0.6';
      if (badge) { badge.textContent = 'Inactive'; badge.style.background = '#dc3545'; badge.style.color = '#fff'; }
      btn.innerHTML = '<i class="fas fa-undo"></i><span>Activate</span>';
      safeNotify('Listing deactivated (placeholder)', 'info');
    }
  }

  function handleEdit(property) {
  window.location.href = `owner/edit-property.html?id=${property.id}`;
  }

  function safeNotify(message, type) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }
    // Minimal fallback toast
    const el = document.createElement('div');
    el.className = `notification ${type || 'info'}`;
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; padding: 12px 18px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.15);
      z-index: 10000; font-size: 14px; font-weight: 500; opacity: .95;`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
})();

// ========================================================
// 🔸 EDIT PROPERTY FUNCTIONALITY (from edit-property.js)
// ========================================================
// Edit Property Page JS: prefill form, manage images, and submit updates
(function() {
  console.log('📦 owner.js EDIT PROPERTY section loaded');
  
  const $ = (id) => document.getElementById(id);
  const notify = (m,t='info') => typeof window.showNotification==='function'?window.showNotification(m,t):alert(m);

  let propertyId = null;
  let existingImages = [];
  let preventRedirect = false; // Flag to prevent auto-logout on errors

  console.log('🎯 Adding DOMContentLoaded listener for edit property');
  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    console.log('🚀 Edit property init() called');
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📍 Full URL:', window.location.href);
    
    // Only run on edit-property page
    if (!window.location.pathname.includes('edit-property')) {
      console.log('⏭️ Not on edit-property page, skipping init');
      return;
    }
    
    console.log('✅ On edit-property page, continuing...');
    
    // Role guard
    try {
      const roles = JSON.parse(localStorage.getItem('roles') || '[]');
      console.log('👤 User roles:', roles);
      if (!roles.includes('ADMIN')) {
        notify('Only owners (ADMIN) can edit properties.', 'error');
        window.location.href = 'index.html';
        return;
      }
    } catch { window.location.href = 'index.html'; return; }

    const params = new URLSearchParams(window.location.search);
    propertyId = params.get('id');
    console.log('🔑 Property ID from URL:', propertyId);
    
    if (!propertyId) { notify('Missing property id', 'error'); window.history.back(); return; }

    console.log('⚙️ Setting up number steppers...');
    setupNumberSteppers();
    console.log('⚙️ Setting up time slot toggle...');
    setupTimeSlotToggle();
    console.log('⚙️ Setting up image upload...');
    setupUploadNewImages();

    console.log('📥 Loading property data...');
    await loadProperty();
    console.log('🖼️ Loading images...');
    await loadImages();

    const form = $('editPropertyForm');
    if (form) {
      console.log('📝 Form found, attaching submit handler');
      form.addEventListener('submit', onSubmit);
    } else {
      console.error('❌ Form #editPropertyForm not found!');
    }
    
    console.log('🎉 Init complete!');
  }

  async function loadProperty(){
    try {
      console.log('🔍 Loading property ID:', propertyId);
      const d = await apiService.getMyProperty(propertyId);
      console.log('✅ Property data received:', d);
      console.log('📊 Property type:', d.type);
      console.log('📊 Property bhkType:', d.bhkType);
      
      if (!d) {
        throw new Error('No property data received from server');
      }
      
      // Basic
      console.log('Setting property type:', d.type);
      setSelect('propertyType', d.type);
      toggleTypeFields();
      if (d.type === 'PG') {
        console.log('Setting PG seater:', d.pgSeater);
        setValue('seater', d.pgSeater);
      } else {
        const bhkValue = mapBhkTypeBack(d.bhkType);
        console.log('Setting BHK type:', d.bhkType, '→', bhkValue);
        setSelect('bhkType', bhkValue);
      }
      setValue('propertyName', d.name || '');
      setNumber('currentFloor', d.currentFloor);
      setNumber('totalFloor', d.totalFloor);
      setSelect('propertyAge', mapAgeBack(d.age));
      setSelect('facing', mapFacingBack(d.facing));
      setNumber('builtUpArea', d.builtUpAreaSqft);
      setNumber('bathrooms', d.bathrooms);

      // Locality
      setValue('city', d.city);
      setValue('location', d.location);
      setValue('landmark', d.landmark);

      // Rental
      setNumber('expectedRent', d.expectedRent);
      setNumber('expectedDeposit', d.expectedDeposit);
      setSelect('rentNegotiable', d.negotiable ? 'Yes' : 'No');
      setNumber('monthlyMaintenance', d.monthlyMaintenance || 0);
      setValue('availableFrom', d.availableFrom);
      setSelect('preferredTenant', mapPreferredTenantBack((d.preferredTenants||[])[0]));
      setSelect('furnishing', mapFurnishingBack(d.furnishing));
      setSelect('parking', mapParkingBack(d.parking));
      setValue('propertyDescription', d.description || '');

      // Amenities + balcony
      setAmenities(d.amenities || [], d.balcony);

      // Schedule
      setSelect('availability', mapAvailabilityBack(d.availability));
      if (d.allDay) {
        setSelect('timeSlot', 'All Day');
        const customGroup = $('#customTimeGroup');
        if (customGroup) customGroup.style.display = 'none';
      } else {
        setSelect('timeSlot', 'Custom');
        const customGroup = $('#customTimeGroup');
        if (customGroup) customGroup.style.display = 'flex';
        setValue('startTime', (d.startTime||'').toString());
        setValue('endTime', (d.endTime||'').toString());
      }

      // Show/Condition
      setSelect('propertyShower', mapWhoShowsBack(d.whoShows));
      setSelect('propertyCondition', mapCurrentConditionBack(d.currentCondition));

      // Type field visibility listeners
      const typeEl = $('#propertyType');
      if (typeEl) typeEl.addEventListener('change', toggleTypeFields);
      
      console.log('✅ Property loaded and form populated successfully!');
    } catch (e) {
      console.error('❌ Error loading property:', e);
      console.error('Error stack:', e.stack);
      console.error('Error message:', e.message);
      notify('Failed to load property details: ' + (e.message || 'Unknown error'), 'error');
    }
  }

  async function loadImages(){
    try {
      const container = $('existingImages');
      if (!container) return;
      container.innerHTML = '<div style="padding:10px;color:#666;">Loading images...</div>';
      const imgs = await apiService.getPropertyImages(propertyId);
      existingImages = Array.isArray(imgs)?imgs:[];
      renderExistingImages();
    } catch (e) {
      console.warn('Failed to load images', e);
      const container = $('existingImages');
      if (container) container.innerHTML = '<div style="padding:10px;color:#999;">No images available.</div>';
    }
  }

  function renderExistingImages(){
    const container = $('existingImages');
    if (!container) return;
    if (!existingImages.length){
      container.innerHTML = '<div style="padding:10px;color:#999;">No images available.</div>';
      return;
    }
    
    // Add instruction message
    const instructionDiv = document.createElement('div');
    instructionDiv.style.cssText = 'background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin-bottom:15px;font-size:13px;color:#856404;';
    instructionDiv.innerHTML = '<strong>💡 Note:</strong> The "Make Primary" feature requires backend configuration. <strong>Workaround:</strong> The first uploaded image is automatically primary. To change it, delete other images or upload your desired primary image first.';
    container.innerHTML = '';
    container.appendChild(instructionDiv);
    
    const imagesHtml = existingImages.map(img => {
      const isPrimary = !!img.primaryImage;
      return `
        <div style="position:relative;display:inline-block;margin:10px;vertical-align:top;width:200px;">
          <div style="position:relative;width:200px;height:200px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            ${isPrimary ? '<span style="position:absolute;top:8px;left:8px;background:#28a745;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;z-index:10;">Primary</span>' : ''}
            <img src="${img.url}" alt="Property Image" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'">
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;width:100%;">
            <button type="button" class="btn-make-primary" data-id="${img.id}" ${isPrimary?'disabled':''} style="padding:8px 12px;border:1px solid #007bff;border-radius:6px;background:${isPrimary?'#f5f5f5':'#007bff'};color:${isPrimary?'#999':'#fff'};cursor:${isPrimary?'not-allowed':'pointer'};font-size:13px;font-weight:500;">Make Primary</button>
            <button type="button" class="btn-delete-image" data-id="${img.id}" style="padding:8px 12px;border:1px solid #dc3545;border-radius:6px;background:#fff;color:#dc3545;cursor:pointer;font-size:13px;font-weight:500;">Delete</button>
          </div>
        </div>`;
    }).join('');
    
    container.innerHTML += imagesHtml;

    container.querySelectorAll('.btn-make-primary').forEach(btn => btn.addEventListener('click', onMakePrimary));
    container.querySelectorAll('.btn-delete-image').forEach(btn => btn.addEventListener('click', onDeleteImage));
  }

  async function onMakePrimary(e){
    e.preventDefault();
    e.stopPropagation();
    
    const id = e.currentTarget.getAttribute('data-id');
    console.log('🖼️ Make Primary clicked - Property ID:', propertyId, 'Image ID:', id);
    console.log('🔑 Auth token exists:', !!localStorage.getItem('authToken'));
    
    if (!id || !propertyId) {
      notify('Missing image or property ID', 'error');
      return;
    }
    
    // Store current auth state
    const authToken = localStorage.getItem('authToken');
    const roles = localStorage.getItem('roles');
    const username = localStorage.getItem('username');
    
    // Disable button during request
    const originalText = e.currentTarget.textContent;
    e.currentTarget.disabled = true;
    e.currentTarget.textContent = 'Setting...';
    
    try {
      console.log('📤 Calling setPrimaryPropertyImage API...');
      const result = await apiService.setPrimaryPropertyImage(propertyId, id);
      console.log('✅ Primary image set successfully:', result);
      notify('Primary image updated successfully!', 'success');
      
      // Reload images to show updated primary status
      await loadImages();
      
    } catch(err){
      console.error('❌ Error setting primary image:', err);
      console.error('Error status:', err.status);
      console.error('Error message:', err.message);
      
      // Restore auth state if it was cleared
      if (authToken && !localStorage.getItem('authToken')) {
        console.warn('⚠️ Auth token was cleared, restoring...');
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('roles', roles);
        localStorage.setItem('username', username);
      }
      
      // Re-enable button
      e.currentTarget.disabled = false;
      e.currentTarget.textContent = originalText;
      
      // Show specific error message without redirecting
      if (err.status === 403) {
        notify('Permission denied (403). This feature is temporarily unavailable.', 'error');
      } else if (err.status === 401) {
        notify('Authentication failed. Please try again.', 'error');
      } else {
        notify('Failed to set primary image: ' + (err.message || 'Unknown error'), 'error');
      }
      
      // IMPORTANT: Don't throw or rethrow the error
      return; // Exit gracefully
    }
  }

  async function onDeleteImage(e){
    const id = e.currentTarget.getAttribute('data-id');
    if (!confirm('Delete this image?')) return;
    try {
      await apiService.deletePropertyImage(propertyId, id);
      notify('Image deleted', 'success');
      await loadImages();
    } catch(err){
      console.error(err);
      notify('Failed to delete image', 'error');
    }
  }

  function setupUploadNewImages(){
    const input = $('newPropertyImages');
    const preview = $('newImagePreviewContainer');
    if (!input || !preview) return;
    let filesQueue = [];

    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      // show previews
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const item = document.createElement('div');
          item.className = 'image-preview-item';
          item.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
          preview.appendChild(item);
        };
        reader.readAsDataURL(file);
      });

      try {
        await apiService.uploadPropertyImages(propertyId, files);
        notify('Images uploaded', 'success');
        preview.innerHTML = '';
        input.value = '';
        await loadImages();
      } catch (err) {
        console.error(err);
        notify('Failed to upload images', 'error');
      }
    });
  }

  function setupNumberSteppers(){
    document.querySelectorAll('.number-input .increment').forEach(btn => {
      btn.addEventListener('click', function(){
        const id = this.getAttribute('data-target');
        const el = $(id);
        if (el) el.value = (parseInt(el.value)||0) + 1;
      });
    });
    document.querySelectorAll('.number-input .decrement').forEach(btn => {
      btn.addEventListener('click', function(){
        const id = this.getAttribute('data-target');
        const el = $(id);
        if (el) {
          const v = (parseInt(el.value)||0) - 1;
          el.value = v > 1 ? v : 1;
        }
      });
    });
  }

  function setupTimeSlotToggle(){
    const timeSlot = $('timeSlot');
    if (timeSlot) {
      timeSlot.addEventListener('change', () => {
        const customGroup = $('#customTimeGroup');
        if (customGroup) customGroup.style.display = timeSlot.value === 'Custom' ? 'flex' : 'none';
      });
    }
  }

  function toggleTypeFields(){
    const typeEl = $('propertyType');
    if (!typeEl) return;
    const type = typeEl.value;
    const nameGroup = $('propertyNameGroup');
    const bhkGroup = $('bhkTypeGroup');
    const seaterGroup = $('seaterGroup');
    if (type === 'PG') {
      if (nameGroup) nameGroup.style.display = 'block';
      if (seaterGroup) seaterGroup.style.display = 'block';
      if (bhkGroup) bhkGroup.style.display = 'none';
    } else if (type === 'APARTMENT') {
      if (nameGroup) nameGroup.style.display = 'block';
      if (seaterGroup) seaterGroup.style.display = 'none';
      if (bhkGroup) bhkGroup.style.display = 'block';
    } else { // FLAT
      if (nameGroup) nameGroup.style.display = 'none';
      if (seaterGroup) seaterGroup.style.display = 'none';
      if (bhkGroup) bhkGroup.style.display = 'block';
    }
  }

  async function onSubmit(e){
    e.preventDefault();
    try {
      const payload = buildUpdateData();
      await apiService.updateProperty(propertyId, payload);
      notify('Property updated successfully', 'success');
      setTimeout(() => window.location.href = 'owner-dashboard.html', 800);
    } catch (err){
      console.error(err);
      notify(err.message || 'Failed to update property', 'error');
    }
  }

  function buildUpdateData(){
    const type = $('propertyType').value;
    const data = {
      type,
      name: $('propertyName').value || null,
      bhkType: type === 'PG' ? null : mapBhkType($('bhkType').value),
      pgSeater: type === 'PG' ? parseInt($('seater').value) : null,
      currentFloor: intval('currentFloor'),
      totalFloor: intval('totalFloor'),
      age: mapPropertyAge($('propertyAge').value),
      facing: mapFacing($('facing').value),
      builtUpAreaSqft: intval('builtUpArea'),
      bathrooms: intval('bathrooms'),
      amenities: getSelectedAmenities(),
      balcony: isBalconyChecked(),

      city: $('city').value,
      location: $('location').value,
      landmark: $('landmark').value,

      expectedRent: intval('expectedRent'),
      expectedDeposit: intval('expectedDeposit'),
      negotiable: $('rentNegotiable').value === 'Yes',
      monthlyMaintenance: intval('monthlyMaintenance') || 0,
      availableFrom: $('availableFrom').value,
      preferredTenants: [mapPreferredTenant($('preferredTenant').value)],
      furnishing: $('furnishing').value.toUpperCase().replace('-', '_'),
      parking: $('parking').value.toUpperCase(),
      description: $('propertyDescription').value,

      availability: mapAvailability($('availability').value),
      allDay: $('timeSlot').value === 'All Day',
      startTime: $('timeSlot').value === 'Custom' ? $('startTime').value : null,
      endTime: $('timeSlot').value === 'Custom' ? $('endTime').value : null,
    };
    return data;
  }

  // Helpers
  function setValue(id, v){ 
    const el = $(id); 
    if (!el) {
      console.warn(`⚠️ Element not found: ${id}`);
      return;
    }
    el.value = v ?? ''; 
  }
  function setNumber(id, v){ 
    const el = $(id); 
    if (!el) {
      console.warn(`⚠️ Element not found: ${id}`);
      return;
    }
    el.value = Number.isFinite(v)? v : ''; 
  }
  function setSelect(id, v){ 
    const el = $(id); 
    if (!el) {
      console.warn(`⚠️ Element not found: ${id}`);
      return;
    }
    el.value = v ?? ''; 
    console.log(`Set ${id} = ${v}`);
  }
  function intval(id){ const el = $(id); return el ? (parseInt(el.value) || 0) : 0; }

  function mapPropertyAge(v){ return ({'1-3':'Y1_3','3-5':'Y3_5','5-10':'Y5_10','10+':'Y10_PLUS'})[v] || null; }
  function mapAgeBack(v){ return ({Y1_3:'1-3',Y3_5:'3-5',Y5_10:'5-10',Y10_PLUS:'10+'})[v] || ''; }
  function mapBhkType(v){ return ({'1':'ONE','2':'TWO','3':'THREE','4':'FOUR','4+':'FOUR_PLUS'})[v] || null; }
  function mapBhkTypeBack(v){ return ({ONE:'1',TWO:'2',THREE:'3',FOUR:'4',FOUR_PLUS:'4+'})[v] || ''; }
  function mapFacing(v){ return ({North:'NORTH',South:'SOUTH',East:'EAST',West:'WEST'})[v] || null; }
  function mapFacingBack(v){ return ({NORTH:'North',SOUTH:'South',EAST:'East',WEST:'West'})[v] || ''; }
  function mapPreferredTenant(v){
    const m = {'Bachelors Male':'BACHELORS_MALE','Bachelors Female':'BACHELORS_FEMALE','Couple':'COUPLE','Family':'FAMILY','Married':'MARRIED','Anyone':'ANYONE'}; return m[v] || 'ANYONE'; }
  function mapPreferredTenantBack(v){ const m = {BACHELORS_MALE:'Bachelors Male',BACHELORS_FEMALE:'Bachelors Female',COUPLE:'Couple',FAMILY:'Family',MARRIED:'Married',ANYONE:'Anyone'}; return m[v] || ''; }
  function mapFurnishingBack(v){ const m = {FURNISHED:'Furnished',SEMI_FURNISHED:'Semi-Furnished',UNFURNISHED:'Unfurnished'}; return m[v] || ''; }
  function mapParkingBack(v){ const m = {BIKE:'Bike',CAR:'Car',BOTH:'Both',NONE:'None'}; return m[v] || ''; }
  function mapAvailability(x){ const m = {Everyday:'EVERYDAY',Weekdays:'WEEKDAYS',Weekend:'WEEKEND'}; return m[x] || null; }
  function mapAvailabilityBack(x){ const m = {EVERYDAY:'Everyday',WEEKDAYS:'Weekdays',WEEKEND:'Weekend'}; return m[x] || ''; }
  function mapWhoShowsBack(v){ const m = {MYSELF:'Myself',NEIGHBOUR:'Neighbour',TENANT:'Tenant',FRIEND_FAMILY:'Friend/Family',NEED_HELP:'Need Help',OTHERS:'Others'}; return m[v] || ''; }
  function mapCurrentConditionBack(v){ const m = {NEWLY_BUILT:'Newly Built',VACANT:'Vacant',TENANT_NOTICE:'Tenant on Notice Period',NEED_MANAGEMENT_HELP:'Need Help to Manage'}; return m[v] || ''; }

  function isBalconyChecked(){
    const balcony = document.querySelector('input[name="amenities"][value="Balcony"]');
    return balcony ? balcony.checked : false;
  }
  function getSelectedAmenities(){
    const mapping = {
      'Housekeeping': 'HOUSEKEEPING', 'CCTV': 'CCTV','Kitchen':'KITCHEN','Self Cooking':'SELF_COOKING','Geyser':'GEYSER','Refrigerator':'REFRIGERATOR',
      '24x7 Security':'SECURITY_24X7','TV':'TV','Power Backup':'POWER_BACKUP','Air Conditioning':'AC','Wi-Fi':'WIFI','Washing Machine':'WASHING_MACHINE','Balcony':'BALCONY'
    };
    const allowed = new Set(Object.values(mapping));
    return Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
      .map(cb => mapping[cb.value]).filter(v => v && v !== 'BALCONY' && allowed.has(v));
  }
  function setAmenities(amenitiesEnum, balconyBool){
    const reverse = {
      HOUSEKEEPING:'Housekeeping', CCTV:'CCTV', KITCHEN:'Kitchen', SELF_COOKING:'Self Cooking', GEYSER:'Geyser', REFRIGERATOR:'Refrigerator',
      SECURITY_24X7:'24x7 Security', TV:'TV', POWER_BACKUP:'Power Backup', AC:'Air Conditioning', WIFI:'Wi-Fi', WASHING_MACHINE:'Washing Machine'
    };
    document.querySelectorAll('input[name="amenities"]').forEach(cb => cb.checked = false);
    (amenitiesEnum||[]).forEach(a => {
      const label = reverse[a];
      if (!label) return;
      const input = document.querySelector(`input[name="amenities"][value="${label}"]`);
      if (input) input.checked = true;
    });
    const balcony = document.querySelector('input[name="amenities"][value="Balcony"]');
    if (balcony) balcony.checked = !!balconyBool;
  }
})();
