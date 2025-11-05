// Property Configuration Page Script
let currentPropertyId = null;
let propertyData = null;
let floors = [];
let units = [];
let tenants = [];
let currentView = 'floors'; // 'floors' or 'tenants'

document.addEventListener('DOMContentLoaded', async function() {
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentPropertyId = urlParams.get('id');
  
  if (!currentPropertyId) {
    showAlert('error', 'No property selected');
    setTimeout(() => window.location.href = 'Owner.html', 2000);
    return;
  }

  // Ensure authenticated and owner role
  const ok = await ensureOwnerSession();
  if (ok) {
    await loadPropertyConfig();
    setupNavigationHandlers();
  }
});

function setupNavigationHandlers() {
  // Handle navigation between sections (sidebar only)
  document.querySelectorAll('.config-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href') || '';
      if (!href.startsWith('#')) return; // allow normal links
      e.preventDefault();

      // Remove active class from sidebar nav items
      document.querySelectorAll('.config-sidebar .nav-item').forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Show appropriate section
      if (href === '#floors') {
        showFloorsSection();
      } else if (href === '#tenants') {
        showTenantsSection();
      }
    });
  });
}

function toggleTopMeta(show) {
  const pageTitle = document.querySelector('.page-title-section');
  const filters = document.querySelector('.filters-section');
  const stats = document.querySelector('.stats-overview');
  if (pageTitle) pageTitle.style.display = show ? 'block' : 'none';
  if (filters) filters.style.display = show ? 'flex' : 'none';
  // Restore the original layout for stats (flex), not grid
  if (stats) stats.style.display = show ? 'flex' : 'none';
}

function showFloorsSection() {
  currentView = 'floors';
  document.querySelector('.floors-section').style.display = 'block';
  document.querySelector('.tenants-section').style.display = 'none';
  // Show top meta (title/filters/stats) in floors view
  toggleTopMeta(true);
}

function showTenantsSection() {
  currentView = 'tenants';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'block';
  // Hide top meta (title/filters/stats) in tenants view
  toggleTopMeta(false);
  loadTenants();
}

