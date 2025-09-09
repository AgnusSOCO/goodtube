#!/bin/bash

# GoodTube Pro - Upstream Sync Script
# This script syncs changes from the original goodtube repository while preserving our enhancements

echo "🔄 GoodTube Pro - Syncing with upstream repository..."

# Fetch latest changes from upstream
echo "📥 Fetching upstream changes..."
git fetch upstream

# Check if there are any new commits
UPSTREAM_COMMITS=$(git rev-list HEAD..upstream/main --count)

if [ "$UPSTREAM_COMMITS" -eq 0 ]; then
    echo "✅ Already up to date with upstream"
    exit 0
fi

echo "📊 Found $UPSTREAM_COMMITS new commits in upstream"

# Create a backup branch
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
echo "💾 Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
git checkout main

# Merge upstream changes
echo "🔀 Merging upstream changes..."
git merge upstream/main --no-edit

# Check for conflicts
if [ $? -ne 0 ]; then
    echo "⚠️  Merge conflicts detected!"
    echo "Please resolve conflicts manually and run:"
    echo "  git add ."
    echo "  git commit -m 'Resolve merge conflicts with upstream'"
    echo "  git push origin main"
    exit 1
fi

# Push changes to our fork
echo "📤 Pushing changes to our fork..."
git push origin main

echo "✅ Successfully synced with upstream!"
echo "📋 Summary:"
echo "  - Merged $UPSTREAM_COMMITS commits from upstream"
echo "  - Backup created at branch: $BACKUP_BRANCH"
echo "  - Changes pushed to origin/main"

# Show recent commits
echo ""
echo "📝 Recent commits:"
git log --oneline -5

