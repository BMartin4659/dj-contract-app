const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'payment', 'success', 'page.js');

try {
  console.log(`Checking file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for problematic characters
  const lines = content.split('\n');
  console.log('Checking for problematic characters...');
  
  lines.forEach((line, index) => {
    // Check for non-ASCII characters
    if (/[^\x00-\x7F]/.test(line)) {
      console.log(`Line ${index + 1} contains non-ASCII characters: ${line}`);
    }
    
    // Check for curly quotes which can cause issues
    if (/['']/.test(line)) {
      console.log(`Line ${index + 1} contains fancy quotes: ${line}`);
    }
    
    // Check for unescaped apostrophes in JSX
    if (line.includes("'") && line.includes('<') && !line.includes('&apos;')) {
      console.log(`Line ${index + 1} might have unescaped apostrophe in JSX: ${line}`);
    }
  });
  
  // Try to parse the file as a JavaScript module
  try {
    const { parse } = require('@babel/parser');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    console.log('✅ File parsed successfully with @babel/parser');
  } catch (parseError) {
    console.error('❌ Parse error:');
    console.error(parseError.message);
    
    // Extract line and column information
    const lineMatch = parseError.message.match(/\((\d+):(\d+)\)/);
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1], 10);
      const columnNumber = parseInt(lineMatch[2], 10);
      
      console.log(`\nError at line ${lineNumber}, column ${columnNumber}:`);
      
      // Print the problematic line and surrounding context
      for (let i = Math.max(0, lineNumber - 3); i <= Math.min(lines.length - 1, lineNumber + 1); i++) {
        console.log(`${i + 1}: ${lines[i]}`);
        if (i + 1 === lineNumber) {
          // Print an indicator at the error column
          console.log(' '.repeat(columnNumber + String(i + 1).length + 2) + '^');
        }
      }
    }
  }
} catch (readError) {
  console.error(`❌ Error reading file: ${readError.message}`);
} 