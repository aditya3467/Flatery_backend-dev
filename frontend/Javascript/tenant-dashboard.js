// Tenant Dashboard JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize navigation
    setupNavigation();
    
    // Load tenant data
    await loadTenantProfile();
    await loadDashboardData();
});

// Setup sidebar navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const sectionId = this.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Load section-specific data
                loadSectionData(this.getAttribute('data-section'));
            }
        });
    });
}

// Load tenant profile
async function loadTenantProfile() {
    try {
        const userData = await apiService.getCurrentUser();
        const tenantData = await apiService.getCurrentTenantSummary();
        
        console.log('Loading tenant profile with data:', { userData, tenantData });
        
        // Update user name
        document.getElementById('tenantUserName').textContent = userData.fullName || userData.username;
        
        // Update property name in sidebar using data already in tenantData
        if (tenantData.propertyName) {
            document.getElementById('tenantPropertyName').textContent = tenantData.propertyName;
            document.getElementById('tenantRoomInfo').textContent = 
                `${tenantData.propertyCity || ''} • Room ${tenantData.flatRoomNumber || 'N/A'}${tenantData.bedIndex ? ', Bed ' + tenantData.bedIndex : ''}`;
        }
    } catch (error) {
        console.error('Error loading tenant profile:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get tenant's active stay info (includes owner and property details)
        let tenantData;
        
        try {
            // Use the comprehensive property API for all tenant data - MANDATORY
            console.log('🔄 Calling API: /api/tenants/me/property');
            const propertyDetails = await apiService.getTenantPropertyDetails();
            console.log('🔍 Main Dashboard - Raw API Response:', propertyDetails);
            console.log('🔍 API Response Type:', typeof propertyDetails);
            console.log('🔍 rentDueDate from API:', propertyDetails?.rentDueDate, typeof propertyDetails?.rentDueDate);
            
            if (!propertyDetails) {
                throw new Error('API returned null/undefined data');
            }
            
            if (propertyDetails.rentDueDate === undefined || propertyDetails.rentDueDate === null) {
                console.error('❌ CRITICAL: rentDueDate is missing from API response!');
                console.error('Available fields:', Object.keys(propertyDetails));
                throw new Error('rentDueDate field is missing from API response');
            }
            
            // Convert to the expected tenantData format
            tenantData = {
                propertyId: propertyDetails.propertyId,
                propertyName: propertyDetails.propertyName,
                propertyCity: propertyDetails.city,
                tenantName: 'Current Tenant', // We don't have tenant name in the API yet
                rentAmount: propertyDetails.rentAmount,
                securityDeposit: propertyDetails.securityDeposit,
                rentDueDate: propertyDetails.rentDueDate, // This MUST come from API
                flatRoomNumber: propertyDetails.unitCode,
                unitId: propertyDetails.unitId,
                bedIndex: null,
                floorId: propertyDetails.floorId,
                leaseStartDate: propertyDetails.leaseStartDate,
                leaseEndDate: propertyDetails.leaseEndDate,
                phoneNumber: propertyDetails.ownerPhone,
                status: propertyDetails.tenantStatus,
                ownerName: propertyDetails.ownerName,
                ownerPhone: propertyDetails.ownerPhone
            };
            
            console.log('✅ Main Dashboard - Final tenant data with rentDueDate:', tenantData.rentDueDate);
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR: Failed to load tenant data from API:', error);
            showError('Failed to load tenant information. Please ensure you are logged in and the backend is running.');
            return; // Stop execution - don't use mock data
        }
        
        if (!tenantData.propertyId) {
            showNoActiveStay();
            return;
        }
        
        // Get unit name from tenant's unit endpoint (works for PG)
        let unitName = tenantData.flatRoomNumber || 'N/A'; // fallback for flats
        if (tenantData.unitId) {
            try {
                const unit = await apiService.getTenantUnit();
                if (unit && unit.code) {
                    unitName = unit.code;
                    console.log('Loaded unit from API:', unitName);
                }
            } catch (error) {
                console.warn('Failed to load unit details, using fallback:', error);
                unitName = tenantData.flatRoomNumber || `Unit ${tenantData.unitId}`;
            }
        }
        console.log('Final unit name:', unitName);
        
        // Update sidebar property info
        const propertyName = tenantData.propertyName || 'Property Name';
        const propertyCity = tenantData.propertyCity || 'City';
        document.getElementById('tenantPropertyName').textContent = propertyName;
        document.getElementById('tenantRoomInfo').textContent = propertyCity;
        
        // Update property header
        document.getElementById('propertyHeaderTitle').textContent = propertyName;
        
        // Update room/bed details
        const roomBed = `${unitName}${tenantData.bedIndex ? ', Bed ' + tenantData.bedIndex : ''}`;
        document.getElementById('roomBedDetail').textContent = roomBed;
        
        // Update property type - can be fetched from property API if needed
        let pgType = 'PG';
        document.getElementById('propertyType').textContent = pgType;
        
        // Update floor number
        document.getElementById('floorNumber').textContent = tenantData.floorId || '1';
        
        // Update owner details from tenancy data
        const ownerName = tenantData.ownerName || 'Property Owner';
        const ownerContact = tenantData.ownerPhone || '9876543210';
        document.getElementById('ownerNameDetail').textContent = ownerName;
        document.getElementById('ownerContactDetail').textContent = ownerContact;
        
        // Update stay period
        const startDate = tenantData.leaseStartDate || new Date().toISOString().split('T')[0];
        const endDate = tenantData.leaseEndDate;
        
        // If tenancy is active, show as "ongoing"
        // If tenancy is not active, show the actual end date
        let stayPeriodText;
        if (tenantData.status && tenantData.status.toLowerCase() === 'active') {
            stayPeriodText = `${formatDateShort(startDate)} – ongoing`;
        } else {
            stayPeriodText = `${formatDateShort(startDate)} – ${endDate ? formatDateShort(endDate) : 'Ongoing'}`;
        }
        document.getElementById('stayPeriodDetail').textContent = stayPeriodText;
        
        // Update deposit
        document.getElementById('depositDetail').textContent = `₹${formatNumber(tenantData.securityDeposit || 0)}`;
        
        // Update summary cards
        document.getElementById('rentAmount').textContent = `₹${formatNumber(tenantData.rentAmount || 0)}`;
        
        // Show consistent due day (not next calculated date)
        const dueDay = tenantData.rentDueDate || 1;
        console.log('🚨 MAIN DASHBOARD - DUE DAY FROM API:', dueDay);
        console.log('🚨 MAIN DASHBOARD - FULL TENANT DATA:', tenantData);
        
        const suffix = getDaySuffix(dueDay);
        document.getElementById('dueDate').textContent = `${dueDay}${suffix}`;
        document.getElementById('dueDateMonth').textContent = 'Every Month';
        
        // Update rent status badge
        const rentStatus = calculateRentStatus(tenantData);
        const statusBadge = document.getElementById('rentStatus');
        statusBadge.textContent = rentStatus === 'Paid' ? '✅ ' + rentStatus : 
                                  rentStatus === 'Pending' ? '🟡 ' + rentStatus : 
                                  '🔴 ' + rentStatus;
        statusBadge.className = `rent-status-badge ${rentStatus.toLowerCase()}`;
        
        // Update stay progress
        const monthsStayed = calculateMonthsStayed(startDate);
        const totalMonths = calculateTotalMonths(startDate, endDate);
        const progressPercent = totalMonths > 0 ? Math.round((monthsStayed / totalMonths) * 100) : 0;
        document.getElementById('stayProgress').textContent = `${progressPercent}%`;
        
        // Generate timeline segments
        generateTimeline(startDate, endDate, monthsStayed);
        
        // Calculate next due date for timeline
        const nextDueDate = calculateNextRentDue(tenantData.rentDueDate);
        
        // Update timeline label
        document.getElementById('timelineLabel').textContent = 
            `${monthsStayed} / ${totalMonths} months rent paid • Next due: ${nextDueDate}`;
        
        // Update countdown
        const daysUntil = calculateDaysUntilDue(tenantData.rentDueDate);
        document.getElementById('nextRentCountdown').textContent = 
            `⏰ Next rent due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
        // Set default values on error
        document.getElementById('propertyHeaderTitle').textContent = 'Unable to Load';
        document.getElementById('roomBedDetail').textContent = 'N/A';
        document.getElementById('propertyType').textContent = 'N/A';
        document.getElementById('floorNumber').textContent = '-';
        document.getElementById('ownerNameDetail').textContent = 'N/A';
        document.getElementById('ownerContactDetail').textContent = 'N/A';
    }
}

// Generate timeline segments
function generateTimeline(startDate, endDate, monthsPaid) {
    const container = document.getElementById('timelineSegments');
    if (!container) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.setMonth(start.getMonth() + 6));
    
    const totalMonths = calculateTotalMonths(startDate, endDate);
    const segments = [];
    
    const startMonth = new Date(startDate).getMonth();
    const startYear = new Date(startDate).getFullYear();
    
    for (let i = 0; i < totalMonths; i++) {
        const monthIndex = (startMonth + i) % 12;
        const monthName = months[monthIndex];
        
        let status = 'upcoming';
        let icon = '🔲';
        
        if (i < monthsPaid) {
            status = 'paid';
            icon = '✅';
        } else if (i === monthsPaid) {
            status = 'pending';
            icon = '🟡';
        }
        
        segments.push(`
            <div class="timeline-segment ${status}" title="${monthName} - ${status}">
                <div class="month-label">${monthName}</div>
                <div class="status-icon">${icon}</div>
            </div>
        `);
    }
    
    container.innerHTML = segments.join('');
}

// Parse due date into day and month
function parseDueDate(dateStr) {
    try {
        const date = new Date(dateStr);
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        return { day: `${day}${getOrdinalSuffix(day)}`, month: month };
    } catch (e) {
        return { day: '-', month: '-' };
    }
}

// Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}

// Format date in short format (Aug 2025)
function formatDateShort(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
        const date = new Date(dateStr);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
        return 'N/A';
    }
}

// Calculate months stayed
function calculateMonthsStayed(startDate) {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    const months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    return Math.max(0, months);
}

// Calculate total months
function calculateTotalMonths(startDate, endDate) {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.setMonth(start.getMonth() + 6)); // Default 6 months if no end date
    const months = (end.getFullYear() - new Date(startDate).getFullYear()) * 12 + (end.getMonth() - new Date(startDate).getMonth());
    return Math.max(1, months);
}

// Load section-specific data
async function loadSectionData(section) {
    switch(section) {
        case 'rent-payments':
            await loadRentPaymentsData();
            break;
        case 'documents':
            await loadDocumentsData();
            break;
        case 'complaints':
            await loadComplaintsData();
            break;
        case 'announcements':
            await loadAnnouncementsData();
            break;
        case 'stay-info':
            await loadStayInformation();
            break;
        case 'past-stays':
            await loadPastStaysData();
            break;
    }
}

// Load rent and payments data
async function loadRentPaymentsData() {
    // Use our comprehensive rent payments loader
    await loadRentPayments();
}

// Load documents data
async function loadDocumentsData() {
    // Mock receipts
    const receiptsGrid = document.getElementById('receiptsGrid');
    receiptsGrid.innerHTML = `
        <div class="document-card" onclick="handleDownloadReceipt()">
            <i class="fas fa-file-pdf"></i>
            <h3>October 2025</h3>
            <p>Rent Receipt</p>
            <button class="btn-download"><i class="fas fa-download"></i> Download</button>
        </div>
    `;
    
    // Mock documents
    const documentsGrid = document.getElementById('documentsGrid');
    const mockDocuments = [
        { icon: 'fa-id-card', title: 'ID Proof', file: 'Aadhaar.pdf' },
        { icon: 'fa-file-contract', title: 'Rent Agreement', file: 'Agreement.pdf' },
        { icon: 'fa-shield-alt', title: 'Police Verification', file: 'Verification.pdf' }
    ];
    
    documentsGrid.innerHTML = mockDocuments.map(doc => `
        <div class="document-card">
            <i class="fas ${doc.icon}"></i>
            <h3>${doc.title}</h3>
            <p>${doc.file}</p>
            <button class="btn-download" onclick="handleDownloadDocument('${doc.file}')">
                <i class="fas fa-download"></i> Download
            </button>
        </div>
    `).join('');
}

// Load complaints data
async function loadComplaintsData() {
    // Use our enhanced complaints loader
    await loadComplaints();
}

// Load announcements data
async function loadAnnouncementsData() {
    const container = document.getElementById('announcementsContainer');
    
    // Mock announcements
    const mockAnnouncements = [
        { 
            title: 'Water Maintenance Schedule', 
            content: 'Water maintenance on 8th Nov (10 AM–4 PM). Please store water in advance.',
            date: '06-Nov-2025'
        },
        { 
            title: 'WiFi Password Updated', 
            content: 'WiFi password has been updated to: Flatery@123',
            date: '05-Nov-2025'
        },
        { 
            title: 'Rent Deadline Extension', 
            content: 'Rent deadline extended due to Diwali holiday. New deadline: 5th Nov',
            date: '01-Nov-2025'
        }
    ];
    
    container.innerHTML = mockAnnouncements.map(announcement => `
        <div class="announcement-card">
            <div class="announcement-header">
                <h3><i class="fas fa-bullhorn"></i> ${announcement.title}</h3>
                <span class="announcement-date">${announcement.date}</span>
            </div>
            <div class="announcement-content">
                <p>${announcement.content}</p>
            </div>
        </div>
    `).join('');
}

// Load stay info data
async function loadStayInfoData() {
    try {
        const tenantData = await apiService.getCurrentTenantSummary();
        
        if (tenantData.propertyId) {
            const property = await apiService.getProperty(tenantData.propertyId);
            
            document.getElementById('stayInfoProperty').textContent = property.name || 'N/A';
            document.getElementById('stayInfoAddress').textContent = `${property.location}, ${property.city}` || 'N/A';
            document.getElementById('stayInfoRoom').textContent = tenantData.flatRoomNumber || 'N/A';
            document.getElementById('stayInfoBed').textContent = tenantData.bedIndex || 'N/A';
            document.getElementById('stayInfoCheckin').textContent = formatDate(tenantData.leaseStartDate) || 'N/A';
            document.getElementById('stayInfoCheckout').textContent = tenantData.leaseEndDate ? formatDate(tenantData.leaseEndDate) : 'Ongoing';
            document.getElementById('stayInfoDeposit').textContent = `₹${formatNumber(tenantData.securityDeposit || 0)}`;
            document.getElementById('stayInfoOwner').textContent = 'Owner Name'; // Placeholder
            document.getElementById('stayInfoOwnerContact').textContent = 'Contact'; // Placeholder
            
            // Mock rules
            const rulesList = document.getElementById('propertyRulesList');
            const mockRules = [
                'Quiet hours: 10 PM – 6 AM',
                'Visitors not allowed after 8 PM',
                'No smoking inside the property',
                'Keep common areas clean'
            ];
            
            rulesList.innerHTML = mockRules.map(rule => `<p><i class="fas fa-check-circle" style="color: #007bff; margin-right: 0.5rem;"></i>${rule}</p>`).join('');
        }
    } catch (error) {
        console.error('Error loading stay info:', error);
    }
}

// Load past stays data
async function loadPastStaysData() {
    const grid = document.getElementById('pastStaysGrid');
    
    // Mock past stays
    const mockStays = [
        { property: 'Urban Nest PG', period: 'Jan – Mar 2025', status: 'completed' },
        { property: 'Classic Stay PG', period: 'Jul – Sep 2024', status: 'completed' }
    ];
    
    grid.innerHTML = mockStays.map(stay => `
        <div class="past-stay-card">
            <div class="stay-image">
                <i class="fas fa-building"></i>
            </div>
            <div class="stay-content">
                <h3>${stay.property}</h3>
                <p>Stay Period: ${stay.period}</p>
                <span class="status-badge ${stay.status}">${capitalizeFirst(stay.status)}</span>
            </div>
            <button class="btn-view-details" onclick="handleViewPastStay('${stay.property}')">
                View Details
            </button>
        </div>
    `).join('');
}

// Helper functions
function calculateRentStatus(tenantData) {
    // Simple logic - needs backend support for actual status
    const today = new Date();
    const dueDay = tenantData.rentDueDate || 1;
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (today > dueDate) {
        return 'Overdue';
    } else if (today.getDate() >= dueDay - 3) {
        return 'Pending';
    }
    return 'Paid';
}

function calculateNextRentDue(rentDueDate) {
    const today = new Date();
    const dueDay = rentDueDate || 1;
    let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (today.getDate() >= dueDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    return formatDate(dueDate.toISOString().split('T')[0]);
}

function calculateDaysUntilDue(rentDueDate) {
    const today = new Date();
    const dueDay = rentDueDate || 1;
    let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (today.getDate() >= dueDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateRentProgress(tenantData) {
    const today = new Date();
    const dueDay = tenantData.rentDueDate || 1;
    const lastDueDate = new Date(today.getFullYear(), today.getMonth() - 1, dueDay);
    const nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    if (today.getDate() >= dueDay) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
    
    const totalDays = (nextDueDate - lastDueDate) / (1000 * 60 * 60 * 24);
    const daysPassed = (today - lastDueDate) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNoActiveStay() {
    document.querySelector('.active-stay-card').innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <i class="fas fa-home fa-4x" style="color: #ccc; margin-bottom: 1rem;"></i>
            <h2>No Active Stay</h2>
            <p style="color: #666;">You don't have any active tenancy at the moment.</p>
        </div>
    `;
}

function showError(message) {
    console.error(message);
    // You can add a toast notification here
}

// Action handlers
function handlePayRent() {
    alert('Payment gateway integration coming soon!');
}

function handleUploadProof() {
    alert('Payment proof upload functionality coming soon!');
}

function handleRaiseComplaint() {
    alert('Complaint submission form coming soon!');
}

function handlePayViaGateway() {
    alert('Payment gateway integration coming soon!');
}

function handleShowQR() {
    alert('QR code display coming soon!');
}

function handleDownloadReceipt() {
    alert('Receipt download functionality coming soon!');
}

function handleUploadDocument() {
    alert('Document upload functionality coming soon!');
}

function handleDownloadDocument(fileName) {
    alert(`Download ${fileName} - functionality coming soon!`);
}

function handleViewComplaint(id) {
    alert(`View complaint ${id} - functionality coming soon!`);
}

function handleViewPastStay(property) {
    alert(`View past stay at ${property} - functionality coming soon!`);
}

function handleViewReceipts() {
    // Navigate to documents section
    const documentsNavItem = document.querySelector('[data-section="documents"]');
    if (documentsNavItem) {
        documentsNavItem.click();
    }
}

// =============================================
// STAY INFORMATION PAGE FUNCTIONS
// =============================================

// Load stay information data
async function loadStayInformation() {
    try {
        console.log('Loading stay information...');
        
        // Use the new comprehensive property endpoint for ALL data
        const propertyDetails = await apiService.getTenantPropertyDetails();
        console.log('🚨 STAY INFO - Property details received:', propertyDetails);
        console.log('🚨 STAY INFO - DUE DAY FROM API:', propertyDetails?.rentDueDate);
        
        // Load all sections with the comprehensive data
        await loadPropertyInformation(propertyDetails);
        await loadRoomDetails(propertyDetails, propertyDetails);
        await loadOwnerInformation(propertyDetails);
        await loadStayDuration(propertyDetails);
        await loadAmenities(propertyDetails.amenities);
        await loadPropertyRules(propertyDetails.rules);
        
        console.log('Stay information loaded successfully');
    } catch (error) {
        console.error('Error loading stay information:', error);
        showNotification('Failed to load stay information', 'error');
    }
}

// Load property information card
async function loadPropertyInformation(propertyDetails) {
    try {
        document.getElementById('propertyName').textContent = propertyDetails.propertyName || 'N/A';
        document.getElementById('propertyAddress').textContent = `${propertyDetails.address || ''} ${propertyDetails.city || ''}`.trim() || 'N/A';
        document.getElementById('propertyType').textContent = propertyDetails.propertyType || 'PG';
        document.getElementById('totalFloors').textContent = propertyDetails.totalFloors || 'N/A';
        
        console.log('Property information loaded from comprehensive data:', {
            name: propertyDetails.propertyName,
            address: propertyDetails.address,
            city: propertyDetails.city,
            type: propertyDetails.propertyType,
            floors: propertyDetails.totalFloors
        });
    } catch (error) {
        console.error('Error loading property information:', error);
        // Fallback values
        document.getElementById('propertyName').textContent = 'N/A';
        document.getElementById('propertyAddress').textContent = 'N/A';
        document.getElementById('propertyType').textContent = 'N/A';
        document.getElementById('totalFloors').textContent = 'N/A';
    }
}

// Load room details card
async function loadRoomDetails(tenantData, propertyDetails) {
    try {
        document.getElementById('roomNumber').textContent = propertyDetails.unitCode || tenantData.flatRoomNumber || 'N/A';
        document.getElementById('bedNumber').textContent = tenantData.bedIndex || 'N/A';
        document.getElementById('floorName').textContent = propertyDetails.floorName || `Floor ${propertyDetails.floorNumber || tenantData.floorId || 'N/A'}`;
        document.getElementById('sharingType').textContent = propertyDetails.unitType || 'N/A';
        document.getElementById('monthlyRent').textContent = `₹${tenantData.rentAmount || 0}`;
        
        // Handle rent due date - it's a day of month (1-31), not a full date
        const dueDay = tenantData.rentDueDate;
        console.log('🚨 ROOM DETAILS - DUE DAY FROM tenantData:', dueDay, typeof dueDay);
        if (dueDay && dueDay >= 1 && dueDay <= 31) {
            const suffix = getDaySuffix(dueDay);
            document.getElementById('rentDueDate').textContent = `${dueDay}${suffix} of every month`;
            document.getElementById('paymentCycle').textContent = `Monthly (${dueDay}${suffix})`;
        } else {
            console.error('🚨 ROOM DETAILS - Invalid dueDay, using default');
            document.getElementById('rentDueDate').textContent = '1st of every month'; // Default
            document.getElementById('paymentCycle').textContent = 'Monthly (1st)';
        }
        
        console.log('Room details loaded:', {
            unitCode: propertyDetails.unitCode,
            bedIndex: tenantData.bedIndex,
            floorName: propertyDetails.floorName,
            unitType: propertyDetails.unitType,
            dueDay: dueDay
        });
    } catch (error) {
        console.error('Error loading room details:', error);
    }
}

// Load owner information card
async function loadOwnerInformation(propertyDetails) {
    try {
        document.getElementById('ownerName').textContent = propertyDetails.ownerName || 'N/A';
        document.getElementById('ownerPhone').textContent = propertyDetails.ownerPhone || 'N/A';
        document.getElementById('ownerEmail').textContent = propertyDetails.ownerEmail || 'Not provided';
        
        // Set owner avatar initial
        const ownerAvatar = document.getElementById('ownerAvatar');
        if (propertyDetails.ownerName) {
            ownerAvatar.innerHTML = propertyDetails.ownerName.charAt(0).toUpperCase();
        }
        
        console.log('Owner information loaded:', {
            name: propertyDetails.ownerName,
            phone: propertyDetails.ownerPhone,
            email: propertyDetails.ownerEmail
        });
    } catch (error) {
        console.error('Error loading owner information:', error);
    }
}

// Load stay duration and progress
async function loadStayDuration(propertyDetails) {
    try {
        const checkinDate = new Date(propertyDetails.leaseStartDate);
        const today = new Date();
        const checkoutDate = propertyDetails.checkoutDate ? new Date(propertyDetails.checkoutDate) : null;
        
        document.getElementById('checkinDate').textContent = formatDate(propertyDetails.leaseStartDate);
        document.getElementById('checkoutDate').textContent = checkoutDate ? formatDate(checkoutDate) : 'Ongoing';
        document.getElementById('depositAmount').textContent = `₹${propertyDetails.securityDeposit || 0}`;
        
        // Update rent cycle to match due date
        const dueDay = propertyDetails.rentDueDate || 1;
        console.log('🚨 STAY DURATION - DUE DAY FROM propertyDetails:', dueDay, typeof dueDay);
        const suffix = getDaySuffix(dueDay);
        document.getElementById('rentCycle').textContent = `Monthly (Due every ${dueDay}${suffix})`;
        
        // Set deposit status
        const depositStatus = document.getElementById('depositStatus');
        depositStatus.textContent = 'Paid'; // Assuming paid for now
        depositStatus.className = 'deposit-status paid';
        
        // Calculate stay progress if checkout date is available
        if (checkoutDate) {
            const totalDuration = checkoutDate.getTime() - checkinDate.getTime();
            const elapsedDuration = today.getTime() - checkinDate.getTime();
            const progress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
            
            document.getElementById('stayProgressFill').style.width = `${progress}%`;
            document.getElementById('stayProgressText').textContent = `${Math.round(progress)}%`;
        } else {
            // For ongoing stays, calculate months stayed
            const monthsStayed = calculateMonthsStayed(checkinDate, today);
            document.getElementById('stayProgressFill').style.width = '100%';
            document.getElementById('stayProgressText').textContent = `${monthsStayed} months`;
        }
    } catch (error) {
        console.error('Error loading stay duration:', error);
    }
}

// Load amenities using comprehensive data
async function loadAmenities(amenities) {
    try {
        if (amenities && amenities.length > 0) {
            // Update both amenities grids
            updateAmenitiesGrid('amenitiesGrid', amenities.slice(0, 3)); // First 3 for property card
            updateAmenitiesGrid('fullAmenitiesGrid', amenities); // All for full section
            console.log('Amenities loaded from comprehensive data:', amenities);
        } else {
            // Fallback to default amenities
            const defaultAmenities = [
                { name: 'WiFi', icon: 'fas fa-wifi' },
                { name: 'Laundry', icon: 'fas fa-tshirt' },
                { name: 'Kitchen', icon: 'fas fa-utensils' },
                { name: 'Hot Water', icon: 'fas fa-shower' },
                { name: 'Daily Cleaning', icon: 'fas fa-broom' }
            ];
            
            updateAmenitiesGrid('amenitiesGrid', defaultAmenities.slice(0, 3));
            updateAmenitiesGrid('fullAmenitiesGrid', defaultAmenities);
            console.log('Default amenities loaded');
        }
    } catch (error) {
        console.error('Error loading amenities:', error);
    }
}

// Load property rules
async function loadPropertyRules(rules) {
    try {
        const rulesList = document.getElementById('propertyRulesList');
        if (rules && rules.length > 0) {
            rulesList.innerHTML = rules.map(rule => `<li>${rule}</li>`).join('');
            console.log('Property rules loaded:', rules);
        } else {
            // Keep default rules
            console.log('Using default property rules');
        }
    } catch (error) {
        console.error('Error loading property rules:', error);
    }
}

// Update amenities grid
function updateAmenitiesGrid(gridId, amenities) {
    const grid = document.getElementById(gridId);
    if (!grid || !amenities?.length) return;
    
    grid.innerHTML = amenities.map(amenity => `
        <div class="amenity-chip">
            <i class="${amenity.icon || getAmenityIcon(amenity.name)}"></i>
            <span>${amenity.name}</span>
        </div>
    `).join('');
}

// Get appropriate icon for amenity
function getAmenityIcon(amenityName) {
    const iconMap = {
        'wifi': 'fas fa-wifi',
        'laundry': 'fas fa-tshirt',
        'kitchen': 'fas fa-utensils',
        'hot water': 'fas fa-shower',
        'cleaning': 'fas fa-broom',
        'parking': 'fas fa-car',
        'security': 'fas fa-shield-alt',
        'gym': 'fas fa-dumbbell',
        'food': 'fas fa-utensils',
        'ac': 'fas fa-snowflake'
    };
    
    const key = amenityName?.toLowerCase();
    return iconMap[key] || 'fas fa-check';
}

// Stay information interaction functions
function makeCall() {
    const phoneNumber = document.getElementById('ownerPhone').textContent;
    if (phoneNumber && phoneNumber !== 'N/A') {
        window.open(`tel:${phoneNumber}`);
    }
}

function sendEmail() {
    const email = document.getElementById('ownerEmail').textContent;
    if (email && email !== 'Not provided') {
        window.open(`mailto:${email}`);
    }
}

function downloadRules() {
    alert('Rules PDF download - functionality coming soon!');
}

function acknowledgeRules() {
    alert('Rules acknowledgment - functionality coming soon!');
}

function downloadDocument(docType) {
    alert(`Download ${docType} document - functionality coming soon!`);
}

// =============================================
// END STAY INFORMATION FUNCTIONS
// =============================================

// Helper function to get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// ============================================
// RENT & PAYMENTS FUNCTIONALITY
// ============================================

// Load rent and payments section data
async function loadRentPayments() {
    try {
        // Fetch real data from the comprehensive property API
        const propertyDetails = await apiService.getTenantPropertyDetails();
        
        console.log('🔍 Raw API Response:', propertyDetails);
        console.log('🔍 Property Details Keys:', Object.keys(propertyDetails || {}));
        console.log('🔍 Rent Amount:', propertyDetails?.rentAmount);
        console.log('🔍 Security Deposit:', propertyDetails?.securityDeposit);
        console.log('🔍 Rent Due Date:', propertyDetails?.rentDueDate);
        console.log('🔍 Owner Name:', propertyDetails?.ownerName);
        
        if (!propertyDetails) {
            throw new Error('Failed to fetch tenant property details');
        }

        const rentData = {
            currentMonth: getCurrentMonthYear(),
            monthlyRent: propertyDetails.rentAmount || propertyDetails.monthlyRent || 0,
            rentDueDate: propertyDetails.rentDueDate || propertyDetails.dueDate || 1,
            currentStatus: 'pending', // Will be determined by payment/transaction API later
            lateFeePolicy: '₹100/day after due date', // Hardcoded for now, can be added to property model
            paymentMode: 'UPI / Manual',
            securityDeposit: propertyDetails.securityDeposit || propertyDetails.deposit || 0,
            depositStatus: 'paid', // Assuming paid for now
            ownerName: propertyDetails.ownerName || 'Property Owner'
        };

        console.log('🔍 Processed Rent Data:', rentData);

        // Store owner name globally for QR modal
        window.currentOwnerName = rentData.ownerName;

        // Calculate next due date based on actual rent due date
        const nextDueDate = calculateNextRentDue(rentData.rentDueDate);

        // Update current month rent summary
        document.getElementById('currentMonth').textContent = rentData.currentMonth;
        document.getElementById('monthlyRentAmount').textContent = `₹${formatNumber(rentData.monthlyRent)}`;
        document.getElementById('nextDueDate').textContent = nextDueDate;
        document.getElementById('lateFeePolicy').textContent = rentData.lateFeePolicy;
        document.getElementById('paymentMode').textContent = rentData.paymentMode;
        document.getElementById('depositInfo').textContent = `₹${formatNumber(rentData.securityDeposit)} (${capitalizeFirst(rentData.depositStatus)})`;
        
        // Update status badge
        const statusBadge = document.getElementById('currentMonthStatus');
        statusBadge.className = `payment-status-badge ${rentData.currentStatus}`;
        statusBadge.textContent = getStatusIcon(rentData.currentStatus) + ' ' + capitalizeFirst(rentData.currentStatus);

        // Load payment history (still mock until payment API is ready)
        await loadPaymentHistory(rentData.monthlyRent);
        
        // Load analytics (still mock until payment API is ready)
        await loadRentAnalytics(rentData.monthlyRent);

        console.log('Rent payments loaded with real data:', {
            rentAmount: rentData.monthlyRent,
            dueDate: rentData.rentDueDate,
            securityDeposit: rentData.securityDeposit,
            nextDueDate: nextDueDate
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to load rent payments data:', error);
        showError('Failed to load payment information. Please ensure the backend is running and you are logged in.');
        // NO FALLBACK - Force user to fix the API issue
        throw error;
    }
}

// Get current month and year
function getCurrentMonthYear() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'verified': '✅',
        'pending': '🟡',
        'overdue': '🔴',
        'upcoming': '🔲',
        'canceled': '⚫'
    };
    return icons[status] || '🔲';
}

// Load payment history table
async function loadPaymentHistory(rentAmount = 6000) {
    try {
        // Mock data - will be replaced with payment/transaction API call
        const paymentHistory = [
            {
                month: 'Oct 2025',
                amount: rentAmount,
                mode: 'UPI',
                refId: '32498ABC',
                status: 'verified',
                hasReceipt: true
            },
            {
                month: 'Nov 2025',
                amount: rentAmount,
                mode: 'UPI',
                refId: null,
                status: 'pending',
                hasReceipt: false
            },
            {
                month: 'Dec 2025',
                amount: rentAmount,
                mode: null,
                refId: null,
                status: 'upcoming',
                hasReceipt: false
            }
        ];

        const tableBody = document.getElementById('paymentHistoryTableBody');
        tableBody.innerHTML = '';

        paymentHistory.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.month}</td>
                <td>₹${formatNumber(payment.amount)}</td>
                <td>${payment.mode || '–'}</td>
                <td>${payment.refId || '–'}</td>
                <td><span class="payment-status-badge ${payment.status}">${getStatusIcon(payment.status)} ${capitalizeFirst(payment.status)}</span></td>
                <td>${payment.hasReceipt ? '<button class="table-action-btn download" onclick="downloadReceipt(\'' + payment.month + '\')">Download</button>' : '-'}</td>
                <td>${payment.status === 'pending' ? '<button class="table-action-btn upload" onclick="handleUploadProof(\'' + payment.month + '\')">Upload Proof</button>' : '-'}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading payment history:', error);
    }
}

// Load rent analytics
async function loadRentAnalytics(rentAmount = 6000) {
    try {
        // Mock data - will be replaced with payment/transaction API call
        // Calculate analytics based on real rent amount
        const monthsStayed = 6; // This will come from payment history API
        const totalRentPaid = rentAmount * (monthsStayed - 1); // Assuming last month is current/pending
        
        const analytics = {
            totalRentPaid: totalRentPaid,
            onTimePayments: { completed: 5, total: 6 },
            lateFeesPaid: 200,
            paymentStreak: 4
        };

        document.getElementById('totalRentPaid').textContent = `₹${formatNumber(analytics.totalRentPaid)}`;
        document.getElementById('onTimePayments').textContent = `${analytics.onTimePayments.completed} / ${analytics.onTimePayments.total}`;
        document.getElementById('lateFeesPaid').textContent = `₹${formatNumber(analytics.lateFeesPaid)}`;
        document.getElementById('paymentStreak').textContent = `🔥 ${analytics.paymentStreak} Months`;

    } catch (error) {
        console.error('Error loading rent analytics:', error);
    }
}

// ============================================
// PAYMENT ACTIONS
// ============================================

// Handle Pay via Gateway
function handlePayViaGateway() {
    // Mock Razorpay integration - will be implemented with actual payment gateway
    alert('🚧 Payment Gateway Integration\n\nThis will redirect to Razorpay/Cashfree checkout for secure payment processing.');
    
    // Real implementation would be:
    // const options = {
    //     amount: 600000, // amount in paise
    //     currency: 'INR',
    //     name: 'Flatery - Rent Payment',
    //     description: 'Monthly Rent Payment',
    //     handler: function(response) {
    //         // Handle successful payment
    //         handlePaymentSuccess(response);
    //     }
    // };
    // const rzp = new Razorpay(options);
    // rzp.open();
}

// Handle Upload Proof
function handleUploadProof(month = null) {
    // Set the month if specified
    if (month) {
        document.getElementById('paymentProofForm').dataset.month = month;
    }
    
    // Get the current rent amount from the DOM and pre-fill
    const rentAmountText = document.getElementById('monthlyRentAmount').textContent;
    const rentAmount = parseInt(rentAmountText.replace(/[₹,]/g, '')) || 6000;
    document.getElementById('paidAmount').value = rentAmount;
    
    // Pre-fill current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;
    
    // Show modal
    document.getElementById('paymentProofModal').style.display = 'flex';
}

// Handle View QR Code
async function handleViewQRCode() {
    try {
        // Get the current rent amount from the DOM
        const rentAmountText = document.getElementById('monthlyRentAmount').textContent;
        const rentAmount = parseInt(rentAmountText.replace(/[₹,]/g, '')) || 6000;
        
        // In the future, this will fetch owner payment details from API
        // const ownerPaymentInfo = await apiService.getOwnerPaymentInfo();
        
        // Mock QR data - will be fetched from API
        const qrData = {
            upiId: 'owner@paytm',
            ownerName: window.currentOwnerName || 'Property Owner',
            qrImageUrl: 'https://via.placeholder.com/200x200/7A7AFF/FFFFFF?text=QR+CODE',
            rentAmount: rentAmount
        };

        document.getElementById('ownerUpiId').textContent = qrData.upiId;
        document.getElementById('ownerPaymentName').textContent = qrData.ownerName;
        document.getElementById('qrRentAmount').textContent = `₹${formatNumber(qrData.rentAmount)}`;
        document.getElementById('qrAmountHint').textContent = formatNumber(qrData.rentAmount);
        document.getElementById('ownerQRCode').src = qrData.qrImageUrl;

        document.getElementById('qrCodeModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading QR code data:', error);
        showError('Failed to load payment QR code');
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('paymentProofModal').style.display = 'none';
    document.getElementById('paymentProofForm').reset();
}

// Close QR Modal
function closeQRModal() {
    document.getElementById('qrCodeModal').style.display = 'none';
}

// Handle Payment Proof Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('paymentProofForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const month = form.dataset.month || getCurrentMonthYear();
            
            try {
                // Show loading state
                const submitBtn = form.querySelector('.payment-modal-btn.submit');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = '⏳ Uploading...';
                submitBtn.disabled = true;

                // Mock API call - replace with actual implementation
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Success
                showSuccess('Payment proof uploaded successfully! Your payment is now pending verification.');
                closePaymentModal();
                
                // Refresh payment history
                await loadPaymentHistory();

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

            } catch (error) {
                console.error('Error uploading payment proof:', error);
                showError('Failed to upload payment proof. Please try again.');
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showSuccess(`Copied "${text}" to clipboard!`);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showError('Failed to copy to clipboard');
    });
}

