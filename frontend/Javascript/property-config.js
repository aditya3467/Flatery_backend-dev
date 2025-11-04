// Property Configuration Page Script
let currentPropertyId = null;
let propertyData = null;
let floors = [];
let units = [];

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
  }
});

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
    
    // Initialize floors and units data
    initializeFloorsAndUnits();
    
    // Render the configuration
    renderFloorsAndUnits();
    updateStats();
    populateFloorFilters();
    
  } catch (error) {
    console.error('Failed to load property configuration:', error);
    showAlert('error', 'Failed to load property configuration');
  }
}

function initializeFloorsAndUnits() {
  // For now, create a sample structure
  // In production, this would come from your backend
  floors = [
    { id: 0, name: 'Ground Floor', number: 0 },
    { id: 1, name: 'First Floor', number: 1 },
    { id: 2, name: 'Second Floor', number: 2 }
  ];
  
  // Sample units - replace with actual data from backend
  units = [
    { id: 1, floor: 0, number: 'B-1', type: '2BHK', beds: 2, rent: 12000, status: 'available' },
    { id: 2, floor: 0, number: 'B-2', type: '2BHK', beds: 2, rent: 12000, status: 'occupied' },
    { id: 3, floor: 0, number: 'B-3', type: '1BHK', beds: 1, rent: 10000, status: 'available' },
    { id: 4, floor: 0, number: 'B-4', type: '1BHK', beds: 1, rent: 10000, status: 'reserved' },
  ];
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
  const occupied = floorUnits.filter(u => u.status === 'occupied').length;
  const reserved = floorUnits.filter(u => u.status === 'reserved').length;
  const totalBeds = floorUnits.reduce((sum, u) => sum + (u.beds || 0), 0);
  
  card.innerHTML = `
    <div class="floor-header">
      <h3>${floor.name}</h3>
      <button class="btn-icon" onclick="deleteFloor(${floor.number})">
        <i class="fas fa-trash"></i> Delete Floor
      </button>
    </div>
    <div class="floor-stats">
      <span>Total Units: <strong>${floorUnits.length}</strong></span>
      <span>Total Beds: <strong>${totalBeds}</strong></span>
      <span>Available: <strong class="text-success">${available}</strong></span>
      <span>Occupied: <strong class="text-danger">${occupied}</strong></span>
      <span>Reserved: <strong class="text-warning">${reserved}</strong></span>
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
               unit.status === 'occupied' ? 'fa-user' :
               unit.status === 'reserved' ? 'fa-bookmark' : 'fa-wrench';
  
  box.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${unit.number}</span>
  `;
  
  return box;
}

function updateStats() {
  const totalUnits = units.length;
  const totalBeds = units.reduce((sum, u) => sum + (u.beds || 0), 0);
  const available = units.filter(u => u.status === 'available').length;
  const occupied = units.filter(u => u.status === 'occupied').length;
  const reserved = units.filter(u => u.status === 'reserved').length;
  const maintenance = units.filter(u => u.status === 'maintenance').length;
  
  document.getElementById('totalUnits').textContent = totalUnits;
  document.getElementById('totalBeds').textContent = totalBeds;
  document.getElementById('availableUnits').textContent = available;
  document.getElementById('occupiedUnits').textContent = occupied;
  document.getElementById('reservedUnits').textContent = reserved;
  document.getElementById('maintenanceUnits').textContent = maintenance;
  document.getElementById('intimatedUnits').textContent = 0; // Update when you have this data
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
    option2.value = floor.number;
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
    document.getElementById('unitFloorSelect').value = floorNumber;
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
  
  const newFloor = {
    id: floors.length,
    name: formData.get('floorName'),
    number: parseInt(formData.get('floorNumber'))
  };
  
  // Check if floor number already exists
  if (floors.some(f => f.number === newFloor.number)) {
    showAlert('error', 'Floor number already exists');
    return;
  }
  
  floors.push(newFloor);
  renderFloorsAndUnits();
  updateStats();
  populateFloorFilters();
  closeCreateFloorModal();
  showAlert('success', 'Floor created successfully');
}

async function handleAddUnit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const newUnit = {
    id: units.length + 1,
    floor: parseInt(formData.get('floor')),
    number: formData.get('unitNumber'),
    type: formData.get('unitType'),
    beds: parseInt(formData.get('beds')),
    rent: parseInt(formData.get('rent')),
    status: 'available'
  };
  
  // Check if unit number already exists on this floor
  if (units.some(u => u.floor === newUnit.floor && u.number === newUnit.number)) {
    showAlert('error', 'Unit number already exists on this floor');
    return;
  }
  
  units.push(newUnit);
  renderFloorsAndUnits();
  updateStats();
  closeAddUnitModal();
  showAlert('success', 'Unit added successfully');
}

function deleteFloor(floorNumber) {
  if (!confirm('Are you sure you want to delete this floor? All units on this floor will be deleted.')) {
    return;
  }
  
  // Remove floor and its units
  floors = floors.filter(f => f.number !== floorNumber);
  units = units.filter(u => u.floor !== floorNumber);
  
  renderFloorsAndUnits();
  updateStats();
  populateFloorFilters();
  showAlert('success', 'Floor deleted successfully');
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

// Expose functions to window
window.openCreateFloorModal = openCreateFloorModal;
window.closeCreateFloorModal = closeCreateFloorModal;
window.openAddUnitModal = openAddUnitModal;
window.closeAddUnitModal = closeAddUnitModal;
window.handleCreateFloor = handleCreateFloor;
window.handleAddUnit = handleAddUnit;
window.deleteFloor = deleteFloor;
window.loadPropertyConfig = loadPropertyConfig;
window.openUnitDetails = openUnitDetails;
