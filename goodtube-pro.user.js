// ==UserScript==
// @name         GoodTube Pro - Enhanced
// @namespace    http://tampermonkey.net/
// @version      4.0.0
// @description  Enhanced YouTube experience with modern UI, advanced ad blocking, and powerful features
// @author       GoodTube Pro Team
// @updateURL    https://github.com/AgnusSOCO/goodtube/raw/refs/heads/main/goodtube-pro.user.js
// @downloadURL  https://github.com/AgnusSOCO/goodtube/raw/refs/heads/main/goodtube-pro.user.js
// @match        *://m.youtube.com/*
// @match        *://www.youtube.com/*
// @match        *://youtube.com/*
// @icon         https://cdn-icons-png.flaticon.com/256/1384/1384060.png
// @run-at       document-start
// @grant        none
// ==/UserScript==

// GoodTube Pro - Enhanced YouTube Experience
// Features modern SOCO PWA-inspired design with advanced functionality
// Automatically loads the latest enhanced version for seamless updates

(function () {
	'use strict';

	// Bypass CSP restrictions for modern browsers
	if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
		window.trustedTypes.createPolicy('default', {
			createHTML: string => string,
			createScriptURL: string => string,
			createScript: string => string
		});
	}

	// Enhanced loading function with better error handling
	function goodTubePro_load(loadAttempts) {
		// First load attempt - show branding
		if (loadAttempts === 0) {
			if (window.top === window.self) {
				console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗  ██████╗  ██████╗ ██████╗ ████████╗██╗   ██╗██████╗ ║
║  ██╔════╝ ██╔═══██╗██╔═══██╗██╔══██╗╚══██╔══╝██║   ██║██╔══██╗║
║  ██║  ███╗██║   ██║██║   ██║██║  ██║   ██║   ██║   ██║██████╔╝║
║  ██║   ██║██║   ██║██║   ██║██║  ██║   ██║   ██║   ██║██╔══██╗║
║  ╚██████╔╝╚██████╔╝╚██████╔╝██████╔╝   ██║   ╚██████╔╝██████╔╝║
║   ╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═════╝ ║
║                                                              ║
║                    ██████╗ ██████╗  ██████╗                 ║
║                    ██╔══██╗██╔══██╗██╔═══██╗                ║
║                    ██████╔╝██████╔╝██║   ██║                ║
║                    ██╔═══╝ ██╔══██╗██║   ██║                ║
║                    ██║     ██║  ██║╚██████╔╝                ║
║                    ╚═╝     ╚═╝  ╚═╝ ╚═════╝                 ║
║                                                              ║
║              Enhanced YouTube Experience v4.0               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
				`);
				console.log('🛡️ [GoodTube Pro] Initializing enhanced experience...');
			}
		}

		// Maximum retry attempts
		if (loadAttempts >= 10) {
			if (window.top === window.self) {
				console.error('❌ [GoodTube Pro] Failed to load after maximum attempts');
				
				// Show user-friendly error notification
				const errorNotification = document.createElement('div');
				errorNotification.style.cssText = `
					position: fixed;
					top: 20px;
					right: 20px;
					background: linear-gradient(135deg, #EF4444, #DC2626);
					color: white;
					padding: 16px 20px;
					border-radius: 12px;
					box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
					z-index: 999999;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					font-size: 14px;
					font-weight: 500;
					max-width: 300px;
				`;
				errorNotification.innerHTML = `
					<div style="display: flex; align-items: center; gap: 8px;">
						<span style="font-size: 18px;">⚠️</span>
						<div>
							<div style="font-weight: 600; margin-bottom: 4px;">GoodTube Pro Error</div>
							<div style="opacity: 0.9;">Could not load. Please refresh the page to try again.</div>
						</div>
					</div>
				`;
				document.body.appendChild(errorNotification);
				
				// Auto-remove notification after 5 seconds
				setTimeout(() => errorNotification.remove(), 5000);
			}
			return;
		}

		// Increment load attempts
		loadAttempts++;

		// Load the enhanced GoodTube Pro script
		fetch('https://raw.githubusercontent.com/AgnusSOCO/goodtube/refs/heads/main/goodtube-enhanced.js', {
			cache: 'no-cache',
			headers: {
				'Cache-Control': 'no-cache'
			}
		})
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			return response.text();
		})
		.then(scriptContent => {
			// Create and inject the enhanced script
			const scriptElement = document.createElement('script');
			scriptElement.type = 'text/javascript';
			scriptElement.innerHTML = scriptContent;
			
			// Add script to head for better execution context
			(document.head || document.documentElement).appendChild(scriptElement);
			
			if (window.top === window.self) {
				console.log('✅ [GoodTube Pro] Enhanced experience loaded successfully!');
			}
		})
		.catch((error) => {
			console.warn(`⚠️ [GoodTube Pro] Load attempt ${loadAttempts} failed:`, error.message);
			
			// Retry with exponential backoff
			const retryDelay = Math.min(1000 * Math.pow(1.5, loadAttempts - 1), 5000);
			setTimeout(() => {
				goodTubePro_load(loadAttempts);
			}, retryDelay);
		});
	}

	// Initialize GoodTube Pro
	goodTubePro_load(0);

})();

