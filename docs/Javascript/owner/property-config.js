// Temporary stub for generateMockDues to prevent ReferenceError
function generateMockDues() {
  return [];
}

// Property Configuration Page Script
let currentPropertyId = null;
let propertyData = null;
let floors = [];
let units = [];
let tenants = [];
let paymentSubmissions = [];
let currentView = 'dashboard'; // 'dashboard', 'floors' or 'tenants'

document.addEventListener('DOMContentLoaded', async function() {
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentPropertyId = urlParams.get('id');
  
  if (!currentPropertyId) {
    showAlert('error', 'No property selected');
    setTimeout(() => window.location.href = 'owner-dashboard.html', 2000);
    return;
  }

  try {
    // Ensure authenticated and owner role
    const ok = await ensureOwnerSession();
    
    if (!ok) {
      return;
    }
    
    await loadPropertyConfig();
    setupNavigationHandlers();
    
  } catch (error) {
    console.error('Error during initialization:', error);
    showAlert('error', 'Failed to initialize page: ' + error.message);
  }
});

let navigationHandlersSetup = false;

function setupNavigationHandlers() {
  if (navigationHandlersSetup) {
    return;
  }
  
  const sidebar = document.querySelector('.config-sidebar');
  
  if (!sidebar) {
    console.error('Navigation sidebar not found');
    return;
  }
  
  // Use event delegation on sidebar for navigation
  sidebar.addEventListener('click', function(e) {
    const navItem = e.target.closest('a.nav-item');
    
    if (!navItem) return;
    
    const href = navItem.getAttribute('href');
    
    if (!href || !href.startsWith('#')) return;
    
    e.preventDefault();
    
    // Remove active from all, add to clicked
    sidebar.querySelectorAll('a.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    navItem.classList.add('active');
    
    // Route to appropriate section
    switch(href) {
      case '#dashboard':
        showDashboardSection();
        break;
      case '#financial':
        showFinancialSection();
        break;
      case '#floors':
        showFloorsSection();
        break;
      case '#tenants':
        showTenantsSection();
        break;
      case '#payments':
        showPaymentsSection();
        break;
      case '#manage-payments':
        showManagePaymentsSection();
        break;
      case '#payment-settings':
        showPaymentSettingsSection();
        break;
      case '#maintenance':
        showMaintenanceSection();
        break;
      case '#notices':
        showNoticesSection();
        break;
      case '#preferences':
        showPreferencesSection();
        break;
    }
  });
  
  navigationHandlersSetup = true;
}

function showDashboardSection() {
  currentView = 'dashboard';
  document.querySelector('.dashboard-section').style.display = 'block';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  toggleTopMeta(false);
  loadDashboardData();
}

function showFinancialSection() {
  currentView = 'financial';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'block';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  toggleTopMeta(false);
  loadFinancialData();
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
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'block';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  // Show top meta (title/filters/stats) in floors view
  toggleTopMeta(true);
}

function showTenantsSection() {
  currentView = 'tenants';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'block';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  // Hide top meta (title/filters/stats) in tenants view
  toggleTopMeta(false);
  loadTenants();
}

function showPaymentsSection() {
  currentView = 'payments';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'block';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  // Hide top meta (title/filters/stats) in payments view
  toggleTopMeta(false);
  loadPayments();
}

function showPaymentSettingsSection() {
  currentView = 'payment-settings';
  
  // Hide all sections
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  const maintenanceSection = document.querySelector('.maintenance-section');
  const noticesSection = document.querySelector('.notices-section');
  
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  if (noticesSection) noticesSection.style.display = 'none';
  
  // Show payment settings section
  if (paymentSettingsSection) {
    paymentSettingsSection.style.display = 'block';
  } else {
    console.error('Payment settings section not found in DOM');
    showAlert('error', 'Payment settings section not available');
    return;
  }
  
  // Hide top meta
  toggleTopMeta(false);
  
  // Load payment settings and setup form
  loadPaymentSettings().catch(err => {
    console.error('Error loading payment settings:', err);
  });
  
  setupPaymentSettingsForm();
}

function showManagePaymentsSection() {
  currentView = 'manage-payments';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'block';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  toggleTopMeta(false);
}

function showMaintenanceSection() {
  currentView = 'maintenance';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'block';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  toggleTopMeta(false);

  // Load complaints/maintenance list for this property
  loadOwnerComplaints();
}

function showManagePaymentsSection() {
  currentView = 'manage-payments';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'block';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'none';
  toggleTopMeta(false);

  refreshPaymentSubmissions();
}

function showNoticesSection() {
  currentView = 'notices';
  document.querySelector('.dashboard-section').style.display = 'none';
  document.querySelector('.financial-section').style.display = 'none';
  document.querySelector('.floors-section').style.display = 'none';
  document.querySelector('.tenants-section').style.display = 'none';
  document.querySelector('.payments-section').style.display = 'none';
  const paymentSettingsSection = document.querySelector('.payment-settings-section');
  if (paymentSettingsSection) paymentSettingsSection.style.display = 'none';
  const managePaymentsSection = document.querySelector('.manage-payments-section');
  if (managePaymentsSection) managePaymentsSection.style.display = 'none';
  const maintenanceSection = document.querySelector('.maintenance-section');
  if (maintenanceSection) maintenanceSection.style.display = 'none';
  const noticesSection = document.querySelector('.notices-section');
  if (noticesSection) noticesSection.style.display = 'block';
  toggleTopMeta(false);
}

function showPreferencesSection() {
  currentView = 'preferences';
  // Preferences section doesn't exist yet, show a placeholder
  alert('Property Preferences section coming soon!');
}

// ========================================
// DASHBOARD FUNCTIONS
// ========================================

async function loadDashboardData(period = 'month') {
  try {
    // Calculate dashboard metrics from existing data
    const totalBeds = units.reduce((sum, u) => sum + (u.beds || 0), 0);
    const occupiedBeds = units.reduce((sum, u) => sum + (u.occupied || 0), 0);
    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    
    // Update KPI cards
    document.getElementById('kpiTotalBeds').textContent = totalBeds;
    document.getElementById('kpiOccupied').textContent = occupiedBeds;
    document.getElementById('kpiOccupancyRate').textContent = `(${occupancyRate}%)`;
    
    // Calculate real rent collected from tenant data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalRent = 0;
    let collectedRent = 0;
    let pendingRent = 0;
    
    allTenants.forEach(tenant => {
      const rent = tenant.rent || 0;
      totalRent += rent;
      
      // Check if tenant has paid for current month
      if (tenant.isCurrentMonthPaid || (tenant.paymentStatus || '').toUpperCase() === 'PAID') {
        collectedRent += rent;
      } else {
        pendingRent += rent;
      }
    });
    
    document.getElementById('kpiRentCollected').textContent = `₹${formatNumber(collectedRent)}`;
    document.getElementById('kpiPendingDues').textContent = `₹${formatNumber(pendingRent)}`;
    
    // Get real complaints count via complaint manager (shared help module)
    try {
      let complaints = [];
      if (window.complaintManager && typeof complaintManager.getComplaints === 'function') {
        complaints = await complaintManager.getComplaints();
      }
      const activeComplaints = complaints.filter(c => c.status !== 'RESOLVED').length;
      document.getElementById('kpiComplaints').textContent = activeComplaints;
    } catch (error) {
      document.getElementById('kpiComplaints').textContent = '0';
    }
    
    // Load quick lists
    loadTenantsDuesList();
    loadMaintenanceList();
    loadUpcomingEvents();
    
    // Render charts
    renderOccupancyTrendChart();
    renderRentCollectionChart();
    renderOccupancyHeatmap();
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

function loadTenantsDuesList() {
  const listContainer = document.getElementById('tenantsDuesList');
  const countBadge = document.getElementById('duesCount');
  
  // Get tenants with pending dues based on payment status
  const tenantsWithDues = allTenants.filter(tenant => {
    const paymentStatus = (tenant.paymentStatus || 'DUE').toUpperCase();
    const isNotPaid = paymentStatus !== 'PAID' && !tenant.isCurrentMonthPaid;
    const hasDue = tenant.isDue || tenant.isOverdue;
    return isNotPaid || hasDue;
  });
  
  countBadge.textContent = tenantsWithDues.length;
  
  if (tenantsWithDues.length === 0) {
    listContainer.innerHTML = '<div class="no-data-small">No pending dues</div>';
    return;
  }
  
  let html = '';
  tenantsWithDues.slice(0, 5).forEach(tenant => {
    const initials = getInitials(tenant.name);
    const dueAmount = tenant.rent || 0;
    const roomInfo = tenant.roomNumber ? `Room ${tenant.roomNumber}` : (tenant.flatRoomNumber ? `Flat ${tenant.flatRoomNumber}` : 'Unit');
    
    html += `
      <div class="list-item" onclick="openTenantProfileDrawer(${tenant.id})" style="cursor: pointer;">
        <div class="item-avatar">${initials}</div>
        <div class="item-details">
          <div class="item-name">${tenant.name}</div>
          <div class="item-info">${roomInfo} • ₹${formatNumber(dueAmount)} due</div>
        </div>
        <div class="item-amount">₹${formatNumber(dueAmount)}</div>
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
}

async function loadMaintenanceList() {
  const listContainer = document.getElementById('maintenanceList');
  const countBadge = document.getElementById('maintenanceCount');
  
  try {
    // Fetch maintenance requests from API
    // const maintenanceRequests = await apiService.getMaintenanceRequests(currentPropertyId);
    
    // For now, show empty state until API is implemented
    const maintenanceRequests = [];
    
    countBadge.textContent = maintenanceRequests.length;
    
    if (maintenanceRequests.length === 0) {
      listContainer.innerHTML = '<div class="no-data-small">No active requests</div>';
      return;
    }
    
    let html = '';
    maintenanceRequests.forEach(req => {
      html += `
        <div class="list-item">
          <div class="item-avatar maintenance">
            <i class="fas fa-${req.icon || 'tools'}"></i>
          </div>
          <div class="item-details">
            <div class="item-name">${req.title}</div>
            <div class="item-info">Unit ${req.unit} • ${req.time}</div>
          </div>
          <span class="item-status ${req.priority}">${req.priority}</span>
        </div>
      `;
    });
    
    listContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load maintenance requests:', error);
    listContainer.innerHTML = '<div class="no-data-small">No active requests</div>';
    countBadge.textContent = '0';
  }
}

// Load owner complaints (maintenance issues) and render table + stats
async function loadOwnerComplaints() {
  const tableBody = document.getElementById('complaintsTableBody');
  const resultsCountEl = document.getElementById('resultsCount');
  const totalEl = document.getElementById('totalComplaints');
  const openEl = document.getElementById('openComplaints');
  const inProgressEl = document.getElementById('inProgressComplaints');
  const resolvedEl = document.getElementById('resolvedComplaints');

  // Show loading state
  if (tableBody) {
    tableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="9" class="text-center">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            Loading maintenance issues...
          </div>
        </td>
      </tr>`;
  }

  try {
    let complaints = [];
    if (window.complaintManager && typeof complaintManager.getComplaints === 'function') {
      complaints = await complaintManager.getComplaints();
    }

    const propertyIdNum = Number(currentPropertyId);
    const filtered = complaints.filter(c => {
      const pid = Number(c.propertyId);
      if (Number.isFinite(pid)) return pid === propertyIdNum;
      if (c.propertyName && propertyData?.name) return c.propertyName === propertyData.name;
      return true; // fallback if no property info
    });

    const statusVal = c => (c.status || '').toUpperCase();
    const total = filtered.length;
    const openCount = filtered.filter(c => ['OPEN', 'REOPENED'].includes(statusVal(c))).length;
    const inProgressCount = filtered.filter(c => ['IN_PROGRESS', 'ACKNOWLEDGED'].includes(statusVal(c))).length;
    const resolvedCount = filtered.filter(c => ['RESOLVED', 'CLOSED'].includes(statusVal(c))).length;

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = openCount;
    if (inProgressEl) inProgressEl.textContent = inProgressCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;
    if (resultsCountEl) resultsCountEl.textContent = `${total} issues found`;

    if (!tableBody) return;

    if (total === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center no-data">No complaints found</td></tr>';
      return;
    }

    const formatDate = (dt) => {
      if (!dt) return '-';
      const d = new Date(dt);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const rows = filtered.map(c => {
      const category = c.category || 'GENERAL';
      const priority = (c.priority || 'MEDIUM').toUpperCase();
      const status = statusVal(c);
      const updatedOn = c.updatedAt || c.lastUpdatedAt || c.resolvedAt || c.createdAt;
      return `
        <tr>
          <td>${c.propertyName || propertyData?.name || '-'}</td>
          <td>${c.unitName || c.unit || c.roomNumber || '-'}</td>
          <td>${c.tenantName || c.submittedBy || '-'}</td>
          <td>${c.title || c.issueTitle || c.issue || 'Issue'}</td>
          <td>${category}</td>
          <td><span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span></td>
          <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
          <td>${formatDate(updatedOn)}</td>
          <td>
            <button class="table-action-btn view" onclick="complaintManager.viewComplaint(${c.id || c.complaintId})">
              <i class="fas fa-eye"></i> View
            </button>
          </td>
        </tr>`;
    }).join('');

    tableBody.innerHTML = rows;
  } catch (error) {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="9" class="text-center no-data">Failed to load complaints</td></tr>';
    if (totalEl) totalEl.textContent = '0';
    if (openEl) openEl.textContent = '0';
    if (inProgressEl) inProgressEl.textContent = '0';
    if (resolvedEl) resolvedEl.textContent = '0';
    if (resultsCountEl) resultsCountEl.textContent = '0 issues found';
  }
}

// ===================== PAYMENT SUBMISSIONS (MANAGE PAYMENTS) =====================
function mapStatusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'VERIFIED' || s === 'APPROVED') return { text: 'APPROVED', cls: 'approved' };
  if (s === 'REJECTED') return { text: 'REJECTED', cls: 'rejected' };
  return { text: 'PENDING', cls: 'pending' };
}

function mapPaymentMode(mode) {
  const m = (mode || '').toUpperCase();
  if (m.includes('UPI')) return { text: 'UPI', cls: 'upi' };
  if (m.includes('BANK')) return { text: 'BANK TRANSFER', cls: 'bank' };
  if (m.includes('CASH')) return { text: 'CASH', cls: 'cash' };
  return { text: m || 'OTHER', cls: 'other' };
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonthLabel(paymentMonth, paymentDate) {
  const key = normalizePaymentMonth(paymentMonth, paymentDate);
  if (!key) return paymentMonth || '-';
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function getMonthOptionKey(paymentMonth, paymentDate) {
  const key = normalizePaymentMonth(paymentMonth, paymentDate);
  if (key) {
    const [year, month] = key.split('-');
    return `${month}-${year}`; // matches dropdown format e.g., 11-2024
  }
  return '';
}

async function loadPaymentSubmissions() {
  const tableBody = document.getElementById('paymentSubmissionsTableBody');
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading payment submissions...</div></td></tr>';
  }

  try {
    // Load payments only for the current property, not all payments
    const propertyIdNum = Number(currentPropertyId);
    const all = await apiService.getOwnerPaymentsByProperty(propertyIdNum);
    paymentSubmissions = Array.isArray(all) ? all : [];

    updatePaymentSubmissionStats(paymentSubmissions);
    populateSubmissionMonthFilter(paymentSubmissions);
    renderPaymentSubmissions(paymentSubmissions);
  } catch (error) {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="9" class="text-center no-data">Failed to load submissions</td></tr>';
    const ids = ['pendingSubmissionsCount','approvedSubmissionsCount','rejectedSubmissionsCount','totalSubmittedAmount'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = id === 'totalSubmittedAmount' ? '₹0' : '0'; });
  }
}

function updatePaymentSubmissionStats(list) {
  const statusVal = t => (t.status || '').toUpperCase();
  const pending = list.filter(t => statusVal(t) === 'PENDING').length;
  const approved = list.filter(t => ['VERIFIED', 'APPROVED'].includes(statusVal(t))).length;
  const rejected = list.filter(t => statusVal(t) === 'REJECTED').length;
  const totalAmount = list.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const pendingEl = document.getElementById('pendingSubmissionsCount');
  const approvedEl = document.getElementById('approvedSubmissionsCount');
  const rejectedEl = document.getElementById('rejectedSubmissionsCount');
  const totalEl = document.getElementById('totalSubmittedAmount');
  if (pendingEl) pendingEl.textContent = pending;
  if (approvedEl) approvedEl.textContent = approved;
  if (rejectedEl) rejectedEl.textContent = rejected;
  if (totalEl) totalEl.textContent = `₹${formatNumber(totalAmount)}`;
}

function populateSubmissionMonthFilter(list) {
  const select = document.getElementById('submissionMonthFilter');
  if (!select) return;
  const seen = new Set();
  const options = ['<option value="">All Months</option>'];

  list.forEach(t => {
    const key = getMonthOptionKey(t.paymentMonth, t.paymentDate);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const [month, year] = key.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push(`<option value="${key}">${label}</option>`);
  });

  select.innerHTML = options.join('');
}

function renderPaymentSubmissions(list) {
  const tableBody = document.getElementById('paymentSubmissionsTableBody');
  if (!tableBody) return;

  if (!list || list.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center no-data">No payment submissions found</td></tr>';
    return;
  }

  const rows = list.map(t => {
    const status = mapStatusBadge(t.status);
    const mode = mapPaymentMode(t.paymentMode);
    const monthLabel = formatMonthLabel(t.paymentMonth, t.paymentDate);
    const submitted = formatDateShort(t.paymentDate || t.submissionDate || t.createdAt);
    const proofUrl = t.screenshotUrl || t.paymentProofUrl || t.paymentScreenshotUrl || t.proofUrl;
    const remark = t.ownerRemark || t.remark || '';
    const tenantName = t.tenantName || 'Tenant';
    const unitInfo = t.unitNumber || t.unitName || t.roomNumber || '';
    const isPending = (t.status || '').toUpperCase() === 'PENDING';

    // Only show action buttons for PENDING payments
    const actionsHtml = isPending ? `
      <div class="payment-actions">
        <button class="btn-icon success" title="Approve" onclick="approvePaymentSubmission(${t.id})"><i class="fas fa-check"></i></button>
        <button class="btn-icon danger" title="Reject" onclick="showRejectModal(${t.id})"><i class="fas fa-times"></i></button>
      </div>` : '-';

    return `
      <tr>
        <td>
          <div class="tenant-info">
            <div class="tenant-avatar">${tenantName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${tenantName}</strong>
              <small>${unitInfo || ''}</small>
            </div>
          </div>
        </td>
        <td>${monthLabel}</td>
        <td><strong>₹${formatNumber(t.amount || 0)}</strong></td>
        <td><span class="payment-mode-badge ${mode.cls}">${mode.text}</span></td>
        <td><div class="date-info"><div>${submitted}</div></div></td>
        <td><span class="status-badge ${status.cls}">${status.text}</span></td>
        <td>
          ${proofUrl ? `<button class="btn-icon" onclick="viewPaymentProof('${proofUrl}')" title="View Proof"><i class="fas fa-image"></i></button>` : '-'}
        </td>
        <td><div class="tenant-remark"><small>${remark || ''}</small></div></td>
        <td>${actionsHtml}</td>
      </tr>`;
  }).join('');

  tableBody.innerHTML = rows;
}

function filterPaymentSubmissions() {
  const statusVal = document.getElementById('submissionStatusFilter')?.value || '';
  const monthVal = document.getElementById('submissionMonthFilter')?.value || '';
  const searchVal = (document.getElementById('submissionTenantSearch')?.value || '').toLowerCase();

  let filtered = paymentSubmissions.slice();

  if (statusVal) {
    filtered = filtered.filter(t => (t.status || '').toUpperCase() === statusVal.toUpperCase());
  }

  if (monthVal) {
    filtered = filtered.filter(t => getMonthOptionKey(t.paymentMonth, t.paymentDate) === monthVal);
  }

  if (searchVal) {
    filtered = filtered.filter(t => (t.tenantName || '').toLowerCase().includes(searchVal));
  }

  renderPaymentSubmissions(filtered);
}

function refreshPaymentSubmissions() {
  loadPaymentSubmissions();
}

// Proof modal helpers
function viewPaymentProof(url) {
  if (!url) return;
  const modal = document.getElementById('viewProofModal');
  const img = document.getElementById('proofImage');
  if (img) img.src = url;
  if (modal) modal.style.display = 'block';
  window.currentProofUrl = url;
}

function closeProofModal() {
  const modal = document.getElementById('viewProofModal');
  if (modal) modal.style.display = 'none';
}

function downloadProof() {
  if (!window.currentProofUrl) return;
  const link = document.createElement('a');
  link.href = window.currentProofUrl;
  link.download = 'payment-proof';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openProofInNewTab() {
  if (!window.currentProofUrl) return;
  window.open(window.currentProofUrl, '_blank');
}

// Approve payment submission
async function approvePaymentSubmission(transactionId) {
  if (!transactionId) return;
  
  try {
    // Show confirmation
    if (!confirm('Are you sure you want to approve this payment?')) return;
    
    const response = await apiService.verifyPaymentSubmission(transactionId);
    
    if (response) {
      showNotification('Payment approved successfully!', 'success');
      // Reload the payment submissions
      loadPaymentSubmissions();
    }
  } catch (error) {
    console.error('Error approving payment:', error);
    showNotification('Failed to approve payment. Please try again.', 'error');
  }
}

// Show rejection modal
function showRejectModal(transactionId) {
  window.currentRejectTransactionId = transactionId;
  const modal = document.getElementById('rejectPaymentModal');
  if (!modal) {
    // Create modal if it doesn't exist
    createRejectPaymentModal();
  }
  const rejectModal = document.getElementById('rejectPaymentModal');
  if (rejectModal) rejectModal.style.display = 'block';
  const reasonInput = document.getElementById('rejectionReasonInput');
  if (reasonInput) reasonInput.value = '';
}

// Reject payment submission
async function rejectPaymentSubmission() {
  const transactionId = window.currentRejectTransactionId;
  const reasonInput = document.getElementById('rejectionReasonInput');
  const reason = reasonInput ? reasonInput.value.trim() : '';
  
  if (!transactionId) return;
  if (!reason) {
    showNotification('Please enter a rejection reason', 'warning');
    return;
  }
  
  try {
    const response = await apiService.rejectPaymentSubmission(transactionId, reason);
    
    if (response) {
      showNotification('Payment rejected successfully!', 'success');
      closeRejectModal();
      // Reload the payment submissions
      loadPaymentSubmissions();
    }
  } catch (error) {
    console.error('Error rejecting payment:', error);
    showNotification('Failed to reject payment. Please try again.', 'error');
  }
}

function closeRejectModal() {
  const modal = document.getElementById('rejectPaymentModal');
  if (modal) modal.style.display = 'none';
  window.currentRejectTransactionId = null;
}

// Create reject payment modal if it doesn't exist in HTML
function createRejectPaymentModal() {
  if (document.getElementById('rejectPaymentModal')) return;
  
  const modalHtml = `
    <div id="rejectPaymentModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Reject Payment</h2>
          <button class="modal-close" onclick="closeRejectModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Rejection Reason <span style="color: red;">*</span></label>
            <textarea id="rejectionReasonInput" class="form-control" placeholder="Enter reason for rejection..." rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-action secondary" onclick="closeRejectModal()">Cancel</button>
          <button class="btn-action danger" onclick="rejectPaymentSubmission()">Reject Payment</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function loadUpcomingEvents() {
  const listContainer = document.getElementById('upcomingEventsList');
  const countBadge = document.getElementById('eventsCount');
  
  try {
    // Fetch upcoming events from API (move-ins, move-outs, etc.)
    // const events = await apiService.getUpcomingEvents(currentPropertyId);
    
    // For now, show empty state until API is implemented
    const events = [];
    
    countBadge.textContent = events.length;
    
    if (events.length === 0) {
      listContainer.innerHTML = '<div class="no-data-small">No upcoming events</div>';
      return;
    }
    
    let html = '';
    events.forEach(event => {
      const initials = getInitials(event.name);
      html += `
        <div class="list-item">
          <div class="item-avatar event">${initials}</div>
          <div class="item-details">
            <div class="item-name">${event.name}</div>
            <div class="item-info">Unit ${event.unit} • ${event.date}</div>
          </div>
          <span class="item-status ${event.type}">${event.type}</span>
        </div>
      `;
    });
    
    listContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load upcoming events:', error);
    listContainer.innerHTML = '<div class="no-data-small">No upcoming events</div>';
    countBadge.textContent = '0';
  }
}

function renderOccupancyTrendChart() {
  const ctx = document.getElementById('occupancyTrendChart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (window.occupancyTrendChart && typeof window.occupancyTrendChart.destroy === 'function') {
    window.occupancyTrendChart.destroy();
  }
  
  // Generate data for last 6 months
  const months = [];
  const occupancyData = [];
  const today = new Date();
  const currentOccupancyRate = units.reduce((sum, u) => sum + u.occupied, 0) / 
                                 Math.max(1, units.reduce((sum, u) => sum + u.beds, 0));
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-IN', { month: 'short' }));
    
    // Generate trend with some variance
    const variance = (Math.random() * 0.2) - 0.1; // ±10%
    const rate = Math.min(100, Math.max(0, (currentOccupancyRate * 100) + variance * 100));
    occupancyData.push(Math.round(rate));
  }
  
  window.occupancyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Occupancy %',
        data: occupancyData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              return `Occupancy: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function renderRentCollectionChart() {
  const ctx = document.getElementById('rentCollectionChart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (window.rentCollectionChart && typeof window.rentCollectionChart.destroy === 'function') {
    window.rentCollectionChart.destroy();
  }
  
  // Generate data for last 6 months using real tenant data
  const months = [];
  const collectedData = [];
  const dueData = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-IN', { month: 'short' }));
    
    // Calculate for this specific month
    const monthCollected = allTenants.reduce((sum, tenant) => {
      // For current month (i === 0), use actual payment status
      if (i === 0) {
        if (tenant.isCurrentMonthPaid || (tenant.paymentStatus || '').toUpperCase() === 'PAID') {
          return sum + (tenant.rent || 0);
        }
        return sum;
      }
      // For past months, assume 80-95% collection rate (mock historical data)
      return sum + (tenant.rent || 0) * (0.8 + Math.random() * 0.15);
    }, 0);
    
    const monthTotal = allTenants.reduce((sum, tenant) => sum + (tenant.rent || 0), 0);
    const monthDue = monthTotal - monthCollected;
    
    collectedData.push(Math.floor(monthCollected));
    dueData.push(Math.floor(Math.max(0, monthDue)));
  }
  
  window.rentCollectionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Collected',
          data: collectedData,
          backgroundColor: '#10b981',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Due',
          data: dueData,
          backgroundColor: '#ef4444',
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ₹${formatNumber(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + formatNumber(value);
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

function renderOccupancyHeatmap() {
  const container = document.getElementById('occupancyHeatmap');
  if (!container) return;
  
  let html = '';
  
  // Group units by floor
  const floorGroups = new Map();
  units.forEach(unit => {
    if (!floorGroups.has(unit.floor)) {
      floorGroups.set(unit.floor, []);
    }
    floorGroups.get(unit.floor).push(unit);
  });
  
  // Sort floors
  const sortedFloors = Array.from(floorGroups.keys()).sort((a, b) => a - b);
  
  sortedFloors.forEach(floorNum => {
    const floorUnits = floorGroups.get(floorNum);
    const floor = floors.find(f => f.number === floorNum);
    const floorName = floor ? floor.name : `Floor ${floorNum}`;
    
    html += `
      <div class="floor-heatmap">
        <div class="floor-title">${floorName}</div>
        <div class="beds-grid">
    `;
    
    floorUnits.forEach(unit => {
      let statusClass = 'vacant';
      let statusText = 'Available';
      
      if (unit.occupied === unit.beds) {
        statusClass = 'occupied';
        statusText = 'Full';
      } else if (unit.occupied > 0) {
        statusClass = 'partial';
        statusText = `${unit.occupied}/${unit.beds}`;
      }
      
      html += `
        <div class="bed-box ${statusClass}" onclick="openUnitDetails({id: ${unit.id}, number: '${unit.number}', beds: ${unit.beds}, occupied: ${unit.occupied}, rent: ${unit.rent}, status: '${unit.status}'})">
          <div class="bed-number">${unit.number}</div>
          <div class="bed-status">${statusText}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="no-data-small">No units configured</div>';
}

function formatNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + ' Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(2) + ' L';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + ' K';
  }
  return num.toLocaleString('en-IN');
}

// Helper function to get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day) {
  if (!day) return '';
  const dayNum = parseInt(day);
  if (dayNum === 1 || dayNum === 21 || dayNum === 31) return 'st';
  if (dayNum === 2 || dayNum === 22) return 'nd';
  if (dayNum === 3 || dayNum === 23) return 'rd';
  return 'th';
}

async function ensureOwnerSession() {
  try {
    if (typeof apiService === 'undefined') {
      console.error('API Service not loaded');
      showAlert('error', 'API Service not loaded. Please refresh the page.');
      return false;
    }
    
    if (!apiService.isAuthenticated()) {
      showAlert('error', 'Please log in as an owner.');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return false;
    }
    
    let roles = [];
    try { 
      roles = JSON.parse(localStorage.getItem('roles') || '[]'); 
    } catch (e) { 
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
      console.error('❌ Property is not PG type, aborting. Type is:', pType);
      showAlert('error', 'This configuration page is only for PG properties.');
      setTimeout(() => window.location.href = 'owner-dashboard.html', 1800);
      return;
    }
    
    
    // Update UI with property name
    document.getElementById('propertyName').textContent = propertyData.name || 'Property';
    document.getElementById('breadcrumbProperty').textContent = propertyData.name || 'Configuration';
    
    // Load user info - get firstName from localStorage
    const firstName = localStorage.getItem('firstName') || 'Owner';
    document.getElementById('userName').textContent = firstName;
    
    // Load floors and units from backend
    await loadFloorsAndUnitsFromApi();
    
    // Load tenants
    await loadTenants();
    
    // Render the configuration
    renderFloorsAndUnits();
    updateStats();
    populateFloorFilters();
    
    // Load dashboard by default
    showDashboardSection();
    
    
  } catch (error) {
    console.error('❌ Failed to load property configuration:', error);
    console.error('Error stack:', error.stack);
    showAlert('error', 'Failed to load property configuration: ' + error.message);
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
  // Populate unit details
  document.getElementById('unitDetailsNumber').textContent = `Unit ${unit.number}`;
  document.getElementById('unitDetailsStatus').textContent = unit.status.toUpperCase();
  document.getElementById('unitDetailsStatus').className = `unit-status-badge status-${unit.status}`;
  document.getElementById('unitDetailsType').textContent = unit.type || '-';
  document.getElementById('unitDetailsBeds').textContent = `${unit.beds} bed${unit.beds > 1 ? 's' : ''}`;
  document.getElementById('unitDetailsRent').textContent = `₹${formatNumber(unit.rent)}/month`;
  document.getElementById('unitDetailsOccupancy').textContent = `${unit.occupied || 0}/${unit.beds} occupied`;

  // Load tenants for this unit
  loadTenantsForUnit(unit.id);

  // Show modal
  document.getElementById('unitDetailsModal').classList.add('active');
}

function closeUnitDetailsModal() {
  document.getElementById('unitDetailsModal').classList.remove('active');
}

async function loadTenantsForUnit(unitId) {
  const container = document.getElementById('unitTenantsList');
  
  try {
    // Ensure we have loaded tenants - use allTenants which is populated by loadTenants()
    let unitTenants = allTenants.filter(t => t.unitId === unitId);

    if (!unitTenants || unitTenants.length === 0) {
      container.innerHTML = `
        <div class="no-data-message">
          <i class="fas fa-user-slash"></i>
          <p>No tenants assigned to this unit</p>
        </div>
      `;
      document.getElementById('tenantCountBadge').textContent = '0';
      return;
    }

    document.getElementById('tenantCountBadge').textContent = unitTenants.length;

    let html = '';
    unitTenants.forEach(tenant => {
      const initials = getInitials(tenant.name || `${tenant.firstName || ''} ${tenant.lastName || ''}`, '');
      html += `
        <div class="tenant-card">
          <div class="tenant-card-header">
            <div>
              <div class="tenant-name">${tenant.name || `${tenant.firstName || ''} ${tenant.lastName || ''}`}</div>
              <div class="tenant-info-small">
                <i class="fas fa-phone"></i>
                ${tenant.phone || tenant.mobileNumber || '-'}
              </div>
              <div class="tenant-info-small">
                <i class="fas fa-envelope"></i>
                ${truncateEmail(tenant.email || tenant.emailAddress) || '-'}
              </div>
              <div class="tenant-info-small">
                <i class="fas fa-calendar"></i>
                Since ${formatDateShort(tenant.checkInDate || tenant.moveInDate)}
              </div>
            </div>
            <div class="tenant-avatar">${initials}</div>
          </div>
          <div class="tenant-card-actions">
            <button class="btn-move-tenant" onclick="openMoveTenantModal('${tenant.id}', '${tenant.name || `${tenant.firstName || ''} ${tenant.lastName || ''}`}', ${unitId})">
              <i class="fas fa-exchange-alt"></i> Move
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Failed to load tenants:', error);
    container.innerHTML = `
      <div class="no-data-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load tenants</p>
      </div>
    `;
  }
}

function getInitials(firstName, lastName) {
  const first = (firstName || '').charAt(0).toUpperCase();
  const last = (lastName || '').charAt(0).toUpperCase();
  return (first + last) || '?';
}

function truncateEmail(email) {
  if (!email) return '';
  if (email.length > 20) {
    return email.substring(0, 17) + '...';
  }
  return email;
}

function formatDateShort(date) {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function openMoveTenantModal(tenantId, tenantName, fromUnitId) {
  document.getElementById('moveTenantId').value = tenantId;
  document.getElementById('moveFromUnitId').value = fromUnitId;
  document.getElementById('moveTenantName').textContent = tenantName;

  // Get the current unit name
  const currentUnit = units.find(u => u.id === fromUnitId);
  document.getElementById('moveFromUnit').textContent = currentUnit ? `Unit ${currentUnit.number}` : 'Current Unit';

  // Populate available units (excluding current unit)
  populateMoveUnitOptions(fromUnitId);

  document.getElementById('moveTenantModal').classList.add('active');
}

function closeMoveTenantModal() {
  document.getElementById('moveTenantModal').classList.remove('active');
  document.getElementById('moveTenantForm').reset();
}

function populateMoveUnitOptions(excludeUnitId) {
  const select = document.getElementById('moveToUnit');
  select.innerHTML = '<option value="">-- Select Unit --</option>';

  units.forEach(unit => {
    if (unit.id !== excludeUnitId) {
      const occupancyText = `${unit.occupied || 0}/${unit.beds} beds`;
      const option = document.createElement('option');
      option.value = unit.id;
      option.textContent = `${unit.number} (${occupancyText}) - ${unit.status}`;
      select.appendChild(option);
    }
  });
}

async function handleMoveTenant(event) {
  event.preventDefault();

  const tenantId = document.getElementById('moveTenantId').value;
  const fromUnitId = parseInt(document.getElementById('moveFromUnitId').value);
  const toUnitId = parseInt(document.getElementById('moveToUnit').value);
  const reason = document.getElementById('transferReason').value;
  const notifyTenant = document.getElementById('notifyTenant').checked;

  if (!toUnitId) {
    showAlert('error', 'Please select a destination unit');
    return;
  }

  try {
    // Call API to move tenant
    await apiService.moveTenant(currentPropertyId, {
      tenantId,
      fromUnitId,
      toUnitId,
      reason,
      notifyTenant
    });

    showAlert('success', 'Tenant moved successfully');
    closeMoveTenantModal();

    // Reload data
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();

    // Reload the modal with updated tenant list
    const movedUnit = units.find(u => u.id === fromUnitId);
    if (movedUnit) {
      openUnitDetails(movedUnit);
    }
  } catch (error) {
    showAlert('error', error.message || 'Failed to move tenant');
  }
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
            <button class="deactivate" onclick="deactivateTenantFromList('${tenant.tenantId}')" ${String(tenant.status).toUpperCase()==='VACATED'?'disabled':''}>
              <i class="fas fa-user-slash"></i> ${String(tenant.status).toUpperCase()==='VACATED'?'Deactivated':'Deactivate'}
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
  showAlert('info', 'Edit functionality will be implemented soon');
}

function removeTenant(tenantId) {
  // Will implement API later
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

// ========================================
// FINANCIAL STATISTICS FUNCTIONS
// ========================================

let financialData = {
  monthlyRent: 0,
  yearlyRent: 0,
  expectedMonthlyRent: 0,
  outstandingDues: 0,
  securityDeposits: 0,
  depositCount: 0,
  monthlyExpense: 0,
  yearlyExpense: 0,
  paymentModeBreakdown: {},
  revenueSeries: [],
  expenseSeries: [],
  duesTenants: [],
  transactions: [],
  expenses: []
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMonthKey(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function normalizePaymentMonth(paymentMonth, paymentDate) {
  if (!paymentMonth && paymentDate) return getMonthKey(paymentDate);
  if (typeof paymentMonth === 'string') {
    const trimmed = paymentMonth.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(`${trimmed}-01`);
    if (!Number.isNaN(parsed.getTime())) {
      return getMonthKey(parsed);
    }
  }
  return paymentDate ? getMonthKey(paymentDate) : null;
}

function monthKeyToDate(key) {
  if (!key || typeof key !== 'string' || !/^\d{4}-\d{2}$/.test(key)) return null;
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function computeTrend(current, previous) {
  if (!previous) return 0;
  const delta = ((current - previous) / previous) * 100;
  return Math.round(delta * 10) / 10;
}

function buildRevenueSeries(transactions, months = 6) {
  const results = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const revenue = transactions
      .filter(txn => normalizePaymentMonth(txn.paymentMonth, txn.paymentDate) === key && (txn.status || '').toUpperCase() === 'VERIFIED')
      .reduce((sum, txn) => sum + toNumber(txn.amount), 0);
    results.push({ key, label, revenue });
  }
  return results;
}

function getTenantDueDate(tenant) {
  if (tenant.nextDueDate) {
    const d = new Date(tenant.nextDueDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (tenant.rentDueDate) {
    const today = new Date();
    const dueDay = Number(tenant.rentDueDate);
    const d = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (d < today) {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  }
  return null;
}

async function loadFinancialData() {
  try {
    // Ensure tenants are loaded
    if (!allTenants || allTenants.length === 0) {
      await loadTenants();
    }

    // Fetch owner transactions with detailed filtering
    let ownerTransactions = [];
    try {
      const transactions = await apiService.getOwnerAllPayments();
      
      const propertyIdNum = parseInt(currentPropertyId);
      
      if (!Array.isArray(transactions)) {
        ownerTransactions = [];
      } else if (transactions.length > 0) {
        ownerTransactions = transactions.filter(txn => {
          const txnPropertyId = Number(txn.propertyId);
          const match = txnPropertyId === propertyIdNum;
          return match;
        });
      }
    } catch (err) {
      ownerTransactions = [];
    }

    // Calculate active tenants
    const activeTenants = (allTenants || []).filter(t => {
      const status = (t.status || '').toUpperCase();
      return status !== 'VACATED' && status !== 'INACTIVE';
    });

    const expectedRent = activeTenants.reduce((sum, t) => {
      const tenantRent = toNumber(t.rent);
      return sum + tenantRent;
    }, 0);
    
    const securityDeposits = activeTenants.reduce((sum, t) => sum + toNumber(t.securityDeposit), 0);
    const depositCount = activeTenants.filter(t => toNumber(t.securityDeposit) > 0).length;
    const monthlyExpense = toNumber(propertyData?.monthlyMaintenance) || 0;
    const yearlyExpense = monthlyExpense * 12;


    const currentMonthKey = getMonthKey(new Date());
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    // Calculate collected rent for this month USING SAME METHOD AS DASHBOARD
    // (Check tenant payment status, not transaction verification)
    let collectedThisMonth = 0;
    let pendingDuesThisMonth = 0;
    
    activeTenants.forEach(tenant => {
      const rent = toNumber(tenant.rent) || 0;
      
      // SAME LOGIC AS DASHBOARD - Check if tenant has paid for current month
      if (tenant.isCurrentMonthPaid || (tenant.paymentStatus || '').toUpperCase() === 'PAID') {
        collectedThisMonth += rent;
      } else {
        pendingDuesThisMonth += rent;
      }
    });
    

    const collectedThisYear = ownerTransactions.reduce((sum, txn) => {
      const monthKey = normalizePaymentMonth(txn.paymentMonth, txn.paymentDate);
      const monthDate = monthKeyToDate(monthKey);
      const status = (txn.status || '').toUpperCase();
      if (status === 'VERIFIED' && monthDate && monthDate >= twelveMonthsAgo) {
        return sum + toNumber(txn.amount);
      }
      return sum;
    }, 0);


    // Build revenue and expense series
    const revenueSeries = buildRevenueSeries(ownerTransactions, 6);
    const expenseSeries = revenueSeries.map(item => ({ key: item.key, label: item.label, expense: monthlyExpense }));


    // Calculate dues
    const duesTenants = activeTenants.filter(t => {
      const status = (t.paymentStatus || '').toUpperCase();
      return status !== 'PAID' && !t.isCurrentMonthPaid;
    });

    // Payment mode breakdown for current month
    // Only count payment modes for tenants who have marked rent as paid
    const paidTenantIds = activeTenants
      .filter(t => t.isCurrentMonthPaid || (t.paymentStatus || '').toUpperCase() === 'PAID')
      .map(t => t.id);
    
    const paymentModeBreakdown = ownerTransactions.reduce((acc, txn) => {
      const monthKey = normalizePaymentMonth(txn.paymentMonth, txn.paymentDate);
      const status = (txn.status || '').toUpperCase();
      // Only count transactions from paid tenants, for current month, with VERIFIED status
      if (monthKey !== currentMonthKey || status !== 'VERIFIED' || !paidTenantIds.includes(txn.tenantId)) return acc;
      const mode = (txn.paymentMode || 'OTHER').toUpperCase();
      acc[mode] = (acc[mode] || 0) + toNumber(txn.amount);
      return acc;
    }, {});


    // Update financial data with ACTUAL collected amounts (same as dashboard)
    financialData = {
      ...financialData,
      transactions: ownerTransactions,
      monthlyRent: collectedThisMonth,  // ACTUAL collected rent from tenant status
      yearlyRent: collectedThisMonth * 12,  // Estimate yearly (monthly × 12)
      expectedMonthlyRent: expectedRent,  // What should be collected
      outstandingDues: pendingDuesThisMonth,  // Direct from tenant payment status
      collectedThisMonth: collectedThisMonth,
      securityDeposits,
      depositCount,
      monthlyExpense,
      yearlyExpense,
      paymentModeBreakdown,
      revenueSeries,
      expenseSeries,
      duesTenants
    };


    // Update UI
    updateFinancialOverview();
    renderRevenueExpenseChart();
    renderPaymentModeChart();
    loadExpenseData();
    loadDuesReport();
    
    console.log('[Financial] Financial section updated successfully');
  } catch (error) {
    console.error('[Financial] Failed to load financial data:', error);
    console.error('[Financial] Error stack:', error.stack);
    // Show partial data without crashing
    updateFinancialOverview();
  }
}

function updateFinancialOverview() {
  const rentEl = document.getElementById('finTotalRent');
  const rentTrendEl = document.getElementById('finRentTrend');
  const expenseTrendEl = document.getElementById('finExpenseTrend');

  const currentRevenue = financialData.monthlyRent;  // ACTUAL collected rent
  const previousRevenue = financialData.revenueSeries.length > 1 
    ? financialData.revenueSeries[financialData.revenueSeries.length - 2].revenue 
    : 0;
  const rentTrend = computeTrend(currentRevenue, previousRevenue);

  if (rentEl) {
    rentEl.textContent = `₹${formatNumber(currentRevenue)}`;
  }
  
  // Always show "Total Rent Collected" - the actual collected amount
  const rentLabel = document.querySelector('.total-rent p');
  if (rentLabel) {
    rentLabel.textContent = 'Total Rent Collected';
  }
  
  if (rentTrendEl) rentTrendEl.textContent = `${rentTrend >= 0 ? '+' : ''}${rentTrend}%`;
  const rentTrendContainer = rentTrendEl ? rentTrendEl.parentElement : null;
  if (rentTrendContainer && rentTrendContainer.classList.contains('fin-trend')) {
    rentTrendContainer.className = `fin-trend ${rentTrend >= 0 ? 'positive' : 'negative'}`;
  }

  document.getElementById('finOutstandingDues').textContent = `₹${formatNumber(financialData.outstandingDues)}`;
  document.getElementById('finDuesCount').textContent = financialData.duesTenants.length;

  document.getElementById('finSecurityDeposits').textContent = `₹${formatNumber(financialData.securityDeposits)}`;
  document.getElementById('finDepositCount').textContent = financialData.depositCount;

  document.getElementById('finMaintenanceExpense').textContent = `₹${formatNumber(financialData.monthlyExpense)}`;
  const expenseTrend = computeTrend(financialData.monthlyExpense, financialData.monthlyExpense);
  if (expenseTrendEl) expenseTrendEl.textContent = `${expenseTrend >= 0 ? '+' : ''}${expenseTrend}%`;
  const expenseTrendContainer = expenseTrendEl ? expenseTrendEl.parentElement : null;
  if (expenseTrendContainer && expenseTrendContainer.classList.contains('fin-trend')) {
    expenseTrendContainer.className = 'fin-trend neutral';
  }

  const profitLoss = financialData.monthlyRent - financialData.monthlyExpense;
  document.getElementById('finProfitLoss').textContent = `₹${formatNumber(Math.abs(profitLoss))}`;
  
  const trendEl = document.getElementById('finProfitTrend');
  if (profitLoss > 0) {
    trendEl.className = 'fin-trend positive';
    trendEl.innerHTML = '<i class="fas fa-arrow-up"></i> Profit this month';
  } else if (profitLoss < 0) {
    trendEl.className = 'fin-trend negative';
    trendEl.innerHTML = '<i class="fas fa-arrow-down"></i> Loss this month';
  } else {
    trendEl.className = 'fin-trend neutral';
    trendEl.innerHTML = '<i class="fas fa-equals"></i> Break even';
  }
}

function toggleFinPeriod(type, period, btn) {
  // Update button states
  const parent = btn.parentElement;
  parent.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Update values
  if (type === 'rent') {
    const value = period === 'month' ? financialData.monthlyRent : financialData.yearlyRent;
    document.getElementById('finTotalRent').textContent = `₹${formatNumber(value)}`;
  } else if (type === 'expense') {
    const value = period === 'month' ? financialData.monthlyExpense : financialData.yearlyExpense;
    document.getElementById('finMaintenanceExpense').textContent = `₹${formatNumber(value)}`;
  }
}

function switchFinTab(tabName, btn) {
  // Update tab buttons
  document.querySelectorAll('.fin-tab').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  
  // Update panels
  document.querySelectorAll('.fin-tab-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(tabName + '-panel').classList.add('active');
}

function renderRevenueExpenseChart() {
  const ctx = document.getElementById('revenueExpenseChart');
  if (!ctx) return;
  
  if (window.revenueExpenseChart && typeof window.revenueExpenseChart.destroy === 'function') {
    window.revenueExpenseChart.destroy();
  }
  
  const months = financialData.revenueSeries.map(item => item.label);
  const revenueData = financialData.revenueSeries.map(item => item.revenue);
  const expenseData = financialData.expenseSeries.map(item => item.expense ?? financialData.monthlyExpense);
  const profitData = revenueData.map((rev, idx) => rev - (expenseData[idx] || 0));

  const avgRev = revenueData.length ? Math.floor(revenueData.reduce((a, b) => a + b, 0) / revenueData.length) : 0;
  const avgExp = expenseData.length ? Math.floor(expenseData.reduce((a, b) => a + b, 0) / expenseData.length) : 0;
  const avgProf = avgRev - avgExp;
  
  document.getElementById('avgRevenue').textContent = `₹${formatNumber(avgRev)}`;
  document.getElementById('avgExpense').textContent = `₹${formatNumber(avgExp)}`;
  document.getElementById('avgProfit').textContent = `₹${formatNumber(avgProf)}`;
  document.getElementById('avgProfit').className = avgProf >= 0 ? 'summary-value positive' : 'summary-value negative';
  
  window.revenueExpenseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { padding: 20, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ₹${formatNumber(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + formatNumber(value);
            }
          }
        }
      }
    }
  });
}

function renderPaymentModeChart() {
  const ctx = document.getElementById('paymentModeChart');
  if (!ctx) return;
  
  if (window.paymentModeChart && typeof window.paymentModeChart.destroy === 'function') {
    window.paymentModeChart.destroy();
  }
  
  const breakdown = financialData.paymentModeBreakdown || {};
  const cash = toNumber(breakdown.CASH);
  const upi = toNumber(breakdown.UPI);
  const bank = toNumber(breakdown.BANK_TRANSFER);
  const gateway = toNumber(breakdown.GATEWAY);
  const total = cash + upi + bank + gateway;

  const percent = (value) => total ? `${Math.round((value / total) * 100)}%` : '0%';

  document.getElementById('cashPayments').textContent = `₹${formatNumber(cash)}`;
  document.getElementById('cashPercent').textContent = percent(cash);
  document.getElementById('upiPayments').textContent = `₹${formatNumber(upi)}`;
  document.getElementById('upiPercent').textContent = percent(upi);
  document.getElementById('bankPayments').textContent = `₹${formatNumber(bank)}`;
  document.getElementById('bankPercent').textContent = percent(bank);
  
  if (!total) {
    return;
  }

  window.paymentModeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cash', 'UPI', 'Bank Transfer', 'Gateway'],
      datasets: [{
        data: [cash, upi, bank, gateway],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true }
        }
      },
      cutout: '65%'
    }
  });
}

function loadDuesReport() {
  const tbody = document.getElementById('duesReportTableBody');
  const duesList = financialData.duesTenants || [];
  
  if (duesList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-row">No pending dues</td></tr>';
    return;
  }
  
  const today = new Date();
  let html = '';
  duesList.forEach(tenant => {
    const amount = toNumber(tenant.dues) || toNumber(tenant.rent);
    const dueDateObj = getTenantDueDate(tenant);
    const dueDate = dueDateObj ? dueDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
    let daysPastDue = 0;
    if (dueDateObj) {
      const diff = today - dueDateObj;
      daysPastDue = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    }
    let pastDueClass = 'low';
    if (daysPastDue > 20) pastDueClass = 'high';
    else if (daysPastDue > 10) pastDueClass = 'medium';
    
    html += `
      <tr>
        <td><strong>${tenant.name || 'Tenant'}</strong></td>
        <td>${tenant.roomNumber ? `Room ${tenant.roomNumber}` : '-'}</td>
        <td><strong style="color: #ef4444;">₹${formatNumber(amount)}</strong></td>
        <td>${dueDate}</td>
        <td><span class="overdue-badge ${pastDueClass}">${daysPastDue} days</span></td>
        <td>
          <button class="table-action-btn remind" onclick="remindTenant('${tenant.name || 'Tenant'}')">
            <i class="fas fa-bell"></i> Remind
          </button>
          <button class="table-action-btn view" onclick="viewDuesDetails('${tenant.name || 'Tenant'}')">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

function loadExpenseData() {
  const expenses = financialData.expenses || [];
  const categoryTotals = expenses.reduce((acc, expense) => {
    const key = (expense.category || 'Other').toLowerCase();
    acc[key] = (acc[key] || 0) + toNumber(expense.amount);
    return acc;
  }, {});

  document.getElementById('expenseElectricity').textContent = `₹${formatNumber(categoryTotals.electricity || 0)}`;
  document.getElementById('expenseCleaning').textContent = `₹${formatNumber(categoryTotals.cleaning || 0)}`;
  document.getElementById('expenseStaff').textContent = `₹${formatNumber(categoryTotals['staff salary'] || categoryTotals.staff || 0)}`;
  document.getElementById('expenseRepairs').textContent = `₹${formatNumber(categoryTotals.repairs || 0)}`;
  document.getElementById('expenseOther').textContent = `₹${formatNumber(categoryTotals.other || 0)}`;
  
  const tbody = document.getElementById('expenseListTableBody');
  
  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-row">No expenses recorded</td></tr>';
    return;
  }
  
  let html = '';
  expenses.forEach(expense => {
    html += `
      <tr>
        <td>${expense.date || '-'}</td>
        <td><strong>${expense.category || 'Other'}</strong></td>
        <td>${expense.description || '-'}</td>
        <td><strong>₹${formatNumber(expense.amount)}</strong></td>
        <td>${expense.paymentMode || '-'}</td>
        <td>
          <button class="table-action-btn view" onclick="viewExpense(${expense.id || 0})">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="table-action-btn delete" onclick="deleteExpense(${expense.id || 0})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

function openAddExpenseModal() {
  document.getElementById('addExpenseModal').classList.add('active');
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="expenseDate"]').value = today;
}

function closeAddExpenseModal() {
  document.getElementById('addExpenseModal').classList.remove('active');
  document.getElementById('addExpenseForm').reset();
}

function handleAddExpense(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const expense = {
    date: formData.get('expenseDate'),
    category: formData.get('category'),
    description: formData.get('description'),
    amount: parseFloat(formData.get('amount')),
    paymentMode: formData.get('paymentMode')
  };
  
  // In production, call API to save expense
  
  closeAddExpenseModal();
  showAlert('success', 'Expense added successfully');
  
  // Reload expense data
  setTimeout(() => {
    loadExpenseData();
    updateFinancialOverview();
  }, 500);
}

function exportToExcel() {
  showAlert('info', 'Excel export feature will be implemented soon');
}

function exportToPDF() {
  showAlert('info', 'PDF export feature will be implemented soon');
}

function remindTenant(name) {
  showAlert('info', `Reminder sent to ${name}`);
}

function viewDuesDetails(name) {
  showAlert('info', `Viewing dues details for ${name}`);
}

function viewExpense(id) {
  showAlert('info', `Viewing expense details for ID: ${id}`);
}

function deleteExpense(id) {
  if (confirm('Are you sure you want to delete this expense?')) {
    showAlert('success', 'Expense deleted successfully');
    setTimeout(() => loadExpenseData(), 500);
  }
}

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
window.closeUnitDetailsModal = closeUnitDetailsModal;
window.openMoveTenantModal = openMoveTenantModal;
window.closeMoveTenantModal = closeMoveTenantModal;
window.handleMoveTenant = handleMoveTenant;
window.toggleTenantMenu = toggleTenantMenu;
window.editTenant = editTenant;
window.removeTenant = removeTenant;
window.toggleFinPeriod = toggleFinPeriod;
window.switchFinTab = switchFinTab;
window.openAddExpenseModal = openAddExpenseModal;
window.closeAddExpenseModal = closeAddExpenseModal;
window.handleAddExpense = handleAddExpense;
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.remindTenant = remindTenant;
window.viewDuesDetails = viewDuesDetails;
window.viewExpense = viewExpense;
window.deleteExpense = deleteExpense;

// ===============================================
// TENANTS SECTION FUNCTIONS
// ===============================================

let currentTenantId = null;
let allTenants = [];

// Load and display tenants
async function loadTenants() {
  try {
    // Fetch tenants from API
    const tenantsList = await apiService.getTenants();
    
    if (!tenantsList || !Array.isArray(tenantsList)) {
      console.error('No tenants data received from API');
      allTenants = [];
      renderTenantsTable(allTenants);
      return;
    }

    // Filter tenants for current property
    const propertyTenants = tenantsList.filter(t => 
      t.propertyId === parseInt(currentPropertyId)
    );
    
    
    // Transform tenant data to include unit/bed info and payment status
    allTenants = propertyTenants.map(tenant => {
      // Find the unit for this tenant
      const unit = units.find(u => u.id === tenant.unitId);
      
      // Get tenant name - backend returns it as 'tenantName'
      const tenantName = tenant.tenantName || 'Unknown';
      
      // Get bed number - backend returns it as 'bedIndex' (0-based)
      const bedNumber = tenant.bedIndex !== null && tenant.bedIndex !== undefined 
        ? (tenant.bedIndex + 1) 
        : '-';
      
      return {
        id: tenant.id,
        tenantId: tenant.tenantId,
        name: tenantName,
        phone: tenant.phoneNumber || '-',
        email: tenant.emailAddress || '-',
        photo: tenant.photo || null,
        roomNumber: tenant.flatRoomNumber || (unit ? unit.number : '-'),
        bedNumber: bedNumber,
        checkInDate: tenant.leaseStartDate || null,
        rent: tenant.rentAmount || (unit ? unit.rent : 0),
        status: tenant.status || 'Active',
        dues: tenant.pendingDues || tenant.dues || 0,
        unitId: tenant.unitId,
        bedId: tenant.bedId,
        // Payment status fields from backend
        paymentStatus: tenant.paymentStatus || 'DUE',
        isCurrentMonthPaid: tenant.isCurrentMonthPaid || false,
        isDue: tenant.isDue || tenant.isOverdue || false,
        nextDueDate: tenant.nextDueDate || null,
        // Additional fields for profile
        dateOfBirth: tenant.dateOfBirth || null,
        gender: tenant.gender || '-',
        bloodGroup: tenant.bloodGroup || '-',
        emergencyContact: tenant.emergencyContact || tenant.emergencyPhone || '-',
        address: tenant.permanentAddress || tenant.address || '-',
        occupation: tenant.occupation || '-',
        company: tenant.companyName || tenant.company || '-',
        lockInPeriod: tenant.lockInMonths ? `${tenant.lockInMonths} months` : '-',
        noticePeriod: tenant.noticePeriodDays ? `${tenant.noticePeriodDays} days` : '30 days',
        expectedCheckOut: tenant.leaseEndDate || null,
        securityDeposit: tenant.securityDeposit || 0,
        rentDueDate: tenant.rentDueDate || 1
      };
    });
    
    console.log('Loaded tenants with payment status:', allTenants.length);
    if (allTenants.length > 0) {
      console.log('Sample tenant data:', allTenants[0]);
    }

    renderTenantsTable(allTenants);
    
  } catch (error) {
    console.error('Failed to load tenants:', error);
    showAlert('error', 'Failed to load tenants');
    allTenants = [];
    renderTenantsTable(allTenants);
  }
}

// Render tenants table
function renderTenantsTable(tenants) {
  const tbody = document.getElementById('tenantsTableBody');
  
  if (!tenants || tenants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="no-data-row">
          <i class="fas fa-users" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
          <div>No tenants found</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tenants.map(tenant => {
    const statusClass = tenant.status ? tenant.status.toLowerCase() : 'active';
    const duesAmount = tenant.dues || 0;
    const duesClass = duesAmount === 0 ? 'zero' : 'pending';
    const initials = tenant.name ? tenant.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'T';
    
    // Calculate payment status and days until due
    let paymentStatusText = '-';
    let paymentStatusClass = '';
    let nextDueText = '-';
    
    // Determine the due date
    let dueDate = null;
    
    if (tenant.nextDueDate) {
      // Backend provided nextDueDate
      dueDate = new Date(tenant.nextDueDate);
    } else if (tenant.rentDueDate) {
      // Calculate next due date from rentDueDate
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const dueDay = parseInt(tenant.rentDueDate);
      
      dueDate = new Date(currentYear, currentMonth, dueDay);
      
      // If the due date has already passed this month, use next month
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }
    }
    
    // Calculate payment status based on due date
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if due
      if (tenant.isDue || (tenant.paymentStatus || '').toUpperCase() === 'DUE' || diffDays < 0) {
        paymentStatusText = 'Due';
        paymentStatusClass = 'due';
      } else if (tenant.isCurrentMonthPaid || (tenant.paymentStatus || '').toUpperCase() === 'PAID') {
        paymentStatusText = 'Paid';
        paymentStatusClass = 'paid';
      } else if (diffDays === 0) {
        paymentStatusText = 'Due Today';
        paymentStatusClass = 'due-today';
      } else if (diffDays === 1) {
        paymentStatusText = 'Due Tomorrow';
        paymentStatusClass = 'due-soon';
      } else {
        paymentStatusText = `Due in ${diffDays} days`;
        paymentStatusClass = diffDays <= 7 ? 'due-soon' : 'upcoming';
      }
      
      // Format next due date
      nextDueText = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      // No due date available
      if (tenant.isCurrentMonthPaid || (tenant.paymentStatus || '').toUpperCase() === 'PAID') {
        paymentStatusText = 'Paid';
        paymentStatusClass = 'paid';
      } else if (tenant.isDue || (tenant.paymentStatus || '').toUpperCase() === 'DUE') {
        paymentStatusText = 'Due';
        paymentStatusClass = 'due';
      } else {
        paymentStatusText = 'Pending';
        paymentStatusClass = 'upcoming';
      }
    }
    
    return `
      <tr>
        <td>
          ${tenant.photo ? 
            `<img src="${tenant.photo}" alt="${tenant.name}" class="tenant-photo">` :
            `<div class="tenant-photo-placeholder">${initials}</div>`
          }
        </td>
        <td>
          <div class="tenant-name">${tenant.name || 'Unknown'}</div>
          <div style="font-size: 12px; color: #7f8c8d;">${tenant.phone || '-'}</div>
        </td>
        <td>Room ${tenant.roomNumber || '-'}</td>
        <td>Bed ${tenant.bedNumber || '-'}</td>
        <td>${tenant.checkInDate ? formatDate(tenant.checkInDate) : '-'}</td>
        <td><strong>₹${(tenant.rent || 0).toLocaleString()}</strong></td>
        <td><span class="status-badge ${statusClass}">${tenant.status || 'Active'}</span></td>
        <td><span class="payment-status-badge ${paymentStatusClass}">${paymentStatusText}</span></td>
        <td>${nextDueText}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="viewTenantProfile(${tenant.id})">
              <i class="fas fa-eye"></i> View
            </button>
            
            <button class="action-btn whatsapp" onclick="sendWhatsAppReminder(${tenant.id}, '${tenant.name.replace(/'/g, "\\'")}', '${tenant.phone}')" title="Send WhatsApp Reminder">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            
            <button class="action-btn remove" onclick="confirmRemoveTenant(${tenant.id}, '${tenant.name.replace(/'/g, "\\'")}')">
              <i class="fas fa-user-minus"></i> Remove
            </button>
            
            <button class="action-btn deactivate" data-tenant-id="${tenant.tenantId || tenant.id}" onclick="deactivateTenantAction(this)" ${String(tenant.status).toUpperCase() === 'VACATED' ? 'disabled' : ''}>
              <i class="fas fa-user-slash"></i> ${String(tenant.status).toUpperCase() === 'VACATED' ? 'Deactivated' : 'Deactivate'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter tenants based on search and filters
function filterTenants() {
  const searchTerm = document.getElementById('tenantSearch').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const duesFilter = document.getElementById('duesFilter').value;

  let filtered = allTenants.filter(tenant => {
    // Search filter
    const matchesSearch = !searchTerm || 
      (tenant.name && tenant.name.toLowerCase().includes(searchTerm)) ||
      (tenant.phone && tenant.phone.includes(searchTerm)) ||
      (tenant.roomNumber && tenant.roomNumber.toString().includes(searchTerm));

    // Status filter
    const tenantStatus = (tenant.status || 'active').toLowerCase();
    const matchesStatus = !statusFilter || tenantStatus === statusFilter;

    // Dues filter
    const hasDues = tenant.dues && tenant.dues > 0;
    const matchesDues = !duesFilter || 
      (duesFilter === 'dues' && hasDues) ||
      (duesFilter === 'paid' && !hasDues);

    return matchesSearch && matchesStatus && matchesDues;
  });

  renderTenantsTable(filtered);
}

// View tenant profile in modal
function viewTenantProfile(tenantId) {
  const tenant = allTenants.find(t => t.id === tenantId);
  if (!tenant) {
    console.error('Tenant not found');
    return;
  }

  currentTenantId = tenantId;
  
  // Populate sidebar
  const initials = tenant.name ? tenant.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'T';
  
  if (tenant.photo) {
    document.getElementById('profilePhoto').innerHTML = `<img src="${tenant.photo}" alt="${tenant.name}">`;
  } else {
    document.getElementById('profilePhoto').innerHTML = `<i class="fas fa-user"></i>`;
  }
  
  document.getElementById('profileName').textContent = tenant.name || 'Unknown';
  document.getElementById('profileStatus').textContent = tenant.status || 'Active';
  document.getElementById('profileStatus').className = `profile-status ${(tenant.status || 'active').toLowerCase()}`;
  document.getElementById('profilePhone').textContent = tenant.phone || '-';
  document.getElementById('profileEmail').textContent = tenant.email || '-';
  document.getElementById('profileRoom').textContent = `Room ${tenant.roomNumber}`;
  document.getElementById('profileBed').textContent = `Bed ${tenant.bedNumber}`;
  document.getElementById('profileCheckIn').textContent = tenant.checkInDate ? formatDate(tenant.checkInDate) : '-';
  document.getElementById('profileRent').textContent = `₹${(tenant.rent || 0).toLocaleString()}`;

  // Populate personal info tab
  loadPersonalInfo(tenant);
  
  // Load payment history
  loadPaymentHistory(tenant);
  
  // Load rent timeline
  loadRentTimeline(tenant);
  
  // Load complaints
  loadComplaints(tenant);

  // Show modal
  document.getElementById('tenantProfileModal').style.display = 'block';
}

// Close tenant profile modal
function closeTenantProfile() {
  document.getElementById('tenantProfileModal').style.display = 'none';
  currentTenantId = null;
}

// Switch profile tabs
function switchProfileTab(tabName, button) {
  // Remove active class from all tabs and panels
  document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.profile-panel').forEach(panel => panel.classList.remove('active'));
  
  // Add active class to selected tab and panel
  button.classList.add('active');
  document.getElementById(`${tabName}-panel`).classList.add('active');
}

// Load personal information
function loadPersonalInfo(tenant) {
  document.getElementById('detailName').textContent = tenant.name || '-';
  document.getElementById('detailPhone').textContent = tenant.phone || '-';
  document.getElementById('detailEmail').textContent = tenant.email || '-';
  document.getElementById('detailDOB').textContent = tenant.dateOfBirth ? formatDate(tenant.dateOfBirth) : '-';
  document.getElementById('detailGender').textContent = tenant.gender || '-';
  document.getElementById('detailBloodGroup').textContent = tenant.bloodGroup || '-';
  document.getElementById('detailEmergency').textContent = tenant.emergencyContact || '-';
  document.getElementById('detailAddress').textContent = tenant.address || '-';
  document.getElementById('detailOccupation').textContent = tenant.occupation || '-';
  document.getElementById('detailCompany').textContent = tenant.company || '-';
  document.getElementById('detailCheckIn').textContent = tenant.checkInDate ? formatDate(tenant.checkInDate) : '-';
  document.getElementById('detailLockIn').textContent = tenant.lockInPeriod || '-';
  document.getElementById('detailNoticePeriod').textContent = tenant.noticePeriod || '30 days';
  document.getElementById('detailCheckOut').textContent = tenant.expectedCheckOut ? formatDate(tenant.expectedCheckOut) : '-';
}

// Load payment history
function loadPaymentHistory(tenant) {
  // Generate mock payment history
  const payments = generateMockPayments(tenant);
  
  // Calculate summary
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalDues = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
  const lastPaymentDate = payments.find(p => p.status === 'paid')?.date || '-';
  
  document.getElementById('totalPaid').textContent = `₹${totalPaid.toLocaleString()}`;
  document.getElementById('totalDues').textContent = `₹${totalDues.toLocaleString()}`;
  document.getElementById('lastPayment').textContent = lastPaymentDate !== '-' ? formatDate(lastPaymentDate) : '-';
  
  // Render payment table
  const tbody = document.getElementById('paymentHistoryBody');
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-row">No payment history</td></tr>';
    return;
  }
  
  tbody.innerHTML = payments.map(payment => `
    <tr>
      <td>${formatDate(payment.date)}</td>
      <td>${payment.month}</td>
      <td><strong>₹${payment.amount.toLocaleString()}</strong></td>
      <td>${payment.mode}</td>
      <td><span class="payment-status ${payment.status}">${payment.status}</span></td>
      <td>
        ${payment.status === 'paid' ? 
          `<button class="receipt-btn" onclick="downloadReceipt('${payment.id}')">
            <i class="fas fa-download"></i> Receipt
          </button>` : 
          '-'
        }
      </td>
    </tr>
  `).join('');
}

// Generate mock payment history
function generateMockPayments(tenant) {
  const payments = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const modes = ['UPI', 'Cash', 'Bank Transfer', 'Cheque'];
  const statuses = ['paid', 'pending', 'due'];
  
  for (let i = 0; i < 6; i++) {
    const monthIndex = new Date().getMonth() - i;
    const month = months[monthIndex >= 0 ? monthIndex : 12 + monthIndex];
    const status = i === 0 ? 'pending' : (i === 1 ? 'paid' : (Math.random() > 0.3 ? 'paid' : 'due'));
    
    payments.push({
      id: `pay-${tenant.id}-${i}`,
      date: new Date(2024, monthIndex >= 0 ? monthIndex : 12 + monthIndex, 5),
      month: `${month} 2024`,
      amount: tenant.rent || 6000,
      mode: modes[Math.floor(Math.random() * modes.length)],
      status: status
    });
  }
  
  return payments;
}

// Load rent timeline
function loadRentTimeline(tenant) {
  const payments = generateMockPayments(tenant);
  const timeline = document.getElementById('rentTimeline');
  
  if (payments.length === 0) {
    timeline.innerHTML = '<div class="no-data-small">No timeline data</div>';
    return;
  }
  
  timeline.innerHTML = payments.map(payment => `
    <div class="timeline-item">
      <div class="timeline-icon ${payment.status}">
        <i class="fas ${payment.status === 'paid' ? 'fa-check' : payment.status === 'pending' ? 'fa-clock' : 'fa-exclamation'}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-month">${payment.month}</div>
        <div class="timeline-details">
          <span>${payment.status === 'paid' ? 'Paid on ' + formatDate(payment.date) : payment.status === 'pending' ? 'Payment Due' : 'Due'}</span>
          <span class="timeline-amount">₹${payment.amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Load complaints
async function loadComplaints(tenant) {
  const complaintsContainer = document.getElementById('complaintsList');
  
  try {
    // Fetch complaints from API
    // const complaints = await apiService.getComplaints(tenant.id);
    
    // For now, show empty state until API is implemented
    const complaints = [];
    
    if (complaints.length === 0) {
      complaintsContainer.innerHTML = '<div class="no-data-small">No complaints logged</div>';
      return;
    }
    
    complaintsContainer.innerHTML = complaints.map(complaint => `
      <div class="complaint-item">
        <div class="complaint-header">
          <div class="complaint-title">${complaint.title}</div>
          <div class="complaint-date">${formatDate(complaint.date)}</div>
        </div>
        <div class="complaint-description">${complaint.description}</div>
        <span class="complaint-status ${complaint.status}">${complaint.status}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load complaints:', error);
    complaintsContainer.innerHTML = '<div class="no-data-small">No complaints logged</div>';
  }
}

// Confirm and remove tenant
function confirmRemoveTenant(tenantId, tenantName) {
  if (confirm(`Are you sure you want to remove ${tenantName} from this property?\n\nThis will:\n✓ Mark the tenant as inactive\n✓ Free up the bed/room\n✓ Keep all tenancy records for history\n✗ Not delete any data`)) {
    removeTenantFromProperty(tenantId);
  }
}

// Remove tenant from property (de-assign, not delete)
async function removeTenantFromProperty(tenantId) {
  try {
    const tenant = allTenants.find(t => t.id === tenantId);
    if (!tenant) {
      showAlert('error', 'Tenant not found');
      return;
    }

    // Call backend API to de-assign tenant
    // This should update tenant status to 'INACTIVE' and free up the bed
    await apiService.makeRequest(`/tenants/${tenantId}/deassign`, {
      method: 'POST'
    });

    showAlert('success', `${tenant.name} has been removed from the property. All records have been preserved.`);
    
    // Reload tenants list to reflect changes
    await loadTenants();
    
    // Reload dashboard if it's visible to update occupancy stats
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
    
    // Reload floors view to update bed availability
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
    
  } catch (error) {
    console.error('Failed to remove tenant:', error);
    showAlert('error', error.message || 'Failed to remove tenant from property');
  }
}

// Deactivate tenant from the compact list dropdown
window.deactivateTenantFromList = async function(externalTenantId){
  if(!externalTenantId) return;
  if(!confirm('Are you sure you want to deactivate this tenant? This will free their bed/room.')) return;
  try {
    await apiService.deactivateTenant(externalTenantId);
    showAlert && showAlert('success','Tenant deactivated');
    await loadTenants();
    // Refresh floors/units & stats so the freed bed is immediately visible
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
    if (currentView === 'dashboard') {
      loadDashboardData();
    } else if (currentView === 'financial') {
      loadFinancialData();
    }
  } catch(e){
    console.error('Deactivate failed', e);
    showAlert && showAlert('error', e.message || 'Failed to deactivate tenant');
  }
};

// Deactivate tenant (mark VACATED and free bed) with button loading state
window.deactivateTenantAction = async function(btn) {
  const tenantId = btn.getAttribute('data-tenant-id');
  if (!tenantId) return;
  if (btn.disabled) return;
  if (!confirm('Are you sure you want to deactivate this tenant?\n\nThis will free their bed/room and mark them as VACATED.')) return;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deactivating...';
  try {
    await apiService.deactivateTenant(tenantId);
    btn.innerHTML = '<i class="fas fa-check"></i> Deactivated';
    btn.classList.remove('loading');
    btn.classList.add('success');
    // Reload tenants to reflect status badge
    await loadTenants();
    // Refresh floors/units & stats so the bed shows as free
    await loadFloorsAndUnitsFromApi();
    renderFloorsAndUnits();
    updateStats();
    if (currentView === 'dashboard') {
      loadDashboardData();
    } else if (currentView === 'financial') {
      loadFinancialData();
    }
  } catch (e) {
    console.error('Failed to deactivate:', e);
    alert(e.message || 'Failed to deactivate tenant');
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = originalText;
  }
};

// Export tenants to Excel
function exportTenantsToExcel() {
  alert('Excel export functionality will be implemented with backend integration');
}

// Send WhatsApp reminder
function sendWhatsAppReminder() {
  const tenant = allTenants.find(t => t.id === currentTenantId);
  if (!tenant) {
    showAlert('error', 'Tenant not found');
    return;
  }

  // Validate phone number
  const phone = tenant.phone;
  if (!phone || phone.trim() === '') {
    showAlert('error', 'Tenant phone number not available');
    return;
  }

  // Clean phone number (remove non-digits)
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Add India country code
    }
    cleanPhone = '+' + cleanPhone;
  }

  // Create WhatsApp message with rent details
  const rentAmount = tenant.rent || 0;
  const dueDays = 5;
  const message = `🏠 *Rent Reminder - Flatery*\n\nDear ${tenant.name},\n\nThis is a friendly reminder regarding your rent payment.\n\n💰 *Amount Due:* ₹${rentAmount}\n*Due within ${dueDays} days*\n\nPlease submit your payment at your earliest convenience. If you've already paid, please ignore this message.\n\nFor any queries, feel free to contact us.\n\nThank you! 🙏`;

  // Open WhatsApp with pre-filled message
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  // Show confirmation
  showAlert('success', `Opening WhatsApp chat with ${tenant.name}. Message is ready to send.`);
  console.log('WhatsApp chat opened for tenant:', tenant.name);
}

// Generate agreement
function generateAgreement() {
  alert('Agreement generation functionality will be implemented with backend integration');
}

// Download rent receipts
function downloadRentReceipts() {
  alert('Rent receipts download functionality will be implemented with backend integration');
}

// Download individual receipt
function downloadReceipt(paymentId) {
  alert(`Downloading receipt for payment: ${paymentId}`);
}

// Edit tenant profile
function editTenantProfile() {
  if (currentTenantId) {
    window.location.href = `edit-tenant.html?id=${currentTenantId}&propertyId=${currentPropertyId}`;
  }
}

// Remove tenant from modal
function removeTenantFromModal() {
  const tenant = allTenants.find(t => t.id === currentTenantId);
  if (tenant) {
    closeTenantProfile();
    confirmRemoveTenant(currentTenantId, tenant.name);
  }
}

// View document
function viewDocument(docType) {
  alert(`Viewing ${docType} document`);
}

// Download document
function downloadDocument(docType) {
  alert(`Downloading ${docType} document`);
}

// Helper function to format dates
function formatDate(date) {
  if (!date) return '-';
  
  // Handle string dates from backend (e.g., "2024-10-15")
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Export functions to window
window.loadTenants = loadTenants;
window.filterTenants = filterTenants;
window.viewTenantProfile = viewTenantProfile;
window.closeTenantProfile = closeTenantProfile;
window.switchProfileTab = switchProfileTab;
window.exportTenantsToExcel = exportTenantsToExcel;
window.confirmRemoveTenant = confirmRemoveTenant;
window.removeTenantFromProperty = removeTenantFromProperty;
window.sendWhatsAppReminder = sendWhatsAppReminder;
window.generateAgreement = generateAgreement;
window.downloadRentReceipts = downloadRentReceipts;
window.downloadReceipt = downloadReceipt;
window.editTenantProfile = editTenantProfile;
window.removeTenantFromModal = removeTenantFromModal;
window.viewDocument = viewDocument;
window.downloadDocument = downloadDocument;

// ===============================================
// PAYMENTS SECTION FUNCTIONS
// ===============================================

let allPayments = [];
let currentPaymentId = null;
let rentCollectionChart = null;

// Load and display payments - NEW RENT COLLECTION VIEW
async function loadPayments() {
  try {
    // Ensure tenants are loaded first
    if (!allTenants || allTenants.length === 0) {
      await loadTenants();
    }
    
    // Load rent collection overview (new view)
    await loadRentCollectionOverview();
    
    // Populate tenant dropdown in add payment modal
    populateTenantDropdown();
    
    // Set default date to today
    const paymentDateInput = document.getElementById('paymentDate');
    if (paymentDateInput) {
      paymentDateInput.valueAsDate = new Date();
    }
    
  } catch (error) {
    console.error('Failed to load payments:', error);
    showAlert('error', 'Failed to load payments: ' + error.message);
  }
}

// Load Rent Collection Overview - categorize tenants by payment status
async function loadRentCollectionOverview() {
  try {
    console.log('Loading rent collection overview with', allTenants.length, 'tenants');
    
    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const monthFromNow = new Date(today);
    monthFromNow.setDate(monthFromNow.getDate() + 30);
    
    // Categorize tenants
    const dueTenants = [];
    const dueTodayTenants = [];
    const dueThisWeekTenants = [];
    const upcomingTenants = [];
    const paidTenants = [];
    
    let totalExpected = 0;
    let totalCollected = 0;
    let totalDue = 0;
    
    allTenants.forEach(tenant => {
      const rentAmount = tenant.rent || 0;
      totalExpected += rentAmount;
      
      // Check payment status from backend
      const paymentStatus = (tenant.paymentStatus || 'DUE').toUpperCase();
      const isDue = tenant.isDue === true || tenant.isOverdue === true;
      const nextDueDateStr = tenant.nextDueDate;
      
      // Parse next due date
      let nextDueDate = null;
      if (nextDueDateStr) {
        nextDueDate = new Date(nextDueDateStr);
        nextDueDate.setHours(0, 0, 0, 0);
      }
      
      // Categorize by payment status and due date
      if (paymentStatus === 'PAID' || tenant.isCurrentMonthPaid === true) {
        paidTenants.push(tenant);
        totalCollected += rentAmount;
      } else if (isDue || paymentStatus === 'DUE' || (nextDueDate && nextDueDate < today)) {
        dueTenants.push(tenant);
        totalDue += rentAmount;
      } else if (nextDueDate) {
        // Check date proximity
        if (nextDueDate >= today && nextDueDate <= todayEnd) {
          dueTodayTenants.push(tenant);
          totalDue += rentAmount;
        } else if (nextDueDate > today && nextDueDate <= weekFromNow) {
          dueThisWeekTenants.push(tenant);
          totalDue += rentAmount;
        } else if (nextDueDate > weekFromNow && nextDueDate <= monthFromNow) {
          upcomingTenants.push(tenant);
          totalDue += rentAmount;
        } else {
          // Future due date beyond 30 days
          upcomingTenants.push(tenant);
          totalDue += rentAmount;
        }
      } else {
        // No due date available - put in upcoming
        upcomingTenants.push(tenant);
        totalDue += rentAmount;
      }
    });
    
    console.log('Categorized tenants:', {
      due: dueTenants.length,
      dueToday: dueTodayTenants.length,
      dueThisWeek: dueThisWeekTenants.length,
      upcoming: upcomingTenants.length,
      paid: paidTenants.length
    });
    
    // Update stats
    updateCollectionStats(totalExpected, totalCollected, totalDue, allTenants.length);
    
    // Render each category (overdue container now shows all due tenants)
    renderTenantCategory('dueTodayContainer', dueTenants, 'due');
    renderTenantCategory('dueWeekContainer', dueThisWeekTenants, 'due-week');
    renderTenantCategory('upcomingContainer', upcomingTenants, 'upcoming');
    renderTenantCategory('paidContainer', paidTenants, 'paid');
    
    // Update category counts
    const updateCount = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    
    updateCount('dueTodayCount', dueTenants.length);
    updateCount('dueWeekCount', dueThisWeekTenants.length);
    updateCount('upcomingCount', upcomingTenants.length);
    updateCount('paidCount', paidTenants.length);
    
  } catch (error) {
    console.error('Failed to load rent collection overview:', error);
    showAlert('error', 'Failed to load rent collection data');
  }
}

// Update collection statistics
function updateCollectionStats(expected, collected, due, totalTenants) {
  const collectionPercentage = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  
  // Update stat cards
  const updateStat = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  
  updateStat('totalExpectedRent', `₹${formatNumber(expected)}`);
  updateStat('totalCollectedRent', `₹${formatNumber(collected)}`);
  updateStat('collectedPercentage', `${collectionPercentage}%`);
  updateStat('totalPendingRent', `₹${formatNumber(due)}`);
  updateStat('pendingTenantsCount', `${totalTenants - Math.floor(collected / (expected / totalTenants || 1))} tenants`);
}

// Render tenant cards for a category
function renderTenantCategory(containerId, tenants, categoryType) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found`);
    return;
  }
  
  if (!tenants || tenants.length === 0) {
    container.innerHTML = '<div class="no-data-message">No tenants in this category</div>';
    return;
  }
  
  const html = tenants.map(tenant => {
    const statusBadgeClass = (tenant.paymentStatus || 'DUE').toLowerCase();
    const statusText = tenant.paymentStatus || 'DUE';
    
    // Format due date
    let dueDateText = 'Not set';
    if (tenant.nextDueDate) {
      const dueDate = new Date(tenant.nextDueDate);
      dueDateText = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (tenant.rentDueDate) {
      dueDateText = `${tenant.rentDueDate}${getDaySuffix(tenant.rentDueDate)} of month`;
    }
    
    // For paid tenants, show "Paid for [month]"
    if (categoryType === 'paid') {
      const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long' });
      dueDateText = `Paid for ${currentMonth}`;
    }
    
    const location = `Room ${tenant.roomNumber || '-'}, Bed ${tenant.bedNumber || '-'}`;
    
    return `
      <div class="tenant-card ${categoryType}">
        <div class="tenant-card-header">
          <div>
            <div class="tenant-card-name">${tenant.name || 'Unknown'}</div>
            <div class="tenant-card-location">${location}</div>
          </div>
          <span class="payment-status-badge ${statusBadgeClass}">${statusText}</span>
        </div>
        <div class="tenant-card-body">
          <div class="tenant-card-info">
            <span class="label">Rent Amount:</span>
            <span class="value">₹${formatNumber(tenant.rent || 0)}</span>
          </div>
          <div class="tenant-card-info">
            <span class="label">${categoryType === 'paid' ? 'Paid On:' : 'Due Date:'}</span>
            <span class="value">${dueDateText}</span>
          </div>
          <div class="tenant-card-info">
            <span class="label">Contact:</span>
            <span class="value">${tenant.phone || 'N/A'}</span>
          </div>
        </div>
        <div class="tenant-card-footer">
          ${categoryType !== 'paid' ? `
            <button class="btn-small primary whatsapp" onclick="sendWhatsAppReminder(${tenant.id}, '${tenant.name.replace(/'/g, "\\'")}', '${tenant.phone}')" title="Send WhatsApp Reminder">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn-small primary" onclick="sendPaymentReminder(${tenant.id})">
              <i class="fas fa-bell"></i> Email/SMS
            </button>
          ` : ''}
          <button class="btn-small secondary" onclick="viewTenantDetails(${tenant.id})">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

// Send payment reminder to tenant
function sendPaymentReminder(tenantId) {
  const tenant = allTenants.find(t => t.id === tenantId);
  if (!tenant) {
    showAlert('error', 'Tenant not found');
    return;
  }
  
  // TODO: Implement actual SMS/Email reminder via backend API
  // For now, show success message
  showAlert('success', `Payment reminder sent to ${tenant.name}`);
  console.log('TODO: Send payment reminder to tenant:', tenant);
}

/**
 * Send WhatsApp rent due reminder to tenant
 */
function sendWhatsAppReminder(tenantId, tenantName, phone) {
  const tenant = allTenants.find(t => t.id === tenantId);
  if (!tenant) {
    showAlert('error', 'Tenant not found');
    return;
  }

  // Validate phone number
  if (!phone || phone.trim() === '') {
    showAlert('error', 'Tenant phone number not available');
    return;
  }

  // Clean phone number (remove non-digits)
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Add India country code
    }
    cleanPhone = '+' + cleanPhone;
  }

  // Create WhatsApp message
  const rentAmount = tenant.rent || 0;
  const dueDays = 5; // Default reminder days
  const message = `🏠 *Rent Reminder - Flatery*\n\nDear ${tenantName},\n\nThis is a friendly reminder regarding your rent payment.\n\n💰 *Amount Due:* ₹${rentAmount}\n*Due within ${dueDays} days*\n\nPlease submit your payment at your earliest convenience. If you've already paid, please ignore this message.\n\nFor any queries, feel free to contact us.\n\nThank you! 🙏`;

  // Open WhatsApp with pre-filled message
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  // Show success message
  showAlert('success', `Opening WhatsApp chat with ${tenantName}. Message is ready to send.`);
  console.log('WhatsApp chat opened:', {
    tenant: tenantName,
    phone: cleanPhone,
    messageLength: message.length
  });
}

// View tenant details
function viewTenantDetails(tenantId) {
  // Reuse existing tenant profile view function
  if (typeof viewTenantProfile === 'function') {
    viewTenantProfile(tenantId);
  } else {
    console.error('viewTenantProfile function not found');
    showAlert('info', 'Tenant details view not available');
  }
}

// Generate mock payment data
function generateMockPayments() {
  const payments = [];
  const months = ['2024-11', '2024-10', '2024-09', '2024-08', '2024-07', '2024-06'];
  const modes = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD'];
  
  allTenants.forEach((tenant, index) => {
    months.forEach((month, monthIndex) => {
      const status = monthIndex === 0 ? (Math.random() > 0.3 ? 'paid' : 'pending') : 
                     monthIndex === 1 ? (Math.random() > 0.5 ? 'paid' : 'due') : 
                     'paid';
      
      const date = new Date(month + '-' + (5 + Math.floor(Math.random() * 5)));
      
      payments.push({
        id: `pay-${tenant.id}-${month}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        phone: tenant.phone,
        room: tenant.roomNumber,
        bed: tenant.bedNumber,
        amount: tenant.rent,
        mode: status === 'paid' ? modes[Math.floor(Math.random() * modes.length)] : null,
        date: status === 'paid' ? date : null,
        status: status,
        month: month,
        transactionRef: status === 'paid' ? `TXN${Math.floor(Math.random() * 1000000)}` : null
      });
    });
  });
  
  return payments;
}

// Update payment widgets
function updatePaymentWidgets() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthPayments = allPayments.filter(p => p.month === currentMonth);
  
  const totalCollected = currentMonthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const paidCount = currentMonthPayments.filter(p => p.status === 'paid').length;
  
  const totalPending = currentMonthPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = currentMonthPayments.filter(p => p.status === 'pending').length;
  
  const totalDue = currentMonthPayments.filter(p => p.status === 'due').reduce((sum, p) => sum + p.amount, 0);
  const dueCount = currentMonthPayments.filter(p => p.status === 'due').length;
  
  const totalBeds = units.reduce((sum, u) => sum + (u.beds || 0), 0);
  const averageRent = totalBeds > 0 ? Math.round(units.reduce((sum, u) => sum + (u.rent || 0) * u.beds, 0) / totalBeds) : 0;
  
  document.getElementById('totalCollected').textContent = `₹${totalCollected.toLocaleString()}`;
  document.getElementById('paidCount').textContent = paidCount;
  
  document.getElementById('totalPending').textContent = `₹${totalPending.toLocaleString()}`;
  document.getElementById('pendingCount').textContent = pendingCount;
  
  // Note: totalOverdue and overdueCount elements removed from HTML, no longer updating them
  
  document.getElementById('averageRent').textContent = `₹${averageRent.toLocaleString()}`;
  document.getElementById('totalBeds').textContent = totalBeds;
}

// Render rent collection chart
function renderRentCollectionChart(period = '6months') {
  const ctx = document.getElementById('rentCollectionChart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (rentCollectionChart && typeof rentCollectionChart.destroy === 'function') {
    rentCollectionChart.destroy();
  }
  
  // Generate chart data
  const months = period === '6months' ? 6 : 12;
  const labels = [];
  const collectedData = [];
  const pendingData = [];
  const dueData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    labels.push(monthLabel);
    
    const monthPayments = allPayments.filter(p => p.month === monthKey);
    const collected = monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pending = monthPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const due = monthPayments.filter(p => p.status === 'due').reduce((sum, p) => sum + p.amount, 0);
    
    collectedData.push(collected);
    pendingData.push(pending);
    dueData.push(due);
  }
  
  rentCollectionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Collected',
          data: collectedData,
          backgroundColor: 'rgba(39, 174, 96, 0.8)',
          borderColor: 'rgba(39, 174, 96, 1)',
          borderWidth: 2
        },
        {
          label: 'Pending',
          data: pendingData,
          backgroundColor: 'rgba(243, 156, 18, 0.8)',
          borderColor: 'rgba(243, 156, 18, 1)',
          borderWidth: 2
        },
        {
          label: 'Due',
          data: dueData,
          backgroundColor: 'rgba(231, 76, 60, 0.8)',
          borderColor: 'rgba(231, 76, 60, 1)',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12, weight: 'bold' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Load payment chart
function loadPaymentChart(period) {
  // Update active button
  document.querySelectorAll('.chart-period-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  renderRentCollectionChart(period);
}

// Populate room filter
function populateRoomFilter() {
  const roomFilter = document.getElementById('roomFilter');
  const rooms = [...new Set(allTenants.map(t => t.roomNumber))].sort();
  
  roomFilter.innerHTML = '<option value="">All Rooms</option>';
  rooms.forEach(room => {
    roomFilter.innerHTML += `<option value="${room}">Room ${room}</option>`;
  });
}

// Populate tenant dropdown
function populateTenantDropdown() {
  const tenantSelect = document.getElementById('paymentTenantId');
  tenantSelect.innerHTML = '<option value="">Select Tenant</option>';
  
  allTenants.forEach(tenant => {
    tenantSelect.innerHTML += `<option value="${tenant.id}" data-rent="${tenant.rent}">
      ${tenant.name} - Room ${tenant.roomNumber}, Bed ${tenant.bedNumber}
    </option>`;
  });
  
  // Auto-fill amount when tenant is selected
  tenantSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
      const rent = selectedOption.getAttribute('data-rent');
      document.getElementById('paymentAmount').value = rent;
    }
  });
}

// Filter payments
function filterPayments() {
  const monthFilter = document.getElementById('monthFilter').value;
  const statusFilter = document.getElementById('statusFilterPayment').value;
  const roomFilter = document.getElementById('roomFilter').value;
  const searchTerm = document.getElementById('tenantSearchPayment').value.toLowerCase();
  
  let filtered = allPayments.filter(payment => {
    const matchesMonth = !monthFilter || payment.month.endsWith('-' + monthFilter.padStart(2, '0'));
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesRoom = !roomFilter || payment.room === roomFilter;
    const matchesSearch = !searchTerm || payment.tenantName.toLowerCase().includes(searchTerm);
    
    return matchesMonth && matchesStatus && matchesRoom && matchesSearch;
  });
  
  renderPaymentsTable(filtered);
}

// Render payments table
function renderPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  
  if (!payments || payments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="no-data-row">
          <i class="fas fa-money-bill-wave" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
          <div>No payments found</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = payments.map(payment => {
    const statusIcon = payment.status === 'paid' ? '✅' : payment.status === 'pending' ? '⚠️' : '❌';
    const statusClass = payment.status;
    
    let actionsHtml = '';
    if (payment.status === 'paid') {
      actionsHtml = `
        <button class="payment-action-btn receipt" onclick="viewReceipt('${payment.id}')">
          <i class="fas fa-file-invoice"></i> View
        </button>
      `;
    } else {
      actionsHtml = `
        <button class="payment-action-btn mark-paid" onclick="markAsPaid('${payment.id}')">
          <i class="fas fa-check"></i> Mark Paid
        </button>
      `;
    }
    
    return `
      <tr>
        <td>
          <div class="tenant-info">
            <span class="name">${payment.tenantName}</span>
            <span class="phone">${payment.phone}</span>
          </div>
        </td>
        <td>Room ${payment.room}</td>
        <td>Bed ${payment.bed}</td>
        <td class="payment-amount">₹${payment.amount.toLocaleString()}</td>
        <td><span class="payment-mode">${payment.mode || '-'}</span></td>
        <td>${payment.date ? formatDate(payment.date) : '-'}</td>
        <td>
          <span class="payment-status-badge ${statusClass}">
            ${statusIcon} ${payment.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div class="payment-actions">
            ${actionsHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open add payment modal
function openAddPaymentModal() {
  document.getElementById('addPaymentModal').style.display = 'block';
  document.getElementById('addPaymentForm').reset();
  document.getElementById('paymentDate').valueAsDate = new Date();
}

// Close add payment modal
function closeAddPaymentModal() {
  document.getElementById('addPaymentModal').style.display = 'none';
}

// Handle add payment
async function handleAddPayment(event) {
  event.preventDefault();
  
  const tenantId = parseInt(document.getElementById('paymentTenantId').value);
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const mode = document.getElementById('paymentMode').value;
  const date = document.getElementById('paymentDate').value;
  const transactionRef = document.getElementById('transactionRef').value;
  const notes = document.getElementById('paymentNotes').value;
  
  try {
    // TODO: Call backend API to record payment
    // await apiService.recordPayment({ tenantId, amount, mode, date, transactionRef, notes });
    
    showAlert('success', 'Payment recorded successfully!');
    closeAddPaymentModal();
    await loadPayments();
    
    // Reload other sections if visible
    if (currentView === 'dashboard') {
      loadDashboardData();
    }
    
  } catch (error) {
    console.error('Failed to record payment:', error);
    showAlert('error', 'Failed to record payment');
  }
}

// Mark payment as paid
async function markAsPaid(paymentId) {
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;
  
  // Pre-fill modal with payment details
  document.getElementById('paymentTenantId').value = payment.tenantId;
  document.getElementById('paymentAmount').value = payment.amount;
  document.getElementById('paymentDate').valueAsDate = new Date();
  
  openAddPaymentModal();
}

// View receipt
function viewReceipt(paymentId) {
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;
  
  // Populate receipt modal
  document.getElementById('receiptNumber').textContent = payment.id;
  document.getElementById('receiptProperty').textContent = propertyData.name || '-';
  document.getElementById('receiptAddress').textContent = propertyData.address || '-';
  document.getElementById('receiptTenant').textContent = payment.tenantName;
  document.getElementById('receiptRoom').textContent = `Room ${payment.room}`;
  document.getElementById('receiptBed').textContent = `Bed ${payment.bed}`;
  document.getElementById('receiptAmount').textContent = `₹${payment.amount.toLocaleString()}`;
  document.getElementById('receiptMode').textContent = payment.mode || '-';
  document.getElementById('receiptDate').textContent = formatDate(payment.date);
  document.getElementById('receiptRef').textContent = payment.transactionRef || '-';
  document.getElementById('receiptTimestamp').textContent = new Date().toLocaleString();
  
  // Show modal
  document.getElementById('paymentReceiptModal').style.display = 'block';
}

// Close receipt modal
function closeReceiptModal() {
  document.getElementById('paymentReceiptModal').style.display = 'none';
}

// Print receipt
function printReceipt() {
  window.print();
}

// Download receipt as PDF
function downloadReceiptPDF() {
  alert('PDF download functionality will be implemented with backend integration');
}

// ========================================
// PAYMENT SETTINGS FUNCTIONS
// ========================================

let currentQRFile = null;

// Setup payment settings form handler
function setupPaymentSettingsForm() {
  const form = document.getElementById('paymentSettingsForm');
  if (!form) {
    return;
  }
  
  // Remove any existing listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Add submit handler
  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await savePaymentSettings();
  });
}

// Load payment settings from API
async function loadPaymentSettings() {
  try {
    const data = await apiService.get('/owner-payment-info');
    if (data) {
      populatePaymentSettingsForm(data);
    } else {
      clearPaymentSettingsForm();
    }
  } catch (error) {
    if (error.status === 204) {
      // No content - user hasn't set up payment info yet
      clearPaymentSettingsForm();
    } else {
      console.error('Error loading payment settings:', error);
      showAlert('error', 'Error loading payment settings: ' + (error.message || 'Unknown error'));
    }
  }
}

// Populate form with existing data
function populatePaymentSettingsForm(data) {
  document.getElementById('upiId').value = data.upiId || '';
  document.getElementById('preferredMode').value = data.preferredMode || '';
  document.getElementById('isActive').checked = data.isActive !== false;
  
  // Show QR code if exists
  if (data.qrImageUrl) {
    document.getElementById('qrImage').src = data.qrImageUrl;
    document.getElementById('qrImage').style.display = 'block';
    document.getElementById('qrPlaceholder').style.display = 'none';
    document.getElementById('removeQRBtn').style.display = 'block';
  } else {
    clearQRPreview();
  }
}

// Clear form
function clearPaymentSettingsForm() {
  document.getElementById('upiId').value = '';
  document.getElementById('preferredMode').value = '';
  document.getElementById('isActive').checked = true;
  clearQRPreview();
}

// Clear QR preview
function clearQRPreview() {
  document.getElementById('qrImage').style.display = 'none';
  document.getElementById('qrImage').src = '';
  document.getElementById('qrPlaceholder').style.display = 'flex';
  document.getElementById('removeQRBtn').style.display = 'none';
  currentQRFile = null;
}

// Handle QR code upload
async function handleQRUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showAlert('error', 'Please upload an image file');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('error', 'File size must be less than 5MB');
    return;
  }

  // Store file for later upload
  currentQRFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('qrImage').src = e.target.result;
    document.getElementById('qrImage').style.display = 'block';
    document.getElementById('qrPlaceholder').style.display = 'none';
    document.getElementById('removeQRBtn').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Remove QR code
function removeQRCode() {
  clearQRPreview();
  document.getElementById('qrCodeUpload').value = '';
}

// Save payment settings
async function savePaymentSettings() {
  try {
    const upiId = document.getElementById('upiId').value.trim();
    const preferredMode = document.getElementById('preferredMode').value;
    const isActive = document.getElementById('isActive').checked;

    // Validate UPI ID if provided
    if (upiId && !validateUpiId(upiId)) {
      showAlert('error', 'Please enter a valid UPI ID (e.g., username@paytm)');
      return;
    }

    // Upload QR code if user selected a new file
    if (currentQRFile) {
      const qrImageUrl = await uploadQRCode(currentQRFile);
      if (!qrImageUrl) {
        showAlert('error', 'Failed to upload QR code. Please try again.');
        return;
      }
      // QR URL is now saved to database by the upload endpoint, no need to send it again
    }

    // Prepare payload - don't send qrImageUrl, backend already updated it
    const payload = {
      upiId: upiId || null,
      preferredMode: preferredMode || null,
      isActive: isActive
    };

    // Save to API using apiService
    const result = await apiService.post('/owner-payment-info', payload);
    showAlert('success', 'Payment settings saved successfully!');
    currentQRFile = null;
    // Reload to show saved data
    await loadPaymentSettings();
  } catch (error) {
    console.error('Error saving payment settings:', error);
    showAlert('error', error.message || 'Error saving payment settings');
  }
}

// Upload QR code image
async function uploadQRCode(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Use the same token key as apiService
    const token = localStorage.getItem('authToken');
    
    // Validate token exists and is not null
    if (!token || token === 'null' || token === 'undefined') {
      console.error('No valid authentication token found!');
      throw new Error('Authentication required. Please log in again.');
    }
    

    // Use the owner-payment-info QR upload endpoint
    const response = await fetch(`${apiService.baseURL}/owner-payment-info/upload-qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
      },
      body: formData
    });


    if (response.ok) {
      const result = await response.json();
      return result.url;
    } else {
      const errorText = await response.text();
      console.error('Failed to upload QR code:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('Error uploading QR code:', error);
    throw error; // Propagate error so savePaymentSettings can show it to user
  }
}

// Validate UPI ID format
function validateUpiId(upiId) {
  // Basic UPI ID format: username@bank
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
  return upiPattern.test(upiId);
}


// Download payment report
function downloadPaymentReport() {
  alert('Payment report download functionality will be implemented with backend integration');
}

// Export functions
window.loadPayments = loadPayments;
window.filterPayments = filterPayments;
window.loadPaymentChart = loadPaymentChart;
window.openAddPaymentModal = openAddPaymentModal;
window.closeAddPaymentModal = closeAddPaymentModal;
window.handleAddPayment = handleAddPayment;
window.markAsPaid = markAsPaid;
window.viewReceipt = viewReceipt;
window.closeReceiptModal = closeReceiptModal;
window.printReceipt = printReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.downloadPaymentReport = downloadPaymentReport;

