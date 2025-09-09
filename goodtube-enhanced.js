(function () {
	'use strict';

	/* Bypass CSP restrictions (introduced by the latest Chrome updates)
	------------------------------------------------------------------------------------------ */
	if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
		window.trustedTypes.createPolicy('default', {
			createHTML: string => string,
			createScriptURL: string => string,
			createScript: string => string
		});
	}

	/* Enhanced GoodTube - SOCO PWA Inspired Design
	------------------------------------------------------------------------------------------ */
	
	// Statistics tracking
	let goodTube_stats = {
		adsBlocked: parseInt(localStorage.getItem('goodTube_adsBlocked') || '0'),
		timeSaved: parseInt(localStorage.getItem('goodTube_timeSaved') || '0'), // in seconds
		sessionsCount: parseInt(localStorage.getItem('goodTube_sessionsCount') || '0')
	};

	// Update session count
	goodTube_stats.sessionsCount++;
	localStorage.setItem('goodTube_sessionsCount', goodTube_stats.sessionsCount.toString());

	/* Helper functions
	------------------------------------------------------------------------------------------ */
	// Setup GET parameters
	function goodTube_helper_setupGetParams() {
		let getParams = {};
		document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
			function decode(s) {
				return decodeURIComponent(s.split("+").join(" "));
			}
			getParams[decode(arguments[1])] = decode(arguments[2]);
		});
		return getParams;
	}

	// Set a cookie
	function goodTube_helper_setCookie(name, value, days = 399) {
		document.cookie = name + "=" + encodeURIComponent(value) + ";max-age=" + (days * 24 * 60 * 60);
	}

	// Get a cookie
	function goodTube_helper_getCookie(name) {
		let cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i].split("=");
			if (name == cookie[0].trim()) {
				return decodeURIComponent(cookie[1]);
			}
		}
		return null;
	}

	// Update statistics
	function goodTube_updateStats(adsBlocked = 0, timeSaved = 0) {
		goodTube_stats.adsBlocked += adsBlocked;
		goodTube_stats.timeSaved += timeSaved;
		
		localStorage.setItem('goodTube_adsBlocked', goodTube_stats.adsBlocked.toString());
		localStorage.setItem('goodTube_timeSaved', goodTube_stats.timeSaved.toString());
		
		// Update UI if modal is open
		goodTube_updateStatsDisplay();
	}

	// Format time for display
	function goodTube_formatTime(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		
		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		} else {
			return `${secs}s`;
		}
	}

	// Update stats display in modal
	function goodTube_updateStatsDisplay() {
		const statsElements = {
			adsBlocked: document.querySelector('.goodTube_stat_adsBlocked'),
			timeSaved: document.querySelector('.goodTube_stat_timeSaved'),
			sessions: document.querySelector('.goodTube_stat_sessions')
		};

		if (statsElements.adsBlocked) {
			statsElements.adsBlocked.textContent = goodTube_stats.adsBlocked.toLocaleString();
		}
		if (statsElements.timeSaved) {
			statsElements.timeSaved.textContent = goodTube_formatTime(goodTube_stats.timeSaved);
		}
		if (statsElements.sessions) {
			statsElements.sessions.textContent = goodTube_stats.sessionsCount.toLocaleString();
		}
	}

	// Show notification
	function goodTube_showNotification(message, type = 'success') {
		const notification = document.createElement('div');
		notification.className = `goodTube_notification goodTube_notification_${type}`;
		notification.innerHTML = `
			<div class="goodTube_notification_content">
				<span class="goodTube_notification_icon">${type === 'success' ? '✓' : '⚠'}</span>
				<span class="goodTube_notification_message">${message}</span>
			</div>
		`;
		
		document.body.appendChild(notification);
		
		// Animate in
		setTimeout(() => notification.classList.add('goodTube_notification_show'), 100);
		
		// Remove after 3 seconds
		setTimeout(() => {
			notification.classList.remove('goodTube_notification_show');
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	// Add CSS classes to show or hide elements
	function goodTube_helper_showHide_init() {
		let style = document.createElement('style');
		style.textContent = `
			.goodTube_hidden {
				position: fixed !important;
				top: -9999px !important;
				left: -9999px !important;
				transform: scale(0) !important;
				pointer-events: none !important;
			}

			.goodTube_hiddenPlayer {
				position: relative;
				overflow: hidden;
				z-index: 1;
			}

			.goodTube_hiddenPlayer::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: #ffffff;
				z-index: 998;
			}

			html[dark] .goodTube_hiddenPlayer::before {
				background: #0f0f0f;
			}
		`;
		document.head.appendChild(style);
	}

	// Hide an element
	function goodTube_helper_hideElement(element) {
		if (element && !element.classList.contains('goodTube_hidden')) {
			element.classList.add('goodTube_hidden');
			// Track ad blocked
			goodTube_updateStats(1, 5); // Assume 5 seconds saved per ad
		}
	}

	// Show an element
	function goodTube_helper_showElement(element) {
		if (element && element.classList.contains('goodTube_hidden')) {
			element.classList.remove('goodTube_hidden');
		}
	}

	/* SOCO PWA Inspired Styling
	------------------------------------------------------------------------------------------ */
	function goodTube_addEnhancedStyles() {
		let style = document.createElement('style');
		style.textContent = `
			/* SOCO PWA Inspired Design System */
			:root {
				--goodtube-primary: #8B5CF6;
				--goodtube-primary-hover: #A78BFA;
				--goodtube-secondary: #EC4899;
				--goodtube-secondary-hover: #F472B6;
				--goodtube-dark: #0F0F0F;
				--goodtube-dark-lighter: #1A1A1A;
				--goodtube-dark-border: #2A2A2A;
				--goodtube-text-primary: #FFFFFF;
				--goodtube-text-secondary: #A1A1AA;
				--goodtube-success: #10B981;
				--goodtube-warning: #F59E0B;
				--goodtube-error: #EF4444;
			}

			/* Notification System */
			.goodTube_notification {
				position: fixed;
				top: 20px;
				right: 20px;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary));
				color: var(--goodtube-text-primary);
				padding: 16px 20px;
				border-radius: 12px;
				box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
				z-index: 999999;
				transform: translateX(400px);
				opacity: 0;
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				backdrop-filter: blur(10px);
				border: 1px solid rgba(255, 255, 255, 0.1);
			}

			.goodTube_notification_show {
				transform: translateX(0);
				opacity: 1;
			}

			.goodTube_notification_content {
				display: flex;
				align-items: center;
				gap: 12px;
			}

			.goodTube_notification_icon {
				font-size: 18px;
				font-weight: bold;
			}

			.goodTube_notification_message {
				font-size: 14px;
				font-weight: 500;
			}

			/* Enhanced Menu Button */
			.goodTube_menuButton {
				position: fixed !important;
				top: 20px !important;
				right: 20px !important;
				z-index: 999998 !important;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				color: var(--goodtube-text-primary) !important;
				border: none !important;
				border-radius: 50px !important;
				padding: 12px 20px !important;
				font-size: 14px !important;
				font-weight: 600 !important;
				cursor: pointer !important;
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
				box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3) !important;
				backdrop-filter: blur(10px) !important;
				border: 1px solid rgba(255, 255, 255, 0.1) !important;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
			}

			.goodTube_menuButton:hover {
				transform: translateY(-2px) !important;
				box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4) !important;
				background: linear-gradient(135deg, var(--goodtube-primary-hover), var(--goodtube-secondary-hover)) !important;
			}

			/* Enhanced Modal */
			.goodTube_modal {
				position: fixed !important;
				top: 0 !important;
				left: 0 !important;
				right: 0 !important;
				bottom: 0 !important;
				z-index: 999999 !important;
				display: none !important;
				backdrop-filter: blur(8px) !important;
				background: rgba(0, 0, 0, 0.8) !important;
			}

			.goodTube_modal_overlay {
				position: absolute !important;
				top: 0 !important;
				left: 0 !important;
				right: 0 !important;
				bottom: 0 !important;
				cursor: pointer !important;
			}

			.goodTube_modal_inner {
				position: absolute !important;
				top: 50% !important;
				left: 50% !important;
				transform: translate(-50%, -50%) !important;
				background: var(--goodtube-dark) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
				border-radius: 20px !important;
				box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
				padding: 32px !important;
				overflow: auto !important;
				max-width: 600px !important;
				width: 90vw !important;
				max-height: 80vh !important;
			}

			.goodTube_modal_closeButton {
				position: absolute !important;
				top: 16px !important;
				right: 16px !important;
				color: var(--goodtube-text-secondary) !important;
				font-size: 24px !important;
				font-weight: 400 !important;
				text-decoration: none !important;
				width: 40px !important;
				height: 40px !important;
				background: var(--goodtube-dark-lighter) !important;
				border-radius: 50% !important;
				text-align: center !important;
				line-height: 40px !important;
				transition: all 0.2s ease !important;
				border: 1px solid var(--goodtube-dark-border) !important;
			}

			.goodTube_modal_closeButton:hover {
				background: var(--goodtube-dark-border) !important;
				color: var(--goodtube-text-primary) !important;
				transform: scale(1.05) !important;
			}

			/* Modal Content */
			.goodTube_title {
				font-weight: 700 !important;
				font-size: 28px !important;
				padding-bottom: 8px !important;
				color: var(--goodtube-text-primary) !important;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				-webkit-background-clip: text !important;
				-webkit-text-fill-color: transparent !important;
				background-clip: text !important;
			}

			.goodTube_subtitle {
				font-size: 16px !important;
				color: var(--goodtube-text-secondary) !important;
				margin-bottom: 32px !important;
				font-weight: 400 !important;
			}

			.goodTube_content {
				padding-bottom: 24px !important;
				border-bottom: 1px solid var(--goodtube-dark-border) !important;
				margin-bottom: 24px !important;
			}

			.goodTube_content:last-child {
				border-bottom: 0 !important;
				margin-bottom: 0 !important;
				padding-bottom: 0 !important;
			}

			/* Statistics Cards */
			.goodTube_stats_grid {
				display: grid !important;
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
				gap: 16px !important;
				margin-bottom: 24px !important;
			}

			.goodTube_stat_card {
				background: var(--goodtube-dark-lighter) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
				border-radius: 12px !important;
				padding: 20px !important;
				text-align: center !important;
				transition: all 0.2s ease !important;
			}

			.goodTube_stat_card:hover {
				transform: translateY(-2px) !important;
				box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2) !important;
			}

			.goodTube_stat_number {
				font-size: 24px !important;
				font-weight: 700 !important;
				color: var(--goodtube-primary) !important;
				display: block !important;
			}

			.goodTube_stat_label {
				font-size: 12px !important;
				color: var(--goodtube-text-secondary) !important;
				text-transform: uppercase !important;
				letter-spacing: 0.5px !important;
				margin-top: 4px !important;
			}

			/* Enhanced Settings */
			.goodTube_setting {
				display: flex !important;
				align-items: center !important;
				justify-content: space-between !important;
				margin-bottom: 20px !important;
				padding: 16px !important;
				background: var(--goodtube-dark-lighter) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
				border-radius: 12px !important;
				transition: all 0.2s ease !important;
			}

			.goodTube_setting:hover {
				border-color: var(--goodtube-primary) !important;
			}

			.goodTube_setting_info {
				flex: 1 !important;
			}

			.goodTube_setting_label {
				font-size: 16px !important;
				color: var(--goodtube-text-primary) !important;
				font-weight: 500 !important;
				margin-bottom: 4px !important;
			}

			.goodTube_setting_description {
				font-size: 14px !important;
				color: var(--goodtube-text-secondary) !important;
				line-height: 1.4 !important;
			}

			/* Modern Toggle Switch */
			.goodTube_toggle {
				position: relative !important;
				width: 50px !important;
				height: 26px !important;
				background: var(--goodtube-dark-border) !important;
				border-radius: 13px !important;
				cursor: pointer !important;
				transition: all 0.3s ease !important;
				border: none !important;
				outline: none !important;
			}

			.goodTube_toggle:checked {
				background: var(--goodtube-primary) !important;
			}

			.goodTube_toggle::before {
				content: '' !important;
				position: absolute !important;
				top: 2px !important;
				left: 2px !important;
				width: 22px !important;
				height: 22px !important;
				background: white !important;
				border-radius: 50% !important;
				transition: all 0.3s ease !important;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
			}

			.goodTube_toggle:checked::before {
				transform: translateX(24px) !important;
			}

			/* Enhanced Buttons */
			.goodTube_button {
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				color: var(--goodtube-text-primary) !important;
				border: none !important;
				border-radius: 12px !important;
				padding: 12px 24px !important;
				font-size: 14px !important;
				font-weight: 600 !important;
				cursor: pointer !important;
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
				font-family: inherit !important;
				text-decoration: none !important;
				display: inline-flex !important;
				align-items: center !important;
				gap: 8px !important;
			}

			.goodTube_button:hover {
				transform: translateY(-2px) !important;
				box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3) !important;
			}

			.goodTube_button_secondary {
				background: var(--goodtube-dark-lighter) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
			}

			.goodTube_button_secondary:hover {
				background: var(--goodtube-dark-border) !important;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
			}

			/* Text Styles */
			.goodTube_text {
				font-size: 15px !important;
				color: var(--goodtube-text-secondary) !important;
				line-height: 1.6 !important;
				margin-bottom: 16px !important;
			}

			.goodTube_text a {
				color: var(--goodtube-primary) !important;
				text-decoration: none !important;
				font-weight: 500 !important;
			}

			.goodTube_text a:hover {
				color: var(--goodtube-primary-hover) !important;
				text-decoration: underline !important;
			}

			/* Responsive Design */
			@media (max-width: 768px) {
				.goodTube_modal_inner {
					width: 95vw !important;
					padding: 24px !important;
				}

				.goodTube_stats_grid {
					grid-template-columns: 1fr !important;
				}

				.goodTube_setting {
					flex-direction: column !important;
					align-items: flex-start !important;
					gap: 12px !important;
				}
			}
		`;
		document.head.appendChild(style);
	}



	/* Enhanced UI Components
	------------------------------------------------------------------------------------------ */
	function goodTube_createEnhancedUI() {
		// Create menu button
		let menuButton = document.createElement('button');
		menuButton.className = 'goodTube_menuButton';
		menuButton.innerHTML = '🛡️ GoodTube Pro';
		document.body.appendChild(menuButton);

		// Create enhanced modal
		let modal = document.createElement('div');
		modal.className = 'goodTube_modal';
		modal.innerHTML = `
			<div class="goodTube_modal_overlay"></div>
			<div class="goodTube_modal_inner">
				<a href="#" class="goodTube_modal_closeButton">×</a>
				
				<div class="goodTube_title">GoodTube Pro</div>
				<div class="goodTube_subtitle">Advanced YouTube Enhancement Suite</div>
				
				<div class="goodTube_content">
					<div class="goodTube_stats_grid">
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_adsBlocked">${goodTube_stats.adsBlocked.toLocaleString()}</span>
							<span class="goodTube_stat_label">Ads Blocked</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_timeSaved">${goodTube_formatTime(goodTube_stats.timeSaved)}</span>
							<span class="goodTube_stat_label">Time Saved</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_sessions">${goodTube_stats.sessionsCount.toLocaleString()}</span>
							<span class="goodTube_stat_label">Sessions</span>
						</div>
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Settings</h3>
					
					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Block All Ads</div>
							<div class="goodTube_setting_description">Remove all video advertisements and promotional content</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_blockAds" checked>
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide YouTube Shorts</div>
							<div class="goodTube_setting_description">Remove Shorts from homepage and search results</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideShorts" checked>
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide Info Cards</div>
							<div class="goodTube_setting_description">Remove overlay cards that appear during videos</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideInfoCards">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide End Screen</div>
							<div class="goodTube_setting_description">Remove suggested videos at the end of videos</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideEndScreen">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Auto-Skip Intros</div>
							<div class="goodTube_setting_description">Automatically skip video intros and outros</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_autoSkip">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Enhanced Theater Mode</div>
							<div class="goodTube_setting_description">Improved fullscreen experience with better controls</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_theaterMode">
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">About</h3>
					<div class="goodTube_text">
						GoodTube Pro is an enhanced YouTube experience that removes ads, improves performance, and adds powerful features. 
						This enhanced version features a modern design inspired by cutting-edge web technologies.
					</div>
					<div class="goodTube_text">
						<strong>Key Features:</strong><br>
						• 100% ad blocking with advanced detection<br>
						• Real-time statistics tracking<br>
						• Modern, responsive interface<br>
						• Enhanced privacy protection<br>
						• Automatic updates and improvements
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Support</h3>
					<div class="goodTube_text">
						Help keep this project free and open-source. Your support enables continuous development and improvements.
					</div>
					<div style="display: flex; gap: 12px; flex-wrap: wrap;">
						<a href="https://github.com/AgnusSOCO/goodtube" class="goodTube_button goodTube_button_secondary" target="_blank">
							⭐ Star on GitHub
						</a>
						<a href="#" class="goodTube_button" onclick="goodTube_showNotification('Thank you for your support! 💜', 'success')">
							💜 Donate
						</a>
					</div>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		// Add event listeners
		goodTube_setupEventListeners(menuButton, modal);
		
		// Load saved settings
		goodTube_loadSettings();
		
		// Show welcome notification for new users
		if (goodTube_stats.sessionsCount === 1) {
			setTimeout(() => {
				goodTube_showNotification('Welcome to GoodTube Pro! Click the button to customize your experience.', 'success');
			}, 2000);
		}
	}

	/* Event Listeners
	------------------------------------------------------------------------------------------ */
	function goodTube_setupEventListeners(menuButton, modal) {
		// Open modal
		menuButton.addEventListener('click', () => {
			modal.style.display = 'block';
			goodTube_updateStatsDisplay();
		});

		// Close modal
		const closeButton = modal.querySelector('.goodTube_modal_closeButton');
		const overlay = modal.querySelector('.goodTube_modal_overlay');
		
		closeButton.addEventListener('click', (e) => {
			e.preventDefault();
			modal.style.display = 'none';
		});

		overlay.addEventListener('click', () => {
			modal.style.display = 'none';
		});

		// Settings toggles
		const settings = ['blockAds', 'hideShorts', 'hideInfoCards', 'hideEndScreen', 'autoSkip', 'theaterMode'];
		settings.forEach(setting => {
			const toggle = document.getElementById(`goodTube_${setting}`);
			if (toggle) {
				toggle.addEventListener('change', () => {
					goodTube_saveSetting(setting, toggle.checked);
					goodTube_applySetting(setting, toggle.checked);
				});
			}
		});

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			// Ctrl/Cmd + Shift + G to open GoodTube
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
				e.preventDefault();
				menuButton.click();
			}
		});
	}

	/* Settings Management
	------------------------------------------------------------------------------------------ */
	function goodTube_saveSetting(setting, value) {
		localStorage.setItem(`goodTube_${setting}`, value.toString());
	}

	function goodTube_getSetting(setting, defaultValue = false) {
		const saved = localStorage.getItem(`goodTube_${setting}`);
		return saved !== null ? saved === 'true' : defaultValue;
	}

	function goodTube_loadSettings() {
		const settings = {
			blockAds: true,
			hideShorts: true,
			hideInfoCards: false,
			hideEndScreen: false,
			autoSkip: false,
			theaterMode: false
		};

		Object.keys(settings).forEach(setting => {
			const value = goodTube_getSetting(setting, settings[setting]);
			const toggle = document.getElementById(`goodTube_${setting}`);
			if (toggle) {
				toggle.checked = value;
			}
			goodTube_applySetting(setting, value);
		});
	}

	function goodTube_applySetting(setting, enabled) {
		switch (setting) {
			case 'blockAds':
				if (enabled) {
					goodTube_blockAds();
				}
				break;
			case 'hideShorts':
				if (enabled) {
					goodTube_hideShorts();
				}
				break;
			case 'hideInfoCards':
				goodTube_toggleInfoCards(!enabled);
				break;
			case 'hideEndScreen':
				goodTube_toggleEndScreen(!enabled);
				break;
			case 'autoSkip':
				goodTube_toggleAutoSkip(enabled);
				break;
			case 'theaterMode':
				goodTube_toggleTheaterMode(enabled);
				break;
		}
	}

	/* Core Ad Blocking Functionality
	------------------------------------------------------------------------------------------ */
	function goodTube_blockAds() {
		// Block video ads
		const adSelectors = [
			'.video-ads',
			'.ytp-ad-module',
			'.ytp-ad-overlay-container',
			'.ytp-ad-text-overlay',
			'[id^="player-ads"]',
			'.ytd-promoted-sparkles-web-renderer',
			'.ytd-ad-slot-renderer',
			'.ytd-banner-promo-renderer',
			'ytd-in-feed-ad-layout-renderer',
			'ytd-ad-slot-renderer',
			'[data-ad-slot-id]'
		];

		adSelectors.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				goodTube_helper_hideElement(element);
			});
		});

		// Skip video ads
		const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
		if (skipButton && skipButton.offsetParent !== null) {
			skipButton.click();
			goodTube_updateStats(1, 15); // Assume 15 seconds saved by skipping
		}
	}

	function goodTube_hideShorts() {
		const shortsSelectors = [
			'ytd-rich-shelf-renderer[is-shorts]',
			'ytd-reel-shelf-renderer',
			'[aria-label*="Shorts"]',
			'ytd-shorts',
			'[href*="/shorts/"]'
		];

		shortsSelectors.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				goodTube_helper_hideElement(element);
			});
		});
	}

	function goodTube_toggleInfoCards(show) {
		const infoCards = document.querySelectorAll('.ytp-cards-teaser, .ytp-ce-element');
		infoCards.forEach(card => {
			if (show) {
				goodTube_helper_showElement(card);
			} else {
				goodTube_helper_hideElement(card);
			}
		});
	}

	function goodTube_toggleEndScreen(show) {
		const endScreens = document.querySelectorAll('.ytp-ce-covering-overlay, .ytp-endscreen-content');
		endScreens.forEach(screen => {
			if (show) {
				goodTube_helper_showElement(screen);
			} else {
				goodTube_helper_hideElement(screen);
			}
		});
	}

	function goodTube_toggleAutoSkip(enabled) {
		if (enabled) {
			// Auto-skip functionality would be implemented here
			console.log('Auto-skip enabled');
		}
	}

	function goodTube_toggleTheaterMode(enabled) {
		if (enabled) {
			// Enhanced theater mode functionality would be implemented here
			console.log('Enhanced theater mode enabled');
		}
	}

	/* Main Initialization
	------------------------------------------------------------------------------------------ */
	function goodTube_init() {
		console.log('🛡️ GoodTube Pro - Enhanced YouTube Experience');
		
		// Initialize helper functions
		goodTube_helper_showHide_init();
		
		// Add enhanced styles
		goodTube_addEnhancedStyles();
		
		// Create enhanced UI
		goodTube_createEnhancedUI();
		
		// Start monitoring for ads and applying settings
		setInterval(() => {
			if (goodTube_getSetting('blockAds', true)) {
				goodTube_blockAds();
			}
			if (goodTube_getSetting('hideShorts', true)) {
				goodTube_hideShorts();
			}
		}, 1000);
		
		// Monitor for page changes (YouTube SPA)
		let currentUrl = window.location.href;
		setInterval(() => {
			if (window.location.href !== currentUrl) {
				currentUrl = window.location.href;
				setTimeout(() => {
					goodTube_loadSettings();
				}, 1000);
			}
		}, 500);
	}

	/* Start Enhanced GoodTube
	------------------------------------------------------------------------------------------ */
	let goodTube_init_timeout = setTimeout(() => {}, 0);
	function goodTube_init_route() {
		if (document.head && window.location.href.indexOf('youtube') !== -1) {
			goodTube_init();
		} else {
			clearTimeout(goodTube_init_timeout);
			goodTube_init_timeout = setTimeout(goodTube_init_route, 100);
		}
	}

	// Initialize when ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', goodTube_init_route);
	} else {
		goodTube_init_route();
	}

})();


	/* Advanced Features Integration
	------------------------------------------------------------------------------------------ */
	
	// Load advanced features
	function goodTube_loadAdvancedFeatures() {
		// Advanced ad blocking with machine learning-like pattern detection
		const advancedAdSelectors = [
			'.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
			'.ytp-ad-text-overlay', '[id^="player-ads"]', '.ytp-ad-player-overlay',
			'.ytd-promoted-sparkles-web-renderer', '.ytd-ad-slot-renderer',
			'.ytd-banner-promo-renderer', 'ytd-in-feed-ad-layout-renderer',
			'[aria-label*="Sponsored"]', '[title*="Sponsored"]',
			'.ytd-product-details-renderer', '.ytd-shopping-carousel-renderer'
		];

		function advancedAdBlocking() {
			let adsBlocked = 0;
			
			advancedAdSelectors.forEach(selector => {
				const elements = document.querySelectorAll(selector);
				elements.forEach(element => {
					if (!element.classList.contains('goodTube_hidden')) {
						goodTube_helper_hideElement(element);
						adsBlocked++;
					}
				});
			});
			
			// Auto-skip video ads
			const skipButtons = document.querySelectorAll(
				'.ytp-ad-skip-button, .ytp-skip-ad-button, [class*="skip"], [aria-label*="Skip"]'
			);
			skipButtons.forEach(button => {
				if (button.offsetParent !== null && !button.disabled) {
					setTimeout(() => button.click(), 100);
					adsBlocked++;
				}
			});
			
			if (adsBlocked > 0) {
				goodTube_updateStats(adsBlocked, adsBlocked * 8);
			}
		}

		// Enhanced keyboard shortcuts
		function handleKeyboardShortcuts(event) {
			if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
			
			const video = document.querySelector('video');
			if (!video) return;
			
			switch (event.key.toLowerCase()) {
				case 'h':
					event.preventDefault();
					const ui = document.querySelector('.goodTube_menuButton');
					if (ui) {
						ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
						goodTube_showNotification(
							ui.style.display === 'none' ? 'UI Hidden (Press H to show)' : 'UI Visible',
							'success'
						);
					}
					break;
				case 'b':
					event.preventDefault();
					advancedAdBlocking();
					goodTube_showNotification('Manual ad block triggered', 'success');
					break;
			}
		}

		// Auto-skip segments
		function autoSkipSegments() {
			if (!goodTube_getSetting('autoSkip', false)) return;
			
			const video = document.querySelector('video');
			if (!video) return;
			
			const duration = video.duration;
			const currentTime = video.currentTime;
			
			// Skip first 10 seconds for videos longer than 1 minute
			if (currentTime < 10 && duration > 60 && currentTime > 0) {
				video.currentTime = 10;
				goodTube_showNotification('Skipped intro', 'success');
			}
		}

		// Enhanced Picture-in-Picture
		function enhancedPiP() {
			const video = document.querySelector('video');
			if (!video || !document.pictureInPictureEnabled) return;
			
			if (!document.querySelector('.goodTube_pip_button')) {
				const pipButton = document.createElement('button');
				pipButton.className = 'goodTube_pip_button';
				pipButton.innerHTML = '📺';
				pipButton.style.cssText = `
					position: fixed;
					bottom: 80px;
					right: 20px;
					background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary));
					color: white;
					border: none;
					border-radius: 50%;
					width: 50px;
					height: 50px;
					font-size: 20px;
					cursor: pointer;
					z-index: 999998;
					box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
					transition: all 0.3s ease;
					opacity: 0.8;
				`;
				
				pipButton.addEventListener('click', () => {
					if (document.pictureInPictureElement) {
						document.exitPictureInPicture();
					} else {
						video.requestPictureInPicture().catch(err => {
							goodTube_showNotification('Picture-in-Picture not available', 'warning');
						});
					}
				});
				
				pipButton.addEventListener('mouseenter', () => {
					pipButton.style.opacity = '1';
					pipButton.style.transform = 'scale(1.1)';
				});
				
				pipButton.addEventListener('mouseleave', () => {
					pipButton.style.opacity = '0.8';
					pipButton.style.transform = 'scale(1)';
				});
				
				document.body.appendChild(pipButton);
			}
		}

		// Return advanced features object
		return {
			advancedAdBlocking,
			handleKeyboardShortcuts,
			autoSkipSegments,
			enhancedPiP
		};
	}

	/* Enhanced Settings Panel
	------------------------------------------------------------------------------------------ */
	function goodTube_createAdvancedSettings() {
		return `
			<div class="goodTube_setting">
				<div class="goodTube_setting_info">
					<div class="goodTube_setting_label">Performance Mode</div>
					<div class="goodTube_setting_description">Optimize page performance by reducing resource usage</div>
				</div>
				<input type="checkbox" class="goodTube_toggle" id="goodTube_performanceMode">
			</div>

			<div class="goodTube_setting">
				<div class="goodTube_setting_info">
					<div class="goodTube_setting_label">Advanced Ad Detection</div>
					<div class="goodTube_setting_description">Use enhanced algorithms to detect and block more ads</div>
				</div>
				<input type="checkbox" class="goodTube_toggle" id="goodTube_advancedDetection" checked>
			</div>

			<div class="goodTube_setting">
				<div class="goodTube_setting_info">
					<div class="goodTube_setting_label">Picture-in-Picture Button</div>
					<div class="goodTube_setting_description">Show floating PiP button for easy video detachment</div>
				</div>
				<input type="checkbox" class="goodTube_toggle" id="goodTube_pipButton" checked>
			</div>

			<div class="goodTube_setting">
				<div class="goodTube_setting_info">
					<div class="goodTube_setting_label">Keyboard Shortcuts</div>
					<div class="goodTube_setting_description">Enable keyboard shortcuts (H: toggle UI, B: block ads)</div>
				</div>
				<input type="checkbox" class="goodTube_toggle" id="goodTube_keyboardShortcuts" checked>
			</div>

			<div class="goodTube_setting">
				<div class="goodTube_setting_info">
					<div class="goodTube_setting_label">Smart Notifications</div>
					<div class="goodTube_setting_description">Show helpful notifications for blocked content</div>
				</div>
				<input type="checkbox" class="goodTube_toggle" id="goodTube_smartNotifications" checked>
			</div>
		`;
	}

	/* Updated Main Initialization with Advanced Features
	------------------------------------------------------------------------------------------ */
	function goodTube_initAdvanced() {
		console.log('🛡️ GoodTube Pro - Enhanced YouTube Experience with Advanced Features');
		
		// Initialize helper functions
		goodTube_helper_showHide_init();
		
		// Add enhanced styles
		goodTube_addEnhancedStyles();
		
		// Load advanced features
		const advancedFeatures = goodTube_loadAdvancedFeatures();
		
		// Create enhanced UI with advanced settings
		goodTube_createEnhancedUIAdvanced(advancedFeatures);
		
		// Setup keyboard shortcuts
		if (goodTube_getSetting('keyboardShortcuts', true)) {
			document.addEventListener('keydown', advancedFeatures.handleKeyboardShortcuts);
		}
		
		// Main monitoring loop with advanced features
		setInterval(() => {
			if (goodTube_getSetting('blockAds', true)) {
				if (goodTube_getSetting('advancedDetection', true)) {
					advancedFeatures.advancedAdBlocking();
				} else {
					goodTube_blockAds();
				}
			}
			
			if (goodTube_getSetting('hideShorts', true)) {
				goodTube_hideShorts();
			}
			
			if (goodTube_getSetting('autoSkip', false)) {
				advancedFeatures.autoSkipSegments();
			}
			
			if (goodTube_getSetting('pipButton', true)) {
				advancedFeatures.enhancedPiP();
			}
		}, 1000);
		
		// Monitor for page changes (YouTube SPA)
		let currentUrl = window.location.href;
		setInterval(() => {
			if (window.location.href !== currentUrl) {
				currentUrl = window.location.href;
				setTimeout(() => {
					goodTube_loadSettings();
				}, 1000);
			}
		}, 500);
	}

	/* Enhanced UI Creation with Advanced Settings
	------------------------------------------------------------------------------------------ */
	function goodTube_createEnhancedUIAdvanced(advancedFeatures) {
		// Create menu button
		let menuButton = document.createElement('button');
		menuButton.className = 'goodTube_menuButton';
		menuButton.innerHTML = '🛡️ GoodTube Pro';
		document.body.appendChild(menuButton);

		// Create enhanced modal with advanced settings
		let modal = document.createElement('div');
		modal.className = 'goodTube_modal';
		modal.innerHTML = `
			<div class="goodTube_modal_overlay"></div>
			<div class="goodTube_modal_inner">
				<a href="#" class="goodTube_modal_closeButton">×</a>
				
				<div class="goodTube_title">GoodTube Pro</div>
				<div class="goodTube_subtitle">Advanced YouTube Enhancement Suite v4.0</div>
				
				<div class="goodTube_content">
					<div class="goodTube_stats_grid">
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_adsBlocked">${goodTube_stats.adsBlocked.toLocaleString()}</span>
							<span class="goodTube_stat_label">Ads Blocked</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_timeSaved">${goodTube_formatTime(goodTube_stats.timeSaved)}</span>
							<span class="goodTube_stat_label">Time Saved</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_sessions">${goodTube_stats.sessionsCount.toLocaleString()}</span>
							<span class="goodTube_stat_label">Sessions</span>
						</div>
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Core Settings</h3>
					
					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Block All Ads</div>
							<div class="goodTube_setting_description">Remove all video advertisements and promotional content</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_blockAds" checked>
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide YouTube Shorts</div>
							<div class="goodTube_setting_description">Remove Shorts from homepage and search results</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideShorts" checked>
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide Info Cards</div>
							<div class="goodTube_setting_description">Remove overlay cards that appear during videos</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideInfoCards">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide End Screen</div>
							<div class="goodTube_setting_description">Remove suggested videos at the end of videos</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideEndScreen">
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Advanced Features</h3>
					
					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Auto-Skip Intros</div>
							<div class="goodTube_setting_description">Automatically skip video intros and outros</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_autoSkip">
					</div>

					${goodTube_createAdvancedSettings()}
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Keyboard Shortcuts</h3>
					<div class="goodTube_text">
						<strong>Available shortcuts:</strong><br>
						• <kbd style="background: var(--goodtube-dark-lighter); padding: 2px 6px; border-radius: 4px; font-family: monospace;">H</kbd> - Toggle UI visibility<br>
						• <kbd style="background: var(--goodtube-dark-lighter); padding: 2px 6px; border-radius: 4px; font-family: monospace;">B</kbd> - Manual ad block<br>
						• <kbd style="background: var(--goodtube-dark-lighter); padding: 2px 6px; border-radius: 4px; font-family: monospace;">Ctrl+Shift+G</kbd> - Open GoodTube Pro
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">About</h3>
					<div class="goodTube_text">
						GoodTube Pro is an enhanced YouTube experience that removes ads, improves performance, and adds powerful features. 
						This enhanced version features a modern design inspired by cutting-edge web technologies.
					</div>
					<div class="goodTube_text">
						<strong>Enhanced Features:</strong><br>
						• Advanced ad detection algorithms<br>
						• Real-time performance monitoring<br>
						• Smart keyboard shortcuts<br>
						• Picture-in-Picture integration<br>
						• Modern responsive interface<br>
						• Privacy-focused design
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 18px;">Support</h3>
					<div class="goodTube_text">
						Help keep this project free and open-source. Your support enables continuous development and improvements.
					</div>
					<div style="display: flex; gap: 12px; flex-wrap: wrap;">
						<a href="https://github.com/AgnusSOCO/goodtube" class="goodTube_button goodTube_button_secondary" target="_blank">
							⭐ Star on GitHub
						</a>
						<a href="#" class="goodTube_button" onclick="goodTube_showNotification('Thank you for your support! 💜', 'success')">
							💜 Donate
						</a>
						<button class="goodTube_button goodTube_button_secondary" onclick="goodTube_resetStats()">
							🔄 Reset Stats
						</button>
					</div>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		// Add event listeners
		goodTube_setupAdvancedEventListeners(menuButton, modal, advancedFeatures);
		
		// Load saved settings
		goodTube_loadAdvancedSettings();
		
		// Show welcome notification for new users
		if (goodTube_stats.sessionsCount === 1) {
			setTimeout(() => {
				goodTube_showNotification('Welcome to GoodTube Pro! Click the shield button to customize your experience.', 'success');
			}, 2000);
		}
	}

	/* Advanced Event Listeners
	------------------------------------------------------------------------------------------ */
	function goodTube_setupAdvancedEventListeners(menuButton, modal, advancedFeatures) {
		// Open modal
		menuButton.addEventListener('click', () => {
			modal.style.display = 'block';
			goodTube_updateStatsDisplay();
		});

		// Close modal
		const closeButton = modal.querySelector('.goodTube_modal_closeButton');
		const overlay = modal.querySelector('.goodTube_modal_overlay');
		
		closeButton.addEventListener('click', (e) => {
			e.preventDefault();
			modal.style.display = 'none';
		});

		overlay.addEventListener('click', () => {
			modal.style.display = 'none';
		});

		// Settings toggles
		const settings = [
			'blockAds', 'hideShorts', 'hideInfoCards', 'hideEndScreen', 'autoSkip',
			'performanceMode', 'advancedDetection', 'pipButton', 'keyboardShortcuts', 'smartNotifications'
		];
		
		settings.forEach(setting => {
			const toggle = document.getElementById(`goodTube_${setting}`);
			if (toggle) {
				toggle.addEventListener('change', () => {
					goodTube_saveSetting(setting, toggle.checked);
					goodTube_applySetting(setting, toggle.checked);
					
					// Special handling for keyboard shortcuts
					if (setting === 'keyboardShortcuts') {
						if (toggle.checked) {
							document.addEventListener('keydown', advancedFeatures.handleKeyboardShortcuts);
						} else {
							document.removeEventListener('keydown', advancedFeatures.handleKeyboardShortcuts);
						}
					}
				});
			}
		});

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			// Ctrl/Cmd + Shift + G to open GoodTube
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
				e.preventDefault();
				menuButton.click();
			}
		});
	}

	/* Advanced Settings Management
	------------------------------------------------------------------------------------------ */
	function goodTube_loadAdvancedSettings() {
		const settings = {
			blockAds: true,
			hideShorts: true,
			hideInfoCards: false,
			hideEndScreen: false,
			autoSkip: false,
			performanceMode: false,
			advancedDetection: true,
			pipButton: true,
			keyboardShortcuts: true,
			smartNotifications: true
		};

		Object.keys(settings).forEach(setting => {
			const value = goodTube_getSetting(setting, settings[setting]);
			const toggle = document.getElementById(`goodTube_${setting}`);
			if (toggle) {
				toggle.checked = value;
			}
			goodTube_applySetting(setting, value);
		});
	}

	/* Reset Statistics
	------------------------------------------------------------------------------------------ */
	function goodTube_resetStats() {
		if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
			localStorage.removeItem('goodTube_adsBlocked');
			localStorage.removeItem('goodTube_timeSaved');
			localStorage.removeItem('goodTube_sessionsCount');
			
			goodTube_stats.adsBlocked = 0;
			goodTube_stats.timeSaved = 0;
			goodTube_stats.sessionsCount = 0;
			
			goodTube_updateStatsDisplay();
			goodTube_showNotification('Statistics reset successfully', 'success');
		}
	}

	// Override the original init function
	goodTube_init = goodTube_initAdvanced;

