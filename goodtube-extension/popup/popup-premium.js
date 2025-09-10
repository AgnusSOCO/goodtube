// GoodTube Pro Premium UI - Advanced JavaScript Controller
class GoodTubeProPremium {
    constructor() {
        this.stats = {
            adsBlocked: 0,
            timeSaved: 0,
            sessionsCount: 1
        };
        
        this.settings = {
            adBlocking: true,
            autoSkip: true,
            hideShorts: false,
            analytics: true
        };
        
        this.isLoading = false;
        this.settingsExpanded = false;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.startAnimations();
        this.setupRippleEffect();
    }
    
    async loadData() {
        try {
            // Load stats from Chrome storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['goodtubeStats', 'goodtubeSettings']);
                if (result.goodtubeStats) {
                    this.stats = { ...this.stats, ...result.goodtubeStats };
                }
                if (result.goodtubeSettings) {
                    this.settings = { ...this.settings, ...result.goodtubeSettings };
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    async saveData() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    goodtubeStats: this.stats,
                    goodtubeSettings: this.settings
                });
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    setupEventListeners() {
        // Action buttons
        document.getElementById('manualBlockBtn')?.addEventListener('click', () => {
            this.handleManualBlock();
        });
        
        document.getElementById('refreshPageBtn')?.addEventListener('click', () => {
            this.handleRefreshPage();
        });
        
        // Settings panel toggle
        document.getElementById('settingsToggle')?.addEventListener('click', () => {
            this.toggleSettingsPanel();
        });
        
        // Setting toggles
        document.getElementById('adBlockingToggle')?.addEventListener('change', (e) => {
            this.updateSetting('adBlocking', e.target.checked);
        });
        
        document.getElementById('autoSkipToggle')?.addEventListener('change', (e) => {
            this.updateSetting('autoSkip', e.target.checked);
        });
        
        document.getElementById('hideShortsToggle')?.addEventListener('change', (e) => {
            this.updateSetting('hideShorts', e.target.checked);
        });
        
        document.getElementById('analyticsToggle')?.addEventListener('change', (e) => {
            this.updateSetting('analytics', e.target.checked);
        });
        
        // Footer buttons
        document.getElementById('dashboardBtn')?.addEventListener('click', () => {
            this.openDashboard();
        });
        
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.openHelp();
        });
        
        // Toast close button
        document.querySelector('.toast-close')?.addEventListener('click', () => {
            this.hideNotification();
        });
        
        // Stat cards hover effects
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animateStatCard(card);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    updateUI() {
        // Update stats display
        this.updateStatsDisplay();
        
        // Update settings toggles
        this.updateSettingsToggles();
        
        // Update status indicator
        this.updateStatusIndicator();
    }
    
    updateStatsDisplay() {
        const adsBlockedEl = document.getElementById('adsBlocked');
        const timeSavedEl = document.getElementById('timeSaved');
        const sessionsCountEl = document.getElementById('sessionsCount');
        
        if (adsBlockedEl) {
            this.animateNumber(adsBlockedEl, this.stats.adsBlocked);
        }
        
        if (timeSavedEl) {
            const minutes = Math.floor(this.stats.timeSaved / 60);
            const seconds = this.stats.timeSaved % 60;
            const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            this.animateText(timeSavedEl, timeText);
        }
        
        if (sessionsCountEl) {
            this.animateNumber(sessionsCountEl, this.stats.sessionsCount);
        }
    }
    
    updateSettingsToggles() {
        document.getElementById('adBlockingToggle').checked = this.settings.adBlocking;
        document.getElementById('autoSkipToggle').checked = this.settings.autoSkip;
        document.getElementById('hideShortsToggle').checked = this.settings.hideShorts;
        document.getElementById('analyticsToggle').checked = this.settings.analytics;
    }
    
