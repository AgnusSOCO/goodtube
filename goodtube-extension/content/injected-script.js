// GoodTube Pro Injected Script - Runs in page context for advanced blocking

(function() {
    'use strict';
    
    console.log('🛡️ GoodTube Pro: Injected script loaded');
    
    // Advanced ad blocking at the network level
    class AdvancedAdBlocker {
        constructor() {
            this.blockedRequests = 0;
            this.adPatterns = [
                /doubleclick\.net/,
                /googleadservices\.com/,
                /googlesyndication\.com/,
                /googletagmanager\.com/,
                /google-analytics\.com/,
                /googletagservices\.com/,
                /adsystem\.google/,
                /pagead2\.googlesyndication/,
                /tpc\.googlesyndication/,
                /youtube\.com\/api\/stats\/ads/,
                /youtube\.com\/ptracking/,
                /youtube\.com\/api\/stats\/qoe/
            ];
            
            this.init();
        }
        
        init() {
            this.interceptFetch();
            this.interceptXHR();
            this.blockAdScripts();
            this.interceptVideoAds();
        }
        
        interceptFetch() {
            const originalFetch = window.fetch;
            
            window.fetch = (...args) => {
                const url = args[0];
                
                if (this.shouldBlockRequest(url)) {
                    console.log('🛡️ GoodTube Pro: Blocked fetch request:', url);
                    this.blockedRequests++;
                    return Promise.reject(new Error('Blocked by GoodTube Pro'));
                }
                
                return originalFetch.apply(this, args);
            };
        }
        
        interceptXHR() {
            const originalOpen = XMLHttpRequest.prototype.open;
            
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                if (window.goodTubeAdvancedBlocker && window.goodTubeAdvancedBlocker.shouldBlockRequest(url)) {
                    console.log('🛡️ GoodTube Pro: Blocked XHR request:', url);
                    window.goodTubeAdvancedBlocker.blockedRequests++;
                    return;
                }
                
                return originalOpen.call(this, method, url, ...args);
            };
        }
        
        shouldBlockRequest(url) {
            if (typeof url !== 'string') return false;
            
            return this.adPatterns.some(pattern => pattern.test(url));
        }
        
        blockAdScripts() {
            // Override ad-related functions
            const adFunctions = [
                'googletag',
                'googlefc',
                'adsbygoogle',
                '__gads',
                '__gpi'
            ];
            
            adFunctions.forEach(funcName => {
                try {
                    Object.defineProperty(window, funcName, {
                        get: () => undefined,
                        set: () => {},
                        configurable: false
                    });
                } catch (e) {
                    // Silently handle errors
                }
            });
        }
        
        interceptVideoAds() {
            // Intercept video ad loading
            const originalCreateElement = document.createElement;
            
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                
                if (tagName.toLowerCase() === 'video') {
                    // Monitor video elements for ads
                    element.addEventListener('loadstart', function() {
                        if (this.src && window.goodTubeAdvancedBlocker.shouldBlockRequest(this.src)) {
                            console.log('🛡️ GoodTube Pro: Blocked video ad:', this.src);
                            this.src = '';
                            this.load();
                        }
                    });
                }
                
                return element;
            };
        }
        
        getStats() {
            return {
                blockedRequests: this.blockedRequests
            };
        }
    }
    
    // YouTube-specific enhancements
    class YouTubeEnhancer {
        constructor() {
            this.init();
        }
        
        init() {
            this.enhanceVideoPlayer();
            this.interceptYouTubeAPI();
            this.setupKeyboardShortcuts();
        }
        
        enhanceVideoPlayer() {
            // Auto-skip ads when they appear
            const checkForAds = () => {
                const video = document.querySelector('video');
                if (!video) return;
                
                const adText = document.querySelector('.ytp-ad-text');
                const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
                
                if (adText && skipButton && skipButton.offsetParent !== null) {
                    skipButton.click();
                    console.log('🛡️ GoodTube Pro: Auto-clicked skip button');
                }
                
                // Skip unskippable ads by seeking to the end
                if (adText && !skipButton) {
                    const duration = video.duration;
                    if (duration && duration > 0) {
                        video.currentTime = duration - 0.1;
                        console.log('🛡️ GoodTube Pro: Skipped unskippable ad');
                    }
                }
            };
            
            setInterval(checkForAds, 500);
        }
        
        interceptYouTubeAPI() {
            // Intercept YouTube's internal API calls
            if (window.yt && window.yt.config_) {
                try {
                    // Disable ad-related configurations
                    if (window.yt.config_.EXPERIMENT_FLAGS) {
                        window.yt.config_.EXPERIMENT_FLAGS.enable_ad_cpn_macro_substitution_for_click_pings = false;
                        window.yt.config_.EXPERIMENT_FLAGS.enable_server_stitched_dai = false;
                        window.yt.config_.EXPERIMENT_FLAGS.enable_ad_video_quality_logging = false;
                    }
                } catch (e) {
                    console.log('🛡️ GoodTube Pro: Could not modify YouTube config');
                }
            }
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+A - Force ad skip
                if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                    e.preventDefault();
                    this.forceSkipAd();
                }
            });
        }
        
        forceSkipAd() {
            const video = document.querySelector('video');
            const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
            
            if (skipButton) {
                skipButton.click();
            } else if (video && video.duration) {
                video.currentTime = video.duration - 0.1;
            }
            
            console.log('🛡️ GoodTube Pro: Force skip triggered');
        }
    }
    
    // Performance monitor
    class PerformanceMonitor {
        constructor() {
            this.metrics = {
                pageLoadTime: 0,
                adsBlocked: 0,
                memoryUsage: 0
            };
            
            this.init();
        }
        
        init() {
            this.measurePageLoad();
            this.monitorMemory();
        }
        
        measurePageLoad() {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
                console.log('🛡️ GoodTube Pro: Page load time:', this.metrics.pageLoadTime + 'ms');
            });
        }
        
        monitorMemory() {
            if ('memory' in performance) {
                setInterval(() => {
                    this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
                }, 10000);
            }
        }
        
        getMetrics() {
            return this.metrics;
        }
    }
    
    // Initialize all components
    window.goodTubeAdvancedBlocker = new AdvancedAdBlocker();
    window.goodTubeYouTubeEnhancer = new YouTubeEnhancer();
    window.goodTubePerformanceMonitor = new PerformanceMonitor();
    
    // Expose stats for content script
    window.getGoodTubeStats = () => {
        return {
            ...window.goodTubeAdvancedBlocker.getStats(),
            ...window.goodTubePerformanceMonitor.getMetrics()
        };
    };
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        console.log('🛡️ GoodTube Pro: Injected script cleanup');
    });
    
    // Prevent detection by YouTube's anti-adblock
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
    });
    
    // Hide extension presence
    const originalQuery = document.querySelector;
    document.querySelector = function(selector) {
        if (selector.includes('goodtube') || selector.includes('adblock')) {
            return null;
        }
        return originalQuery.call(this, selector);
    };
    
    console.log('🛡️ GoodTube Pro: Advanced blocking initialized');
    
})();

