// GoodTube Pro Background Service Worker

class GoodTubeServiceWorker {
    constructor() {
        this.version = '4.0.0';
        this.defaultSettings = {
            adBlocking: true,
            hideShorts: true,
            notifications: true,
            performanceMode: false,
            autoSkip: true,
            keyboardShortcuts: true
        };
        
        this.defaultStats = {
            adsBlocked: 0,
            timeSaved: 0,
            sessionAds: 0,
            totalSessions: 0,
            installDate: Date.now(),
            lastActive: Date.now()
        };
        
        this.init();
    }
    
    init() {
        console.log('🛡️ GoodTube Pro Service Worker: Starting v' + this.version);
        
        this.setupEventListeners();
        this.initializeStorage();
        this.setupAlarms();
        this.setupContextMenus();
        this.injectContentScripts();
    }
    
    setupEventListeners() {
        // Extension installation/update
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });
        
        // Extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });
        
        // Message handling
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
        
        // Tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
        
        // Keyboard commands
        chrome.commands.onCommand.addListener((command) => {
            this.handleCommand(command);
        });
        
        // Storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.handleStorageChange(changes, namespace);
        });
    }
    
    async initializeStorage() {
        try {
            // Initialize settings if not exists
            const settingsResult = await chrome.storage.sync.get(['goodtubeSettings']);
            if (!settingsResult.goodtubeSettings) {
                await chrome.storage.sync.set({ 
                    goodtubeSettings: this.defaultSettings 
                });
                console.log('🛡️ GoodTube Pro: Initialized default settings');
            }
            
            // Initialize stats if not exists
            const statsResult = await chrome.storage.local.get(['goodtubeStats']);
            if (!statsResult.goodtubeStats) {
                await chrome.storage.local.set({ 
                    goodtubeStats: this.defaultStats 
                });
                console.log('🛡️ GoodTube Pro: Initialized default stats');
            }
            
            // Update last active timestamp
            await this.updateLastActive();
            
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error initializing storage:', error);
        }
    }
    
    async handleInstallation(details) {
        console.log('🛡️ GoodTube Pro: Installation event:', details.reason);
        
        if (details.reason === 'install') {
            // First time installation
            await this.showWelcomeNotification();
            await this.openWelcomePage();
            
            // Track installation
            const stats = await this.getStats();
            stats.installDate = Date.now();
            await this.saveStats(stats);
            
        } else if (details.reason === 'update') {
            // Extension update
            await this.showUpdateNotification(details.previousVersion);
            await this.migrateData(details.previousVersion);
        }
    }
    
    async handleStartup() {
        console.log('🛡️ GoodTube Pro: Extension startup');
        await this.updateLastActive();
        
        // Increment session count
        const stats = await this.getStats();
        stats.totalSessions = (stats.totalSessions || 0) + 1;
        await this.saveStats(stats);
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GET_SETTINGS':
                    const settings = await this.getSettings();
                    sendResponse({ settings });
                    break;
                    
                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_STATS':
                    const stats = await this.getStats();
                    sendResponse({ stats });
                    break;
                    
                case 'UPDATE_STATS':
                    await this.updateStats(message.stats);
                    sendResponse({ success: true });
                    break;
                    
                case 'MANUAL_BLOCK':
                    await this.handleManualBlock(sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'SHOW_NOTIFICATION':
                    await this.showNotification(message.title, message.message);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    console.log('🛡️ GoodTube Pro: Unknown message type:', message.type);
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }
    
    async handleTabUpdate(tabId, changeInfo, tab) {
        // Inject content script when YouTube page loads
        if (changeInfo.status === 'complete' && 
            tab.url && 
            tab.url.includes('youtube.com')) {
            
            try {
                await this.injectContentScript(tabId);
            } catch (error) {
                console.error('🛡️ GoodTube Pro: Error injecting content script:', error);
            }
        }
    }
    
    async handleCommand(command) {
        console.log('🛡️ GoodTube Pro: Command received:', command);
        
        try {
            const [activeTab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            if (!activeTab || !activeTab.url.includes('youtube.com')) {
                return;
            }
            
            switch (command) {
                case 'toggle-ui':
                    await chrome.tabs.sendMessage(activeTab.id, { 
                        type: 'TOGGLE_UI' 
                    });
                    break;
                    
                case 'manual-block':
                    await chrome.tabs.sendMessage(activeTab.id, { 
                        type: 'MANUAL_BLOCK' 
                    });
                    break;
                    
                case 'open-settings':
                    await chrome.runtime.openOptionsPage();
                    break;
            }
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error handling command:', error);
        }
    }
    
    async handleStorageChange(changes, namespace) {
        console.log('🛡️ GoodTube Pro: Storage changed:', changes, namespace);
        
        // Notify all YouTube tabs of settings changes
        if (changes.goodtubeSettings && namespace === 'sync') {
            const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
            
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'SETTINGS_UPDATED',
                        settings: changes.goodtubeSettings.newValue
                    });
                } catch (error) {
                    // Tab might not have content script loaded yet
                }
            }
        }
    }
    
    setupAlarms() {
        // Check if alarms API is available
        if (!chrome.alarms) {
            console.log('🛡️ GoodTube Pro: Alarms API not available');
            return;
        }
        
        // Daily stats cleanup
        chrome.alarms.create('dailyCleanup', { 
            delayInMinutes: 1, 
            periodInMinutes: 24 * 60 
        });
        
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'dailyCleanup') {
                this.performDailyCleanup();
            }
        });
    }
    
    setupContextMenus() {
        // Check if contextMenus API is available
        if (!chrome.contextMenus) {
            console.log('🛡️ GoodTube Pro: Context menus not available');
            return;
        }
        
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'goodtube-manual-block',
                title: '🛡️ Block ads on this page',
                contexts: ['page'],
                documentUrlPatterns: ['*://*.youtube.com/*']
            });
            
            chrome.contextMenus.create({
                id: 'goodtube-settings',
                title: '⚙️ GoodTube Pro Settings',
                contexts: ['page'],
                documentUrlPatterns: ['*://*.youtube.com/*']
            });
        });
        
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            switch (info.menuItemId) {
                case 'goodtube-manual-block':
                    try {
                        await chrome.tabs.sendMessage(tab.id, { 
                            type: 'MANUAL_BLOCK' 
                        });
                    } catch (error) {
                        console.error('🛡️ GoodTube Pro: Error sending manual block message:', error);
                    }
                    break;
                    
                case 'goodtube-settings':
                    try {
                        await chrome.runtime.openOptionsPage();
                    } catch (error) {
                        console.error('🛡️ GoodTube Pro: Error opening options page:', error);
                    }
                    break;
            }
        });
    }
    
    async injectContentScripts() {
        try {
            const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
            
            for (const tab of tabs) {
                await this.injectContentScript(tab.id);
            }
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error injecting content scripts:', error);
        }
    }
    
    async injectContentScript(tabId) {
        try {
            // Inject the main content script
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/content-script.js']
            });
            
            // Inject the page-level script
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content/injected-script.js'],
                world: 'MAIN'
            });
            
            console.log('🛡️ GoodTube Pro: Content scripts injected into tab', tabId);
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error injecting into tab', tabId, error);
        }
    }
    
    async getSettings() {
        try {
            const result = await chrome.storage.sync.get(['goodtubeSettings']);
            return result.goodtubeSettings || this.defaultSettings;
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error getting settings:', error);
            return this.defaultSettings;
        }
    }
    
    async updateSettings(newSettings) {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            await chrome.storage.sync.set({ goodtubeSettings: updatedSettings });
            console.log('🛡️ GoodTube Pro: Settings updated:', updatedSettings);
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error updating settings:', error);
        }
    }
    
    async getStats() {
        try {
            const result = await chrome.storage.local.get(['goodtubeStats']);
            return result.goodtubeStats || this.defaultStats;
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error getting stats:', error);
            return this.defaultStats;
        }
    }
    
    async saveStats(stats) {
        try {
            await chrome.storage.local.set({ goodtubeStats: stats });
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error saving stats:', error);
        }
    }
    
    async updateStats(newStats) {
        try {
            const currentStats = await this.getStats();
            const updatedStats = { ...currentStats, ...newStats };
            await this.saveStats(updatedStats);
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error updating stats:', error);
        }
    }
    
    async updateLastActive() {
        try {
            const stats = await this.getStats();
            stats.lastActive = Date.now();
            await this.saveStats(stats);
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error updating last active:', error);
        }
    }
    
    async handleManualBlock(tab) {
        if (!tab || !tab.url.includes('youtube.com')) {
            return;
        }
        
        try {
            await chrome.tabs.sendMessage(tab.id, { 
                type: 'MANUAL_BLOCK' 
            });
            
            // Update stats
            const stats = await this.getStats();
            stats.adsBlocked = (stats.adsBlocked || 0) + 1;
            stats.sessionAds = (stats.sessionAds || 0) + 1;
            await this.saveStats(stats);
            
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error in manual block:', error);
        }
    }
    
    async showNotification(title, message, iconUrl = null) {
        try {
            // Check if notifications API is available
            if (!chrome.notifications) {
                console.log('🛡️ GoodTube Pro: Notifications API not available');
                return;
            }
            
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: iconUrl || 'icons/icon-48.png',
                title: title,
                message: message
            });
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error showing notification:', error);
        }
    }
    
    async showWelcomeNotification() {
        await this.showNotification(
            '🛡️ GoodTube Pro Installed!',
            'Welcome to GoodTube Pro! Your YouTube experience is now enhanced with advanced ad blocking.'
        );
    }
    
    async showUpdateNotification(previousVersion) {
        await this.showNotification(
            '🛡️ GoodTube Pro Updated!',
            `Updated from v${previousVersion} to v${this.version}. New features and improvements available!`
        );
    }
    
    async openWelcomePage() {
        try {
            await chrome.tabs.create({
                url: chrome.runtime.getURL('popup/popup.html?welcome=true')
            });
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error opening welcome page:', error);
        }
    }
    
    async migrateData(previousVersion) {
        console.log('🛡️ GoodTube Pro: Migrating data from version', previousVersion);
        
        // Add migration logic here for future versions
        try {
            const stats = await this.getStats();
            stats.previousVersion = previousVersion;
            stats.updateDate = Date.now();
            await this.saveStats(stats);
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error migrating data:', error);
        }
    }
    
    async performDailyCleanup() {
        console.log('🛡️ GoodTube Pro: Performing daily cleanup');
        
        try {
            const stats = await this.getStats();
            
            // Reset session stats
            stats.sessionAds = 0;
            
            // Clean up old data if needed
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (stats.lastCleanup && stats.lastCleanup < oneWeekAgo) {
                // Perform weekly cleanup tasks
                console.log('🛡️ GoodTube Pro: Performing weekly cleanup');
            }
            
            stats.lastCleanup = Date.now();
            await this.saveStats(stats);
            
        } catch (error) {
            console.error('🛡️ GoodTube Pro: Error in daily cleanup:', error);
        }
    }
}

// Initialize the service worker
const goodTubeServiceWorker = new GoodTubeServiceWorker();

console.log('🛡️ GoodTube Pro Service Worker: Loaded successfully');

