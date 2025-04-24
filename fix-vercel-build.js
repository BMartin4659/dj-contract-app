/**
 * Vercel Build Helper Script
 * This script checks for potential issues with imports that might be causing build failures
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

console.log('Done checking build integrity'); 