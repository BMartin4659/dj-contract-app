/**
 * EmailJS Fix Script
 * 
 * This script helps fix the EmailJS integration issues in the DJ Contract App.
 * 
 * 1. Creates/updates the .env.local file with proper EmailJS configuration
 * 2. Ensures the public key is properly set
 * 
 * Usage:
 * - Run with: node fix-emailjs.js [YOUR_PUBLIC_KEY]
 * - If no key provided, uses the default: PRPjY6zE2LkFb3a25
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk'); // Optional, for colored output

console.log(chalk ? chalk.blue('Starting EmailJS integration fix...') : 'Starting EmailJS integration fix...');

// Get public key from args or use default
let publicKey = 'PRPjY6zE2LkFb3a25'; // Default key
if (process.argv.length >= 3) {
  publicKey = process.argv[2];
}

console.log(`\x1b[34mUsing EmailJS public key: ${publicKey}\x1b[0m`);

// Create .env.local file content
const envContent = `# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_9z9konq
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_p87ey1j
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=${publicKey}

# Existing Google Maps API Key (preserving if it exists)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc'}
`;

try {
  // Write to .env.local file
  fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
  
  console.log('\x1b[32mSuccess: .env.local file has been created/updated with your EmailJS configuration.\x1b[0m');
  console.log('\x1b[32mRestart your development server for changes to take effect.\x1b[0m');
  
  // Check for common issues
  console.log('\n\x1b[34mVerifying components that use EmailJS:\x1b[0m');
  
  let stripeCheckoutPath = path.join(process.cwd(), 'components', 'StripeCheckout.js');
  let successPagePath = path.join(process.cwd(), 'app', 'payment', 'success', 'page.js');
  
  if (fs.existsSync(stripeCheckoutPath)) {
    console.log('\x1b[32m✓ StripeCheckout.js found.\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ StripeCheckout.js not found at expected location.\x1b[0m');
  }
  
  if (fs.existsSync(successPagePath)) {
    console.log('\x1b[32m✓ Payment success page found.\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ Payment success page not found at expected location.\x1b[0m');
  }
  
  console.log('\n\x1b[34mNext steps:\x1b[0m');
  console.log('1. Run \x1b[33mnpm run dev\x1b[0m to restart the development server');
  console.log('2. Test the email functionality');
  console.log('3. For any remaining issues, check browser console for detailed error messages');
  
} catch (error) {
  console.error('\x1b[31mError creating .env.local file:\x1b[0m', error.message);
  process.exit(1);
}

// Fix EmailJS integration issues
// Run with: node fix-emailjs.js

// 1. Check if the proper package is installed
try {
  console.log('Checking installed packages...');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.error('Error: package.json not found. Make sure you run this script from the project root.');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Check for conflicting packages
  if (dependencies.emailjs && !dependencies['@emailjs/browser']) {
    console.log('Found outdated emailjs package. Removing and installing @emailjs/browser...');
    execSync('npm uninstall emailjs', { stdio: 'inherit' });
    execSync('npm install @emailjs/browser', { stdio: 'inherit' });
    console.log(chalk ? chalk.green('Successfully updated EmailJS package!') : 'Successfully updated EmailJS package!');
  } else if (!dependencies['@emailjs/browser']) {
    console.log('Installing @emailjs/browser package...');
    execSync('npm install @emailjs/browser', { stdio: 'inherit' });
    console.log(chalk ? chalk.green('Successfully installed @emailjs/browser!') : 'Successfully installed @emailjs/browser!');
  } else {
    console.log(chalk ? chalk.green('Correct EmailJS package is already installed.') : 'Correct EmailJS package is already installed.');
  }
} catch (error) {
  console.error('Error checking or updating packages:', error.message);
}

// 2. Check for environment variables
const envFile = '.env.local';
try {
  console.log('\nChecking environment variables...');
  
  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }
  
  const requiredVars = [
    'NEXT_PUBLIC_EMAILJS_SERVICE_ID',
    'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID',
    'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(chalk ? chalk.yellow(`Missing environment variables: ${missingVars.join(', ')}`) : 
                          `Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Please make sure these are defined in your .env.local file.');
    
    // Prompt for essential missing variables if needed
    console.log('\nPlease check your EmailJS dashboard for these values and add them to your .env.local file:');
    for (const varName of missingVars) {
      console.log(`${varName}=your_value_here`);
    }
  } else {
    console.log(chalk ? chalk.green('All required environment variables are set!') : 
                         'All required environment variables are set!');
  }
} catch (error) {
  console.error('Error checking environment variables:', error.message);
}

// 3. Verify the success page implementation
const successPagePath = path.join('app', 'payment', 'success', 'page.js');
try {
  console.log('\nVerifying success page implementation...');
  
  if (!fs.existsSync(successPagePath)) {
    console.error(`Error: ${successPagePath} not found.`);
  } else {
    const successPageContent = fs.readFileSync(successPagePath, 'utf8');
    
    // Check for proper imports
    const hasProperImport = successPageContent.includes('import emailjs from \'@emailjs/browser\'');
    if (!hasProperImport) {
      console.log(chalk ? chalk.yellow('Success page is not using the correct EmailJS import.') : 
                           'Success page is not using the correct EmailJS import.');
      console.log('Please update the import to: import emailjs from \'@emailjs/browser\'');
    }
    
    // Check for initialization
    const hasInitialization = successPageContent.includes('emailjs.init(');
    if (!hasInitialization) {
      console.log(chalk ? chalk.yellow('EmailJS initialization is missing.') : 
                           'EmailJS initialization is missing.');
      console.log('Please add EmailJS initialization to your component.');
    }
    
    // Check for proper error handling
    const hasErrorHandling = successPageContent.includes('CORS issue') || 
                             successPageContent.includes('Object.keys(error).length === 0');
    if (!hasErrorHandling) {
      console.log(chalk ? chalk.yellow('Improved error handling is missing.') : 
                           'Improved error handling is missing.');
      console.log('Please add improved error handling in the catch block.');
    }
    
    if (hasProperImport && hasInitialization && hasErrorHandling) {
      console.log(chalk ? chalk.green('Success page implementation looks good!') : 
                           'Success page implementation looks good!');
    } else {
      console.log('Please check the success page for the issues mentioned above.');
    }
  }
} catch (error) {
  console.error('Error verifying success page:', error.message);
}

// 4. Final instructions
console.log('\n' + (chalk ? chalk.blue('EmailJS Fix Complete') : 'EmailJS Fix Complete'));
console.log('Next steps:');
console.log('1. Ensure all environment variables are correctly set in .env.local');
console.log('2. Test sending emails in development');
console.log('3. Check for CORS errors in your browser console');
console.log('4. If problems persist, verify your EmailJS service settings and whitelist your domain');

// Read the file
fs.readFile('app/page.js', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split into lines
  const lines = data.split('\n');
  
  // Remove the EmailJS block (lines 1228-1249)
  const result = [
    ...lines.slice(0, 1227),
    '  // EmailJS initialization removed',
    ...lines.slice(1249)
  ];
  
  // Write the file back
  fs.writeFile('app/page.js', result.join('\n'), err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('EmailJS block removed successfully.');
    }
  });
}); 