// ==UserScript==
// @name         GoodTube Pro - Enhanced (Fixed)
// @namespace    https://github.com/AgnusSOCO/goodtube
// @version      4.1.0
// @description  Enhanced YouTube experience with improved ad blocking and non-invasive UI
// @author       GoodTube Pro Team
// @match        *://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/AgnusSOCO/goodtube/raw/main/goodtube-enhanced-fixed.js
// @downloadURL  https://github.com/AgnusSOCO/goodtube/raw/main/goodtube-enhanced-fixed.js
// ==/UserScript==

(function() {
	'use strict';

	/* Bypass CSP restrictions */
	if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
		window.trustedTypes.createPolicy('default', {
			createHTML: string => string,
			createScriptURL: string => string,
			createScript: string => string
		});
	}

	/* Enhanced GoodTube - Fixed Version */
	
	// Statistics tracking
	let goodTube_stats = {
		adsBlocked: parseInt(localStorage.getItem('goodTube_adsBlocked') || '0'),
		timeSaved: parseInt(localStorage.getItem('goodTube_timeSaved') || '0'),
		sessionsCount: parseInt(localStorage.getItem('goodTube_sessionsCount') || '0')
	};

	goodTube_stats.sessionsCount++;
	localStorage.setItem('goodTube_sessionsCount', goodTube_stats.sessionsCount.toString());

	/* Helper functions */
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

	function goodTube_helper_setCookie(name, value, days = 399) {
		document.cookie = name + "=" + encodeURIComponent(value) + ";max-age=" + (days * 24 * 60 * 60);
	}

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

	function goodTube_helper_hideElement(element) {
		if (element && !element.classList.contains('goodTube_hidden')) {
			element.classList.add('goodTube_hidden');
			element.style.setProperty('display', 'none', 'important');
			element.style.setProperty('visibility', 'hidden', 'important');
			element.style.setProperty('opacity', '0', 'important');
			element.style.setProperty('height', '0', 'important');
			element.style.setProperty('width', '0', 'important');
			element.style.setProperty('margin', '0', 'important');
			element.style.setProperty('padding', '0', 'important');
		}
	}

	function goodTube_helper_showElement(element) {
		if (element && element.classList.contains('goodTube_hidden')) {
			element.classList.remove('goodTube_hidden');
			element.style.removeProperty('display');
			element.style.removeProperty('visibility');
			element.style.removeProperty('opacity');
			element.style.removeProperty('height');
			element.style.removeProperty('width');
			element.style.removeProperty('margin');
			element.style.removeProperty('padding');
		}
	}

	function goodTube_helper_showHide_init() {
		// Initialize helper functions
	}

	function goodTube_updateStats(adsBlocked = 0, timeSaved = 0) {
		goodTube_stats.adsBlocked += adsBlocked;
		goodTube_stats.timeSaved += timeSaved;
		
		localStorage.setItem('goodTube_adsBlocked', goodTube_stats.adsBlocked.toString());
		localStorage.setItem('goodTube_timeSaved', goodTube_stats.timeSaved.toString());
		
		goodTube_updateStatsDisplay();
	}

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

	/* Enhanced Styles with Non-invasive UI */
	function goodTube_addEnhancedStyles() {
		const style = document.createElement('style');
		style.textContent = `
			/* CSS Variables */
			:root {
				--goodtube-primary: #8B5CF6;
				--goodtube-secondary: #EC4899;
				--goodtube-primary-hover: #7C3AED;
				--goodtube-secondary-hover: #DB2777;
				--goodtube-dark: #1a1a1a;
				--goodtube-dark-lighter: #2a2a2a;
				--goodtube-dark-border: #3a3a3a;
				--goodtube-text-primary: #ffffff;
				--goodtube-text-secondary: #a0a0a0;
				--goodtube-success: #10B981;
				--goodtube-warning: #F59E0B;
				--goodtube-error: #EF4444;
			}

			/* Hidden elements */
			.goodTube_hidden {
				display: none !important;
				visibility: hidden !important;
				opacity: 0 !important;
				height: 0 !important;
				width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
			}

			/* Notification System */
			.goodTube_notification {
				position: fixed;
				top: 20px;
				right: 20px;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary));
				color: var(--goodtube-text-primary);
				padding: 12px 16px;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
				z-index: 999999;
				transform: translateX(400px);
				opacity: 0;
				transition: all 0.3s ease;
				backdrop-filter: blur(10px);
				border: 1px solid rgba(255, 255, 255, 0.1);
				font-size: 13px;
				max-width: 300px;
			}

			.goodTube_notification_show {
				transform: translateX(0);
				opacity: 1;
			}

			/* Non-invasive Menu Button - Bottom Right Corner */
			.goodTube_menuButton {
				position: fixed !important;
				bottom: 20px !important;
				right: 20px !important;
				z-index: 999998 !important;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				color: var(--goodtube-text-primary) !important;
				border: none !important;
				border-radius: 50% !important;
				width: 50px !important;
				height: 50px !important;
				font-size: 18px !important;
				font-weight: 600 !important;
				cursor: pointer !important;
				transition: all 0.3s ease !important;
				box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
				backdrop-filter: blur(10px) !important;
				border: 1px solid rgba(255, 255, 255, 0.1) !important;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
				display: flex !important;
				align-items: center !important;
				justify-content: center !important;
			}

			.goodTube_menuButton:hover {
				transform: translateY(-2px) scale(1.05) !important;
				box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
				background: linear-gradient(135deg, var(--goodtube-primary-hover), var(--goodtube-secondary-hover)) !important;
			}

			/* Tooltip for the button */
			.goodTube_menuButton::after {
				content: 'GoodTube Pro Settings';
				position: absolute;
				bottom: 60px;
				right: 0;
				background: var(--goodtube-dark);
				color: var(--goodtube-text-primary);
				padding: 8px 12px;
				border-radius: 6px;
				font-size: 12px;
				white-space: nowrap;
				opacity: 0;
				pointer-events: none;
				transition: opacity 0.3s ease;
				border: 1px solid var(--goodtube-dark-border);
			}

			.goodTube_menuButton:hover::after {
				opacity: 1;
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
				border-radius: 16px !important;
				box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
				padding: 24px !important;
				overflow: auto !important;
				max-width: 500px !important;
				width: 90vw !important;
				max-height: 80vh !important;
			}

			.goodTube_modal_closeButton {
				position: absolute !important;
				top: 12px !important;
				right: 12px !important;
				color: var(--goodtube-text-secondary) !important;
				font-size: 20px !important;
				font-weight: 400 !important;
				text-decoration: none !important;
				width: 32px !important;
				height: 32px !important;
				background: var(--goodtube-dark-lighter) !important;
				border-radius: 50% !important;
				text-align: center !important;
				line-height: 32px !important;
				transition: all 0.2s ease !important;
				border: 1px solid var(--goodtube-dark-border) !important;
			}

			.goodTube_modal_closeButton:hover {
				background: var(--goodtube-dark-border) !important;
				color: var(--goodtube-text-primary) !important;
			}

			/* Modal Content */
			.goodTube_title {
				font-weight: 700 !important;
				font-size: 24px !important;
				padding-bottom: 6px !important;
				color: var(--goodtube-text-primary) !important;
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				-webkit-background-clip: text !important;
				-webkit-text-fill-color: transparent !important;
				background-clip: text !important;
			}

			.goodTube_subtitle {
				font-size: 14px !important;
				color: var(--goodtube-text-secondary) !important;
				margin-bottom: 24px !important;
				font-weight: 400 !important;
			}

			.goodTube_content {
				padding-bottom: 20px !important;
				border-bottom: 1px solid var(--goodtube-dark-border) !important;
				margin-bottom: 20px !important;
			}

			.goodTube_content:last-child {
				border-bottom: 0 !important;
				margin-bottom: 0 !important;
				padding-bottom: 0 !important;
			}

			/* Statistics Cards */
			.goodTube_stats_grid {
				display: grid !important;
				grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
				gap: 12px !important;
				margin-bottom: 20px !important;
			}

			.goodTube_stat_card {
				background: var(--goodtube-dark-lighter) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
				border-radius: 8px !important;
				padding: 16px !important;
				text-align: center !important;
				transition: all 0.2s ease !important;
			}

			.goodTube_stat_card:hover {
				transform: translateY(-1px) !important;
				box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2) !important;
			}

			.goodTube_stat_number {
				font-size: 20px !important;
				font-weight: 700 !important;
				color: var(--goodtube-primary) !important;
				display: block !important;
			}

			.goodTube_stat_label {
				font-size: 11px !important;
				color: var(--goodtube-text-secondary) !important;
				text-transform: uppercase !important;
				letter-spacing: 0.5px !important;
				margin-top: 4px !important;
			}

			/* Settings */
			.goodTube_setting {
				display: flex !important;
				justify-content: space-between !important;
				align-items: center !important;
				padding: 12px 0 !important;
				border-bottom: 1px solid var(--goodtube-dark-border) !important;
			}

			.goodTube_setting:last-child {
				border-bottom: none !important;
			}

			.goodTube_setting_info {
				flex: 1 !important;
			}

			.goodTube_setting_label {
				color: var(--goodtube-text-primary) !important;
				font-weight: 500 !important;
				font-size: 14px !important;
				margin-bottom: 2px !important;
			}

			.goodTube_setting_description {
				color: var(--goodtube-text-secondary) !important;
				font-size: 12px !important;
				line-height: 1.4 !important;
			}

			/* Toggle Switch */
			.goodTube_toggle {
				position: relative !important;
				width: 44px !important;
				height: 24px !important;
				background: var(--goodtube-dark-border) !important;
				border-radius: 12px !important;
				border: none !important;
				cursor: pointer !important;
				transition: background 0.3s ease !important;
				appearance: none !important;
				-webkit-appearance: none !important;
			}

			.goodTube_toggle:checked {
				background: var(--goodtube-primary) !important;
			}

			.goodTube_toggle::after {
				content: '' !important;
				position: absolute !important;
				top: 2px !important;
				left: 2px !important;
				width: 20px !important;
				height: 20px !important;
				background: white !important;
				border-radius: 50% !important;
				transition: transform 0.3s ease !important;
			}

			.goodTube_toggle:checked::after {
				transform: translateX(20px) !important;
			}

			/* Buttons */
			.goodTube_button {
				background: linear-gradient(135deg, var(--goodtube-primary), var(--goodtube-secondary)) !important;
				color: var(--goodtube-text-primary) !important;
				border: none !important;
				padding: 8px 16px !important;
				border-radius: 6px !important;
				font-size: 12px !important;
				font-weight: 500 !important;
				cursor: pointer !important;
				transition: all 0.2s ease !important;
				text-decoration: none !important;
				display: inline-block !important;
			}

			.goodTube_button:hover {
				transform: translateY(-1px) !important;
				box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
			}

			.goodTube_button_secondary {
				background: var(--goodtube-dark-lighter) !important;
				border: 1px solid var(--goodtube-dark-border) !important;
			}

			.goodTube_text {
				color: var(--goodtube-text-secondary) !important;
				font-size: 13px !important;
				line-height: 1.5 !important;
				margin-bottom: 12px !important;
			}

			.goodTube_text:last-child {
				margin-bottom: 0 !important;
			}
		`;
		document.head.appendChild(style);
	}

	/* Enhanced Ad Blocking with Mid-roll Support */
	function goodTube_blockAds() {
		let adsBlocked = 0;

		// Comprehensive ad selectors including mid-roll ads
		const adSelectors = [
			// Video ads
			'.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
			'.ytp-ad-text-overlay', '[id^="player-ads"]', '.ytp-ad-player-overlay',
			'.ytp-ad-overlay-slot', '.ytp-ad-overlay-image', '.ytp-ad-image-overlay',
			
			// Mid-roll and pre-roll ads
			'.ytp-ad-preview-container', '.ytp-ad-preview-text', '.ytp-ad-preview-image',
			'.ad-showing', '.ad-interrupting', '[class*="ad-showing"]',
			
			// Sponsored content
			'.ytd-promoted-sparkles-web-renderer', '.ytd-ad-slot-renderer',
			'.ytd-banner-promo-renderer', 'ytd-in-feed-ad-layout-renderer',
			'[aria-label*="Sponsored"]', '[title*="Sponsored"]',
			
			// Shopping and product ads
			'.ytd-product-details-renderer', '.ytd-shopping-carousel-renderer',
			
			// Generic ad containers
			'[data-ad-slot-id]', '[id*="google_ads"]', '.googima-ad-div',
			'[class*="advertisement"]', '[id*="advertisement"]'
		];

		// Block ads by hiding elements
		adSelectors.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				if (!element.classList.contains('goodTube_hidden')) {
					goodTube_helper_hideElement(element);
					adsBlocked++;
				}
			});
		});

		// Enhanced skip button detection and clicking
		const skipSelectors = [
			'.ytp-ad-skip-button', '.ytp-skip-ad-button', '.ytp-ad-skip-button-modern',
			'[class*="skip"]', '[aria-label*="Skip"]', '[title*="Skip"]',
			'.videoAdUiSkipButton', '.skip-button', '[data-purpose="skip-button"]'
		];

		skipSelectors.forEach(selector => {
			const skipButtons = document.querySelectorAll(selector);
			skipButtons.forEach(button => {
				if (button.offsetParent !== null && !button.disabled && button.style.display !== 'none') {
					setTimeout(() => {
						button.click();
						adsBlocked++;
						goodTube_showNotification('Ad skipped automatically', 'success');
					}, 100);
				}
			});
		});

		// Advanced video ad detection and handling
		const video = document.querySelector('video');
		if (video) {
			// Check if video is an ad by examining the player state
			const playerContainer = video.closest('#movie_player, .html5-video-player');
			if (playerContainer) {
				// Look for ad indicators in the player
				const adIndicators = playerContainer.querySelectorAll(
					'.ytp-ad-text, [class*="ad-text"], .ytp-ad-duration-remaining, .ytp-ad-preview-text'
				);
				
				if (adIndicators.length > 0) {
					// This is likely an ad, try to skip it
					video.currentTime = video.duration || 0;
					adsBlocked++;
				}

				// Check for ad overlay elements
				const adOverlays = playerContainer.querySelectorAll(
					'.ytp-ad-overlay-container, .ytp-ad-text-overlay, .ytp-ad-image-overlay'
				);
				adOverlays.forEach(overlay => {
					if (!overlay.classList.contains('goodTube_hidden')) {
						goodTube_helper_hideElement(overlay);
						adsBlocked++;
					}
				});
			}

			// Monitor video events for ad detection
			if (!video.hasAttribute('goodtube-monitored')) {
				video.setAttribute('goodtube-monitored', 'true');
				
				video.addEventListener('loadstart', () => {
					// Check if this is an ad video
					setTimeout(() => {
						const adText = document.querySelector('.ytp-ad-text, .ytp-ad-duration-remaining');
						if (adText && adText.offsetParent !== null) {
							// Try to skip the ad
							const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
							if (skipButton) {
								skipButton.click();
							} else {
								// If no skip button, try to fast-forward
								video.currentTime = video.duration || 0;
							}
							adsBlocked++;
						}
					}, 500);
				});
			}
		}

		// Update statistics if ads were blocked
		if (adsBlocked > 0) {
			goodTube_updateStats(adsBlocked, adsBlocked * 8);
		}
	}

	/* Notification System */
	function goodTube_showNotification(message, type = 'info') {
		const notification = document.createElement('div');
		notification.className = 'goodTube_notification';
		
		const icons = {
			success: '✅',
			warning: '⚠️',
			error: '❌',
			info: 'ℹ️'
		};
		
		notification.innerHTML = `
			<div class="goodTube_notification_content">
				<span class="goodTube_notification_icon">${icons[type] || icons.info}</span>
				<span class="goodTube_notification_message">${message}</span>
			</div>
		`;
		
		document.body.appendChild(notification);
		
		// Show notification
		setTimeout(() => {
			notification.classList.add('goodTube_notification_show');
		}, 100);
		
		// Hide and remove notification
		setTimeout(() => {
			notification.classList.remove('goodTube_notification_show');
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 300);
		}, 3000);
	}

	/* Enhanced UI Creation */
	function goodTube_createEnhancedUI() {
		// Create menu button with shield icon
		const menuButton = document.createElement('button');
		menuButton.className = 'goodTube_menuButton';
		menuButton.innerHTML = '🛡️';
		menuButton.title = 'GoodTube Pro Settings';
		document.body.appendChild(menuButton);

		// Create modal
		const modal = document.createElement('div');
		modal.className = 'goodTube_modal';
		modal.innerHTML = `
			<div class="goodTube_modal_overlay"></div>
			<div class="goodTube_modal_inner">
				<a href="#" class="goodTube_modal_closeButton">×</a>
				
				<div class="goodTube_title">🛡️ GoodTube Pro</div>
				<div class="goodTube_subtitle">Enhanced YouTube experience with advanced ad blocking</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 16px;">📊 Statistics</h3>
					<div class="goodTube_stats_grid">
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_adsBlocked">0</span>
							<span class="goodTube_stat_label">Ads Blocked</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_timeSaved">0s</span>
							<span class="goodTube_stat_label">Time Saved</span>
						</div>
						<div class="goodTube_stat_card">
							<span class="goodTube_stat_number goodTube_stat_sessions">0</span>
							<span class="goodTube_stat_label">Sessions</span>
						</div>
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 16px;">⚙️ Settings</h3>
					
					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Block Ads</div>
							<div class="goodTube_setting_description">Remove all ads including mid-roll video ads</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_blockAds">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide Shorts</div>
							<div class="goodTube_setting_description">Remove YouTube Shorts from all pages</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideShorts">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide Info Cards</div>
							<div class="goodTube_setting_description">Remove popup cards during video playback</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideInfoCards">
					</div>

					<div class="goodTube_setting">
						<div class="goodTube_setting_info">
							<div class="goodTube_setting_label">Hide End Screen</div>
							<div class="goodTube_setting_description">Remove suggested videos at the end</div>
						</div>
						<input type="checkbox" class="goodTube_toggle" id="goodTube_hideEndScreen">
					</div>
				</div>

				<div class="goodTube_content">
					<h3 style="color: var(--goodtube-text-primary); margin-bottom: 16px; font-size: 16px;">ℹ️ About</h3>
					<div class="goodTube_text">
						GoodTube Pro provides an enhanced YouTube experience with advanced ad blocking, 
						including mid-roll video ads, and a clean, non-invasive interface.
					</div>
					<div class="goodTube_text">
						<strong>Keyboard Shortcuts:</strong><br>
						• <kbd>H</kbd> - Toggle UI visibility<br>
						• <kbd>B</kbd> - Manual ad block<br>
						• <kbd>Ctrl+Shift+G</kbd> - Open settings
					</div>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		// Setup event listeners
		goodTube_setupEventListeners(menuButton, modal);
		goodTube_loadSettings();
		
		// Show welcome notification for new users
		if (goodTube_stats.sessionsCount === 1) {
			setTimeout(() => {
				goodTube_showNotification('Welcome to GoodTube Pro! Enhanced ad blocking is now active.', 'success');
			}, 2000);
		}
	}

	/* Event Listeners */
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
		const settings = ['blockAds', 'hideShorts', 'hideInfoCards', 'hideEndScreen'];
		settings.forEach(setting => {
			const toggle = document.getElementById(`goodTube_${setting}`);
			if (toggle) {
				toggle.addEventListener('change', () => {
					goodTube_saveSetting(setting, toggle.checked);
					goodTube_applySetting(setting, toggle.checked);
				});
			}
		});

		// Enhanced keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
			
			switch (e.key.toLowerCase()) {
				case 'h':
					e.preventDefault();
					menuButton.style.display = menuButton.style.display === 'none' ? 'flex' : 'none';
					goodTube_showNotification(
						menuButton.style.display === 'none' ? 'UI Hidden (Press H to show)' : 'UI Visible',
						'success'
					);
					break;
				case 'b':
					e.preventDefault();
					goodTube_blockAds();
					goodTube_showNotification('Manual ad block triggered', 'success');
					break;
			}
			
			// Ctrl/Cmd + Shift + G to open settings
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
				e.preventDefault();
				menuButton.click();
			}
		});
	}

	/* Settings Management */
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
			hideEndScreen: false
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
		}
	}

	/* Additional Functions */
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

	/* Main Initialization */
	function goodTube_init() {
		console.log('🛡️ GoodTube Pro - Enhanced YouTube Experience (Fixed Version)');
		
		goodTube_helper_showHide_init();
		goodTube_addEnhancedStyles();
		goodTube_createEnhancedUI();
		
		// Enhanced monitoring with more frequent checks for mid-roll ads
		setInterval(() => {
			if (goodTube_getSetting('blockAds', true)) {
				goodTube_blockAds();
			}
			if (goodTube_getSetting('hideShorts', true)) {
				goodTube_hideShorts();
			}
		}, 500); // More frequent checking for better mid-roll ad detection
		
		// Monitor for page changes
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

	/* Initialize */
	let goodTube_init_timeout = setTimeout(() => {}, 0);
	function goodTube_init_route() {
		if (document.head && window.location.href.indexOf('youtube') !== -1) {
			goodTube_init();
		} else {
			clearTimeout(goodTube_init_timeout);
			goodTube_init_timeout = setTimeout(goodTube_init_route, 100);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', goodTube_init_route);
	} else {
		goodTube_init_route();
	}

})();

