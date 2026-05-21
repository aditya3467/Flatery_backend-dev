/**
 * ========================================================
 * 🏘 PG PORTFOLIO LIST - JavaScript
 * ========================================================
 * 
 * Manages PG properties listing with filters and search
 */

class PGPortfolio {
    constructor() {
        this.pgProperties = [];
        this.filteredProperties = [];
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.filters = {
            search: '',
            city: '',
            status: '',
            occupancy: '',
            sort: 'name'
        };
        
        this.init();
    }

    async init() {
        
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Load PG properties
        await this.loadPGProperties();
        
    }

    checkAuth() {
        if (typeof apiService === 'undefined') {
            console.error('[PGPortfolio] API Service not loaded');
            alert('API Service not loaded. Please refresh the page.');
            return false;
        }

        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        
        if (!apiService.isAuthenticated() || !roles.includes('ADMIN')) {
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return false;
        }

        return true;
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('pgSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const cityFilter = document.getElementById('cityFilter');
        const statusFilter = document.getElementById('statusFilter');
        const occupancyFilter = document.getElementById('occupancyFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (occupancyFilter) {
            occupancyFilter.addEventListener('change', (e) => {
                this.filters.occupancy = e.target.value;
                this.applyFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderPGGrid();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderPGGrid();
                }
            });
        }
    }

