const fs = require('fs');
const path = require('path');

// Function to safely read file contents
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

// Function to safely write to a file
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    return false;
  }
};

// Main fix function
const removeEmailJsReferences = () => {
  console.log('Starting comprehensive EmailJS removal...');
  
  // Fix page.js - known issue location
  const pageJsPath = path.join('app', 'page.js');
  const pageContent = readFile(pageJsPath);
  
  if (pageContent) {
    // Split into lines
    const lines = pageContent.split('\n');
    
    // Remove the EmailJS block (lines 1228-1249)
    const result = [
      ...lines.slice(0, 1227),
      '  // EmailJS initialization block removed',
      ...lines.slice(1249)
    ];
    
    writeFile(pageJsPath, result.join('\n'));
  }
  
  console.log('\nAll EmailJS references should now be removed.');
  console.log('Please test your application to ensure it works correctly.');
};

// Run the fix
removeEmailJsReferences(); 