const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Testing Google Maps API key with simple HTML...');

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
    const htmlPath = path.join(__dirname, 'test-api-key.html');
    console.log('Opening HTML file:', htmlPath);
    
    await page.goto(`file://${htmlPath}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Waiting for Google Maps to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if Google Maps API is loaded
    const mapsCheck = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasPlaces: typeof window.google?.maps?.places !== 'undefined',
        hasAutocomplete: typeof window.google?.maps?.places?.Autocomplete !== 'undefined',
        statusText: document.getElementById('status').textContent
      };
    });
    
    console.log('Google Maps API status:', mapsCheck);
    
    if (mapsCheck.hasAutocomplete) {
      console.log('✅ Google Maps API key is working!');
      
      // Test autocomplete
      console.log('Testing autocomplete...');
      await page.focus('#address');
      await page.type('#address', '123 Main Street, New York');
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
      console.log('❌ Google Maps API failed to load');
      console.log('Status text:', mapsCheck.statusText);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'api-key-test-result.png', fullPage: true });
    console.log('Screenshot saved as api-key-test-result.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('Test completed. Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})(); 