async function ensureOwnerSession() {
  try {
    if (!apiService.isAuthenticated()) {
      showAlert('error', 'Please log in as an owner.');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return false;
    }
    
    let roles = [];
    try { 
      roles = JSON.parse(localStorage.getItem('roles') || '[]'); 
    } catch { 
      roles = []; 
    }
    
    if (!roles.length) {
      const user = await apiService.getCurrentUser();
      roles = user?.roles ? Array.from(user.roles) : [];
    }
    
    const isOwner = roles.includes('ADMIN') || roles.includes('SUPERADMIN');
    if (!isOwner) {
      showAlert('error', 'Only property owners can access this page.');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Auth check failed', e);
    showAlert('error', 'Authentication required. Please log in again.');
    return false;
  }
}

async function loadPropertyConfig() {
  try {
    // Load property details
    propertyData = await apiService.getMyProperty(currentPropertyId);
    
    // Guard: Only allow PG properties to access this page
    const pType = (propertyData?.type || '').toString().toUpperCase();
    if (pType !== 'PG') {
      showAlert('error', 'This configuration page is only for PG properties.');
      setTimeout(() => window.location.href = 'Owner.html', 1800);
      return;
    }
    
    // Update UI with property name
    document.getElementById('propertyName').textContent = propertyData.name || 'Property';
    document.getElementById('breadcrumbProperty').textContent = propertyData.name || 'Configuration';
    
    // Load user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.firstName || 'Owner';
    
  // Load floors and units from backend
  await loadFloorsAndUnitsFromApi();
    
  // Render the configuration
  renderFloorsAndUnits();
  updateStats();
  populateFloorFilters();
    
  } catch (error) {
    console.error('Failed to load property configuration:', error);
    showAlert('error', 'Failed to load property configuration');
  }
}

async function loadFloorsAndUnitsFromApi() {
  // Fetch floors
  const floorList = await apiService.getFloors(currentPropertyId);
  floors = Array.isArray(floorList) ? floorList : [];
  
  // Fetch units
  const unitList = await apiService.getUnits(currentPropertyId);
  const floorById = new Map(floors.map(f => [f.id, f]));
  units = (Array.isArray(unitList) ? unitList : []).map(u => {
    const capacity = u.capacity || 1;
    const occupied = u.occupiedBeds || 0;
    let status = (u.status || 'AVAILABLE').toString();
    // Derive status from occupancy cache to avoid stale values
    if (occupied === 0) status = 'AVAILABLE';
    else if (occupied < capacity) status = 'PARTIAL';
    else status = 'OCCUPIED';
    return {
      id: u.id,
      floor: floorById.get(u.floorId)?.number ?? 0,
      number: u.code,
      type: u.type || 'ROOM',
      beds: capacity,
      occupied: occupied,
      free: Math.max(0, capacity - occupied),
      rent: u.rentAmount || 0,
      status: status.toLowerCase()
    };
  });

  // Console logs for debugging occupancy per unit and per floor
  units.forEach(u => {
    console.log(`[PG] Unit ${u.number}: active tenants=${u.occupied}, capacity=${u.beds}, freeBeds=${u.free}`);
  });
  const byFloor = new Map();
  units.forEach(u => {
    const key = u.floor;
    const prev = byFloor.get(key) || { tenants: 0, beds: 0, free: 0 };
    prev.tenants += u.occupied;
    prev.beds += u.beds;
    prev.free += u.free;
    byFloor.set(key, prev);
  });
  byFloor.forEach((agg, floorNum) => {
    console.log(`[PG] Floor ${floorNum}: tenants=${agg.tenants}, beds=${agg.beds}, freeBeds=${agg.free}`);
  });
}

function renderFloorsAndUnits() {
  const container = document.getElementById('floorsContainer');
  container.innerHTML = '';
  
  floors.forEach(floor => {
    const floorUnits = units.filter(u => u.floor === floor.number);
    const floorCard = createFloorCard(floor, floorUnits);
    container.appendChild(floorCard);
  });
}

function createFloorCard(floor, floorUnits) {
  const card = document.createElement('div');
  card.className = 'floor-card';
  
  const available = floorUnits.filter(u => u.status === 'available').length;
  const partial = floorUnits.filter(u => u.status === 'partial').length;
  const occupied = floorUnits.filter(u => u.status === 'occupied').length;
  const totalBeds = floorUnits.reduce((sum, u) => sum + (u.beds || 0), 0);
  const freeBeds = floorUnits.reduce((sum, u) => sum + (u.free || 0), 0);
  
  card.innerHTML = `
    <div class="floor-header">
      <h3>${floor.name}</h3>
      <button class="btn-icon" onclick="deleteFloorById(${floor.id})">
        <i class="fas fa-trash"></i> Delete Floor
      </button>
    </div>
    <div class="floor-stats">
      <span>Total Units: <strong>${floorUnits.length}</strong></span>
      <span>Total Beds: <strong>${totalBeds}</strong></span>
      <span>Free Beds: <strong class="text-success">${freeBeds}</strong></span>
      <span>Available: <strong class="text-success">${available}</strong></span>
      <span>Partially Filled: <strong class="text-warning">${partial}</strong></span>
      <span>Occupied: <strong class="text-danger">${occupied}</strong></span>
    </div>
    <div class="units-grid" id="floor${floor.number}Units"></div>
    <button class="btn-add-unit" onclick="openAddUnitModal(${floor.number})">
      <i class="fas fa-plus-circle"></i> Add Unit
    </button>
  `;
  
  // Render units
  const unitsGrid = card.querySelector('.units-grid');
  floorUnits.forEach(unit => {
    const unitBox = createUnitBox(unit);
    unitsGrid.appendChild(unitBox);
  });
  
  return card;
}

function createUnitBox(unit) {
  const box = document.createElement('div');
  box.className = `unit-box ${unit.status}`;
  box.onclick = () => openUnitDetails(unit);
  
  const icon = unit.status === 'available' ? 'fa-check-circle' :
                 (unit.status === 'occupied' || unit.status === 'partial') ? 'fa-user' :
               unit.status === 'reserved' ? 'fa-bookmark' : 'fa-wrench';
  
  box.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${unit.number}</span>
    <small style="display:block;opacity:.8;margin-top:4px;">${unit.free}/${unit.beds} beds free</small>
  `;
  
  return box;
}

function updateStats() {
  const totalUnits = units.length;
  const totalBeds = units.reduce((sum, u) => sum + (u.beds || 0), 0);
  const available = units.filter(u => u.status === 'available').length;
  const partial = units.filter(u => u.status === 'partial').length;
  const occupied = units.filter(u => u.status === 'occupied').length;
  const maintenance = units.filter(u => u.status === 'maintenance').length;
  const availableBeds = units.reduce((sum, u) => sum + (u.free || 0), 0);
  
  document.getElementById('totalUnits').textContent = totalUnits;
  document.getElementById('totalBeds').textContent = totalBeds;
  const ab = document.getElementById('availableBeds');
  if (ab) ab.textContent = availableBeds;
  document.getElementById('availableUnits').textContent = available;
  document.getElementById('occupiedUnits').textContent = occupied;
  const pu = document.getElementById('partiallyUnits');
  if (pu) pu.textContent = partial;
  document.getElementById('maintenanceUnits').textContent = maintenance;
}

function populateFloorFilters() {
  const floorFilter = document.getElementById('floorFilter');
  const unitFloorSelect = document.getElementById('unitFloorSelect');
  
  floors.forEach(floor => {
    const option1 = document.createElement('option');
    option1.value = floor.number;
    option1.textContent = floor.name;
    floorFilter.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = floor.id;
    option2.textContent = floor.name;
    unitFloorSelect.appendChild(option2);
  });
}

// Modal Functions
function openCreateFloorModal() {
  document.getElementById('createFloorModal').classList.add('active');
}

function closeCreateFloorModal() {
  document.getElementById('createFloorModal').classList.remove('active');
  document.getElementById('createFloorForm').reset();
}

function openAddUnitModal(floorNumber = null) {
  document.getElementById('addUnitModal').classList.add('active');
  if (floorNumber !== null) {
    const floor = floors.find(f => f.number === floorNumber);
    if (floor) {
      document.getElementById('unitFloorSelect').value = floor.id;
    }
  }
}

function closeAddUnitModal() {
  document.getElementById('addUnitModal').classList.remove('active');
  document.getElementById('addUnitForm').reset();
}

function openUnitDetails(unit) {
  // Show unit details modal or navigate to unit management page
  alert(`Unit: ${unit.number}\nType: ${unit.type}\nBeds: ${unit.beds}\nRent: ₹${unit.rent}\nStatus: ${unit.status}`);
  // In production, open a detailed modal or page
}

// Form Handlers
async function handleCreateFloor(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const number = parseInt(formData.get('floorNumber'));
  const name = formData.get('floorName');
  
  try {
    await apiService.createFloor(currentPropertyId, { number, name });
    closeCreateFloorModal();
    showAlert('success', 'Floor created successfully');
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
    populateFloorFilters();
  } catch (err) {
    showAlert('error', err.message || 'Failed to create floor');
  }
}

async function handleAddUnit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const floorId = parseInt(formData.get('floor'));
  const code = formData.get('unitNumber');
  const uiType = formData.get('unitType');
  const beds = parseInt(formData.get('beds')) || 1;
  const rent = parseInt(formData.get('rent')) || 0;

  // Map UI to backend model (PG focus)
  let type = 'ROOM';
  let sharingType = 'PRIVATE';
  let capacity = beds;
  if (uiType === 'Shared') {
    if (beds === 2) sharingType = 'DOUBLE';
    else if (beds === 3) sharingType = 'TRIPLE';
    else if (beds === 4) sharingType = 'QUAD';
    else sharingType = 'CUSTOM';
  } else {
    sharingType = beds > 1 ? 'CUSTOM' : 'PRIVATE';
  }

  try {
    await apiService.createUnit(currentPropertyId, {
      floorId,
      code,
      type,
      sharingType,
      capacity,
      genderPolicy: 'ANY',
      rentAmount: rent,
      depositAmount: null,
      furnishedLevel: 'UNFURNISHED',
      attributes: null
    });
    closeAddUnitModal();
    showAlert('success', 'Unit added successfully');
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
  } catch (err) {
    showAlert('error', err.message || 'Failed to add unit');
  }
}

async function deleteFloorById(floorId) {
  if (!confirm('Are you sure you want to delete this floor? All units on this floor will be deleted.')) {
    return;
  }
  try {
    await apiService.deleteFloor(floorId);
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
    populateFloorFilters();
    showAlert('success', 'Floor deleted successfully');
  } catch (err) {
    showAlert('error', err.message || 'Failed to delete floor');
  }
}

// Backward-compat: delete by floor number if called from static markup
function deleteFloor(floorNumber) {
  const f = floors.find(fl => fl.number === floorNumber);
  if (!f) {
    showAlert('error', 'Floor not found');
    return;
  }
  deleteFloorById(f.id);
}

// Utility Functions
function showAlert(type, message) {
  const alert = document.getElementById('alertMessage');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  alert.style.display = 'block';
  
  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
};

// Tenants Section Functions
async function loadTenants() {
  try {
    const tenantsData = await apiService.getTenants();
    // Filter tenants for current property
    tenants = tenantsData.filter(t => t.propertyId === parseInt(currentPropertyId));
    renderTenants();
  } catch (error) {
    console.error('Failed to load tenants:', error);
    showAlert('error', 'Failed to load tenants');
  }
}

function renderTenants() {
  const container = document.getElementById('tenantsListContainer');
  
  if (!tenants || tenants.length === 0) {
    container.innerHTML = `
      <div class="tenants-empty">
        <i class="fas fa-users"></i>
        <h3>No Tenants Yet</h3>
        <p>Start by adding tenants to your property</p>
        <button class="btn-primary" onclick="window.location.href='add-tenant.html?propertyId=${currentPropertyId}'">
          <i class="fas fa-plus"></i> Add Tenant
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  tenants.forEach(tenant => {
    const initials = getInitials(tenant.tenantName);
    const floorName = getFloorName(tenant.floorId);
    const unitName = getUnitName(tenant.unitId);
    const bedInfo = tenant.bedIndex !== null && tenant.bedIndex !== undefined ? ` (Bed ${tenant.bedIndex})` : '';
    const location = unitName ? `${unitName}${bedInfo}` : 'Not Assigned';
    
    html += `
      <div class="tenant-item" data-tenant-id="${tenant.id}">
        <div class="tenant-avatar">${initials}</div>
        <div class="tenant-info">
          <div class="tenant-detail">
            <span class="tenant-label">Name</span>
            <span class="tenant-value name">${tenant.tenantName || 'N/A'}</span>
          </div>
          <div class="tenant-detail">
            <span class="tenant-label">Mobile Number</span>
            <span class="tenant-value phone">${tenant.phoneNumber || 'N/A'}</span>
          </div>
          <div class="tenant-detail">
            <span class="tenant-label">Floor</span>
            <span class="tenant-value">${floorName}</span>
          </div>
          <div class="tenant-detail">
            <span class="tenant-label">Unit / Room</span>
            <span class="tenant-value">${location}</span>
          </div>
        </div>
        <div class="tenant-actions">
          <button class="btn-menu" onclick="toggleTenantMenu(${tenant.id})">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="tenant-dropdown" id="tenantMenu-${tenant.id}">
            <button onclick="editTenant(${tenant.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete" onclick="removeTenant(${tenant.id})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tenant-actions')) {
      document.querySelectorAll('.tenant-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getFloorName(floorId) {
  if (!floorId) return 'N/A';
  const floor = floors.find(f => f.id === floorId);
  return floor ? floor.name : 'N/A';
}

function getUnitName(unitId) {
  if (!unitId) return null;
  const unit = units.find(u => u.id === unitId);
  return unit ? unit.number : null;
}

function toggleTenantMenu(tenantId) {
  event.stopPropagation();
  const menu = document.getElementById(`tenantMenu-${tenantId}`);
  
  // Close all other menus
  document.querySelectorAll('.tenant-dropdown').forEach(dropdown => {
    if (dropdown.id !== `tenantMenu-${tenantId}`) {
      dropdown.classList.remove('active');
    }
  });
  
  menu.classList.toggle('active');
}

function editTenant(tenantId) {
  // Will implement API later
  console.log('Edit tenant:', tenantId);
  showAlert('info', 'Edit functionality will be implemented soon');
}

function removeTenant(tenantId) {
  // Will implement API later
  console.log('Remove tenant:', tenantId);
  if (confirm('Are you sure you want to remove this tenant?')) {
    showAlert('info', 'Remove functionality will be implemented soon');
  }
}

// Search functionality for tenants
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchTenant');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const tenantItems = document.querySelectorAll('.tenant-item');
      
      tenantItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
});

// Expose functions to window
window.openCreateFloorModal = openCreateFloorModal;
window.closeCreateFloorModal = closeCreateFloorModal;
window.openAddUnitModal = openAddUnitModal;
window.closeAddUnitModal = closeAddUnitModal;
window.handleCreateFloor = handleCreateFloor;
window.handleAddUnit = handleAddUnit;
window.deleteFloor = deleteFloor;
window.deleteFloorById = deleteFloorById;
window.loadPropertyConfig = loadPropertyConfig;
window.openUnitDetails = openUnitDetails;
window.toggleTenantMenu = toggleTenantMenu;
window.editTenant = editTenant;
window.removeTenant = removeTenant;
