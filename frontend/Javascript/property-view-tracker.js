/**
 * Property View Tracking
 * Records property views after user stays on page for 3-5 seconds
 */

class PropertyViewTracker {
    constructor() {
        this.viewTimer = null;
        this.viewRecorded = false;
        this.viewStartTime = null;
        this.sessionId = this.getOrCreateSessionId();
        this.MIN_VIEW_DURATION = 3000; // 3 seconds minimum
    }

    /**
     * Get or create session ID for guest tracking
     */
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('flatery_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('flatery_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Start tracking a property view
     */
    startTracking(propertyId, referrer = null) {
        if (this.viewRecorded) {
            return; // Already recorded
        }

        this.viewStartTime = Date.now();

        // Record view after 3 seconds of being on page
        this.viewTimer = setTimeout(() => {
            this.recordView(propertyId, referrer);
        }, this.MIN_VIEW_DURATION);

        // Track when user leaves to calculate duration
        window.addEventListener('beforeunload', () => {
            if (this.viewRecorded) {
                const duration = Math.floor((Date.now() - this.viewStartTime) / 1000);
                // Could send duration update here if needed
            }
        });

        // Handle page visibility changes (user switches tabs)
        let hiddenTime = null;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                hiddenTime = Date.now();
                if (this.viewTimer) {
                    clearTimeout(this.viewTimer);
                }
            } else {
                // Resume timer if user returns within reasonable time
                if (hiddenTime && (Date.now() - hiddenTime) < 30000) { // 30 sec tolerance
                    const remainingTime = this.MIN_VIEW_DURATION - (hiddenTime - this.viewStartTime);
                    if (remainingTime > 0 && !this.viewRecorded) {
                        this.viewTimer = setTimeout(() => {
                            this.recordView(propertyId, referrer);
                        }, remainingTime);
                    }
                }
            }
        });
    }

    /**
     * Stop tracking (cleanup)
     */
    stopTracking() {
        if (this.viewTimer) {
            clearTimeout(this.viewTimer);
            this.viewTimer = null;
        }
    }

    /**
     * Record the view via API
     */
    async recordView(propertyId, referrer = null) {
        if (this.viewRecorded) {
            return;
        }

        const duration = this.viewStartTime 
            ? Math.floor((Date.now() - this.viewStartTime) / 1000) 
            : null;

        try {
            const response = await fetch(`${apiService.baseURL}/properties/${propertyId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiService.token ? { 'Authorization': `Bearer ${apiService.token}` } : {})
                },
                body: JSON.stringify({
                    propertyId: propertyId,
                    sessionId: this.sessionId,
                    viewDurationSeconds: duration,
                    referrer: referrer || document.referrer
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.viewRecorded = result.recorded;
                console.log('Property view recorded:', propertyId, result.recorded);
            }
        } catch (error) {
            console.error('Failed to record property view:', error);
        }
    }

    /**
     * Get referrer context (where user came from)
     */
    getReferrerContext() {
        const referrer = document.referrer;
        if (!referrer) return 'direct';
        if (referrer.includes('/properties.html')) return 'listing';
        if (referrer.includes('/index.html') || referrer.endsWith('/')) return 'homepage';
        if (referrer.includes('search')) return 'search';
        return 'other';
    }
}

// Initialize tracker globally
window.propertyViewTracker = new PropertyViewTracker();
