const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'payment', 'success', 'page.js');
const outputPath = path.join(__dirname, 'app', 'payment', 'success', 'page.fixed.js');

try {
  console.log(`Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace fancy quotes with straight quotes
  let fixedContent = content
    .replace(/'/g, "'") // Replace single fancy quotes with straight single quotes
    .replace(/'/g, "'") // Replace other single fancy quotes with straight single quotes
    .replace(/"/g, '"') // Replace double fancy quotes with straight double quotes
    .replace(/"/g, '"'); // Replace other double fancy quotes with straight double quotes
  
  // Write the fixed content to a new file
  fs.writeFileSync(outputPath, fixedContent);
  console.log(`Fixed file written to: ${outputPath}`);
  
  // Replace the original file
  fs.renameSync(outputPath, filePath);
  console.log('Original file replaced with fixed version.');
  
} catch (error) {
  console.error(`Error: ${error.message}`);
} 