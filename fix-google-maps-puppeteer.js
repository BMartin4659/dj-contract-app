const puppeteer = require('puppeteer');

(async () => {
  console.log('Fixing Google Maps API by injecting it directly...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
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
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Injecting Google Maps API script...');
    
    // Inject Google Maps API script directly
    await page.evaluate(() => {
      // Remove any existing Google Maps scripts
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());
      
      // Create and inject the Google Maps script
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc&libraries=places&callback=initGoogleMapsCallback&loading=async';
      script.async = true;
      script.defer = true;
      
      // Define the callback
      window.initGoogleMapsCallback = () => {
        console.log('Google Maps API loaded successfully via injection!');
        window.googleMapsLoaded = true;
        
        // Trigger a custom event to notify components
        window.dispatchEvent(new CustomEvent('googleMapsLoaded'));
      };
      
      script.onerror = (error) => {
        console.error('Error loading Google Maps API via injection:', error);
      };
      
      document.head.appendChild(script);
      console.log('Google Maps script injected into page');
    });
    
    console.log('Waiting for Google Maps API to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if Google Maps API is loaded
    const mapsCheck = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasPlaces: typeof window.google?.maps?.places !== 'undefined',
        googleMapsLoaded: window.googleMapsLoaded,
        scriptsInHead: Array.from(document.head.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('maps.googleapis.com'))
      };
    });
    
    console.log('Google Maps check after injection:', mapsCheck);
    
    if (mapsCheck.hasPlaces) {
      console.log('✅ Google Maps API loaded successfully!');
      
      // Test the address autocomplete
      console.log('Testing address autocomplete...');
      
      // Find the venue location input
      const venueInput = await page.$('input[name="venueLocation"]');
      if (venueInput) {
        console.log('✅ Found venue location input');
        
        // Clear and type in the input
        await venueInput.click({ clickCount: 3 });
        await page.keyboard.press('Delete');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await venueInput.type('123 Main Street, New York', { delay: 100 });
        console.log('Typed test address');
        
        // Wait for autocomplete suggestions
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for autocomplete dropdown
        const dropdown = await page.$('.pac-container');
        if (dropdown) {
          console.log('✅ Autocomplete dropdown found!');
          const suggestions = await page.$$('.pac-item');
          console.log(`Found ${suggestions.length} suggestions`);
          
          if (suggestions.length > 0) {
            console.log('✅ Google Maps autocomplete is working!');
            
            // Click on the first suggestion
            await suggestions[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get the final value
            const finalValue = await venueInput.evaluate(el => el.value);
            console.log('Final address value:', finalValue);
          }
        } else {
          console.log('❌ No autocomplete dropdown found');
        }
      } else {
        console.log('❌ Venue location input not found');
      }
    } else {
      console.log('❌ Google Maps API failed to load');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'fix-google-maps-result.png', fullPage: true });
    console.log('Screenshot saved as fix-google-maps-result.png');
    
  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    console.log('Test completed. Keeping browser open for manual inspection...');
    // Don't close the browser so you can inspect manually
    // await browser.close();
  }
})(); 