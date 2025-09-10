// GoodTube Pro Extension Popup JavaScript

class GoodTubePopup {
    constructor() {
        this.settings = {
            adBlocking: true,
            hideShorts: true,
            notifications: true,
            performanceMode: false
        };
        
        this.stats = {
            adsBlocked: 0,
            timeSaved: 0,
            sessionAds: 0
        };
        
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        await this.loadStats();
        this.setupEventListeners();
        this.updateUI();
        this.startStatsUpdater();
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['goodtubeSettings']);
            if (result.goodtubeSettings) {
                this.settings = { ...this.settings, ...result.goodtubeSettings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            await chrome.storage.sync.set({ goodtubeSettings: this.settings });
            // Notify content script of settings change
            this.sendMessageToActiveTab({ type: 'SETTINGS_UPDATED', settings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    async loadStats() {
        try {
            const result = await chrome.storage.local.get(['goodtubeStats']);
            if (result.goodtubeStats) {
                this.stats = { ...this.stats, ...result.goodtubeStats };
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    async saveStats() {
        try {
            await chrome.storage.local.set({ goodtubeStats: this.stats });
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
    
    setupEventListeners() {
        // Toggle switches
        document.getElementById('adBlockCheckbox').addEventListener('change', (e) => {
            this.settings.adBlocking = e.target.checked;
            this.saveSettings();
            this.updateStatusIndicator();
        });
        
        document.getElementById('shortsCheckbox').addEventListener('change', (e) => {
            this.settings.hideShorts = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('notificationsCheckbox').addEventListener('change', (e) => {
            this.settings.notifications = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('performanceCheckbox').addEventListener('change', (e) => {
            this.settings.performanceMode = e.target.checked;
            this.saveSettings();
        });
        
        // Action buttons
        document.getElementById('manualBlockBtn').addEventListener('click', () => {
            this.triggerManualBlock();
        });
        
        document.getElementById('refreshPageBtn').addEventListener('click', () => {
            this.refreshCurrentTab();
        });
        
        // Footer buttons
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });
        
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.openStats();
        });
        
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openHelp();
        });
    }
    
    updateUI() {
        // Update toggle switches
        document.getElementById('adBlockCheckbox').checked = this.settings.adBlocking;
        document.getElementById('shortsCheckbox').checked = this.settings.hideShorts;
        document.getElementById('notificationsCheckbox').checked = this.settings.notifications;
        document.getElementById('performanceCheckbox').checked = this.settings.performanceMode;
        
        // Update stats display
        this.updateStatsDisplay();
        this.updateStatusIndicator();
    }
    
    updateStatsDisplay() {
        document.getElementById('adsBlocked').textContent = this.formatNumber(this.stats.adsBlocked);
        document.getElementById('timeSaved').textContent = this.formatTime(this.stats.timeSaved);
        document.getElementById('sessionAds').textContent = this.formatNumber(this.stats.sessionAds);
    }
    
    updateStatusIndicator() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDot = statusIndicator.querySelector('.status-dot');
        
        if (this.settings.adBlocking) {
            statusText.textContent = 'Active';
            statusDot.style.background = '#10B981';
            statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
            statusIndicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else {
            statusText.textContent = 'Disabled';
            statusDot.style.background = '#EF4444';
            statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
            statusIndicator.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatTime(seconds) {
        if (seconds >= 3600) {
            return Math.floor(seconds / 3600) + 'h';
        } else if (seconds >= 60) {
            return Math.floor(seconds / 60) + 'm';
        }
        return seconds + 's';
    }
    
    async sendMessageToActiveTab(message) {
        try {
            // Check if chrome.tabs API is available
            if (!chrome.tabs) {
                console.error('Chrome tabs API not available');
                return;
            }
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('youtube.com')) {
                await chrome.tabs.sendMessage(tab.id, message);
            }
        } catch (error) {
            console.error('Error sending message to tab:', error);
        }
    }
    
    async triggerManualBlock() {
        const button = document.getElementById('manualBlockBtn');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="animate-spin">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Blocking...
        `;
        button.disabled = true;
        
        try {
            await this.sendMessageToActiveTab({ type: 'MANUAL_BLOCK' });
            
            // Simulate successful block
            setTimeout(() => {
                this.stats.adsBlocked++;
                this.stats.sessionAds++;
                this.updateStatsDisplay();
                this.saveStats();
                
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Blocked!
                `;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 1500);
            }, 1000);
        } catch (error) {
            console.error('Manual block failed:', error);
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
    
    async refreshCurrentTab() {
        try {
            // Check if chrome.tabs API is available
            if (!chrome.tabs) {
                console.error('Chrome tabs API not available');
                return;
            }
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await chrome.tabs.reload(tab.id);
                window.close();
            }
        } catch (error) {
            console.error('Error refreshing tab:', error);
        }
    }
    
    openSettings() {
        try {
            if (chrome.tabs && chrome.runtime) {
                chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html?settings=true') });
                window.close();
            }
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    }
    
    openStats() {
        try {
            if (chrome.tabs && chrome.runtime) {
                chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html?stats=true') });
                window.close();
            }
        } catch (error) {
            console.error('Error opening stats:', error);
        }
    }
    
    openHelp() {
        try {
            if (chrome.tabs) {
                chrome.tabs.create({ url: 'https://github.com/AgnusSOCO/goodtube' });
                window.close();
            }
        } catch (error) {
            console.error('Error opening help:', error);
        }
    }
    
    startStatsUpdater() {
        // Update stats every 5 seconds
        setInterval(async () => {
            try {
                const response = await this.sendMessageToActiveTab({ type: 'GET_STATS' });
                if (response && response.stats) {
                    this.stats = { ...this.stats, ...response.stats };
                    this.updateStatsDisplay();
                    this.saveStats();
                }
            } catch (error) {
                // Silently handle errors for background updates
            }
        }, 5000);
    }
    
    // Animate stats on load
    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach((element, index) => {
            const finalValue = element.textContent;
            element.textContent = '0';
            
            setTimeout(() => {
                this.animateNumber(element, 0, parseInt(finalValue.replace(/[^0-9]/g, '')), 1000);
            }, index * 200);
        });
    }
    
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const originalText = element.textContent;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = originalText;
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GoodTubePopup();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.close();
    }
});

// Add CSS animation for spinning icon
const style = document.createElement('style');
style.textContent = `
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