// Download receipt
function downloadReceipt(month) {
    // Mock download - replace with actual implementation
    alert(`🧾 Downloading receipt for ${month}\n\nThis will download the official rent receipt PDF.`);
    
    // Real implementation would be:
    // window.open(`/api/receipts/download?month=${encodeURIComponent(month)}`, '_blank');
}

// ============================================
// PAYMENT FILTERS AND SEARCH
// ============================================

// Initialize payment filters
function initializePaymentFilters() {
    const monthFilter = document.getElementById('monthFilter');
    const statusFilter = document.getElementById('statusFilterPayment');
    const searchInput = document.getElementById('paymentSearch');

    // Add event listeners
    monthFilter.addEventListener('change', filterPaymentHistory);
    statusFilter.addEventListener('change', filterPaymentHistory);
    searchInput.addEventListener('input', filterPaymentHistory);
}

// Filter payment history
function filterPaymentHistory() {
    const monthFilter = document.getElementById('monthFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilterPayment').value.toLowerCase();
    const searchTerm = document.getElementById('paymentSearch').value.toLowerCase();
    
    const tableRows = document.querySelectorAll('#paymentHistoryTableBody tr');
    
    tableRows.forEach(row => {
        const month = row.cells[0].textContent.toLowerCase();
        const status = row.cells[4].textContent.toLowerCase();
        const allText = row.textContent.toLowerCase();
        
        const monthMatch = !monthFilter || month.includes(monthFilter);
        const statusMatch = !statusFilter || status.includes(statusFilter);
        const searchMatch = !searchTerm || allText.includes(searchTerm);
        
        row.style.display = monthMatch && statusMatch && searchMatch ? '' : 'none';
    });
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('payment-modal')) {
        if (e.target.id === 'paymentProofModal') {
            closePaymentModal();
        } else if (e.target.id === 'qrCodeModal') {
            closeQRModal();
        }
    }
});

