# GoodTube Pro Browser Extension

## Project Structure

```
goodtube-extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── popup/                     # Extension popup UI
│   ├── popup.html            # Popup HTML structure
│   ├── popup.css             # SOCO PWA-inspired styles
│   └── popup.js              # Popup functionality
├── content/                   # Content scripts for YouTube
│   ├── content-script.js     # Main content script
│   ├── content-styles.css    # Injected styles
│   └── injected-script.js    # Page-level script injection
├── background/                # Background service worker
│   └── service-worker.js     # Extension background logic
├── assets/                    # Static assets
│   └── styles/               # Shared stylesheets
├── icons/                     # Extension icons
│   ├── icon-16.png           # 16x16 icon
│   ├── icon-32.png           # 32x32 icon
│   ├── icon-48.png           # 48x48 icon
│   └── icon-128.png          # 128x128 icon
└── README.md                 # This file
```

## Features

- **Native Browser Integration**: No need for Tampermonkey
- **Modern UI**: SOCO PWA-inspired design with dark theme
- **Advanced Ad Blocking**: Intelligent ad detection and removal
- **Real-time Statistics**: Track blocked ads and time saved
- **Keyboard Shortcuts**: Quick access to features
- **Settings Panel**: Comprehensive customization options

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. The extension will be installed and ready to use

## Development

The extension uses Manifest V3 for modern browser compatibility and security.

### Key Components

- **Popup**: Extension popup with settings and statistics
- **Content Script**: Injected into YouTube pages for ad blocking
- **Background**: Service worker for extension lifecycle management
- **Icons**: Purple/pink gradient icons with shield design

### Permissions

- `activeTab`: Access to current tab
- `storage`: Store user preferences
- `scripting`: Inject content scripts
- `tabs`: Tab management for features

### Host Permissions

- `*://*.youtube.com/*`: YouTube pages
- `*://*.googlevideo.com/*`: Video content
- `*://*.ytimg.com/*`: YouTube images

