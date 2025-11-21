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
            currentStatus: 'pending', // Will be determined by payment/transaction API
            lateFeePolicy: '₹100/day after due date', // Hardcoded for now, can be added to property model
            paymentMode: 'UPI / Manual',
            securityDeposit: propertyDetails.securityDeposit || propertyDetails.deposit || 0,
            depositStatus: 'paid', // Assuming paid for now
            ownerName: propertyDetails.ownerName || 'Property Owner',
            ownerId: propertyDetails.ownerId
        };

        console.log('🔍 Processed Rent Data:', rentData);

        // Store owner info globally for QR modal and reminder functionality
        window.currentOwnerName = rentData.ownerName;
        window.currentOwnerId = rentData.ownerId;

        // Fetch real transaction/payment data
        let transactions = [];
        try {
            transactions = await apiService.getTenantPayments();
            console.log('🔍 Fetched Transactions:', transactions);
        } catch (error) {
            console.warn('Failed to fetch transactions, using empty array:', error);
        }

        // Determine current month status and details from transactions
        const currentMonthStr = getCurrentMonthYearShort(); // e.g., "Nov 2025"
        const currentMonthTransaction = transactions.find(t => t.paymentMonth === currentMonthStr);
        
        let currentMonthDetails = {
            status: rentData.currentStatus,
            amount: rentData.monthlyRent,
            paymentMode: rentData.paymentMode,
            upiRef: null,
            paymentDate: null
        };

        if (currentMonthTransaction) {
            // Handle both uppercase and lowercase status from backend
            currentMonthDetails.status = (currentMonthTransaction.status || 'pending').toLowerCase();
            currentMonthDetails.amount = currentMonthTransaction.amount || rentData.monthlyRent;
            currentMonthDetails.paymentMode = currentMonthTransaction.paymentMode || rentData.paymentMode;
            currentMonthDetails.upiRef = currentMonthTransaction.upiRef;
            currentMonthDetails.paymentDate = currentMonthTransaction.paymentDate;
            rentData.currentStatus = currentMonthDetails.status;
            
            console.log('📊 Current Month Transaction Found:', {
                month: currentMonthTransaction.paymentMonth,
                status: currentMonthDetails.status,
                amount: currentMonthDetails.amount,
                mode: currentMonthDetails.paymentMode,
                ref: currentMonthDetails.upiRef
            });
        } else {
            console.log('📊 No transaction found for current month:', currentMonthStr);
        }

        // Calculate next due date based on actual rent due date
        const nextDueDate = calculateNextRentDue(rentData.rentDueDate);

        // Update current month rent summary with transaction details
        document.getElementById('currentMonth').textContent = rentData.currentMonth;
        document.getElementById('monthlyRentAmount').textContent = `₹${formatNumber(currentMonthDetails.amount)}`;
        document.getElementById('nextDueDate').textContent = nextDueDate;
        document.getElementById('lateFeePolicy').textContent = rentData.lateFeePolicy;
        
        // Update payment mode - show actual mode if payment exists
        const paymentModeText = currentMonthDetails.upiRef 
            ? `${currentMonthDetails.paymentMode} (Ref: ${currentMonthDetails.upiRef})` 
            : currentMonthDetails.paymentMode;
        document.getElementById('paymentMode').textContent = paymentModeText;
        
        document.getElementById('depositInfo').textContent = `₹${formatNumber(rentData.securityDeposit)} (${capitalizeFirst(rentData.depositStatus)})`;
        
        // Update status badge with more context
        const statusBadge = document.getElementById('currentMonthStatus');
        statusBadge.className = `payment-status-badge ${currentMonthDetails.status}`;
        
        let statusText = capitalizeFirst(currentMonthDetails.status);
        if (currentMonthDetails.paymentDate && currentMonthDetails.status === 'verified') {
            const paidDate = new Date(currentMonthDetails.paymentDate);
            statusText += ` (Paid: ${paidDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
        } else if (currentMonthDetails.status === 'pending') {
            statusText += ' (Awaiting Verification)';
        }
        
        statusBadge.textContent = getStatusIcon(currentMonthDetails.status) + ' ' + statusText;

        // Load payment history with real transactions
        await loadPaymentHistory(rentData.monthlyRent, transactions);
        
        // Load analytics with real transactions
        await loadRentAnalytics(rentData.monthlyRent, transactions);

        console.log('Rent payments loaded with real data:', {
            rentAmount: rentData.monthlyRent,
            dueDate: rentData.rentDueDate,
            securityDeposit: rentData.securityDeposit,
            nextDueDate: nextDueDate,
            transactionCount: transactions.length
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to load rent payments data:', error);
        showError('Failed to load payment information. Please ensure the backend is running and you are logged in.');
        // NO FALLBACK - Force user to fix the API issue
        throw error;
    }
}

// Get current month and year (short format for API matching)
function getCurrentMonthYearShort() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
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
        'rejected': '❌',
        'canceled': '⚫'
    };
    return icons[status] || '🔲';
}

// Load payment history table
async function loadPaymentHistory(rentAmount = 6000, transactions = []) {
    try {
        const tableBody = document.getElementById('paymentHistoryTableBody');
        tableBody.innerHTML = '';

        // If no transactions, show "no data" message
        if (transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
                        No payment history found
                    </td>
                </tr>
            `;
            return;
        }

        // Sort transactions by payment month (newest first)
        transactions.sort((a, b) => {
            const dateA = parseMonthYear(a.paymentMonth);
            const dateB = parseMonthYear(b.paymentMonth);
            return dateB - dateA;
        });

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            // Handle both uppercase and lowercase status from backend (e.g., "VERIFIED" or "verified")
            const status = (transaction.status || 'pending').toLowerCase();
            
            // Determine which buttons to show
            const isPending = status === 'pending';
            const hasProof = transaction.screenshotUrl;
            const showDownloadButton = status === 'verified' || status === 'completed';
            
            row.innerHTML = `
                <td>${transaction.paymentMonth}</td>
                <td>₹${formatNumber(transaction.amount)}</td>
                <td>${transaction.paymentMode || '–'}</td>
                <td>${transaction.upiRef || '–'}</td>
                <td><span class="payment-status-badge ${status}">${getStatusIcon(status)} ${capitalizeFirst(status)}</span></td>
                <td>${showDownloadButton ? '<button class="table-action-btn download" onclick="downloadReceipt(\'' + transaction.paymentMonth + '\')">📄 Download</button>' : '–'}</td>
                <td>
                    ${isPending && hasProof ? 
                        '<button class="table-action-btn remind" onclick="remindOwnerForPayment(\'' + transaction.paymentMonth + '\', ' + transaction.id + ')">🔔 Remind</button> ' +
                        '<button class="table-action-btn withdraw" onclick="withdrawPaymentRequest(' + transaction.id + ', \'' + transaction.paymentMonth + '\')">�️ Withdraw</button>' : 
                        isPending && !hasProof ? '<button class="table-action-btn upload" onclick="handleUploadProof(\'' + transaction.paymentMonth + '\')">� Upload</button>' : 
                        '–'}
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading payment history:', error);
        const tableBody = document.getElementById('paymentHistoryTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #f44336;">
                    Failed to load payment history
                </td>
            </tr>
        `;
    }
}

