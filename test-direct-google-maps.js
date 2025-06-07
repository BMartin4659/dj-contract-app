const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing direct Google Maps API loading...');

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
    console.log('Creating a simple HTML page with Google Maps...');
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Maps Test</title>
    </head>
    <body>
        <h1>Google Maps API Test</h1>
        <input id="address" type="text" placeholder="Enter address..." style="width: 300px; padding: 10px;">
        <div id="status">Loading...</div>
        
        <script>
            console.log('Script starting...');
            
            // Set the API key
            const API_KEY = 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc';
            
            function initGoogleMaps() {
                console.log('Google Maps API loaded successfully!');
                document.getElementById('status').textContent = 'Google Maps API loaded!';
                
                // Initialize autocomplete
                const input = document.getElementById('address');
                const autocomplete = new google.maps.places.Autocomplete(input, {
                    types: ['address'],
                    componentRestrictions: { country: 'us' }
                });
                
                autocomplete.addListener('place_changed', function() {
                    const place = autocomplete.getPlace();
                    console.log('Place selected:', place.formatted_address);
                    document.getElementById('status').textContent = 'Place selected: ' + place.formatted_address;
                });
                
                document.getElementById('status').textContent = 'Autocomplete ready! Type an address...';
            }
            
            function loadGoogleMaps() {
                console.log('Loading Google Maps API...');
                document.getElementById('status').textContent = 'Loading Google Maps API...';
                
                const script = document.createElement('script');
                script.src = \`https://maps.googleapis.com/maps/api/js?key=\${API_KEY}&libraries=places&callback=initGoogleMaps\`;
                script.async = true;
                script.defer = true;
                
                script.onerror = function(error) {
                    console.error('Error loading Google Maps API:', error);
                    document.getElementById('status').textContent = 'Error loading Google Maps API';
                };
                
                document.head.appendChild(script);
            }
            
            // Make initGoogleMaps global
            window.initGoogleMaps = initGoogleMaps;
            
            // Load the API
            loadGoogleMaps();
        </script>
    </body>
    </html>
    `;
    
    await page.setContent(htmlContent);
    
    console.log('Waiting for Google Maps to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if Google Maps API is loaded
    const mapsCheck = await page.evaluate(() => {
      return {
        hasGoogle: typeof window.google !== 'undefined',
        hasMaps: typeof window.google?.maps !== 'undefined',
        hasPlaces: typeof window.google?.maps?.places !== 'undefined',
        statusText: document.getElementById('status').textContent
      };
    });
    
    console.log('Google Maps check:', mapsCheck);
    
    if (mapsCheck.hasPlaces) {
      console.log('✅ Google Maps API loaded successfully!');
      
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
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-direct-google-maps.png', fullPage: true });
    console.log('Screenshot saved as test-direct-google-maps.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})(); 