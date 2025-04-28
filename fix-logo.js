/**
 * Logo Fix Script
 * This script helps diagnose and fix issues with the DJ Bobby Drake logo
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('DJ Bobby Drake Logo Fix Script');
console.log('-------------------------------');

// Step 1: Check if the logo exists in the public directory
const publicDir = path.join(process.cwd(), 'public');
const logoPath = path.join(publicDir, 'dj-bobby-drake-logo.png');

console.log(`Checking for logo at: ${logoPath}`);
const logoExists = fs.existsSync(logoPath);
console.log(`Logo exists: ${logoExists}`);

// Step 2: List all files in the public directory to check for case issues
console.log('\nListing all files in public directory:');
const publicFiles = fs.readdirSync(publicDir);
publicFiles.forEach(file => console.log(`- ${file}`));

// Step 3: Look for any case variations of the logo file
const logoRegex = /dj-bobby-drake-logo\.png/i;
const matchingFiles = publicFiles.filter(file => logoRegex.test(file));

console.log(`\nFound ${matchingFiles.length} matching logo files:`);
matchingFiles.forEach(file => console.log(`- ${file}`));

// Step 4: If no exact match but case variations exist, create a properly named copy
if (!logoExists && matchingFiles.length > 0) {
  console.log('\nCreating properly named logo file...');
  
  // Use the first matching file as the source
  const sourceFile = path.join(publicDir, matchingFiles[0]);
  
  try {
    fs.copyFileSync(sourceFile, logoPath);
    console.log(`Success! Copied ${matchingFiles[0]} to dj-bobby-drake-logo.png`);
  } catch (err) {
    console.error(`Error copying file: ${err.message}`);
  }
}

// Step 5: If logo is missing completely, try to download it from the Vercel URL
if (!logoExists && matchingFiles.length === 0) {
  console.log('\nLogo file is missing completely. Attempting to download from Vercel deployment...');
  
  // URLs to try
  const urls = [
    'https://dj-contract-app.vercel.app/dj-bobby-drake-logo.png',
    'https://dj-contract-3fsgj115a-bobby-drakes-projects.vercel.app/dj-bobby-drake-logo.png',
    'https://dj-contract-app.web.app/dj-bobby-drake-logo.png'
  ];
  
  let downloadAttempts = 0;
  
  // Try each URL in sequence
  const tryDownload = (index) => {
    if (index >= urls.length) {
      console.log('All download attempts failed.');
      return;
    }
    
    const url = urls[index];
    console.log(`Trying to download from: ${url}`);
    downloadAttempts++;
    
    // Determine if http or https
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`Success! Downloading from ${url}`);
        
        const fileStream = fs.createWriteStream(logoPath);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('Logo downloaded and saved successfully!');
        });
      } else {
        console.log(`Failed to download from ${url} (Status: ${res.statusCode})`);
        tryDownload(index + 1);
      }
    });
    
    req.on('error', (err) => {
      console.log(`Error downloading from ${url}: ${err.message}`);
      tryDownload(index + 1);
    });
  };
  
  // Start the download process
  tryDownload(0);
}

// Step 6: Check file size and permissions
if (logoExists || (matchingFiles.length > 0)) {
  const fileToCheck = logoExists ? logoPath : path.join(publicDir, matchingFiles[0]);
  const stats = fs.statSync(fileToCheck);
  
  console.log('\nFile information:');
  console.log(`- Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Created: ${stats.birthtime}`);
  console.log(`- Modified: ${stats.mtime}`);
  console.log(`- Permissions: ${stats.mode.toString(8)}`);
  
  // Check if file size is reasonable
  if (stats.size > 5 * 1024 * 1024) {
    console.log('\nWARNING: Logo file is very large (>5MB). This may cause performance issues.');
  }
}

console.log('\nLogo check complete!');
console.log('If you still have issues, try:');
console.log('1. Renaming the logo file to exactly "dj-bobby-drake-logo.png" (case sensitive)');
console.log('2. Verifying the file is actually a valid PNG image');
console.log('3. Using the Logo Test page at /logo-test to diagnose the issue'); 