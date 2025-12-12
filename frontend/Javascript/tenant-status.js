// Tenant Status Page JavaScript
// This page is shown when a tenant has no active property assigned

document.addEventListener('DOMContentLoaded', async function() {
    await loadPageData();
    setupEventListeners();
});

// Load tenant data and past stays
async function loadPageData() {
    try {
        const userData = await apiService.getCurrentUser();
        console.log('Tenant user:', userData);

        // Load past stays history
        await loadPastStays();
    } catch (error) {
        console.error('Error loading page data:', error);
    }
}

// Load past stays for the tenant
async function loadPastStays() {
    try {
        const pastStays = await apiService.getTenantPastStays();
        console.log('Past stays:', pastStays);

        const container = document.getElementById('pastStaysContainer');
        const noStaysMsg = document.getElementById('noPastStaysMessage');

        if (!pastStays || pastStays.length === 0) {
            // Show "no past stays" message
            container.innerHTML = '';
            noStaysMsg.style.display = 'flex';
            noStaysMsg.style.flexDirection = 'column';
            noStaysMsg.style.alignItems = 'center';
            noStaysMsg.style.justifyContent = 'center';
            return;
        }

        // Clear "no past stays" message
        noStaysMsg.style.display = 'none';
        container.innerHTML = '';

        // Render past stay cards
        pastStays.forEach(stay => {
            const card = createPastStayCard(stay);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading past stays:', error);

        const container = document.getElementById('pastStaysContainer');
        container.innerHTML = '<p style="color: #6b7280; text-align: center;">Error loading past stays</p>';
    }
}

// Create a single past stay card
function createPastStayCard(stay) {
    const card = document.createElement('div');
    card.className = 'past-stay-card';

    // Format dates
    const startDate = formatDate(stay.startDate);
    const endDate = formatDate(stay.endDate);
    const durationText = endDate ? `${startDate} – ${endDate}` : `Started ${startDate}`;

    // Determine status
    const status = stay.status || 'Completed';
    const isActive = stay.isActive || false;

    // Build the card HTML
    card.innerHTML = `
        <div class="stay-icon">
            <i class="fas fa-building"></i>
        </div>
        <div class="stay-details">
            <div class="stay-property-name">${stay.propertyName || 'Unknown Property'}</div>
            <div class="stay-location">${stay.city || 'Unknown Location'}</div>
            <div class="stay-duration">${durationText}</div>
            <div class="stay-status-chip">${status}</div>
        </div>
    `;

    // Add click handler to view details if needed
    card.addEventListener('click', () => {
        console.log('Clicked on stay:', stay);
        // You can add modal or details page here
    });

    return card;
}

// Format date to readable format (e.g., "Jan 2023")
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Setup event listeners
function setupEventListeners() {
    const viewStaysBtn = document.getElementById('viewStaysBtn');
    const pastStaysSection = document.getElementById('pastStaysSection');

    if (viewStaysBtn) {
        viewStaysBtn.addEventListener('click', () => {
            // Smooth scroll to past stays section
            pastStaysSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}