// Parse month year string to Date for sorting
function parseMonthYear(monthYearStr) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const parts = monthYearStr.split(' ');
    if (parts.length === 2) {
        const month = months[parts[0]];
        const year = parseInt(parts[1]);
        if (month !== undefined && !isNaN(year)) {
            return new Date(year, month, 1);
        }
    }
    return new Date();
}

// Load rent analytics
async function loadRentAnalytics(rentAmount = 6000, transactions = []) {
    try {
        // Calculate analytics based on real transaction data
        let totalRentPaid = 0;
        let onTimePayments = 0;
        let totalPayments = 0;
        let lateFeesPaid = 0;
        let currentStreak = 0;
        
        if (transactions.length > 0) {
            // Calculate total rent paid (only verified/completed payments)
            // Handle both uppercase and lowercase status values
            const verifiedTransactions = transactions.filter(t => {
                const status = (t.status || '').toLowerCase();
                return status === 'verified' || status === 'completed';
            });
            totalRentPaid = verifiedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // Count total expected payments (verified + pending)
            totalPayments = transactions.filter(t => {
                const status = (t.status || '').toLowerCase();
                return status !== 'canceled' && status !== 'upcoming';
            }).length;
            
            // Count on-time payments (verified without late fees)
            onTimePayments = verifiedTransactions.length;
            
            // TODO: Late fees calculation when that field is added to Transaction model
            lateFeesPaid = 0;
            
            // Calculate payment streak (consecutive on-time payments)
            const sortedTransactions = [...transactions].sort((a, b) => {
                const dateA = parseMonthYear(a.paymentMonth);
                const dateB = parseMonthYear(b.paymentMonth);
                return dateB - dateA; // Newest first
            });
            
            for (const transaction of sortedTransactions) {
                const status = (transaction.status || '').toLowerCase();
                if (status === 'verified' || status === 'completed') {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
        
        const analytics = {
            totalRentPaid: totalRentPaid,
            onTimePayments: { completed: onTimePayments, total: Math.max(totalPayments, 1) },
            lateFeesPaid: lateFeesPaid,
            paymentStreak: currentStreak
        };

        document.getElementById('totalRentPaid').textContent = `₹${formatNumber(analytics.totalRentPaid)}`;
        document.getElementById('onTimePayments').textContent = `${analytics.onTimePayments.completed} / ${analytics.onTimePayments.total}`;
        document.getElementById('lateFeesPaid').textContent = `₹${formatNumber(analytics.lateFeesPaid)}`;
        document.getElementById('paymentStreak').textContent = currentStreak > 0 ? `🔥 ${analytics.paymentStreak} Months` : '0 Months';

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

            const month = form.dataset.month || getCurrentMonthYear();
            const submitBtn = form.querySelector('.payment-modal-btn.submit');
            const originalText = submitBtn ? submitBtn.textContent : 'Submit';

            try {
                if (submitBtn) {
                    submitBtn.textContent = '⏳ Uploading...';
                    submitBtn.disabled = true;
                }

                // Build FormData for file upload
                const fd = new FormData();

                // Ensure file is present (input id may vary)
                const fileInput = document.getElementById('paymentProofFile') || form.querySelector('input[type="file"]');
                const file = fileInput && fileInput.files ? fileInput.files[0] : null;
                if (!file) {
                    throw new Error('Please select a proof file to upload');
                }

                // Attach file for multipart upload
                fd.append('file', file);

                // Add contextual fields
                const paidAmountInput = form.querySelector('#paidAmount');
                const amount = paidAmountInput ? (parseFloat(paidAmountInput.value) || 0) : 0;

                console.log('📤 Uploading payment proof file:', {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type
                });

                // Upload file first to get file URL
                const uploadResp = await apiService.uploadPaymentProof(fd);
                const fileUrl = uploadResp?.fileUrl || uploadResp?.url || uploadResp?.data?.fileUrl;

                if (!fileUrl) {
                    throw new Error('File upload succeeded but no URL returned');
                }

                console.log('✅ File uploaded successfully:', fileUrl);

                // Build payment payload matching PaymentRequestDto on backend
                // paymentMode must be one of: UPI, BANK_TRANSFER, GATEWAY, CASH (enum on backend)
                const paymentPayload = {
                    amount: amount,
                    paymentMonth: month,
                    paymentMode: form.querySelector('#paymentModeSelect')?.value || 'UPI',
                    upiRef: form.querySelector('#upiRefId')?.value || null,
                    screenshotUrl: fileUrl
                };

                console.log('📤 Submitting payment payload:', {
                    amount: paymentPayload.amount,
                    paymentMonth: paymentPayload.paymentMonth,
                    paymentMode: paymentPayload.paymentMode,
                    upiRef: paymentPayload.upiRef,
                    screenshotUrl: paymentPayload.screenshotUrl
                });

                await apiService.submitPayment(paymentPayload);

                // Success
                showSuccess('Payment submitted successfully! Your payment is now pending verification.');
                closePaymentModal();
                
                // Reload the complete rent payments section to refresh all data including payment history
                await loadRentPaymentsData();

            } catch (error) {
                console.error('Error uploading payment proof:', error);
                showError(error.message || 'Failed to upload payment proof. Please try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
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

// Download receipt - Generate PDF receipt for verified payments
async function downloadReceipt(month) {
    try {
        // Find the transaction for this month
        const transactions = await apiService.getTenantPayments();
        const transaction = transactions.find(t => t.paymentMonth === month);
        
        if (!transaction) {
            showError('Transaction not found for ' + month);
            return;
        }

        // Only generate receipt for verified payments
        const status = (transaction.status || '').toLowerCase();
        if (status !== 'verified' && status !== 'completed') {
            showError('Receipt can only be generated for verified payments');
            return;
        }

        // Get property and user details
        const propertyDetails = await apiService.getTenantPropertyDetails();
        const currentUser = await apiService.getCurrentUser();

        // Generate the receipt
        await generateReceiptPDF(transaction, propertyDetails, currentUser);
        
        showSuccess(`Receipt for ${month} downloaded successfully!`);
        
    } catch (error) {
        console.error('Error generating receipt:', error);
        showError('Failed to generate receipt. Please try again.');
    }
}

// Generate PDF receipt
async function generateReceiptPDF(transaction, propertyDetails, tenantUser) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Receipt number format: FLT-YYYY-MMDD-TXN_ID
    const now = new Date();
    const receiptNumber = `FLT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${transaction.id}`;
    const issueDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Colors
    const primaryColor = [122, 122, 255]; // #7A7AFF
    const darkColor = [13, 19, 33]; // #0D1321
    const grayColor = [176, 183, 195]; // #B0B7C3
    
    let yPos = 20;
    
    // ===== HEADER SECTION =====
    // Company name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('FLATERY', 20, yPos);
    
    // Receipt title
    yPos += 15;
    doc.setFontSize(18);
    doc.setTextColor(...darkColor);
    doc.text('RENT PAYMENT RECEIPT', 105, yPos, { align: 'center' });
    
    // Receipt number and date
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text(`Receipt No: ${receiptNumber}`, 20, yPos);
    doc.text(`Date of Issue: ${issueDate}`, 190, yPos, { align: 'right' });
    
    // Separator line
    yPos += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    // ===== OWNER & TENANT DETAILS =====
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('Owner Details', 20, yPos);
    doc.text('Tenant Details', 110, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    
    // Owner details (left column)
    doc.text(`Name: ${propertyDetails.ownerName || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Contact: ${propertyDetails.ownerPhone || 'N/A'}`, 20, yPos);
    
    // Tenant details (right column)
    yPos -= 6;
    doc.text(`Name: ${tenantUser.fullName || tenantUser.username}`, 110, yPos);
    yPos += 6;
    doc.text(`Contact: ${tenantUser.username}`, 110, yPos);
    
    // Property details
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Property: ${propertyDetails.propertyName || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Address: ${propertyDetails.address || ''}, ${propertyDetails.city || ''}, ${propertyDetails.state || ''}`, 20, yPos);
    yPos += 6;
    doc.text(`Unit: ${transaction.unitNumber || propertyDetails.unitCode || 'N/A'}`, 20, yPos);
    
    // Separator line
    yPos += 8;
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);
    
    // ===== PAYMENT DETAILS =====
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PAYMENT DETAILS', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    
    // Payment table
    const paymentDetails = [
        ['Rent Period:', transaction.paymentMonth],
        ['Rent Amount:', `₹${formatNumber(transaction.amount)}`],
        ['Payment Date:', transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'],
        ['Payment Mode:', transaction.paymentMode || 'N/A'],
        ['Transaction ID / Ref:', transaction.upiRef || 'N/A'],
        ['Status:', capitalizeFirst((transaction.status || '').toLowerCase())],
        ['Approval Date:', transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A']
    ];
    
    paymentDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 30, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 90, yPos);
        yPos += 7;
    });
    
    // Separator line
    yPos += 3;
    doc.setDrawColor(...grayColor);
    doc.line(20, yPos, 190, yPos);
    
    // ===== SUMMARY SECTION =====
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const amountInWords = numberToWords(transaction.amount) + ' Rupees Only';
    doc.text(amountInWords, 20, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text("Owner's Remark:", 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('Payment received and verified.', 20, yPos);
    
    // ===== SIGNATURE & FOOTER =====
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Owner Signature:', 20, yPos);
    doc.text('Date:', 140, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('______________________', 20, yPos);
    doc.text('______________________', 140, yPos);
    
    yPos += 3;
    doc.setFontSize(9);
    doc.text(propertyDetails.ownerName || 'Property Owner', 20, yPos);
    doc.text(issueDate, 140, yPos);
    
    // Footer
    yPos = 270; // Near bottom of page
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Generated automatically by Flatery on ${new Date().toLocaleString('en-IN')}`, 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setFontSize(7);
    doc.text('This is a system-generated receipt and does not require a physical signature.', 105, yPos, { align: 'center' });
    
    // Add watermark
    doc.setFontSize(50);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');
    doc.text('FLATERY', 105, 150, { align: 'center', angle: 45 });
    
    // Save the PDF
    const fileName = `Flatery_Receipt_${transaction.paymentMonth.replace(' ', '_')}_${receiptNumber}.pdf`;
    doc.save(fileName);
}

// Convert number to words (Indian numbering system)
function numberToWords(num) {
    if (!num || num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        return convertLessThanThousand(thousands) + ' Thousand' + (remainder ? ' ' + convertLessThanThousand(remainder) : '');
    }
    if (num < 10000000) {
        const lakhs = Math.floor(num / 100000);
        const remainder = num % 100000;
        return convertLessThanThousand(lakhs) + ' Lakh' + (remainder ? ' ' + numberToWords(remainder) : '');
    }
    
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return convertLessThanThousand(crores) + ' Crore' + (remainder ? ' ' + numberToWords(remainder) : '');
}

// Remind owner for pending payment
async function remindOwnerForPayment(paymentMonth, transactionId) {
    try {
        const ownerId = window.currentOwnerId;
        const ownerName = window.currentOwnerName || 'Property Owner';
        
        if (!ownerId) {
            showError('Unable to send reminder. Owner information not available.');
            return;
        }

        // Get current user info
        const currentUser = await apiService.getCurrentUser();
        const tenantName = currentUser.fullName || currentUser.username;

        // Create notification for owner
        const notificationData = {
            userId: ownerId,
            senderId: currentUser.id,
            type: 'PAYMENT_REMINDER',
            title: '💰 Payment Reminder',
            message: `${tenantName} has reminded you about their pending payment for ${paymentMonth}. Please verify their payment submission.`,
            redirectUrl: '/owner/Owner.html#pending-payments'
        };

        console.log('Sending reminder notification:', notificationData);

        // Show loading state
        const reminderButtons = document.querySelectorAll('.table-action-btn.remind');
        reminderButtons.forEach(btn => {
            if (btn.textContent.includes(paymentMonth)) {
                btn.disabled = true;
                btn.textContent = '⏳ Sending...';
            }
        });

        // Send notification
        await apiService.createNotification(notificationData);

        // Show success message
        showSuccess(`Reminder sent to ${ownerName} successfully!`);

        // Update button text
        reminderButtons.forEach(btn => {
            if (btn.textContent.includes('Sending')) {
                btn.textContent = '✅ Reminded';
                btn.disabled = true;
                btn.classList.add('reminded');
                
                // Re-enable after 30 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🔔 Remind Again';
                    btn.classList.remove('reminded');
                }, 30000);
            }
        });

    } catch (error) {
        console.error('Error sending reminder:', error);
        showError('Failed to send reminder to owner. Please try again.');
        
        // Reset button state
        const reminderButtons = document.querySelectorAll('.table-action-btn.remind');
        reminderButtons.forEach(btn => {
            if (btn.textContent.includes('Sending')) {
                btn.disabled = false;
                btn.textContent = '🔔 Remind Owner';
            }
        });
    }
}

// Withdraw/cancel payment request
async function withdrawPaymentRequest(transactionId, paymentMonth) {
    // Confirm with user
    const confirmed = confirm(
        `Are you sure you want to withdraw your payment submission for ${paymentMonth}?\n\n` +
        `This action will cancel your payment request and you will need to submit it again if needed.\n\n` +
        `Reason to withdraw:\n` +
        `• Made a mistake in the details\n` +
        `• Wrong payment proof uploaded\n` +
        `• Need to resubmit with correct information`
    );
    
    if (!confirmed) {
        return;
    }

    try {
        console.log('Withdrawing payment request:', { transactionId, paymentMonth });

        // Show loading state - find the withdraw button
        const withdrawButtons = document.querySelectorAll('.table-action-btn.withdraw');
        let targetButton = null;
        withdrawButtons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(transactionId)) {
                btn.disabled = true;
                btn.textContent = '⏳ Canceling...';
                targetButton = btn;
            }
        });

        // Call API to withdraw
    const response = await apiService.withdrawPaymentSubmission(transactionId);
    console.log('Withdraw response:', response);

        // Show success message
        showSuccess(`Payment request for ${paymentMonth} has been withdrawn successfully!`);

        // Reload the payment history to reflect changes
        await loadRentPaymentsData();

    } catch (error) {
        console.error('Error withdrawing payment:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response,
            stack: error.stack
        });
        
        // Show detailed error message
        let errorMessage = 'Failed to withdraw payment request. ';
        
        if (error.message) {
            if (error.message.includes('already')) {
                errorMessage = 'Cannot withdraw: Payment has already been processed by the owner.';
            } else if (error.message.includes('not belong') || error.message.includes('Unauthorized')) {
                errorMessage = 'Unauthorized: You can only withdraw your own payments.';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Transaction not found.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'Please try again or contact support if the issue persists.';
        }
        
        showError(errorMessage);
        
        // Reset button state
        const withdrawButtons = document.querySelectorAll('.table-action-btn.withdraw');
        withdrawButtons.forEach(btn => {
            if (btn.textContent.includes('Canceling')) {
                btn.disabled = false;
                btn.textContent = '🗑️ Withdraw';
            }
        });
    }
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


// Load complaints section
async function loadComplaints() {
    try {
        console.log('Loading complaints from API...');
        let complaints = [];
        if (window.complaintManager && typeof complaintManager.getComplaints === 'function') {
            complaints = await complaintManager.getComplaints();
        }
        // Normalize status and date fields for analytics and table
        complaints = complaints.map(c => ({
            ...c,
            status: c.status ? (typeof c.status === 'string' ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : c.status) : 'Open',
            date: c.submittedAt || c.date || c.createdAt,
            lastUpdated: c.lastUpdated || c.updatedAt || c.resolvedAt || c.date
        }));
        updateComplaintsAnalytics(complaints);
        displayComplaintsTable(complaints);
        displayResolvedComplaints(complaints);
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
    // Robust cleanup: Remove all mobile-table-cards containers before any rendering
    document.querySelectorAll('.mobile-table-cards').forEach(el => el.remove());
    console.log('[displayComplaintsTable] Called. Complaints:', complaints.length, 'Status filter:', statusFilter);

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
        // Still call mobile card generator for empty state
        generateMobileComplaintCards([]);
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
    // Robust cleanup: Remove all mobile-table-cards containers before rendering
    document.querySelectorAll('.mobile-table-cards').forEach(el => el.remove());
    console.log('[generateMobileComplaintCards] Called. Complaints:', complaints.length);

    // Create a new mobile cards container
    const tableWrapper = document.querySelector('.table-wrapper');
    if (!tableWrapper) return;
    const mobileCardsContainer = document.createElement('div');
    mobileCardsContainer.className = 'mobile-table-cards';
    tableWrapper.parentNode.insertBefore(mobileCardsContainer, tableWrapper.nextSibling);

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
// Ensure the real submitComplaint function is used for the form
document.getElementById('raiseComplaintForm').addEventListener('submit', submitComplaint);

// Make complaintManager globally available if not already
if (typeof window.complaintManager === 'undefined' && typeof ComplaintManager !== 'undefined') {
    window.complaintManager = new ComplaintManager();
}

// Handle complaint form submission
async function submitComplaint(event) {
    event.preventDefault();
    const form = document.getElementById('raiseComplaintForm');
    const formData = new FormData(form);

    try {
        let result;
        if (window.complaintManager && typeof complaintManager.createComplaint === 'function') {
            result = await complaintManager.createComplaint(formData);
        } else if (window.apiService && typeof apiService.createComplaint === 'function') {
            result = await apiService.createComplaint(formData);
        } else {
            alert('Complaint service not available.');
            return;
        }
        alert('Complaint submitted successfully!');
        closeRaiseComplaintModal();
        // Optionally refresh complaints list here
        if (typeof loadComplaints === 'function') {
            loadComplaints();
        }
        // Optionally, show details if complaintId is present
        if (result && result.id) {
            // viewComplaintDetails(result.id); // Uncomment if you want to show details
        }
    } catch (error) {
        alert('Failed to submit complaint: ' + (error.message || error));
    }
}

// View complaint details
function viewComplaintDetails(complaintId) {
    if (window.complaintManager && typeof complaintManager.getComplaintDetails === 'function') {
        complaintManager.getComplaintDetails(complaintId).then(complaint => {
            if (!complaint) {
                showError('Complaint not found');
                return;
            }
            // Populate modal with complaint details (reuse your modal population logic or update as needed)
            document.getElementById('complaintDetailsTitle').textContent = `Complaint #${complaint.complaintId || complaint.id} – ${complaint.title}`;
            document.getElementById('detailCategory').textContent = complaint.category;
            document.getElementById('detailStatus').textContent = complaint.status;
            document.getElementById('detailStatus').className = `status-badge ${complaint.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('detailDescription').textContent = complaint.description;
            document.getElementById('detailRaisedDate').textContent = formatDate(complaint.submittedAt || complaint.date);
            document.getElementById('detailUpdatedDate').textContent = formatDate(complaint.lastUpdated || complaint.updatedAt || complaint.resolvedAt || complaint.date);
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
            if ((complaint.status === 'In Progress' || complaint.status === 'IN_PROGRESS') && complaint.ownerResponse) {
                markResolvedBtn.style.display = 'inline-block';
                markResolvedBtn.onclick = () => markComplaintResolved(complaint.complaintId || complaint.id);
            } else {
                markResolvedBtn.style.display = 'none';
            }
            document.getElementById('complaintDetailsModal').style.display = 'block';
        });
    }
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