// Initialize payment filters when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentFilters();
    initializeMobileNavigation();
});

// =============================================
// MOBILE NAVIGATION FUNCTIONALITY
// =============================================

function initializeMobileNavigation() {
    const mobileToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.config-sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    if (!mobileToggle || !sidebar || !overlay) {
        return;
    }
    
    mobileToggle.addEventListener('click', function() {
        const isOpen = sidebar.classList.contains('mobile-open');
        if (isOpen) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    });
    
    overlay.addEventListener('click', closeMobileNav);
    
    // Close on navigation item click (mobile)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(closeMobileNav, 150);
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileNav();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMobileNav();
        }
    });
}

function openMobileNav() {
    const sidebar = document.querySelector('.config-sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const navIcon = document.getElementById('navToggleIcon');
    
    if (sidebar && overlay && navIcon) {
        sidebar.classList.add('mobile-open');
        sidebar.classList.add('open'); // For property-config.css compatibility
        overlay.classList.add('active');
        navIcon.classList.remove('fa-bars');
        navIcon.classList.add('fa-times');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileNav() {
    const sidebar = document.querySelector('.config-sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const navIcon = document.getElementById('navToggleIcon');
    
    if (sidebar && overlay && navIcon) {
        sidebar.classList.remove('mobile-open');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        navIcon.classList.remove('fa-times');
        navIcon.classList.add('fa-bars');
        document.body.style.overflow = '';
    }
}

// =============================================
// COMPLAINTS & MAINTENANCE SECTION
// =============================================

// Mock complaints data (to be replaced with API calls later)
const mockComplaints = [
    {
        id: 112,
        category: 'Electricity',
        title: 'Fan not working',
        description: 'The ceiling fan in my room has stopped working since yesterday. It makes a strange noise when switched on.',
        status: 'In Progress',
        date: '2025-11-05',
        lastUpdated: '2025-11-08',
        attachmentUrl: null,
        ownerResponse: 'Electrician scheduled for tomorrow morning. We will have it fixed by 12 PM.',
        preferredResolutionTime: '2025-11-10'
    },
    {
        id: 113,
        category: 'Cleaning',
        title: 'Bathroom not cleaned',
        description: 'The shared bathroom on the 2nd floor hasn\'t been cleaned for 3 days. Please arrange for cleaning service.',
        status: 'Resolved',
        date: '2025-11-06',
        lastUpdated: '2025-11-07',
        attachmentUrl: 'https://example.com/bathroom-photo.jpg',
        ownerResponse: 'Cleaning done. We have scheduled daily cleaning for this area.',
        preferredResolutionTime: '2025-11-07'
    },
    {
        id: 114,
        category: 'Water',
        title: 'No supply since 7 AM',
        description: 'There has been no water supply in Room 102 since 7 AM this morning. This is affecting our daily routine.',
        status: 'Open',
        date: '2025-11-07',
        lastUpdated: '2025-11-07',
        attachmentUrl: null,
        ownerResponse: null,
        preferredResolutionTime: '2025-11-08'
    },
    {
        id: 115,
        category: 'Others',
        title: 'WiFi connection issues',
        description: 'Internet connectivity has been very poor in the common area. Speed is extremely slow.',
        status: 'Resolved',
        date: '2025-11-03',
        lastUpdated: '2025-11-06',
        attachmentUrl: null,
        ownerResponse: 'Router has been replaced with a higher capacity one. Internet should work fine now.',
        preferredResolutionTime: '2025-11-05'
    },
    {
        id: 111,
        category: 'Cleaning',
        title: 'Kitchen area maintenance',
        description: 'Kitchen exhaust fan needs cleaning and the sink tap is leaking.',
        status: 'Resolved',
        date: '2025-11-01',
        lastUpdated: '2025-11-04',
        attachmentUrl: 'https://example.com/kitchen-photo.jpg',
        ownerResponse: 'Both issues have been fixed. Exhaust cleaned and tap replaced.',
        preferredResolutionTime: '2025-11-03'
    }
];

// Load complaints section
async function loadComplaints() {
    try {
        console.log('Loading complaints...');
        
        // For now, use mock data. Later this will be replaced with API call
        const complaints = mockComplaints;
        
        // Update analytics cards
        updateComplaintsAnalytics(complaints);
        
        // Display complaints table
        displayComplaintsTable(complaints);
        
        // Display resolved complaints
        displayResolvedComplaints(complaints);
        
        // Initialize filter functionality
        initializeComplaintFilters(complaints);
        
        console.log('Complaints loaded successfully');
    } catch (error) {
        console.error('Error loading complaints:', error);
        showError('Failed to load complaints');
    }
}

// Update analytics cards
function updateComplaintsAnalytics(complaints) {
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'Open').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    
    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');
    let avgResolutionTime = 0;
    
    if (resolvedComplaints.length > 0) {
        const totalDays = resolvedComplaints.reduce((sum, complaint) => {
            const createdDate = new Date(complaint.date);
            const resolvedDate = new Date(complaint.lastUpdated);
            const daysDiff = Math.ceil((resolvedDate - createdDate) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
        }, 0);
        avgResolutionTime = Math.round(totalDays / resolvedComplaints.length * 10) / 10; // Round to 1 decimal
    }
    
    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('openComplaints').textContent = open;
    document.getElementById('resolvedComplaints').textContent = resolved;
    document.getElementById('avgResolutionTime').textContent = avgResolutionTime;
}

// Display complaints in table
function displayComplaintsTable(complaints, statusFilter = 'all') {
    const tableBody = document.getElementById('complaintsTableBody');
    
    // Filter complaints based on status
    let filteredComplaints = complaints;
    if (statusFilter !== 'all') {
        filteredComplaints = complaints.filter(c => c.status === statusFilter);
    }
    
    if (filteredComplaints.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No complaints found</td>
            </tr>
        `;
        return;
    }
    
    // Generate table rows
    tableBody.innerHTML = filteredComplaints.map(complaint => `
        <tr>
            <td>#${complaint.id}</td>
            <td>${complaint.category}</td>
            <td>${complaint.title}</td>
            <td>${formatDate(complaint.date)}</td>
            <td>
                <span class="status-badge ${complaint.status.toLowerCase().replace(' ', '-')}">
                    ${complaint.status}
                </span>
            </td>
            <td>
                <button class="view-complaint-btn" onclick="viewComplaintDetails(${complaint.id})">
                    View
                </button>
            </td>
        </tr>
    `).join('');
    
    // Generate mobile cards for very small screens
    generateMobileComplaintCards(filteredComplaints);
}

// Generate mobile-friendly complaint cards
function generateMobileComplaintCards(complaints) {
    let mobileCardsContainer = document.querySelector('.mobile-table-cards');
    
    // Create mobile cards container if it doesn't exist
    if (!mobileCardsContainer) {
        mobileCardsContainer = document.createElement('div');
        mobileCardsContainer.className = 'mobile-table-cards';
        document.querySelector('.table-wrapper').parentNode.insertBefore(
            mobileCardsContainer, 
            document.querySelector('.table-wrapper').nextSibling
        );
    }
    
    if (complaints.length === 0) {
        mobileCardsContainer.innerHTML = '<div class="text-center">No complaints found</div>';
        return;
    }
    
    mobileCardsContainer.innerHTML = complaints.map(complaint => `
        <div class="mobile-complaint-card">
            <div class="mobile-complaint-header">
                <span class="mobile-complaint-id">#${complaint.id}</span>
                <span class="status-badge ${complaint.status.toLowerCase().replace(' ', '-')}">
                    ${complaint.status}
                </span>
            </div>
            <div class="mobile-complaint-title">${complaint.title}</div>
            <div class="mobile-complaint-meta">
                <span>${complaint.category}</span>
                <span>${formatDate(complaint.date)}</span>
            </div>
            <div class="mobile-complaint-actions">
                <button class="view-complaint-btn" onclick="viewComplaintDetails(${complaint.id})">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Display resolved complaints
function displayResolvedComplaints(complaints) {
    const resolvedList = document.getElementById('resolvedComplaintsList');
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').slice(0, 5); // Show last 5
    
    if (resolvedComplaints.length === 0) {
        resolvedList.innerHTML = '<div class="text-center">No resolved complaints found</div>';
        return;
    }
    
    resolvedList.innerHTML = resolvedComplaints.map(complaint => `
        <div class="resolved-complaint-item">
            <div class="resolved-complaint-info">
                <span class="resolved-complaint-id">#${complaint.id}</span>
                <span class="resolved-complaint-category">${complaint.category}</span>
                <span class="resolved-complaint-title">${complaint.title}</span>
                <span class="status-badge resolved">Resolved</span>
            </div>
            <span class="resolved-complaint-date">${formatDate(complaint.date)}</span>
        </div>
    `).join('');
}

// Initialize complaint filters
function initializeComplaintFilters(complaints) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get status filter
            const statusFilter = this.getAttribute('data-status');
            
            // Apply filter
            displayComplaintsTable(complaints, statusFilter);
        });
    });
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Open raise complaint modal
function openRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    modal.style.display = 'block';
    
    // Clear form
    document.getElementById('raiseComplaintForm').reset();
}

// Close raise complaint modal
function closeRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    modal.style.display = 'none';
}

