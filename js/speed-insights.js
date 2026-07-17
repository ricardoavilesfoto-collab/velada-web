/**
 * Vercel Speed Insights initialization
 * Tracks Core Web Vitals and performance metrics
 */
(function() {
  'use strict';
  
  // Import and initialize Speed Insights from CDN
  // This script assumes the Speed Insights library has been loaded via script tag
  if (typeof window !== 'undefined' && window.injectSpeedInsights) {
    // Determine the current route for tracking
    var currentPath = window.location.pathname;
    
    // Initialize Speed Insights with the current route
    window.injectSpeedInsights({
      route: currentPath,
      debug: false // Set to true for debugging in development
    });
    
    console.log('Vercel Speed Insights initialized for route:', currentPath);
  }
})();
