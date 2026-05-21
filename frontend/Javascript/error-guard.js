// Lightweight error guard: deduplicate repeated console.error messages and show a small UI badge
(function(){
  try {
    const originalConsoleError = console.error.bind(console);
    const seen = new Map();
    const MAX_DISPLAY = 100;

    // UI badge
    const badge = document.createElement('div');
    badge.id = 'error-guard-badge';
    badge.style.position = 'fixed';
    badge.style.right = '12px';
    badge.style.bottom = '12px';
    badge.style.zIndex = 99999;
    badge.style.background = 'rgba(220,20,60,0.9)';
    badge.style.color = 'white';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '20px';
    badge.style.fontSize = '13px';
    badge.style.display = 'none';
    badge.style.cursor = 'pointer';
    badge.title = 'Click to view recent errors';
    badge.textContent = 'Errors: 0';
    document.body.appendChild(badge);

    const panel = document.createElement('div');
    panel.id = 'error-guard-panel';
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.bottom = '48px';
    panel.style.zIndex = 99999;
    panel.style.maxWidth = '420px';
    panel.style.maxHeight = '55vh';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(18,18,18,0.95)';
    panel.style.color = 'white';
    panel.style.borderRadius = '8px';
    panel.style.padding = '8px';
    panel.style.display = 'none';
    panel.style.fontSize = '12px';
    document.body.appendChild(panel);

    badge.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    function addError(msg) {
      const key = typeof msg === 'string' ? msg : JSON.stringify(msg);
      const count = (seen.get(key) || 0) + 1;
      seen.set(key, count);
      const total = Array.from(seen.values()).reduce((s, v) => s + v, 0);
      badge.textContent = `Errors: ${total}`;
      badge.style.display = total ? 'block' : 'none';

      // update panel
      renderPanel();
    }

    function renderPanel(){
      panel.innerHTML = '';
      let shown = 0;
      for (const [msg, cnt] of Array.from(seen.entries()).slice(0, MAX_DISPLAY)) {
        const row = document.createElement('div');
        row.style.marginBottom = '6px';
        row.innerHTML = `<div style="opacity:0.85;">${escapeHtml(msg)}</div><div style="opacity:0.6;font-size:11px;">Count: ${cnt}</div>`;
        panel.appendChild(row);
        shown++;
      }
      if (shown === 0) {
        panel.textContent = 'No recent errors.';
      }
    }

    function escapeHtml(s){
      if (!s) return '';
      return s.replace(/[&<>"]+/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    }

    console.error = function(...args){
      try {
        const key = args.map(a => (typeof a === 'string' ? a : (a && a.message) || JSON.stringify(a))).join(' | ');
        // dedupe common messages
        const previous = seen.get(key) || 0;
        if (previous < 5) {
          originalConsoleError(...args);
        }
        addError(key);
      } catch (e) {
        originalConsoleError('error-guard failed', e);
      }
    };

    window.addEventListener('error', (ev) => {
      try {
        const msg = `${ev.message} @ ${ev.filename}:${ev.lineno}:${ev.colno}`;
        console.error(msg);
      } catch (e) {}
    });

    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const reason = ev.reason && ev.reason.message ? ev.reason.message : JSON.stringify(ev.reason);
        console.error('UnhandledRejection: ' + reason);
      } catch (e) {}
    });

  } catch (e) { console.warn('error-guard init failed', e); }
})();