// Handle raise complaint form submission
document.getElementById('raiseComplaintForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const complaintData = {
        category: formData.get('category'),
        title: formData.get('title'),
        description: formData.get('description'),
        attachment: formData.get('attachment'),
        preferredResolutionTime: formData.get('preferredResolutionTime')
    };
    
    console.log('Complaint submitted:', complaintData);
    
    // Here you would make an API call to submit the complaint
    // For now, we'll just show a success message
    showSuccess('Complaint submitted successfully! You will be notified when there are updates.');
    
    // Close modal
    closeRaiseComplaintModal();
    
    // Reload complaints (in a real app, you'd add the new complaint to the list)
    setTimeout(() => {
        loadComplaints();
    }, 1000);
});

// View complaint details
function viewComplaintDetails(complaintId) {
    const complaint = mockComplaints.find(c => c.id === complaintId);
    
    if (!complaint) {
        showError('Complaint not found');
        return;
    }
    
    // Populate modal with complaint details
    document.getElementById('complaintDetailsTitle').textContent = `Complaint #${complaint.id} – ${complaint.title}`;
    document.getElementById('detailCategory').textContent = complaint.category;
    document.getElementById('detailStatus').textContent = complaint.status;
    document.getElementById('detailStatus').className = `status-badge ${complaint.status.toLowerCase().replace(' ', '-')}`;
    document.getElementById('detailDescription').textContent = complaint.description;
    document.getElementById('detailRaisedDate').textContent = formatDate(complaint.date);
    document.getElementById('detailUpdatedDate').textContent = formatDate(complaint.lastUpdated);
    
    // Handle attachment
    const attachmentRow = document.getElementById('attachmentRow');
    if (complaint.attachmentUrl) {
        document.getElementById('detailAttachment').href = complaint.attachmentUrl;
        attachmentRow.style.display = 'flex';
    } else {
        attachmentRow.style.display = 'none';
    }
    
    // Handle owner response
    const ownerResponseRow = document.getElementById('ownerResponseRow');
    if (complaint.ownerResponse) {
        document.getElementById('ownerResponseText').textContent = complaint.ownerResponse;
        ownerResponseRow.style.display = 'flex';
    } else {
        ownerResponseRow.style.display = 'none';
    }
    
    // Show/hide "Mark as Resolved" button
    const markResolvedBtn = document.getElementById('markResolvedBtn');
    if (complaint.status === 'In Progress' && complaint.ownerResponse) {
        markResolvedBtn.style.display = 'inline-block';
        markResolvedBtn.onclick = () => markComplaintResolved(complaintId);
    } else {
        markResolvedBtn.style.display = 'none';
    }
    
    // Show modal
    document.getElementById('complaintDetailsModal').style.display = 'block';
}