    async loadPGProperties() {
        try {
            // Show loading
            const gridLoading = document.getElementById('gridLoading');
            if (gridLoading) gridLoading.style.display = 'block';

            // Fetch all properties
            const response = await apiService.getMyProperties(true, 0, 1000);
            
            let allProperties = [];
            if (Array.isArray(response)) {
                allProperties = response;
            } else if (response && response.content && Array.isArray(response.content)) {
                allProperties = response.content;
            } else if (response && response.properties && Array.isArray(response.properties)) {
                allProperties = response.properties;
            }

            // Filter only PG properties
            this.pgProperties = allProperties.filter(p => 
                p.type === 'PG' || 
                p.type === 'Hostel' || 
                p.propertyType === 'PG' ||
                p.propertyType === 'Hostel'
            );


            // Load tenants to calculate occupancy
            await this.loadTenantsData();

            // Apply filters and render
            this.applyFilters();
            this.updateHeaderStats();

            // Hide loading
            if (gridLoading) gridLoading.style.display = 'none';

        } catch (error) {
            console.error('[PGPortfolio] Error loading PG properties:', error);
            const gridLoading = document.getElementById('gridLoading');
            if (gridLoading) {
                gridLoading.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load PG properties. Please try again.</p>
                `;
            }
        }
    }

    async loadTenantsData() {
        try {
            const response = await apiService.getTenants();
            
            let tenants = [];
            if (Array.isArray(response)) {
                tenants = response;
            } else if (response && response.tenants && Array.isArray(response.tenants)) {
                tenants = response.tenants;
            } else if (response && response.content && Array.isArray(response.content)) {
                tenants = response.content;
            }

            // Associate tenants with properties
            this.pgProperties.forEach(pg => {
                pg.tenants = tenants.filter(t => 
                    t.flatId === pg.id || 
                    t.propertyId === pg.id
                );
                
                // Calculate occupancy
                const totalBeds = pg.totalBeds || pg.totalUnits || 0;
                const occupiedBeds = pg.tenants.length;
                pg.occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
                pg.occupiedBeds = occupiedBeds;
                pg.availableBeds = Math.max(0, totalBeds - occupiedBeds);
            });

        } catch (error) {
            console.error('[PGPortfolio] Error loading tenants:', error);
        }
    }

    updateHeaderStats() {
        // Total PGs
        document.getElementById('totalPGsCount').textContent = this.pgProperties.length;

        // Total Beds
        const totalBeds = this.pgProperties.reduce((sum, pg) => 
            sum + (pg.totalBeds || pg.totalUnits || 0), 0
        );
        document.getElementById('totalBedsCount').textContent = totalBeds;

        // Overall Occupancy
        const totalOccupied = this.pgProperties.reduce((sum, pg) => 
            sum + (pg.occupiedBeds || 0), 0
        );
        const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
        document.getElementById('occupancyRate').textContent = `${occupancyRate}%`;
    }

    applyFilters() {
        let filtered = [...this.pgProperties];

        // Search filter
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(pg => {
                const name = (pg.name || pg.propertyName || '').toLowerCase();
                const area = (pg.area || pg.locality || '').toLowerCase();
                const landmark = (pg.landmark || '').toLowerCase();
                return name.includes(searchLower) || 
                       area.includes(searchLower) || 
                       landmark.includes(searchLower);
            });
        }

        // City filter
        if (this.filters.city) {
            filtered = filtered.filter(pg => 
                (pg.city || '').toLowerCase() === this.filters.city.toLowerCase()
            );
        }

        // Status filter
        if (this.filters.status) {
            filtered = filtered.filter(pg => {
                const isActive = !pg.status || 
                               pg.status === 'ACTIVE' || 
                               pg.status === 'active' ||
                               pg.isActive === true;
                return this.filters.status === 'active' ? isActive : !isActive;
            });
        }

        // Occupancy filter
        if (this.filters.occupancy) {
            filtered = filtered.filter(pg => {
                const occupancy = pg.occupancy || 0;
                if (this.filters.occupancy === 'high') return occupancy >= 90;
                if (this.filters.occupancy === 'medium') return occupancy >= 70 && occupancy < 90;
                if (this.filters.occupancy === 'low') return occupancy < 70;
                return true;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (this.filters.sort === 'name') {
                const nameA = (a.name || a.propertyName || '').toLowerCase();
                const nameB = (b.name || b.propertyName || '').toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (this.filters.sort === 'occupancy') {
                return (b.occupancy || 0) - (a.occupancy || 0);
            } else if (this.filters.sort === 'beds') {
                return (b.totalBeds || b.totalUnits || 0) - (a.totalBeds || a.totalUnits || 0);
            }
            return 0;
        });

        this.filteredProperties = filtered;
        this.currentPage = 1;
        this.renderPGGrid();
        this.updateFiltersSummary();
    }

    updateFiltersSummary() {
        const summary = document.getElementById('filtersSummary');
        const summaryChips = document.getElementById('summaryChips');
        
        if (!summary || !summaryChips) return;

        const activeFilters = [];
        
        if (this.filters.search) activeFilters.push({ key: 'search', label: `Search: "${this.filters.search}"` });
        if (this.filters.city) activeFilters.push({ key: 'city', label: `City: ${this.filters.city}` });
        if (this.filters.status) activeFilters.push({ key: 'status', label: `Status: ${this.filters.status}` });
        if (this.filters.occupancy) {
            let occupancyLabel = '';
            if (this.filters.occupancy === 'high') occupancyLabel = '≥ 90%';
            else if (this.filters.occupancy === 'medium') occupancyLabel = '70-90%';
            else if (this.filters.occupancy === 'low') occupancyLabel = '< 70%';
            activeFilters.push({ key: 'occupancy', label: `Occupancy: ${occupancyLabel}` });
        }

        if (activeFilters.length === 0) {
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'flex';
        summaryChips.innerHTML = activeFilters.map(filter => `
            <div class="summary-chip">
                ${filter.label}
                <button onclick="pgPortfolio.removeFilter('${filter.key}')">×</button>
            </div>
        `).join('');
    }

    removeFilter(key) {
        this.filters[key] = '';
        
        // Update UI
        if (key === 'search') document.getElementById('pgSearchInput').value = '';
        if (key === 'city') document.getElementById('cityFilter').value = '';
        if (key === 'status') document.getElementById('statusFilter').value = '';
        if (key === 'occupancy') document.getElementById('occupancyFilter').value = '';
        
        this.applyFilters();
    }

    clearFilters() {
        this.filters = {
            search: '',
            city: '',
            status: '',
            occupancy: '',
            sort: 'name'
        };

        // Reset all inputs
        document.getElementById('pgSearchInput').value = '';
        document.getElementById('cityFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('occupancyFilter').value = '';
        document.getElementById('sortFilter').value = 'name';

        this.applyFilters();
    }

    renderPGGrid() {
        const grid = document.getElementById('pgGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredProperties.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            this.hidePagination();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Paginate
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.filteredProperties.slice(start, end);

        // Build DOM using DocumentFragment to avoid repeated reflows
        grid.innerHTML = ''; // clear quickly
        const frag = document.createDocumentFragment();
        pageItems.forEach(pg => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = this.createPGCard(pg);
            // move children from wrapper to fragment
            while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
        });
        grid.appendChild(frag);
        this.updatePagination();
    }

    createPGCard(pg) {
        // Handle image URLs
        let imageUrl = pg.primaryImageUrl || pg.imageUrl;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `../${imageUrl}`;
        }
        if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500';
        }

        const title = pg.name || pg.propertyName || `PG ${pg.id}`;
        const pgType = pg.pgType || pg.gender || 'Mixed';
        const isActive = !pg.status || pg.status === 'ACTIVE' || pg.status === 'active' || pg.isActive === true;
        const location = `${pg.area || pg.locality || ''}, ${pg.city || ''}`.trim();
        
        const totalBeds = pg.totalBeds || pg.totalUnits || 0;
        const occupiedBeds = pg.occupiedBeds || 0;
        const availableBeds = pg.availableBeds || 0;
        
        // Calculate pending dues (would need payment data for accurate calculation)
        const pendingDues = 0; // Placeholder

        return `
            <div class="pg-card">
                <!-- Image Section -->
                <div class="pg-card-image-container">
                    <img src="${imageUrl}" alt="${this.escapeHtml(title)}" class="pg-card-image"
                         onerror="this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'">
                    <div class="pg-card-image-overlay">
                        <h3 class="pg-card-title">${this.escapeHtml(title)}</h3>
                        <div class="pg-card-tags">
                            <span class="pg-tag">${pgType}</span>
                        </div>
                    </div>
                    <span class="pg-status-badge ${isActive ? 'active' : 'inactive'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <!-- Stats Section -->
                <div class="pg-card-stats">
                    <div class="pg-stat-box">
                        <span class="pg-stat-value">${totalBeds}</span>
                        <span class="pg-stat-label">Total Beds</span>
                    </div>
                    <div class="pg-stat-box">
                        <span class="pg-stat-value">${occupiedBeds}</span>
                        <span class="pg-stat-label">Occupied</span>
                    </div>
                    <div class="pg-stat-box pending">
                        <span class="pg-stat-value">₹${this.formatNumber(pendingDues)}</span>
                        <span class="pg-stat-label">Pending Dues</span>
                    </div>
                </div>

                <!-- Footer Section -->
                <div class="pg-card-footer">
                    <div class="pg-card-meta">
                        <div class="pg-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${location || 'Location not specified'}</span>
                        </div>
                        ${pg.manager ? `<div class="pg-manager">Manager: ${pg.manager}</div>` : ''}
                    </div>
                    <div class="pg-card-actions">
                        <button class="btn-open-crm" onclick="window.location.href='property-config.html?id=${pg.id}'">
                            Open PG CRM <i class="fas fa-arrow-right"></i>
                        </button>
                        <a href="property-config.html?id=${pg.id}" class="btn-view-details">View Details</a>
                    </div>
                </div>
            </div>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }

        const paginationSection = document.getElementById('paginationSection');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const paginationNumbers = document.getElementById('paginationNumbers');

        if (paginationSection) paginationSection.style.display = 'flex';

        // Update buttons
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;

        // Generate page numbers
        if (paginationNumbers) {
            // Build pagination using DOM methods to avoid expensive innerHTML
            paginationNumbers.innerHTML = '';
            const pagFrag = document.createDocumentFragment();
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                    const div = document.createElement('div');
                    div.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
                    div.textContent = i;
                    div.addEventListener('click', () => this.goToPage(i));
                    pagFrag.appendChild(div);
                } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                    const span = document.createElement('span');
                    span.style.padding = '0 0.5rem';
                    span.textContent = '...';
                    pagFrag.appendChild(span);
                }
            }
            paginationNumbers.appendChild(pagFrag);
        }
    }

    hidePagination() {
        const paginationSection = document.getElementById('paginationSection');
        if (paginationSection) paginationSection.style.display = 'none';
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderPGGrid();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
let pgPortfolio;

document.addEventListener('DOMContentLoaded', () => {
    const initPGPortfolio = () => {
        if (typeof apiService !== 'undefined') {
            pgPortfolio = new PGPortfolio();
        } else {
            setTimeout(initPGPortfolio, 100);
        }
    };
    
    initPGPortfolio();
});
