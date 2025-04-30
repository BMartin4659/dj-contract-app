/**
 * Vercel Build Helper Script
 * This script checks for potential issues with imports that might be causing build failures
 * and adds mobile viewport fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for react-datepicker dependency
console.log('Checking for react-datepicker dependency...');
try {
  require.resolve('react-datepicker');
  console.log('react-datepicker is already installed.');
} catch (e) {
  console.log('react-datepicker is not installed. Installing now...');
  try {
    execSync('npm install react-datepicker', { stdio: 'inherit' });
    console.log('Successfully installed react-datepicker');
  } catch (installError) {
    console.error('Failed to install react-datepicker:', installError);
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