// Close complaint details modal
function closeComplaintDetailsModal() {
    document.getElementById('complaintDetailsModal').style.display = 'none';
}

// Mark complaint as resolved
function markComplaintResolved(complaintId) {
    console.log('Marking complaint as resolved:', complaintId);
    
    // Here you would make an API call to update the complaint status
    // For now, we'll just show a success message
    showSuccess('Thank you! Complaint marked as resolved.');
    
    closeComplaintDetailsModal();
    
    // Update the complaint status in mock data
    const complaint = mockComplaints.find(c => c.id === complaintId);
    if (complaint) {
        complaint.status = 'Resolved';
        complaint.lastUpdated = new Date().toISOString().split('T')[0];
    }
    
    // Reload complaints
    setTimeout(() => {
        loadComplaints();
    }, 1000);
}

// Show success message
function showSuccess(message) {
    // Simple alert for now - in a real app, you'd use a toast notification
    alert('✅ ' + message);
}

// Show error message
function showError(message) {
    // Simple alert for now - in a real app, you'd use a toast notification
    alert('❌ ' + message);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const raiseModal = document.getElementById('raiseComplaintModal');
    const detailsModal = document.getElementById('complaintDetailsModal');
    
    if (event.target === raiseModal) {
        closeRaiseComplaintModal();
    }
    if (event.target === detailsModal) {
        closeComplaintDetailsModal();
    }
});

