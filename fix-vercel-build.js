/**
 * Vercel Build Helper Script
 * This script checks for potential issues with imports that might be causing build failures
 * and adds mobile viewport fixes
 */

const fs = require('fs');
const path = require('path');

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