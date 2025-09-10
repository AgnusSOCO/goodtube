# 🔧 Fix Missing Database Tables

The error shows that the `sessions` table is missing. Let's create all required tables.

## 🚀 **Complete Database Fix**

Run this command on your server to create all missing tables:

```bash
cd /opt/goodtube-analytics && \
source venv/bin/activate && \
python -c "
import sqlite3
conn = sqlite3.connect('analytics.db')
cursor = conn.cursor()

# Create users table
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

# Create sessions table (this was missing!)
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

# Create events table
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

# Create keystrokes table
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

# Create screenshots table
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
print('✅ All database tables created successfully')
" && \
systemctl restart goodtube-analytics && \
echo "🎉 Service restarted with complete database"
```

## 🧪 **Test the Fix**

After running the above command, test:

```bash
# Test stats endpoint
curl http://localhost:5000/api/stats

# Test analytics endpoint
curl -X POST http://localhost:5000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","sessionId":"test_session","events":[{"type":"test_event","data":{"test":true}}],"keystrokes":[{"key":"t"}]}'

# Check if it worked
curl http://localhost:5000/api/stats
```

## 📋 **Expected Results**

After the fix, you should see:

1. **Stats endpoint works:**
```json
{
  "totalUsers": 0,
  "activeSessions": 0, 
  "totalEvents": 0,
  "totalScreenshots": 0,
  "recentEvents": []
}
```

2. **Analytics endpoint accepts data:**
```json
{"status": "success"}
```

3. **Stats show data after sending:**
```json
{
  "totalUsers": 1,
  "activeSessions": 0,
  "totalEvents": 1, 
  "totalScreenshots": 0,
  "recentEvents": [...]
}
```

## 🎯 **What This Fixes**

- ✅ Creates the missing `sessions` table
- ✅ Ensures all foreign key relationships work
- ✅ Provides complete database schema
- ✅ Fixes the 500 error on `/api/stats`
- ✅ Enables proper analytics data storage

Run the command above and then test with `curl http://localhost:5000/api/stats` - it should work!

