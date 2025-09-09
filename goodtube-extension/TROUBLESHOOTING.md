# 🛠️ GoodTube Pro Extension - Troubleshooting Guide

## Common Issues and Solutions

### 🚨 Service Worker Registration Failed (Status Code: 15)

**Problem**: Extension fails to load with service worker registration error.

**Solutions**:
1. **Check Chrome Version**: Ensure you're using Chrome 88+ or Edge 88+
2. **Clear Extension Data**: 
   - Go to `chrome://extensions/`
   - Remove the extension
   - Clear browser cache (`Ctrl+Shift+Delete`)
   - Reinstall the extension
3. **Developer Mode**: Ensure "Developer mode" is enabled in `chrome://extensions/`
4. **File Permissions**: Check that all extension files are readable

### ❌ "Cannot read properties of undefined (reading 'create')"

**Problem**: Chrome APIs not available or permission issues.

**Fixed in Latest Version**: The updated extension now handles missing APIs gracefully.

**Manual Fix**:
1. Download the latest package (fixed version)
2. Remove old extension
3. Install the new version

### 🔌 "Could not establish connection. Receiving end does not exist."

**Problem**: Content script not loaded or communication failure.

**Solutions**:
1. **Refresh YouTube Page**: Press `F5` or `Ctrl+R` on YouTube
2. **Check Extension Status**: Ensure extension is enabled in `chrome://extensions/`
3. **Reload Extension**: Click the reload button next to the extension
4. **Check Permissions**: Verify extension has access to YouTube

### 🚫 Extension Not Working on YouTube

**Problem**: Ad blocking not functioning.

**Solutions**:
1. **Check URL**: Ensure you're on `youtube.com` (not `m.youtube.com`)
2. **Disable Other Blockers**: Turn off conflicting ad blockers
3. **Clear YouTube Cache**: Clear cookies and cache for YouTube
4. **Manual Block**: Use the "Manual Block" button in the popup

### 🎨 Popup Not Showing

**Problem**: Extension icon doesn't show popup.

**Solutions**:
1. **Pin Extension**: Click the puzzle piece icon and pin GoodTube Pro
2. **Check Popup File**: Ensure `popup/popup.html` exists
3. **Browser Restart**: Close and reopen Chrome
4. **Reinstall Extension**: Remove and reinstall

## Installation Verification

### ✅ Successful Installation Checklist

- [ ] Extension appears in `chrome://extensions/`
- [ ] Extension icon visible in toolbar (may need to pin)
- [ ] No error messages in extension details
- [ ] Service worker shows "Active" status
- [ ] Popup opens when clicking extension icon

### 🔍 Debug Information

To get debug information:

1. **Extension Console**:
   - Go to `chrome://extensions/`
   - Click "Details" on GoodTube Pro
   - Click "Inspect views: service worker"
   - Check console for errors

2. **Content Script Console**:
   - Open YouTube
   - Press `F12` to open DevTools
   - Check console for GoodTube Pro messages

3. **Popup Console**:
   - Right-click extension icon
   - Select "Inspect popup"
   - Check console for errors

## Browser Compatibility

### ✅ Fully Supported
- **Chrome 88+** - Full support
- **Edge 88+** - Full support
- **Brave** - Full support
- **Opera** - Full support

### ⚠️ Limited Support
- **Firefox** - Requires Manifest V2 conversion
- **Safari** - Not supported (different extension format)

## Performance Issues

### 🐌 Extension Running Slowly

**Solutions**:
1. **Enable Performance Mode**: In extension popup settings
2. **Disable Animations**: Reduces visual effects
3. **Close Other Extensions**: Reduce browser load
4. **Update Browser**: Ensure latest Chrome version

### 💾 High Memory Usage

**Solutions**:
1. **Restart Browser**: Clear memory leaks
2. **Check Other Extensions**: Disable unnecessary extensions
3. **Performance Mode**: Enable in extension settings
4. **Monitor Usage**: Use Chrome Task Manager (`Shift+Esc`)

## Advanced Troubleshooting

### 🔧 Manual Installation

If automatic installation fails:

1. **Extract ZIP File**: Unzip the extension package
2. **Load Unpacked**: Use "Load unpacked" instead of drag-and-drop
3. **Check File Structure**: Ensure all files are present
4. **Permissions**: Check file read permissions

### 📝 Manifest Validation

Common manifest issues:

1. **JSON Syntax**: Ensure valid JSON format
2. **Required Fields**: All required fields present
3. **Permissions**: Correct permission names
4. **File Paths**: All referenced files exist

### 🔄 Reset Extension

To completely reset the extension:

1. **Remove Extension**: From `chrome://extensions/`
2. **Clear Storage**: 
   ```javascript
   // In browser console
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```
3. **Restart Browser**: Close all Chrome windows
4. **Reinstall**: Install fresh copy

## Getting Help

### 📞 Support Channels

1. **GitHub Issues**: Report bugs and request features
2. **Documentation**: Check README.md for detailed info
3. **Community**: Join discussions on GitHub

### 📊 Reporting Issues

When reporting issues, include:

1. **Browser Version**: Chrome/Edge version number
2. **Extension Version**: GoodTube Pro version
3. **Error Messages**: Full error text from console
4. **Steps to Reproduce**: Detailed reproduction steps
5. **Screenshots**: Visual evidence of the issue

### 🔍 Debug Mode

Enable debug mode for detailed logging:

1. Open extension popup
2. Press `Ctrl+Shift+D` (if implemented)
3. Check browser console for detailed logs

## Quick Fixes

### 🚀 Most Common Solutions

1. **Refresh YouTube Page** - Solves 70% of issues
2. **Reload Extension** - Fixes service worker problems
3. **Clear Browser Cache** - Resolves loading issues
4. **Disable Other Ad Blockers** - Prevents conflicts
5. **Update Browser** - Ensures compatibility

### ⚡ Emergency Reset

If nothing works:

1. Remove extension
2. Clear all browser data for YouTube
3. Restart browser
4. Reinstall extension
5. Test on fresh YouTube page

---

## Status Indicators

### 🟢 Working Correctly
- Extension icon shows in toolbar
- Popup opens with statistics
- YouTube ads are blocked
- No console errors

### 🟡 Partial Issues
- Extension loads but some features don't work
- Intermittent ad blocking
- Some console warnings

### 🔴 Not Working
- Extension won't install
- Service worker registration fails
- No ad blocking functionality
- Multiple console errors

**For persistent issues, please report on GitHub with full debug information.**