// Mobile-specific modal handling
function handleMobileModalOpen(modal) {
    // Prevent background scrolling on mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
}

function handleMobileModalClose() {
    // Restore scrolling on mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
}

// Enhanced modal functions with mobile support
function openRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    modal.style.display = 'block';
    handleMobileModalOpen(modal);
    
    // Clear form
    document.getElementById('raiseComplaintForm').reset();
    
    // Focus first input on non-mobile devices
    if (window.innerWidth > 768) {
        setTimeout(() => {
            document.getElementById('complaintCategory').focus();
        }, 100);
    }
}

function closeRaiseComplaintModal() {
    const modal = document.getElementById('raiseComplaintModal');
    modal.style.display = 'none';
    handleMobileModalClose();
}

function viewComplaintDetails(complaintId) {
    const complaint = mockComplaints.find(c => c.id === complaintId);
    
    if (!complaint) {
        showError('Complaint not found');
        return;
    }
    
    // Populate modal with complaint details
    document.getElementById('complaintDetailsTitle').textContent = `Complaint #${complaint.id} – ${complaint.title}`;
    document.getElementById('detailCategory').textContent = complaint.category;
    document.getElementById('detailStatus').textContent = complaint.status;
    document.getElementById('detailStatus').className = `status-badge ${complaint.status.toLowerCase().replace(' ', '-')}`;
    document.getElementById('detailDescription').textContent = complaint.description;
    document.getElementById('detailRaisedDate').textContent = formatDate(complaint.date);
    document.getElementById('detailUpdatedDate').textContent = formatDate(complaint.lastUpdated);
    
    // Handle attachment
    const attachmentRow = document.getElementById('attachmentRow');
    if (complaint.attachmentUrl) {
        document.getElementById('detailAttachment').href = complaint.attachmentUrl;
        attachmentRow.style.display = 'flex';
    } else {
        attachmentRow.style.display = 'none';
    }
    
    // Handle owner response
    const ownerResponseRow = document.getElementById('ownerResponseRow');
    if (complaint.ownerResponse) {
        document.getElementById('ownerResponseText').textContent = complaint.ownerResponse;
        ownerResponseRow.style.display = 'flex';
    } else {
        ownerResponseRow.style.display = 'none';
    }
    
    // Show/hide "Mark as Resolved" button
    const markResolvedBtn = document.getElementById('markResolvedBtn');
    if (complaint.status === 'In Progress' && complaint.ownerResponse) {
        markResolvedBtn.style.display = 'inline-block';
        markResolvedBtn.onclick = () => markComplaintResolved(complaintId);
    } else {
        markResolvedBtn.style.display = 'none';
    }
    
    // Show modal with mobile support
    const modal = document.getElementById('complaintDetailsModal');
    modal.style.display = 'block';
    handleMobileModalOpen(modal);
}

