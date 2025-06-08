const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Google Maps Autocomplete...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[PAGE]`, msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });

  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('maps.googleapis.com')) {
      console.log('🌐 Google Maps API request:', request.url());
    }
  });
  
  // Listen for network responses
  page.on('response', response => {
    if (response.url().includes('maps.googleapis.com')) {
      console.log('📡 Google Maps API response:', response.status(), response.url());
    }
  });

  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if Google Maps API is loaded
    const mapsCheck = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasPlaces: typeof window.google?.maps?.places !== 'undefined',
        hasAutocomplete: typeof window.google?.maps?.places?.Autocomplete !== 'undefined',
        googleMapsLoaded: window.googleMapsLoaded,
        scriptsInHead: Array.from(document.head.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('maps')),
        scriptsInBody: Array.from(document.body.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('maps'))
      };
    });
    
    console.log('Google Maps API status:', mapsCheck);
    
    if (mapsCheck.hasAutocomplete) {
      console.log('✅ Google Maps API properly loaded');
      
      // Test autocomplete
      console.log('Testing autocomplete...');
      await page.focus('input[name="venueLocation"]');
      await page.type('input[name="venueLocation"]', '123 Main Street, New York');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for autocomplete dropdown
      const dropdown = await page.$('.pac-container');
      if (dropdown) {
        console.log('✅ Autocomplete dropdown found!');
        const suggestions = await page.$$('.pac-item');
        console.log(`Found ${suggestions.length} suggestions`);
      } else {
        console.log('❌ No autocomplete dropdown found');
      }
    } else {
      console.log('❌ Google Maps API not properly loaded');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'google-maps-test-result.png', fullPage: true });
    console.log('Screenshot saved as google-maps-test-result.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('Test completed. Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})(); 