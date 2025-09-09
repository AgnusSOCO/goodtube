# 🛡️ GoodTube Pro Browser Extension - Installation Guide

## Overview

GoodTube Pro is a native browser extension that provides advanced YouTube ad blocking with a modern SOCO PWA-inspired interface. No need for Tampermonkey or other userscript managers!

## Features

✨ **Native Browser Integration** - Direct extension, no third-party dependencies  
🛡️ **Advanced Ad Blocking** - Intelligent ad detection and removal  
🎨 **Modern UI** - SOCO PWA-inspired design with dark theme  
📊 **Real-time Statistics** - Track blocked ads and time saved  
⌨️ **Keyboard Shortcuts** - Quick access to features  
⚙️ **Comprehensive Settings** - Full customization control  

## Installation Methods

### Method 1: Load Unpacked Extension (Recommended for Testing)

1. **Download the Extension**
   - Download or clone the `goodtube-extension` folder
   - Ensure all files are present in the directory

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or click Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - This enables loading unpacked extensions

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `goodtube-extension` folder
   - The extension should appear in your extensions list

5. **Verify Installation**
   - Look for the GoodTube Pro icon in your browser toolbar
   - The icon should show a purple/pink gradient shield
   - Click the icon to open the popup interface

### Method 2: Package and Install (For Distribution)

1. **Package the Extension**
   ```bash
   # Navigate to the extension directory
   cd goodtube-extension
   
   # Create a ZIP file with all extension files
   zip -r goodtube-pro-extension.zip . -x "*.md" "create_icons.py" "create-icons.html"
   ```

2. **Install from Package**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Drag and drop the ZIP file onto the extensions page
   - Or use "Load unpacked" and select the extracted folder

## Browser Compatibility

### ✅ Supported Browsers
- **Google Chrome** (v88+) - Full support
- **Microsoft Edge** (v88+) - Full support  
- **Brave Browser** - Full support
- **Opera** - Full support
- **Vivaldi** - Full support

### 🔄 Firefox Support
Firefox uses a different extension format (Manifest V2). To use with Firefox:
1. Modify `manifest.json` to use Manifest V2 format
2. Update service worker to background script
3. Install as temporary add-on via `about:debugging`

## First-Time Setup

### 1. Extension Permissions
The extension will request these permissions:
- **Active Tab** - Access current YouTube tab
- **Storage** - Save your settings and statistics
- **Scripting** - Inject ad-blocking scripts
- **YouTube Domains** - Access YouTube pages

### 2. Initial Configuration
1. Click the GoodTube Pro icon in your toolbar
2. Review the default settings in the popup
3. Customize features according to your preferences
4. All settings are automatically saved

### 3. Keyboard Shortcuts (Optional)
Default shortcuts (can be customized):
- `Ctrl+Shift+H` - Toggle UI visibility
- `Ctrl+Shift+B` - Manual ad block trigger
- `Ctrl+Shift+G` - Open settings

## Usage Instructions

### Basic Usage
1. **Visit YouTube** - The extension activates automatically
2. **View Statistics** - Click the extension icon to see blocked ads
3. **Adjust Settings** - Use the popup interface to customize features
4. **Manual Blocking** - Use the "Manual Block" button for stubborn ads

### Advanced Features
- **Performance Mode** - Enable for slower devices
- **Smart Notifications** - Get feedback on blocked content
- **Hide Shorts** - Remove YouTube Shorts from your feed
- **Auto-Skip** - Automatically skip video ads when possible

## Troubleshooting

### Extension Not Working
1. **Check YouTube URL** - Ensure you're on youtube.com
2. **Refresh Page** - Reload the YouTube page
3. **Check Permissions** - Verify extension has required permissions
4. **Restart Browser** - Close and reopen Chrome

### Ads Still Showing
1. **Use Manual Block** - Click the manual block button
2. **Check Settings** - Ensure ad blocking is enabled
3. **Clear Cache** - Clear browser cache and cookies
4. **Disable Other Blockers** - Turn off conflicting ad blockers

### Performance Issues
1. **Enable Performance Mode** - In extension settings
2. **Disable Animations** - Reduce visual effects
3. **Check Memory Usage** - Monitor browser memory
4. **Update Browser** - Ensure latest Chrome version

## Privacy & Security

### Data Collection
- **No Personal Data** - Extension doesn't collect personal information
- **Local Storage Only** - Settings stored locally on your device
- **No External Servers** - All processing happens locally
- **Open Source** - Code is transparent and auditable

### Permissions Explained
- **activeTab** - Only accesses current YouTube tab when clicked
- **storage** - Saves your preferences locally
- **scripting** - Injects ad-blocking code into YouTube pages
- **host_permissions** - Limited to YouTube domains only

## Updates

### Automatic Updates
- Extension updates automatically through Chrome Web Store (when published)
- Settings and statistics are preserved during updates
- New features are enabled by default with notification

### Manual Updates
For development versions:
1. Download the latest version
2. Remove old extension from `chrome://extensions/`
3. Load the new unpacked extension
4. Settings will be preserved

## Support

### Getting Help
- **GitHub Issues** - Report bugs and request features
- **Documentation** - Check README.md for detailed information
- **Community** - Join discussions on GitHub

### Common Issues
- **YouTube Updates** - May temporarily break functionality
- **Browser Updates** - Extension updates to maintain compatibility
- **Conflicting Extensions** - Disable other ad blockers for best results

## Uninstallation

### Remove Extension
1. Go to `chrome://extensions/`
2. Find GoodTube Pro in the list
3. Click "Remove" button
4. Confirm removal

### Clean Removal
- Extension data is automatically removed
- No registry entries or leftover files
- YouTube will return to normal behavior immediately

## Development

### File Structure
```
goodtube-extension/
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup UI
├── content/              # YouTube integration scripts
├── background/           # Service worker
├── icons/               # Extension icons
└── assets/              # Additional resources
```

### Contributing
1. Fork the repository
2. Make your changes
3. Test thoroughly on YouTube
4. Submit a pull request

---

## Quick Start Checklist

- [ ] Download extension files
- [ ] Open `chrome://extensions/`
- [ ] Enable Developer mode
- [ ] Click "Load unpacked"
- [ ] Select `goodtube-extension` folder
- [ ] Verify extension appears in toolbar
- [ ] Visit YouTube to test functionality
- [ ] Customize settings as needed

**Enjoy your enhanced, ad-free YouTube experience! 🛡️**