function closeComplaintDetailsModal() {
    const modal = document.getElementById('complaintDetailsModal');
    modal.style.display = 'none';
    handleMobileModalClose();
}

// Add swipe gesture support for mobile modals
function addSwipeToClose() {
    let startY = 0;
    let startX = 0;
    
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', function(e) {
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const deltaY = startY - endY;
        const deltaX = Math.abs(startX - endX);
        
        // Check if it's a swipe down gesture (and not too much horizontal movement)
        if (deltaY < -100 && deltaX < 50) {
            const raiseModal = document.getElementById('raiseComplaintModal');
            const detailsModal = document.getElementById('complaintDetailsModal');
            
            if (raiseModal && raiseModal.style.display === 'block') {
                closeRaiseComplaintModal();
            }
            if (detailsModal && detailsModal.style.display === 'block') {
                closeComplaintDetailsModal();
            }
        }
    });
}

// Initialize mobile enhancements
document.addEventListener('DOMContentLoaded', function() {
    addSwipeToClose();
    
    // Add pull-to-refresh for mobile (simple version)
    if ('ontouchstart' in window) {
        let isRefreshing = false;
        let startY = 0;
        
        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (window.scrollY === 0 && !isRefreshing) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 100) {
                    isRefreshing = true;
                    // Simple refresh indication
                    showSuccess('Refreshing data...');
                    setTimeout(() => {
                        // Reload current section data
                        const activeSection = document.querySelector('.nav-item.active');
                        if (activeSection) {
                            const sectionName = activeSection.getAttribute('data-section');
                            loadSectionData(sectionName);
                        }
                        isRefreshing = false;
                    }, 1000);
                }
            }
        });
    }
});

// Add to section loading
function loadComplaintsSection() {
    loadComplaints();
}