    updateStatusIndicator() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (this.settings.adBlocking) {
            statusDot?.classList.add('active');
            if (statusText) statusText.textContent = 'Active';
        } else {
            statusDot?.classList.remove('active');
            if (statusText) statusText.textContent = 'Inactive';
        }
    }
    
    async handleManualBlock() {
        this.showLoading('Blocking ads...');
        
        try {
            // Send message to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'manualBlock' });
            
            // Update stats
            this.stats.adsBlocked += 1;
            this.stats.timeSaved += 8;
            await this.saveData();
            this.updateStatsDisplay();
            
            this.hideLoading();
            this.showNotification('Success', 'Ads blocked successfully!', 'success');
            
        } catch (error) {
            console.error('Manual block error:', error);
            this.hideLoading();
            this.showNotification('Error', 'Failed to block ads', 'error');
        }
    }
    
    async handleRefreshPage() {
        this.showLoading('Refreshing page...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.reload(tab.id);
            
            setTimeout(() => {
                this.hideLoading();
                this.showNotification('Success', 'Page refreshed successfully!', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Refresh error:', error);
            this.hideLoading();
            this.showNotification('Error', 'Failed to refresh page', 'error');
        }
    }
    
    toggleSettingsPanel() {
        const toggle = document.getElementById('settingsToggle');
        const content = document.getElementById('settingsContent');
        
        this.settingsExpanded = !this.settingsExpanded;
        
        if (this.settingsExpanded) {
            toggle?.classList.add('expanded');
            content?.classList.add('expanded');
        } else {
            toggle?.classList.remove('expanded');
            content?.classList.remove('expanded');
        }
        
        // Add haptic feedback
        this.addHapticFeedback();
    }
    
    async updateSetting(key, value) {
        this.settings[key] = value;
        await this.saveData();
        
        // Send message to content script
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'updateSettings',
                settings: this.settings
            });
        } catch (error) {
            console.error('Settings update error:', error);
        }
        
        this.updateStatusIndicator();
        this.showNotification('Settings Updated', `${key} ${value ? 'enabled' : 'disabled'}`, 'success');
        this.addHapticFeedback();
    }
    
    openDashboard() {
        chrome.tabs.create({ url: 'http://134.199.235.218' });
        this.addHapticFeedback();
    }
    
    openHelp() {
        chrome.tabs.create({ url: 'https://github.com/AgnusSOCO/goodtubepro' });
        this.addHapticFeedback();
    }
    
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        
        if (loadingText) loadingText.textContent = text;
        overlay?.classList.add('visible');
        this.isLoading = true;
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay?.classList.remove('visible');
        this.isLoading = false;
    }
    
    showNotification(title, message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const toastTitle = document.querySelector('.toast-title');
        const toastMessage = document.querySelector('.toast-message');
        const toastIcon = document.querySelector('.toast-icon');
        
        if (toastTitle) toastTitle.textContent = title;
        if (toastMessage) toastMessage.textContent = message;
        
        // Update icon based on type
        if (toastIcon) {
            const iconSvg = type === 'success' 
                ? '<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><polyline points=\"20,6 9,17 4,12\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>'
                : '<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"2\"/><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\" stroke=\"currentColor\" stroke-width=\"2\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>';
            toastIcon.innerHTML = iconSvg;
            toastIcon.style.color = type === 'success' ? '#22c55e' : '#ef4444';
        }
        
        toast?.classList.add('visible');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }
    
    hideNotification() {
        const toast = document.getElementById('notificationToast');
        toast?.classList.remove('visible');
    }
    
    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        if (currentValue < targetValue) {
            element.textContent = Math.min(currentValue + increment, targetValue);
            setTimeout(() => this.animateNumber(element, targetValue), 50);
        }
    }
    
    animateText(element, targetText) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            element.textContent = targetText;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 150);
    }
    
    animateStatCard(card) {
        const icon = card.querySelector('.stat-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            setTimeout(() => {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }, 200);
        }
    }
    
    setupRippleEffect() {
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    }
    
    createRipple(event, button) {
        const ripple = button.querySelector('.btn-ripple');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 600ms linear';
        
        setTimeout(() => {
            ripple.style.animation = '';
        }, 600);
    }
    
    startAnimations() {
        // Stagger animation for stat cards
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Animate action buttons
        document.querySelectorAll('.action-btn').forEach((btn, index) => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                btn.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 300 + index * 100);
        });
    }
    
    handleKeyboardShortcuts(event) {
        if (this.isLoading) return;
        
        switch (event.key) {
            case 'b':
            case 'B':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleManualBlock();
                }
                break;
            case 'r':
            case 'R':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleRefreshPage();
                }
                break;
            case 's':
            case 'S':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleSettingsPanel();
                }
                break;
            case 'Escape':
                this.hideNotification();
                if (this.settingsExpanded) {
                    this.toggleSettingsPanel();
                }
                break;
        }
    }
    
    addHapticFeedback() {
        // Vibration API for mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    // Auto-update stats periodically
    startStatsUpdater() {
        setInterval(async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStats' });
                
                if (response) {
                    this.stats = { ...this.stats, ...response };
                    this.updateStatsDisplay();
                    await this.saveData();
                }
            } catch (error) {
                // Ignore errors when tab is not available
            }
        }, 5000);
    }
}

// Initialize the premium UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new GoodTubeProPremium();
    
    // Start periodic stats updates
    app.startStatsUpdater();
    
    // Add global error handler
    window.addEventListener('error', (event) => {
        console.error('GoodTube Pro Error:', event.error);
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('GoodTube Pro Promise Rejection:', event.reason);
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoodTubeProPremium;
}

