#!/bin/bash

# GoodTube Pro Analytics Dashboard Installation Script
# For Ubuntu Server 20.04+ / 22.04+

set -e

echo "🛡️ GoodTube Pro Analytics Dashboard Installer"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check Ubuntu version
print_status "Checking Ubuntu version..."
if ! lsb_release -d | grep -q "Ubuntu"; then
    print_error "This script is designed for Ubuntu. Other distributions may not work correctly."
    exit 1
fi

UBUNTU_VERSION=$(lsb_release -rs)
print_success "Ubuntu $UBUNTU_VERSION detected"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required system packages
print_status "Installing system dependencies..."
sudo apt install -y python3 python3-pip python3-venv nginx supervisor ufw curl wget git htop unzip

# Create application directory
APP_DIR="/opt/goodtube-analytics"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r ./* $APP_DIR/
cd $APP_DIR

# Create Python virtual environment
print_status "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
print_status "Creating application directories..."
mkdir -p logs uploads screenshots backups

# Set proper permissions
print_status "Setting file permissions..."
chmod +x $APP_DIR/app.py
chmod 755 $APP_DIR
chmod -R 755 $APP_DIR/static
chmod -R 755 $APP_DIR/templates
chmod -R 777 $APP_DIR/uploads
chmod -R 777 $APP_DIR/screenshots
chmod -R 777 $APP_DIR/logs

# Create systemd service file
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/goodtube-analytics.service > /dev/null <<EOF
[Unit]
Description=GoodTube Pro Analytics Dashboard
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 --timeout 120 app:app
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/app.log
StandardError=append:$APP_DIR/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/goodtube-analytics > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /static/ {
        alias $APP_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /api/screenshots/ {
        alias $APP_DIR/screenshots/;
        expires 1d;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/goodtube-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Create backup script
print_status "Creating backup script..."
tee $APP_DIR/backup.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="$APP_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="goodtube_backup_\$DATE.tar.gz"

echo "Creating backup: \$BACKUP_FILE"

tar -czf "\$BACKUP_DIR/\$BACKUP_FILE" --exclude="backups" --exclude="venv" --exclude="logs" -C "$APP_DIR" .

cd "\$BACKUP_DIR"
ls -t goodtube_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: \$BACKUP_FILE"
EOF

chmod +x $APP_DIR/backup.sh

# Create log rotation configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/goodtube-analytics > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload goodtube-analytics
    endscript
}
EOF

# Create cron job for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -

# Start and enable services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable goodtube-analytics
sudo systemctl start goodtube-analytics
sudo systemctl enable nginx
sudo systemctl restart nginx

# Wait for services to start
sleep 5

# Check service status
print_status "Checking service status..."
if sudo systemctl is-active --quiet goodtube-analytics; then
    print_success "GoodTube Analytics service is running"
else
    print_error "GoodTube Analytics service failed to start"
    sudo systemctl status goodtube-analytics
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx service is running"
else
    print_error "Nginx service failed to start"
    sudo systemctl status nginx
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

# Installation complete
echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
print_success "GoodTube Pro Analytics Dashboard is now running!"
echo ""
echo "📊 Dashboard Access:"
echo "   URL: http://$SERVER_IP"
echo "   Local: http://localhost"
echo ""
echo "🔧 Management Commands:"
echo "   Status:  sudo systemctl status goodtube-analytics"
echo "   Start:   sudo systemctl start goodtube-analytics"
echo "   Stop:    sudo systemctl stop goodtube-analytics"
echo "   Restart: sudo systemctl restart goodtube-analytics"
echo "   Logs:    sudo journalctl -u goodtube-analytics -f"
echo ""
echo "📁 Important Paths:"
echo "   App Directory: $APP_DIR"
echo "   Database:      $APP_DIR/analytics.db"
echo "   Screenshots:   $APP_DIR/screenshots/"
echo "   Logs:          $APP_DIR/logs/"
echo "   Backups:       $APP_DIR/backups/"
echo ""
echo "🔒 Security Notes:"
echo "   - Firewall is enabled (UFW)"
echo "   - Only ports 22, 80, 443 are open"
echo "   - Daily backups are scheduled at 2 AM"
echo "   - Log rotation is configured"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Update your browser extension to point to: http://$SERVER_IP"
echo "   2. Consider setting up SSL/HTTPS for production use"
echo "   3. Configure domain name if needed"
echo "   4. Review firewall settings for your network"
echo ""
print_success "Installation completed successfully!"

