/**
 * Notification Manager
 * Handles notification fetching, display, and interactions
 */

class NotificationManager {
    constructor() {
        this.notificationBell = null;
        this.notificationBadge = null;
        this.notificationDropdown = null;
        this.notificationList = null;
        this.notificationSection = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.refreshInterval = null;
        this.isAuthenticated = false;
        this.isInitialized = false;
    }

    /**
     * Initialize notification manager
     */
    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.log('[Notifications] Already initialized');
            return;
        }

        // Check if user is authenticated
        this.isAuthenticated = typeof apiService !== 'undefined' && apiService.isAuthenticated();
        if (!this.isAuthenticated) {
            console.log('[Notifications] Skipping init: not authenticated');
            const section = document.getElementById('notificationSection');
            if (section) section.style.display = 'none';
            return;
        }

        console.log('[Notifications] Initializing notification manager...');
        
        // Get DOM elements
        this.notificationSection = document.getElementById('notificationSection');
        this.notificationBell = document.getElementById('notificationBell');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.notificationDropdown = document.getElementById('notificationDropdown');
        this.notificationList = document.getElementById('notificationList');

        console.log('[Notifications] Initial element check:');
        console.log('  - notificationSection:', !!this.notificationSection);
        console.log('  - notificationBell:', !!this.notificationBell);
        console.log('  - notificationDropdown:', !!this.notificationDropdown);
        console.log('  - notificationList:', !!this.notificationList);

        if (!this.notificationSection || !this.notificationBell || !this.notificationDropdown || !this.notificationList) {
            console.warn('[Notifications] Required DOM elements missing; delaying init and retrying in 300ms...');
            // Retry after longer delay (component-loader may still be loading)
            setTimeout(() => {
                this.notificationSection = document.getElementById('notificationSection');
                this.notificationBell = document.getElementById('notificationBell');
                this.notificationBadge = document.getElementById('notificationBadge');
                this.notificationDropdown = document.getElementById('notificationDropdown');
                this.notificationList = document.getElementById('notificationList');
                
                console.log('[Notifications] Retry element check:');
                console.log('  - notificationSection:', !!this.notificationSection);
                console.log('  - notificationBell:', !!this.notificationBell);
                console.log('  - notificationDropdown:', !!this.notificationDropdown);
                console.log('  - notificationList:', !!this.notificationList);
                
                if (this.notificationSection && this.notificationBell && this.notificationDropdown && this.notificationList) {
                    console.log('[Notifications] Elements found on retry; continuing init');
                    this.finalizeInit();
                } else {
                    console.error('[Notifications] Initialization aborted: elements still missing after retry');
                }
            }, 300);
            return;
        }

        this.finalizeInit();
    }

    finalizeInit() {
        // Show notification section
        if (this.notificationSection) {
            this.notificationSection.style.display = 'flex';
        }

        // Setup event listeners
        this.setupEventListeners();

        // Load initial notifications
        this.loadNotifications();

        // Start auto-refresh (every 30 seconds)
        this.startAutoRefresh();

        // Mark as initialized
        this.isInitialized = true;
        console.log('Notification manager initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle dropdown
        if (this.notificationBell) {
            const bellClickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.toggleDropdown();
            };
            
            this.notificationBell.addEventListener('click', bellClickHandler, true);
        }

        // Prevent dropdown clicks from closing it
        if (this.notificationDropdown) {
            this.notificationDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Close dropdown when clicking outside
        const outsideClickHandler = (e) => {
            if (this.notificationSection && this.notificationSection.contains(e.target)) {
                return;
            }
            this.closeDropdown();
        };
        
        // Add listener with slight delay to prevent immediate triggering
        setTimeout(() => {
            document.addEventListener('click', outsideClickHandler);
        }, 100);

        // Mark all as read button
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });
        }

        // Clear notifications button
        const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearReadNotifications();
            });
        }
    }

    /**
     * Load notifications from API
     */
    async loadNotifications() {
        if (!this.isAuthenticated) return;
        try {
            const [countResponse, notifications] = await Promise.all([
                apiService.getUnreadNotificationCount().catch(e => { console.warn('[Notifications] Count failed', e); return { count: 0 }; }),
                apiService.getAllNotifications().catch(e => { console.warn('[Notifications] List failed', e); return []; })
            ]);
            this.unreadCount = (countResponse && countResponse.count) ? countResponse.count : 0;
            this.notifications = Array.isArray(notifications) ? notifications : [];
            this.updateBadge();
            this.renderNotifications();
        } catch (error) {
            console.error('[Notifications] Unexpected load error:', error);
            this.showError();
        }
    }

    /**
     * Render notifications in the dropdown
     */
    renderNotifications() {
        if (!this.notificationList) return;

        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = this.notifications.map(notification => {
            const icon = this.getNotificationIcon(notification.type);
            const timeAgo = this.getTimeAgo(notification.createdAt);
            const unreadClass = !notification.isRead ? 'unread' : '';

            return `
                <div class="notification-item ${unreadClass}" data-id="${notification.id}" data-url="${notification.redirectUrl || ''}">
                    <div class="notification-icon ${icon.class}">
                        <i class="${icon.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to notification items
        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const url = item.dataset.url;
                this.handleNotificationClick(id, url);
            });
        });
    }

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            'PaymentSubmitted': { icon: 'fas fa-money-bill-wave', class: 'payment' },
            'PaymentApproved': { icon: 'fas fa-check-circle', class: 'payment' },
            'PaymentRejected': { icon: 'fas fa-times-circle', class: 'rejection' },
            'TenantAdded': { icon: 'fas fa-user-plus', class: 'tenant' },
            'MaintenanceRequest': { icon: 'fas fa-tools', class: 'maintenance' },
            'ReminderDue': { icon: 'fas fa-calendar-exclamation', class: 'reminder' },
            'ProfileUpdate': { icon: 'fas fa-user-edit', class: 'tenant' }
        };
        return icons[type] || { icon: 'fas fa-bell', class: 'tenant' };
    }

    /**
     * Get time ago string
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    /**
     * Handle notification click
     */
    async handleNotificationClick(notificationId, redirectUrl) {
        // Mark as read
        await this.markAsRead(notificationId);

        // Close dropdown
        this.closeDropdown();

        // Redirect if URL is provided
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId) {
        try {
            await apiService.markNotificationAsRead(notificationId);
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.isRead) {
                notification.isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            await apiService.markAllNotificationsAsRead();
            
            // Update local state
            this.notifications.forEach(n => n.isRead = true);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderNotifications();
            
            console.log('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    /**
     * Clear read notifications
     */
    async clearReadNotifications() {
        if (!confirm('Clear all read notifications?')) {
            return;
        }

        try {
            await apiService.clearReadNotifications();
            
            // Update local state
            this.notifications = this.notifications.filter(n => !n.isRead);
            this.renderNotifications();
            
            console.log('Read notifications cleared');
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    }

    /**
     * Update badge count
     */
    updateBadge() {
        if (!this.notificationBadge) return;

        if (this.unreadCount > 0) {
            this.notificationBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.notificationBadge.style.display = 'block';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (!this.notificationDropdown) {
            return;
        }

        const isActive = this.notificationDropdown.classList.contains('active');
        
        if (isActive) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        if (!this.notificationDropdown) {
            return;
        }
        this.notificationDropdown.classList.add('active');
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (!this.notificationDropdown) return;
        this.notificationDropdown.classList.remove('active');
    }

    /**
     * Show error message
     */
    showError() {
        if (!this.notificationList) return;
        this.notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load notifications</p>
            </div>
        `;
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Destroy notification manager
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.notificationSection) {
            this.notificationSection.style.display = 'none';
        }
    }
}

// Create global instance
const notificationManager = new NotificationManager();

// Export for use in other files
window.notificationManager = notificationManager;
