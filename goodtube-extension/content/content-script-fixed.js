/**
 * GoodTube Pro - Enhanced Content Script (Fixed Version)
 * Improved ad blocking with mid-roll support and non-invasive UI
 */

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
        this.videoAdMonitored = new Set();
        
        this.init();
    }
    
    async init() {
        console.log('🛡️ GoodTube Pro: Initializing Enhanced Version...');
        
        await this.loadSettings();
        await this.loadStats();
        this.setupMessageListener();
        this.injectStyles();
        this.createNonInvasiveUI();
        this.startMainLoop();
        this.setupUrlChangeDetection();
        this.setupVideoAdMonitoring();
        
        console.log('🛡️ GoodTube Pro: Enhanced version ready!');
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
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getStats':
                    sendResponse(this.stats);
                    break;
                case 'updateSettings':
                    this.settings = { ...this.settings, ...request.settings };
                    this.applySettings();
                    sendResponse({ success: true });
                    break;
                case 'manualBlock':
                    this.performManualAdBlock();
                    sendResponse({ success: true });
                    break;
            }
        });
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* GoodTube Pro Enhanced Styles */
            .goodtube-hidden {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Non-invasive floating button */
            .goodtube-floating-btn {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                width: 50px !important;
                height: 50px !important;
                border-radius: 50% !important;
                background: linear-gradient(135deg, #8B5CF6, #EC4899) !important;
                border: none !important;
                color: white !important;
                font-size: 18px !important;
                cursor: pointer !important;
                z-index: 999999 !important;
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
                transition: all 0.3s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .goodtube-floating-btn:hover {
                transform: translateY(-2px) scale(1.05) !important;
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
            }
            
            /* Tooltip */
            .goodtube-floating-btn::after {
                content: 'GoodTube Pro';
                position: absolute;
                bottom: 60px;
                right: 0;
                background: #1a1a1a;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                border: 1px solid #3a3a3a;
            }
            
            .goodtube-floating-btn:hover::after {
                opacity: 1;
            }
            
            /* Notification system */
            .goodtube-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #8B5CF6, #EC4899);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s ease;
                font-size: 13px;
                max-width: 300px;
            }
            
            .goodtube-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    createNonInvasiveUI() {
        // Create floating button instead of invasive overlay
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'goodtube-floating-btn';
        floatingBtn.innerHTML = '🛡️';
        floatingBtn.title = 'GoodTube Pro Settings';
        
        floatingBtn.addEventListener('click', () => {
            // Send message to popup to open
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
        
        document.body.appendChild(floatingBtn);
        
        // Hide button with keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    floatingBtn.style.display = floatingBtn.style.display === 'none' ? 'flex' : 'none';
                    this.showNotification(
                        floatingBtn.style.display === 'none' ? 'UI Hidden (Press H to show)' : 'UI Visible',
                        'info'
                    );
                }
            }
        });
    }
    
    showNotification(message, type = 'info') {
        if (!this.settings.notifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'goodtube-notification';
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    startMainLoop() {
        // More frequent checking for better mid-roll ad detection
        setInterval(() => {
            if (this.settings.adBlocking) {
                this.blockAds();
            }
            if (this.settings.hideShorts) {
                this.hideShorts();
            }
        }, 500); // Increased frequency for better ad detection
    }
    
    setupUrlChangeDetection() {
        setInterval(() => {
            if (window.location.href !== this.lastUrl) {
                this.lastUrl = window.location.href;
                setTimeout(() => {
                    this.onPageChange();
                }, 1000);
            }
        }, 500);
    }
    
    setupVideoAdMonitoring() {
        // Monitor video elements for ad detection
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check for video elements
                        const videos = node.tagName === 'VIDEO' ? [node] : node.querySelectorAll?.('video') || [];
                        videos.forEach(video => this.monitorVideoForAds(video));
                        
                        // Check for ad elements
                        this.checkForAdElements(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(observer);
    }
    
    monitorVideoForAds(video) {
        if (this.videoAdMonitored.has(video)) return;
        this.videoAdMonitored.add(video);
        
        video.addEventListener('loadstart', () => {
            setTimeout(() => {
                this.checkForVideoAds(video);
            }, 500);
        });
        
        video.addEventListener('timeupdate', () => {
            this.checkForVideoAds(video);
        });
    }
    
    checkForVideoAds(video) {
        const playerContainer = video.closest('#movie_player, .html5-video-player');
        if (!playerContainer) return;
        
        // Check for ad indicators
        const adIndicators = playerContainer.querySelectorAll(
            '.ytp-ad-text, [class*="ad-text"], .ytp-ad-duration-remaining, .ytp-ad-preview-text'
        );
        
        if (adIndicators.length > 0) {
            // This is an ad, try to skip it
            this.skipVideoAd(video, playerContainer);
        }
    }
    
    skipVideoAd(video, playerContainer) {
        // Try to click skip button first
        const skipButtons = playerContainer.querySelectorAll(
            '.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, [class*="skip"]'
        );
        
        let skipped = false;
        skipButtons.forEach(button => {
            if (button.offsetParent !== null && !button.disabled && button.style.display !== 'none') {
                setTimeout(() => {
                    button.click();
                    this.updateStats(1, 15);
                    this.showNotification('Ad skipped automatically', 'success');
                }, 100);
                skipped = true;
            }
        });
        
        // If no skip button, try to fast-forward
        if (!skipped && video.duration && video.duration > 0) {
            video.currentTime = video.duration;
            this.updateStats(1, 8);
        }
    }
    
    checkForAdElements(element) {
        // Check if the element or its children contain ads
        const adSelectors = [
            '.ytp-ad-overlay-container', '.ytp-ad-text-overlay', '.ytp-ad-image-overlay',
            '.ad-showing', '.ad-interrupting', '[class*="ad-showing"]'
        ];
        
        adSelectors.forEach(selector => {
            const adElements = element.matches?.(selector) ? [element] : element.querySelectorAll?.(selector) || [];
            adElements.forEach(adElement => {
                this.hideElement(adElement);
                this.updateStats(1, 5);
            });
        });
    }
    
    blockAds() {
        let adsBlocked = 0;
        
        // Comprehensive ad selectors including mid-roll ads
        const adSelectors = [
            // Video ads
            '.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
            '.ytp-ad-text-overlay', '[id^="player-ads"]', '.ytp-ad-player-overlay',
            '.ytp-ad-overlay-slot', '.ytp-ad-overlay-image', '.ytp-ad-image-overlay',
            
            // Mid-roll and pre-roll ads
            '.ytp-ad-preview-container', '.ytp-ad-preview-text', '.ytp-ad-preview-image',
            '.ad-showing', '.ad-interrupting', '[class*="ad-showing"]',
            
            // Sponsored content
            '.ytd-promoted-sparkles-web-renderer', '.ytd-ad-slot-renderer',
            '.ytd-banner-promo-renderer', 'ytd-in-feed-ad-layout-renderer',
            '[aria-label*="Sponsored"]', '[title*="Sponsored"]',
            
            // Shopping and product ads
            '.ytd-product-details-renderer', '.ytd-shopping-carousel-renderer',
            
            // Generic ad containers
            '[data-ad-slot-id]', '[id*="google_ads"]', '.googima-ad-div',
            '[class*="advertisement"]', '[id*="advertisement"]'
        ];
        
        // Block ads by hiding elements
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.classList.contains('goodtube-hidden')) {
                    this.hideElement(element);
                    adsBlocked++;
                }
            });
        });
        
        // Enhanced skip button detection
        const skipSelectors = [
            '.ytp-ad-skip-button', '.ytp-skip-ad-button', '.ytp-ad-skip-button-modern',
            '[class*="skip"]', '[aria-label*="Skip"]', '[title*="Skip"]',
            '.videoAdUiSkipButton', '.skip-button', '[data-purpose="skip-button"]'
        ];
        
        skipSelectors.forEach(selector => {
            const skipButtons = document.querySelectorAll(selector);
            skipButtons.forEach(button => {
                if (button.offsetParent !== null && !button.disabled && button.style.display !== 'none') {
                    setTimeout(() => {
                        button.click();
                        adsBlocked++;
                        this.showNotification('Ad skipped automatically', 'success');
                    }, 100);
                }
            });
        });
        
        // Update statistics if ads were blocked
        if (adsBlocked > 0) {
            this.updateStats(adsBlocked, adsBlocked * 8);
        }
    }
    
    hideShorts() {
        const shortsSelectors = [
            'ytd-rich-shelf-renderer[is-shorts]',
            'ytd-reel-shelf-renderer',
            '[aria-label*="Shorts"]',
            'ytd-shorts',
            '[href*="/shorts/"]'
        ];
        
        shortsSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.hideElement(element);
            });
        });
    }
    
    hideElement(element) {
        if (element && !element.classList.contains('goodtube-hidden')) {
            element.classList.add('goodtube-hidden');
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('width', '0', 'important');
            element.style.setProperty('margin', '0', 'important');
            element.style.setProperty('padding', '0', 'important');
        }
    }
    
    performManualAdBlock() {
        this.blockAds();
        this.showNotification('Manual ad block triggered', 'success');
    }
    
    updateStats(adsBlocked = 0, timeSaved = 0) {
        this.stats.adsBlocked += adsBlocked;
        this.stats.timeSaved += timeSaved;
        this.stats.sessionAds += adsBlocked;
        
        this.saveStats();
        
        // Send updated stats to popup
        chrome.runtime.sendMessage({
            action: 'statsUpdated',
            stats: this.stats
        }).catch(() => {
            // Ignore errors if popup is not open
        });
    }
    
    onPageChange() {
        console.log('🛡️ GoodTube Pro: Page changed, reapplying settings...');
        this.applySettings();
    }
    
    applySettings() {
        if (this.settings.adBlocking) {
            this.blockAds();
        }
        if (this.settings.hideShorts) {
            this.hideShorts();
        }
    }
    
    destroy() {
        // Clean up observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.videoAdMonitored.clear();
    }
}

// Initialize GoodTube Pro
const goodTubePro = new GoodTubeContentScript();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    goodTubePro.destroy();
});

