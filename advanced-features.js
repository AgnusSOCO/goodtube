/* Advanced Features for GoodTube Pro
------------------------------------------------------------------------------------------ */

// Performance monitoring
let goodTube_performance = {
	startTime: Date.now(),
	adsDetected: 0,
	pageLoads: 0,
	lastOptimization: Date.now()
};

// Advanced ad detection patterns
const goodTube_advancedAdSelectors = [
	// Video ads
	'.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
	'.ytp-ad-text-overlay', '[id^="player-ads"]', '.ytp-ad-player-overlay',
	'.ytp-ad-image-overlay', '.ytp-ad-button-container',
	
	// Promoted content
	'.ytd-promoted-sparkles-web-renderer', '.ytd-ad-slot-renderer',
	'.ytd-banner-promo-renderer', 'ytd-in-feed-ad-layout-renderer',
	'ytd-ad-slot-renderer', '[data-ad-slot-id]',
	
	// Sponsored content
	'[aria-label*="Sponsored"]', '[title*="Sponsored"]',
	'.ytd-promoted-video-renderer', '.ytd-compact-promoted-video-renderer',
	
	// Shopping and product ads
	'.ytd-product-details-renderer', '.ytd-shopping-carousel-renderer',
	'.ytd-product-carousel-renderer', '.ytd-shopping-shelf-renderer',
	
	// Channel promotions
	'.ytd-channel-about-metadata-renderer .ytd-button-renderer[href*="subscribe"]',
	'.ytd-subscribe-button-renderer[subscribe-button]',
	
	// Overlay ads
	'.ytp-ce-covering-overlay', '.ytp-ce-element-show',
	'.ytp-cards-teaser', '.ytp-ce-video', '.ytp-ce-playlist'
];

// Enhanced ad blocking with machine learning-like pattern detection
function goodTube_advancedAdBlocking() {
	let adsBlocked = 0;
	
	// Block known ad selectors
	goodTube_advancedAdSelectors.forEach(selector => {
		const elements = document.querySelectorAll(selector);
		elements.forEach(element => {
			if (!element.classList.contains('goodTube_hidden')) {
				goodTube_helper_hideElement(element);
				adsBlocked++;
			}
		});
	});
	
	// Detect ads by content analysis
	const suspiciousElements = document.querySelectorAll('[class*="ad"], [id*="ad"], [data-ad]');
	suspiciousElements.forEach(element => {
		const text = element.textContent.toLowerCase();
		const adKeywords = ['sponsored', 'advertisement', 'promoted', 'ad', 'shop now', 'buy now'];
		
		if (adKeywords.some(keyword => text.includes(keyword))) {
			if (!element.classList.contains('goodTube_hidden')) {
				goodTube_helper_hideElement(element);
				adsBlocked++;
			}
		}
	});
	
	// Auto-skip video ads with better detection
	const skipButtons = document.querySelectorAll(
		'.ytp-ad-skip-button, .ytp-skip-ad-button, [class*="skip"], [aria-label*="Skip"]'
	);
	skipButtons.forEach(button => {
		if (button.offsetParent !== null && !button.disabled) {
			setTimeout(() => button.click(), 100);
			adsBlocked++;
		}
	});
	
	// Update statistics
	if (adsBlocked > 0) {
		goodTube_updateStats(adsBlocked, adsBlocked * 8); // Assume 8 seconds saved per ad
		goodTube_performance.adsDetected += adsBlocked;
	}
}

// Enhanced shorts removal with better detection
function goodTube_advancedShortsRemoval() {
	const shortsSelectors = [
		// Main shorts containers
		'ytd-rich-shelf-renderer[is-shorts]', 'ytd-reel-shelf-renderer',
		'ytd-shorts', '[aria-label*="Shorts"]',
		
		// Shorts in search and recommendations
		'[href*="/shorts/"]', '[href*="youtube.com/shorts"]',
		'ytd-video-renderer[href*="/shorts/"]',
		
		// Shorts shelf and carousel
		'ytd-reel-shelf-renderer', 'ytd-shorts-shelf-renderer',
		'.ytd-reel-video-renderer', '.ytd-shorts-video-renderer',
		
		// Mobile shorts
		'.shorts-video-cell', '.reel-video-in-sequence',
		'[data-context-item-id*="shorts"]'
	];
	
	shortsSelectors.forEach(selector => {
		const elements = document.querySelectorAll(selector);
		elements.forEach(element => {
			// Check if it's actually a shorts element
			const href = element.href || element.querySelector('a')?.href;
			if (href && href.includes('/shorts/')) {
				goodTube_helper_hideElement(element);
			}
		});
	});
	
	// Remove shorts from search results
	const searchResults = document.querySelectorAll('ytd-video-renderer');
	searchResults.forEach(result => {
		const link = result.querySelector('a[href*="/shorts/"]');
		if (link) {
			goodTube_helper_hideElement(result);
		}
	});
}

// Performance optimization
function goodTube_performanceOptimization() {
	// Remove unnecessary elements that slow down the page
	const heavyElements = [
		'.ytd-comments-section-renderer', // Comments (can be toggled)
		'.ytd-live-chat-frame', // Live chat
		'.ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]'
	];
	
	if (goodTube_getSetting('optimizePerformance', false)) {
		heavyElements.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				element.style.display = 'none';
			});
		});
	}
	
	// Lazy load images that are not in viewport
	const images = document.querySelectorAll('img[src]');
	images.forEach(img => {
		if (!goodTube_isInViewport(img)) {
			const src = img.src;
			img.removeAttribute('src');
			img.dataset.lazySrc = src;
		}
	});
}

