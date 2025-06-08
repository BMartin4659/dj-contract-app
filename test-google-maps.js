const puppeteer = require('puppeteer');

async function testGoogleMapsAutocomplete() {
  console.log('Starting Google Maps autocomplete test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages from the page
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Check if Google Maps API is loaded
    const mapsApiLoaded = await page.evaluate(() => {
      return !!(window.google && window.google.maps && window.google.maps.places);
    });
    
    console.log('Google Maps API loaded:', mapsApiLoaded);
    
    // Check if googleMapsLoaded flag is set
    const googleMapsLoadedFlag = await page.evaluate(() => {
      return window.googleMapsLoaded;
    });
    
    console.log('googleMapsLoaded flag:', googleMapsLoadedFlag);
    
    // Find the venue location input
    const venueInput = await page.$('input[name="venueLocation"]');
    if (venueInput) {
      console.log('Found venue location input');
      
      // Click on the input and type a test address
      await venueInput.click();
      await page.waitForTimeout(1000);
      
      console.log('Typing test address...');
      await venueInput.type('123 Main St, New York', { delay: 100 });
      
      // Wait for autocomplete suggestions
      await page.waitForTimeout(2000);
      
      // Check if autocomplete dropdown appeared
      const autocompleteDropdown = await page.$('.pac-container');
      if (autocompleteDropdown) {
        console.log('✅ Autocomplete dropdown found!');
        
        // Check if there are suggestions
        const suggestions = await page.$$('.pac-item');
        console.log(`Found ${suggestions.length} autocomplete suggestions`);
        
        if (suggestions.length > 0) {
          console.log('✅ Google Maps autocomplete is working!');
          // Click on the first suggestion
          await suggestions[0].click();
          await page.waitForTimeout(1000);
          
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
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'google-maps-test.png', fullPage: true });
    console.log('Screenshot saved as google-maps-test.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testGoogleMapsAutocomplete().catch(console.error); 