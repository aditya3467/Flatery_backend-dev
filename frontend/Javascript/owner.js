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

  async function loadDashboardMetrics() {
    try {
      const totalEl = document.getElementById('totalPropertiesCount');
      if (!totalEl) return;

      // Show a loading state briefly
      totalEl.textContent = '…';

      // Fetch a minimal page to read totalElements
      // all=false -> only my properties; page=0; size=1 to reduce payload
      const page = await apiService.getMyProperties(false, 0, 1);

      // Spring Data Page typically has totalElements; fallback to other shapes if customized
      const total = (page && (page.totalElements ?? page.total ?? page.total_items)) || 0;
      totalEl.textContent = Number.isFinite(total) ? String(total) : '0';
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      const totalEl = document.getElementById('totalPropertiesCount');
      if (totalEl) totalEl.textContent = '0';
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

    card.innerHTML = `
      <div class="property-image">
        <img src="${imageUrl}" alt="${propertyTitle}" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60'">
      </div>
      <div class="property-details">
        <h3>${propertyTitle}</h3>
        <p>${property.type || 'Property'}</p>
        <p>${location}</p>
        <p style="font-weight: 600; color: #007bff; margin-top: 8px;">₹${rent > 0 ? rent.toLocaleString() : 'N/A'}/month</p>
      </div>
    `;

    // Add click handler to view property details
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      // You can navigate to a property details page
      window.location.href = `property-details.html?id=${property.id}`;
    });

    return card;
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