// Check if element is in viewport
function goodTube_isInViewport(element) {
	const rect = element.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

// Auto-skip intros and outros
function goodTube_autoSkipSegments() {
	if (!goodTube_getSetting('autoSkip', false)) return;
	
	const video = document.querySelector('video');
	if (!video) return;
	
	const duration = video.duration;
	const currentTime = video.currentTime;
	
	// Skip first 10 seconds (typical intro length)
	if (currentTime < 10 && duration > 60) {
		video.currentTime = 10;
		goodTube_showNotification('Skipped intro', 'success');
	}
	
	// Skip last 20 seconds (typical outro length)
	if (currentTime > duration - 20 && duration > 60) {
		video.currentTime = duration - 5;
		goodTube_showNotification('Skipped outro', 'success');
	}
}

// Enhanced theater mode
function goodTube_enhancedTheaterMode() {
	if (!goodTube_getSetting('theaterMode', false)) return;
	
	const player = document.querySelector('#movie_player');
	if (!player) return;
	
	// Add custom theater mode styles
	const theaterStyles = `
		.goodTube_enhanced_theater {
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			width: 100vw !important;
			height: 100vh !important;
			z-index: 999999 !important;
			background: #000 !important;
		}
		
		.goodTube_enhanced_theater video {
			width: 100% !important;
			height: 100% !important;
			object-fit: contain !important;
		}
	`;
	
	if (!document.querySelector('#goodTube_theater_styles')) {
		const style = document.createElement('style');
		style.id = 'goodTube_theater_styles';
		style.textContent = theaterStyles;
		document.head.appendChild(style);
	}
}

// Keyboard shortcuts
function goodTube_keyboardShortcuts(event) {
	// Only work when not typing in input fields
	if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
	
	const video = document.querySelector('video');
	if (!video) return;
	
	switch (event.key.toLowerCase()) {
		case 'h': // Hide/show UI
			event.preventDefault();
			goodTube_toggleUI();
			break;
		case 'b': // Block current ad
			event.preventDefault();
			goodTube_blockCurrentAd();
			break;
		case 'n': // Next video
			event.preventDefault();
			goodTube_nextVideo();
			break;
		case 'p': // Previous video
			event.preventDefault();
			goodTube_previousVideo();
			break;
	}
}

// Toggle UI visibility
function goodTube_toggleUI() {
	const ui = document.querySelector('.goodTube_menuButton');
	if (ui) {
		ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
		goodTube_showNotification(
			ui.style.display === 'none' ? 'UI Hidden (Press H to show)' : 'UI Visible',
			'success'
		);
	}
}

// Block current ad manually
function goodTube_blockCurrentAd() {
	const adElements = document.querySelectorAll('.ytp-ad-module, .video-ads, [class*="ad"]');
	let blocked = 0;
	
	adElements.forEach(element => {
		if (element.offsetParent !== null) {
			goodTube_helper_hideElement(element);
			blocked++;
		}
	});
	
	if (blocked > 0) {
		goodTube_showNotification(`Blocked ${blocked} ad element(s)`, 'success');
		goodTube_updateStats(blocked, blocked * 5);
	} else {
		goodTube_showNotification('No ads detected to block', 'warning');
	}
}

// Navigate to next video
function goodTube_nextVideo() {
	const nextButton = document.querySelector('.ytp-next-button');
	if (nextButton && !nextButton.disabled) {
		nextButton.click();
		goodTube_showNotification('Next video', 'success');
	}
}

// Navigate to previous video
function goodTube_previousVideo() {
	const prevButton = document.querySelector('.ytp-prev-button');
	if (prevButton && !prevButton.disabled) {
		prevButton.click();
		goodTube_showNotification('Previous video', 'success');
	}
}

// Picture-in-Picture enhancement
function goodTube_enhancedPiP() {
	const video = document.querySelector('video');
	if (!video || !document.pictureInPictureEnabled) return;
	
	// Add PiP button if not exists
	if (!document.querySelector('.goodTube_pip_button')) {
		const pipButton = document.createElement('button');
		pipButton.className = 'goodTube_pip_button';
		pipButton.innerHTML = '📺';
		pipButton.style.cssText = `
			position: fixed;
			bottom: 20px;
			right: 20px;
			background: var(--goodtube-primary);
			color: white;
			border: none;
			border-radius: 50%;
			width: 50px;
			height: 50px;
			font-size: 20px;
			cursor: pointer;
			z-index: 999998;
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			transition: all 0.3s ease;
		`;
		
		pipButton.addEventListener('click', () => {
			if (document.pictureInPictureElement) {
				document.exitPictureInPicture();
			} else {
				video.requestPictureInPicture();
			}
		});
		
		document.body.appendChild(pipButton);
	}
}

// Export functions for use in main script
window.goodTube_advancedFeatures = {
	advancedAdBlocking: goodTube_advancedAdBlocking,
	advancedShortsRemoval: goodTube_advancedShortsRemoval,
	performanceOptimization: goodTube_performanceOptimization,
	autoSkipSegments: goodTube_autoSkipSegments,
	enhancedTheaterMode: goodTube_enhancedTheaterMode,
	keyboardShortcuts: goodTube_keyboardShortcuts,
	enhancedPiP: goodTube_enhancedPiP
};

