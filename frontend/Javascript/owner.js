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
      console.error('Failed to load owner dashboard metrics:', err);
      const totalEl = document.getElementById('totalPropertiesCount');
      if (totalEl) totalEl.textContent = '0';
      safeNotify(err.message || 'Failed to load dashboard data.', 'error');
    }
  });

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
