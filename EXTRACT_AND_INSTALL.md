# 📦 Extract and Install from TAR.GZ File

You're right! You have the `goodtube-analytics-dashboard.tar.gz` file. Here's how to extract and install it:

## 🚀 **Method 1: Extract and Install (Recommended)**

**SSH into your server:**
```bash
ssh root@134.199.235.218
# Password: COKE@@100coco
```

**Upload the tar.gz file to your server (if not already there):**
```bash
# If you have the file locally, upload it:
scp goodtube-analytics-dashboard.tar.gz root@134.199.235.218:/tmp/

# Or download it directly on the server:
cd /tmp
wget https://github.com/AgnusSOCO/goodtube/raw/main/goodtube-analytics-dashboard.tar.gz
```

**Extract and install:**
```bash
# Extract the tar.gz file
cd /tmp
tar -xzf goodtube-analytics-dashboard.tar.gz

# Go to the extracted directory
cd analytics-dashboard-deployment

# Install system dependencies first
apt update && apt install -y python3 python3-pip python3-venv nginx curl

# Create the application directory
mkdir -p /opt/goodtube-analytics
cp -r * /opt/goodtube-analytics/
cd /opt/goodtube-analytics

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install Flask==2.3.3 Flask-CORS==4.0.0 Werkzeug==2.3.7 gunicorn==21.2.0

# Create systemd service
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

# Create Nginx configuration
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

# Enable Nginx site
ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Set permissions
chmod -R 755 /opt/goodtube-analytics
chmod +x /opt/goodtube-analytics/app.py

# Start services
systemctl daemon-reload
systemctl enable goodtube-analytics
systemctl start goodtube-analytics
systemctl restart nginx

# Check status
echo "🎉 Installation Complete!"
echo "Dashboard URL: http://134.199.235.218"
systemctl status goodtube-analytics --no-pager -l
```

## 🎯 **Method 2: One-Block Copy-Paste**

If you want to do it all at once, copy and paste this entire block:

```bash
#!/bin/bash
set -e

echo "🛡️ Installing from TAR.GZ file..."

# Install dependencies
apt update && apt install -y python3 python3-pip python3-venv nginx curl

# Extract if not already done
cd /tmp
if [ ! -f "goodtube-analytics-dashboard.tar.gz" ]; then
    wget https://github.com/AgnusSOCO/goodtube/raw/main/goodtube-analytics-dashboard.tar.gz
fi

tar -xzf goodtube-analytics-dashboard.tar.gz
cd analytics-dashboard-deployment

# Create application directory
mkdir -p /opt/goodtube-analytics
cp -r * /opt/goodtube-analytics/
cd /opt/goodtube-analytics

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install Flask==2.3.3 Flask-CORS==4.0.0 Werkzeug==2.3.7 gunicorn==21.2.0

# Create systemd service
tee /etc/systemd/system/goodtube-analytics.service << 'EOF'
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
tee /etc/nginx/sites-available/goodtube-analytics << 'EOF'
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

# Enable and start services
ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
chmod -R 755 /opt/goodtube-analytics
systemctl daemon-reload
systemctl enable goodtube-analytics
systemctl start goodtube-analytics
systemctl restart nginx

echo "🎉 Dashboard is live at: http://134.199.235.218"
systemctl status goodtube-analytics --no-pager -l
```

## 🔍 **What's in the TAR.GZ File**

The extracted `analytics-dashboard-deployment/` directory contains:
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies
- `templates/dashboard.html` - Dashboard interface
- `static/css/dashboard.css` - Styles
- `static/js/dashboard.js` - JavaScript
- `install.sh` - Installation script (the one that had issues)

## ✅ **Verification**

After installation:
```bash
# Check service
systemctl status goodtube-analytics

# Test locally
curl http://localhost

# Open in browser
# http://134.199.235.218
```

## 🚨 **If You Get Errors**

Check the logs:
```bash
journalctl -u goodtube-analytics -f
tail -f /var/log/nginx/error.log
```

**This method uses the exact files from your tar.gz package!** 📦

