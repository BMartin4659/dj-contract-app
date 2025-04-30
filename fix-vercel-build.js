/**
 * Vercel Build Helper Script
 * This script checks for potential issues with imports that might be causing build failures
 * and adds mobile viewport fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for react-datepicker dependency
console.log('Checking for date picker dependencies...');
try {
  // Check if it's already in package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = packageJson.dependencies || {};
  
  if (!dependencies['react-datepicker']) {
    console.log('react-datepicker not found in package.json, adding it now...');
    
    // Add it to dependencies
    dependencies['react-datepicker'] = '^4.18.0';
    packageJson.dependencies = dependencies;
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Install the dependency
    console.log('Installing react-datepicker...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('Successfully installed react-datepicker');
    } catch (installError) {
      console.error('Failed to install react-datepicker:', installError);
    }
  } else {
    console.log(`react-datepicker found in package.json: ${dependencies['react-datepicker']}`);
    
    // Verify it's actually installed
    try {
      require.resolve('react-datepicker');
      console.log('react-datepicker is properly installed');
    } catch (e) {
      console.log('react-datepicker is in package.json but not installed, reinstalling...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('Successfully reinstalled dependencies');
      } catch (installError) {
        console.error('Failed to reinstall dependencies:', installError);
      }
    }
  }
} catch (e) {
  console.error('Error checking for react-datepicker:', e);
  
  // Fallback: just try to install it directly
  try {
    execSync('npm install react-datepicker', { stdio: 'inherit' });
    console.log('Installed react-datepicker as fallback');
  } catch (installError) {
    console.error('Failed to install react-datepicker as fallback:', installError);
  }
}

// Check if lib/sendEmail.js exists
const sendEmailPath = path.join(process.cwd(), 'lib', 'sendEmail.js');
const sendEmailExists = fs.existsSync(sendEmailPath);

console.log('Checking build integrity...');
console.log(`lib/sendEmail.js exists: ${sendEmailExists}`);

if (sendEmailExists) {
  console.log('Contents of lib/sendEmail.js:');
  const contents = fs.readFileSync(sendEmailPath, 'utf8');
  console.log(contents.substring(0, 500) + '...');
}

// Check for the DJ logo file
const logoPath = path.join(process.cwd(), 'public', 'dj-bobby-drake-logo.png');
const logoExists = fs.existsSync(logoPath);
console.log(`Logo exists at ${logoPath}: ${logoExists}`);

// If logo doesn't exist, check if it exists with different case
if (!logoExists) {
  // Get all files in the public directory
  const publicFiles = fs.readdirSync(path.join(process.cwd(), 'public'));
  console.log('Files in public directory:', publicFiles);
  
  // Check for any case-insensitive match
  const logoMatch = publicFiles.find(file => 
    file.toLowerCase() === 'dj-bobby-drake-logo.png'
  );
  
  if (logoMatch && logoMatch !== 'dj-bobby-drake-logo.png') {
    console.log(`Found logo with different case: ${logoMatch}`);
    
    // Create a copy with the correct case
    fs.copyFileSync(
      path.join(process.cwd(), 'public', logoMatch),
      path.join(process.cwd(), 'public', 'dj-bobby-drake-logo.png')
    );
    
    console.log('Created copy of logo with correct case');
  } else if (!logoMatch) {
    console.warn('WARNING: Could not find DJ logo file in any case variation!');
  }
}

// Ensure the app/api/booked-dates directory exists
const bookedDatesApiDir = path.join(process.cwd(), 'app', 'api', 'booked-dates');
if (!fs.existsSync(bookedDatesApiDir)) {
  console.log('Creating booked-dates API directory...');
  fs.mkdirSync(bookedDatesApiDir, { recursive: true });
}

// Ensure the app/components directory exists
const componentsDir = path.join(process.cwd(), 'app', 'components');
if (!fs.existsSync(componentsDir)) {
  console.log('Creating components directory...');
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Check if the imports in success page are correct
const successPagePath = path.join(process.cwd(), 'app', 'payment', 'success', 'page.js');
const successPageExists = fs.existsSync(successPagePath);

console.log(`success/page.js exists: ${successPageExists}`);

if (successPageExists) {
  const successPageContents = fs.readFileSync(successPagePath, 'utf8');
  const importLine = successPageContents.match(/import.*sendEmail.*from.*['"](.*)['"];?/);
  
  if (importLine) {
    console.log('Found import line:', importLine[0]);
    console.log('Import path:', importLine[1]);
  } else {
    console.log('Could not find sendEmail import line');
  }
}

// Add mobile viewport fix to layout.js if exists
const layoutPath = path.join(process.cwd(), 'app', 'layout.js');
if (fs.existsSync(layoutPath)) {
  console.log('Checking app/layout.js for viewport meta tag...');
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Check if viewport definition exists
  const viewportExport = layoutContent.includes('export const viewport');
  console.log(`Viewport export found: ${viewportExport}`);
  
  // Check if viewport meta tag exists in head section
  const viewportMetaTag = layoutContent.includes('<meta name="viewport"');
  console.log(`Viewport meta tag found: ${viewportMetaTag}`);
  
  // If no viewport settings are found, add them
  if (!viewportExport && !viewportMetaTag) {
    console.log('Adding viewport settings to layout.js...');
    // Find the position to insert the viewport export
    const exportIndex = layoutContent.indexOf('export const metadata');
    
    if (exportIndex !== -1) {
      // Insert after the metadata export closing bracket
      const closingBracketIndex = layoutContent.indexOf('};', exportIndex);
      const insertPosition = closingBracketIndex + 2;
      
      const viewportCode = `
export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: 'cover',
};
`;
      
      layoutContent = 
        layoutContent.slice(0, insertPosition) + 
        viewportCode + 
        layoutContent.slice(insertPosition);
      
      fs.writeFileSync(layoutPath, layoutContent, 'utf8');
      console.log('Viewport settings added to layout.js');
    } else {
      console.log('Could not find metadata export to add viewport settings');
    }
  }
}

console.log('Done checking build integrity'); 