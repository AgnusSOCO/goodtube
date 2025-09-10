# 🚀 Easy Remote Server Download Guide

## 🎯 **Fastest Methods to Get Dashboard on Your Server**

### **Method 1: Direct GitHub Download (Easiest)**
```bash
# SSH into your Ubuntu server, then run:
cd /tmp
wget https://github.com/AgnusSOCO/goodtube/archive/main.zip
unzip main.zip
cd goodtube-main/analytics-dashboard-deployment/
chmod +x install.sh
./install.sh
```

### **Method 2: One-Command Installation (Simplest)**
```bash
# SSH into your server and run this single command:
curl -sSL https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/install.sh | bash
```

### **Method 3: Git Clone (Developer Friendly)**
```bash
# SSH into your server:
cd /tmp
git clone https://github.com/AgnusSOCO/goodtube.git
cd goodtube/analytics-dashboard-deployment/
chmod +x install.sh
./install.sh
```

### **Method 4: SCP Upload (If You Downloaded Locally)**
```bash
# From your local machine (if you downloaded the tar.gz file):
scp goodtube-analytics-dashboard.tar.gz user@your-server-ip:/tmp/

# Then SSH into server:
ssh user@your-server-ip
cd /tmp
tar -xzf goodtube-analytics-dashboard.tar.gz
cd analytics-dashboard-deployment/
chmod +x install.sh
./install.sh
```

### **Method 5: Direct Raw File Download**
```bash
# SSH into your server:
mkdir -p /tmp/goodtube-dashboard
cd /tmp/goodtube-dashboard

# Download individual files:
curl -O https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/install.sh
curl -O https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/app.py
curl -O https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/requirements.txt
# ... (continue for other files)

chmod +x install.sh
./install.sh
```

## 🎯 **Recommended: Method 1 (Direct GitHub)**

This is the most reliable method:

```bash
# 1. SSH into your Ubuntu server
ssh your-username@your-server-ip

# 2. Download and extract
cd /tmp
wget https://github.com/AgnusSOCO/goodtube/archive/main.zip
unzip main.zip

# 3. Navigate to dashboard directory
cd goodtube-main/analytics-dashboard-deployment/

# 4. Run installer
chmod +x install.sh
./install.sh
```

## ⚡ **Super Quick: Method 2 (One Command)**

If you want the absolute fastest setup:

```bash
# SSH into your server and run:
curl -sSL https://raw.githubusercontent.com/AgnusSOCO/goodtube/main/analytics-dashboard-deployment/install.sh | bash
```

This single command:
- Downloads the installer script
- Runs it automatically
- Installs everything
- Starts the dashboard

## 🔧 **Step-by-Step Example**

Here's exactly what to type:

```bash
# 1. Connect to your server
ssh root@123.456.789.123  # Replace with your server IP

# 2. Download the files
cd /tmp
wget https://github.com/AgnusSOCO/goodtube/archive/main.zip

# 3. Extract
unzip main.zip

# 4. Go to dashboard folder
cd goodtube-main/analytics-dashboard-deployment/

# 5. Make installer executable
chmod +x install.sh

# 6. Run installer
./install.sh

# 7. Access dashboard
# Open browser to: http://123.456.789.123
```

## 🌐 **What Happens During Installation**

The installer will:
1. ✅ Update your Ubuntu system
2. ✅ Install Python, Nginx, and dependencies
3. ✅ Create the dashboard application
4. ✅ Configure firewall and security
5. ✅ Start all services
6. ✅ Show you the dashboard URL

## 📋 **Prerequisites**

Make sure your server has:
- ✅ Ubuntu 20.04+ or 22.04+
- ✅ Root or sudo access
- ✅ Internet connection
- ✅ At least 2GB RAM and 10GB disk space

## 🎯 **After Installation**

You'll see output like:
```
🎉 Installation Complete!
========================

📊 Dashboard Access:
   URL: http://123.456.789.123
   Local: http://localhost

🔧 Management Commands:
   Status:  sudo systemctl status goodtube-analytics
   Restart: sudo systemctl restart goodtube-analytics
   Logs:    sudo journalctl -u goodtube-analytics -f
```

## 🚨 **Troubleshooting**

**If wget is not installed:**
```bash
sudo apt update
sudo apt install wget unzip curl
```

**If you get permission errors:**
```bash
# Make sure you have sudo access
sudo whoami

# Or run as root
sudo su -
```

**If download fails:**
```bash
# Try with curl instead
curl -L https://github.com/AgnusSOCO/goodtube/archive/main.zip -o main.zip
```

## 🎉 **Success!**

After installation, your dashboard will be available at:
**http://YOUR_SERVER_IP**

The dashboard will show:
- Real-time employee monitoring
- User activity tracking
- Screenshot gallery
- Event streaming
- Complete analytics

**Ready to monitor your employees with enterprise-grade analytics!** 🛡️

