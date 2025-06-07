const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Debugging Google Maps loading...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const page = await browser.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}]`, text);
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
  });

  // Listen for network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('maps.googleapis.com') || url.includes('google')) {
      console.log('🌐 REQUEST:', request.method(), url);
    }
  });
  
  // Listen for network responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('maps.googleapis.com') || url.includes('google')) {
      console.log('📡 RESPONSE:', response.status(), url);
    }
  });

  try {
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting 15 seconds for everything to load...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check detailed Google Maps status
    const detailedCheck = await page.evaluate(() => {
      return {
        // Window objects
        hasWindow: typeof window !== 'undefined',
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasPlaces: typeof window.google?.maps?.places !== 'undefined',
        hasAutocomplete: typeof window.google?.maps?.places?.Autocomplete !== 'undefined',
        
        // Custom flags
        googleMapsLoaded: window.googleMapsLoaded,
        googleMapsError: window.googleMapsError,
        
        // Script tags
        allScripts: Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src,
          hasContent: s.innerHTML.length > 0,
          async: s.async,
          defer: s.defer
        })),
        
        // Google Maps specific scripts
        googleScripts: Array.from(document.querySelectorAll('script')).filter(s => 
          s.src.includes('maps.googleapis.com') || s.innerHTML.includes('google.maps')
        ).map(s => ({
          src: s.src,
          content: s.innerHTML.substring(0, 200) + (s.innerHTML.length > 200 ? '...' : ''),
          loaded: s.readyState
        })),
        
        // Check if GoogleMapsLoader component ran
        documentHead: document.head.innerHTML.includes('maps.googleapis.com'),
        
        // Network errors
        networkErrors: window.networkErrors || []
      };
    });
    
    console.log('\n📊 DETAILED GOOGLE MAPS STATUS:');
    console.log('================================');
    console.log('Window objects:', {
      hasWindow: detailedCheck.hasWindow,
      hasGoogle: detailedCheck.hasGoogle,
      hasMaps: detailedCheck.hasMaps,
      hasPlaces: detailedCheck.hasPlaces,
      hasAutocomplete: detailedCheck.hasAutocomplete
    });
    
    console.log('\nCustom flags:', {
      googleMapsLoaded: detailedCheck.googleMapsLoaded,
      googleMapsError: detailedCheck.googleMapsError
    });
    
    console.log('\nGoogle Scripts found:', detailedCheck.googleScripts.length);
    detailedCheck.googleScripts.forEach((script, i) => {
      console.log(`  ${i + 1}. ${script.src || 'inline'}`);
      if (script.content) {
        console.log(`     Content: ${script.content}`);
      }
    });
    
    console.log('\nAll scripts count:', detailedCheck.allScripts.length);
    console.log('Maps in document head:', detailedCheck.documentHead);
    
    if (detailedCheck.hasAutocomplete) {
      console.log('✅ Google Maps API is working!');
      
      // Test autocomplete
      console.log('\n🧪 Testing autocomplete...');
      await page.focus('input[name="venueLocation"]');
      await page.type('input[name="venueLocation"]', '123 Main Street, New York');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const dropdown = await page.$('.pac-container');
      if (dropdown) {
        console.log('✅ Autocomplete dropdown found!');
        const suggestions = await page.$$('.pac-item');
        console.log(`Found ${suggestions.length} suggestions`);
      } else {
        console.log('❌ No autocomplete dropdown found');
      }
    } else {
      console.log('❌ Google Maps API not working');
      
      // Try to manually load the script
      console.log('\n🔧 Attempting manual script injection...');
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc&libraries=places';
        script.onload = () => console.log('Manual script loaded successfully');
        script.onerror = (e) => console.error('Manual script failed:', e);
        document.head.appendChild(script);
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const manualCheck = await page.evaluate(() => ({
        hasGoogle: typeof window.google !== 'undefined',
        hasAutocomplete: typeof window.google?.maps?.places?.Autocomplete !== 'undefined'
      }));
      
      console.log('Manual injection result:', manualCheck);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-google-maps-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved as debug-google-maps-result.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})(); 