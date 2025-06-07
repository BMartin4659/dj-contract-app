const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

// Set screenshot directory
const screenshotDir = path.join(os.homedir(), 'Desktop', 'puppeteer-screenshots');
const fs = require('fs');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  console.log('Testing Google Maps Autocomplete...');
  console.log('Saving screenshots to:', screenshotDir);

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  async function saveScreenshot(name) {
    const filePath = path.join(screenshotDir, name);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log('Saved screenshot:', filePath);
  }

  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
         console.log('Waiting for page to load...');
     await new Promise(resolve => setTimeout(resolve, 5000));
     await saveScreenshot('01_page_loaded.png');
    
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
    
    // Check for any Google Maps related errors
    const googleMapsErrors = await page.evaluate(() => {
      return window.googleMapsError || null;
    });
    
    if (googleMapsErrors) {
      console.log('Google Maps errors:', googleMapsErrors);
    }
    
    // Find the venue location input
    console.log('Looking for venue location input...');
    const venueInput = await page.$('input[name="venueLocation"]');
    
    if (venueInput) {
      console.log('✅ Found venue location input');
      await saveScreenshot('02_venue_input_found.png');
      
             // Scroll to the input to make sure it's visible
       await venueInput.scrollIntoView();
       await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click on the input and clear any existing value
      await venueInput.click({ clickCount: 3 });
             await page.keyboard.press('Delete');
       await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Typing test address...');
      await venueInput.type('123 Main Street, New York', { delay: 100 });
      await saveScreenshot('03_address_typed.png');
      
             // Wait for autocomplete suggestions
       console.log('Waiting for autocomplete suggestions...');
       await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if autocomplete dropdown appeared
      const autocompleteDropdown = await page.$('.pac-container');
      if (autocompleteDropdown) {
        console.log('✅ Autocomplete dropdown found!');
        await saveScreenshot('04_autocomplete_dropdown.png');
        
        // Check if there are suggestions
        const suggestions = await page.$$('.pac-item');
        console.log(`Found ${suggestions.length} autocomplete suggestions`);
        
        if (suggestions.length > 0) {
          console.log('✅ Google Maps autocomplete is working!');
          
                     // Click on the first suggestion
           await suggestions[0].click();
           await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the final value
          const finalValue = await venueInput.evaluate(el => el.value);
          console.log('Final address value:', finalValue);
          await saveScreenshot('05_suggestion_selected.png');
        } else {
          console.log('❌ No autocomplete suggestions found');
        }
      } else {
        console.log('❌ No autocomplete dropdown found');
        await saveScreenshot('04_no_autocomplete.png');
        
        // Check for any error messages in the AddressAutocomplete component
        const errorMessage = await page.$eval('p[style*="color"]', el => el.textContent).catch(() => null);
        if (errorMessage) {
          console.log('Error message found:', errorMessage);
        }
      }
    } else {
      console.log('❌ Venue location input not found');
      await saveScreenshot('02_venue_input_not_found.png');
    }
    
    // Final screenshot
    await saveScreenshot('06_final_state.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot('error_state.png');
  } finally {
    console.log('Test completed. Check screenshots for details.');
    await browser.close();
  }
})(); 