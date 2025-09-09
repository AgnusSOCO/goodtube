#!/bin/bash

# GoodTube Pro Extension Packaging Script

echo "🛡️ GoodTube Pro Extension Packager"
echo "=================================="

# Create package directory
mkdir -p ../packages
PACKAGE_DIR="../packages/goodtube-pro-extension-$(date +%Y%m%d)"

# Copy extension files
echo "📦 Copying extension files..."
cp -r . "$PACKAGE_DIR"

# Remove development files
echo "🧹 Cleaning up development files..."
cd "$PACKAGE_DIR"
rm -f package.sh
rm -f create_icons.py
rm -f create-icons.html
rm -f *.md

# Create ZIP package
echo "📦 Creating ZIP package..."
cd ..
zip -r "goodtube-pro-extension-$(date +%Y%m%d).zip" "goodtube-pro-extension-$(date +%Y%m%d)/"

echo "✅ Package created successfully!"
echo "📁 Location: packages/goodtube-pro-extension-$(date +%Y%m%d).zip"
echo ""
echo "Installation Instructions:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select the extracted folder"
echo "4. Or drag and drop the ZIP file onto the extensions page"

