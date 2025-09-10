// GoodTube Pro Content Script - YouTube Integration

class GoodTubeContentScript {
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
            sessionAds: 0,
            sessionStart: Date.now()
        };
        
        this.observers = [];
        this.adBlockingActive = false;
        this.lastUrl = '';
        
        this.init();
    }
    
    async init() {
        console.log('🛡️ GoodTube Pro: Initializing...');
        
        await this.loadSettings();
        await this.loadStats();
        this.setupMessageListener();
        this.injectStyles();
        this.startMainLoop();
        this.setupUrlChangeDetection();
        
        console.log('🛡️ GoodTube Pro: Ready!');
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['goodtubeSettings']);
            if (result.goodtubeSettings) {
                this.settings = { ...this.settings, ...result.goodtubeSettings };
            }
        } catch (error) {
            console.error('GoodTube Pro: Error loading settings:', error);
        }
    }
    
    async loadStats() {
        try {
            const result = await chrome.storage.local.get(['goodtubeStats']);
            if (result.goodtubeStats) {
                this.stats = { ...this.stats, ...result.goodtubeStats };
            }
        } catch (error) {
            console.error('GoodTube Pro: Error loading stats:', error);
        }
    }
    
    async saveStats() {
        try {
            await chrome.storage.local.set({ goodtubeStats: this.stats });
        } catch (error) {
            console.error('GoodTube Pro: Error saving stats:', error);
        }
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'SETTINGS_UPDATED':
                    this.settings = message.settings;
                    this.applySettings();
                    break;
                    
                case 'MANUAL_BLOCK':
                    this.performManualBlock();
                    break;
                    
                case 'GET_STATS':
                    sendResponse({ stats: this.stats });
                    break;
            }
        });
    }
    
    injectStyles() {
        if (document.getElementById('goodtube-pro-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'goodtube-pro-styles';
        style.textContent = `
            /* GoodTube Pro Injected Styles */
            
            /* Hide ads */
            .goodtube-hidden {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Hide YouTube Shorts */
            ytd-rich-section-renderer[is-shorts],
            ytd-reel-shelf-renderer,
            ytd-shorts,
            [aria-label*="Shorts"],
            [title*="Shorts"],
            ytd-guide-entry-renderer:has([title="Shorts"]),
            ytd-mini-guide-entry-renderer:has([aria-label="Shorts"]) {
                display: none !important;
            }
            
            /* Notification styles */
            .goodtube-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                color: white;
                padding: 12px 20px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
                z-index: 10000;
                animation: goodtube-slide-in 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            @keyframes goodtube-slide-in {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .goodtube-notification.fade-out {
                animation: goodtube-fade-out 0.3s ease-out forwards;
            }
            
            @keyframes goodtube-fade-out {
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
            
            /* Performance mode optimizations */
            .goodtube-performance-mode * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            /* Enhanced video player */
            .goodtube-enhanced-player {
                position: relative;
            }
            
            /* REMOVED INVASIVE OVERLAY - No more "Protected by GoodTube Pro" message */
        `;
        
        document.head.appendChild(style);
    }
    
    startMainLoop() {
        // Main blocking loop
        setInterval(() => {
            if (this.settings.adBlocking) {
                this.blockAds();
            }
            
            if (this.settings.hideShorts) {
                this.hideShorts();
            }
            
            this.enhanceVideoPlayer();
        }, 1000);
        
        // Stats update loop
        setInterval(() => {
            this.saveStats();
        }, 10000);
    }
    
    setupUrlChangeDetection() {
        let currentUrl = location.href;
        
        const urlObserver = new MutationObserver(() => {
            if (location.href !== currentUrl) {
                currentUrl = location.href;
                this.onUrlChange();
            }
        });
        
        urlObserver.observe(document, { subtree: true, childList: true });
        this.observers.push(urlObserver);
    }
    
    onUrlChange() {
        console.log('🛡️ GoodTube Pro: URL changed, reapplying protections...');
        
        // Reset session ads for new video
        if (location.pathname.includes('/watch')) {
            this.stats.sessionAds = 0;
        }
        
        // Reapply all protections
        setTimeout(() => {
            this.applySettings();
        }, 500);
    }
    
    blockAds() {
        const adSelectors = [
            // Video ads
            '.ytp-ad-module',
            '.ytp-ad-overlay-container',
            '.ytp-ad-text-overlay',
            '.ytp-ad-player-overlay',
            '.video-ads',
            '.ytp-ad-image-overlay',
            
            // Sidebar ads
            '#player-ads',
            '.ytd-display-ad-renderer',
            '.ytd-promoted-sparkles-web-renderer',
            '.ytd-ad-slot-renderer',
            
            // Banner ads
            '.ytd-banner-promo-renderer',
            '.ytd-statement-banner-renderer',
            '.masthead-ad',
            
            // Sponsored content
            '.ytd-promoted-video-renderer',
            '.ytd-ad-slot-renderer',
            '[data-ad-slot-id]',
            
            // Skip buttons (click automatically)
            '.ytp-ad-skip-button',
            '.ytp-skip-ad-button'
        ];
        
        let adsBlocked = 0;
        
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.classList.contains('goodtube-hidden')) {
                    // Special handling for skip buttons
                    if (selector.includes('skip')) {
                        element.click();
                        console.log('🛡️ GoodTube Pro: Auto-clicked skip button');
                    } else {
                        element.classList.add('goodtube-hidden');
                        adsBlocked++;
                    }
                }
            });
        });
        
        // Block video ads by seeking past them
        this.skipVideoAds();
        
        if (adsBlocked > 0) {
            this.stats.adsBlocked += adsBlocked;
            this.stats.sessionAds += adsBlocked;
            this.stats.timeSaved += adsBlocked * 15; // Assume 15 seconds per ad
            
            if (this.settings.notifications) {
                this.showNotification(`🛡️ Blocked ${adsBlocked} ad${adsBlocked > 1 ? 's' : ''}!`);
            }
            
            console.log(`🛡️ GoodTube Pro: Blocked ${adsBlocked} ads`);
        }
    }
    
    skipVideoAds() {
        const video = document.querySelector('video');
        if (!video) return;
        
        // Check if we're in an ad
        const adIndicators = [
            '.ytp-ad-text',
            '.ytp-ad-duration-remaining',
            '.ytp-ad-preview-text'
        ];
        
        const isAd = adIndicators.some(selector => document.querySelector(selector));
        
        if (isAd && video.duration && video.currentTime < video.duration - 1) {
            // Skip to near the end of the ad
            video.currentTime = video.duration - 0.5;
            console.log('🛡️ GoodTube Pro: Skipped video ad');
            
            this.stats.adsBlocked++;
            this.stats.sessionAds++;
            this.stats.timeSaved += Math.floor(video.duration);
        }
    }
    
    hideShorts() {
        const shortsSelectors = [
            'ytd-rich-section-renderer[is-shorts]',
            'ytd-reel-shelf-renderer',
            'ytd-shorts',
            '[aria-label*="Shorts"]',
            '[title*="Shorts"]',
            'ytd-guide-entry-renderer:has([title="Shorts"])',
            'ytd-mini-guide-entry-renderer:has([aria-label="Shorts"])',
            '#shorts-container',
            '.ytd-rich-shelf-renderer:has([aria-label*="Shorts"])'
        ];
        
        let shortsHidden = 0;
        
        shortsSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.classList.contains('goodtube-hidden')) {
                    element.classList.add('goodtube-hidden');
                    shortsHidden++;
                }
            });
        });
        
        if (shortsHidden > 0) {
            console.log(`🛡️ GoodTube Pro: Hidden ${shortsHidden} Shorts elements`);
        }
    }
    
    enhanceVideoPlayer() {
        const player = document.querySelector('#movie_player, .html5-video-player');
        if (player && !player.classList.contains('goodtube-enhanced-player')) {
            player.classList.add('goodtube-enhanced-player');
        }
    }
    
    performManualBlock() {
        console.log('🛡️ GoodTube Pro: Manual block triggered');
        
        // Force a comprehensive ad block
        this.blockAds();
        this.hideShorts();
        
        // Remove any remaining ad elements
        const allAds = document.querySelectorAll('[id*="ad"], [class*="ad"], [data-ad]');
        let manualBlocks = 0;
        
        allAds.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes('advertisement') || text.includes('sponsored') || text.includes('promoted')) {
                if (!element.classList.contains('goodtube-hidden')) {
                    element.classList.add('goodtube-hidden');
                    manualBlocks++;
                }
            }
        });
        
        if (manualBlocks > 0) {
            this.stats.adsBlocked += manualBlocks;
            this.stats.sessionAds += manualBlocks;
            
            if (this.settings.notifications) {
                this.showNotification(`🛡️ Manual block: ${manualBlocks} elements removed!`);
            }
        } else {
            if (this.settings.notifications) {
                this.showNotification('🛡️ No ads found to block!');
            }
        }
    }
    
    applySettings() {
        console.log('🛡️ GoodTube Pro: Applying settings...', this.settings);
        
        // Apply performance mode
        if (this.settings.performanceMode) {
            document.body.classList.add('goodtube-performance-mode');
        } else {
            document.body.classList.remove('goodtube-performance-mode');
        }
        
        // Force immediate application of current settings
        if (this.settings.adBlocking) {
            this.blockAds();
        }
        
        if (this.settings.hideShorts) {
            this.hideShorts();
        }
    }
    
    showNotification(message, duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.goodtube-notification');
        existing.forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = 'goodtube-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Cleanup on page unload
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.saveStats();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.goodTubePro = new GoodTubeContentScript();
    });
} else {
    window.goodTubePro = new GoodTubeContentScript();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.goodTubePro) {
        window.goodTubePro.cleanup();
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!window.goodTubePro) return;
    
    // Ctrl+Shift+H - Toggle UI visibility
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        const style = document.getElementById('goodtube-pro-styles');
        if (style) {
            style.disabled = !style.disabled;
            window.goodTubePro.showNotification(
                style.disabled ? '🛡️ GoodTube Pro UI hidden' : '🛡️ GoodTube Pro UI visible'
            );
        }
    }
    
    // Ctrl+Shift+B - Manual block
    if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        window.goodTubePro.performManualBlock();
    }
});

console.log('🛡️ GoodTube Pro Content Script loaded');

