// Lightweight performance fixes applied on page load
// 1) Make wheel/touchmove listeners passive by default when no options provided (improves scroll performance)
// 2) Add a scroll-pauser that gently pauses decorative animations while the user is actively scrolling

(function() {
  try {
    const origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Only default to passive for non-canceling listeners where code didn't pass options.
      if ((type === 'wheel' || type === 'touchmove') && (options === undefined || typeof options === 'boolean')) {
        return origAdd.call(this, type, listener, { passive: true });
      }
      return origAdd.call(this, type, listener, options);
    };
  } catch (e) {
    // If overriding fails, silently continue — this is a best-effort optimization.
    console.warn('perf-fixes: could not patch addEventListener', e);
  }

  // Add touch-action hint to reduce browser work on touch devices
  try {
    document.documentElement.style.touchAction = document.documentElement.style.touchAction || 'pan-y';
  } catch (e) {}

  // Pause decorative animations while scrolling to reduce repaints.
  (function() {
    let scrolling = false;
    let timer = null;
    const start = () => {
      if (!scrolling) {
        scrolling = true;
        document.documentElement.classList.add('is-scrolling');
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        scrolling = false;
        document.documentElement.classList.remove('is-scrolling');
      }, 150);
    };

    // Use passive listener to avoid blocking the main thread
    window.addEventListener('scroll', start, { passive: true });
    window.addEventListener('wheel', start, { passive: true });
    window.addEventListener('touchmove', start, { passive: true });
  })();

  // Promote commonly-animated elements to their own layer to use GPU compositing
  // This is selectively applied to SVG groups with inline animations and floating icons
  requestAnimationFrame(() => {
    try {
      document.querySelectorAll('svg g[style*="animation"], .floating-icon, .float-shape').forEach(el => {
        el.style.willChange = 'transform, opacity';
        el.style.transform = el.style.transform || 'translateZ(0)';
      });
    } catch (e) {}
  });
})();
