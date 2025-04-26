/**
 * EmailJS Error Diagnosis Script
 * 
 * This script helps diagnose common issues with EmailJS and CORS
 * Run with: node fix-emailjs-errors.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

console.log(`${colors.magenta}🔍 EmailJS Issue Diagnosis Tool 🔍${colors.reset}\n`);

// Step 1: Check for dual installations of EmailJS libraries
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  const dependencies = { 
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  let emailJSBrowser = dependencies['@emailjs/browser'];
  let emailJSCom = dependencies['emailjs-com'];
  
  console.log(`${colors.cyan}Checking EmailJS dependencies...${colors.reset}`);
  
  if (emailJSBrowser && emailJSCom) {
    console.log(`${colors.red}⚠️  ISSUE DETECTED: Multiple EmailJS packages installed${colors.reset}`);
    console.log(`   - @emailjs/browser: ${emailJSBrowser}`);
    console.log(`   - emailjs-com: ${emailJSCom}`);
    console.log(`\n${colors.yellow}This could cause conflicts. It's recommended to use only @emailjs/browser (the newer version).${colors.reset}\n`);
    console.log(`To fix, run: ${colors.green}npm uninstall emailjs-com${colors.reset}\n`);
  } else if (emailJSBrowser) {
    console.log(`${colors.green}✅ @emailjs/browser ${emailJSBrowser} is correctly installed${colors.reset}\n`);
  } else if (emailJSCom) {
    console.log(`${colors.yellow}⚠️ Using older emailjs-com package (${emailJSCom})${colors.reset}`);
    console.log(`Consider upgrading to @emailjs/browser: ${colors.green}npm uninstall emailjs-com && npm install @emailjs/browser${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ No EmailJS package found!${colors.reset}`);
    console.log(`Please install: ${colors.green}npm install @emailjs/browser${colors.reset}\n`);
  }
} catch (error) {
  console.log(`${colors.red}Error parsing package.json: ${error.message}${colors.reset}\n`);
}

// Step 2: Check for CORS handling in success page
try {
  const successPagePath = path.join(process.cwd(), 'app', 'payment', 'success', 'page.js');
  if (fs.existsSync(successPagePath)) {
    const content = fs.readFileSync(successPagePath, 'utf8');
    console.log(`${colors.cyan}Checking payment success page for CORS handling...${colors.reset}`);
    
    // Check if direct API approach is used as fallback
    const hasDirectApiFallback = content.includes('fetch("https://api.emailjs.com/api/v1.0/email/send"') ||
                                content.includes('fetch(\'https://api.emailjs.com/api/v1.0/email/send\'') ||
                                content.includes('fetch(`https://api.emailjs.com/api/v1.0/email/send`');
    
    // Check if there's handling for empty error objects
    const hasEmptyErrorHandling = content.includes('Object.keys(error).length === 0') ||
                                 content.includes('Object.keys(sendError).length === 0');
    
    if (!hasDirectApiFallback) {
      console.log(`${colors.red}❌ Missing direct API fallback for CORS issues${colors.reset}`);
      console.log(`   Add a fallback method that uses fetch API directly when EmailJS send fails\n`);
    } else {
      console.log(`${colors.green}✅ Direct API fallback approach found${colors.reset}`);
    }
    
    if (!hasEmptyErrorHandling) {
      console.log(`${colors.red}❌ Missing handling for empty error objects${colors.reset}`);
      console.log(`   Add specific handling for when error is an empty object (common with CORS issues)\n`);
    } else {
      console.log(`${colors.green}✅ Empty error object handling found${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠️  Payment success page not found at expected location${colors.reset}\n`);
  }
} catch (error) {
  console.log(`${colors.red}Error checking success page: ${error.message}${colors.reset}\n`);
}

// Step 3: Check for correct environment variables
console.log(`${colors.cyan}Checking environment variables...${colors.reset}`);
const envFilePath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const serviceIdExists = envContent.includes('NEXT_PUBLIC_EMAILJS_SERVICE_ID');
  const templateIdExists = envContent.includes('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID');
  const publicKeyExists = envContent.includes('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY');
  
  if (serviceIdExists && templateIdExists && publicKeyExists) {
    console.log(`${colors.green}✅ All required EmailJS environment variables found${colors.reset}`);
    
    // Check for the correct template ID
    if (!envContent.includes('template_p87ey1j')) {
      console.log(`${colors.yellow}⚠️  Template ID might not match the expected value (template_p87ey1j)${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}❌ Missing EmailJS environment variables:${colors.reset}`);
    if (!serviceIdExists) console.log(`   - NEXT_PUBLIC_EMAILJS_SERVICE_ID`);
    if (!templateIdExists) console.log(`   - NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`);
    if (!publicKeyExists) console.log(`   - NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`);
    console.log(`\nMake sure these are set properly in your .env.local file\n`);
  }
} else {
  console.log(`${colors.red}❌ .env.local file not found!${colors.reset}`);
  console.log(`Create it with the following content:
  
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_9z9konq
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_p87ey1j
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=PRPjY6zE2LkFb3a25\n`);
}

// Step 4: Provide overall recommendations
console.log(`${colors.magenta}📋 Recommendations to fix EmailJS empty error issues:${colors.reset}`);
console.log(`
1. ${colors.blue}Standardize on one EmailJS package:${colors.reset}
   - Remove emailjs-com: ${colors.green}npm uninstall emailjs-com${colors.reset}
   - Use @emailjs/browser: ${colors.green}npm install @emailjs/browser${colors.reset}

2. ${colors.blue}Update the initialization:${colors.reset}
   - Use this code for initialization:
     ${colors.green}emailjs.init({
       publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'PRPjY6zE2LkFb3a25'
     });${colors.reset}

3. ${colors.blue}Add direct API fallback:${colors.reset}
   - When EmailJS send fails, try using the fetch API directly
   - Include 'Origin' header with window.location.origin

4. ${colors.blue}Handle empty error objects specifically:${colors.reset}
   - Check for errors where Object.keys(error).length === 0
   - These typically indicate CORS issues

5. ${colors.blue}Add CORS debugging:${colors.reset}
   - Log exact error messages and request details
   - Include proper error handling for failed API requests

6. ${colors.blue}Set correct environment variables:${colors.reset}
   - Ensure NEXT_PUBLIC_EMAILJS_SERVICE_ID is set to service_9z9konq
   - Ensure NEXT_PUBLIC_EMAILJS_TEMPLATE_ID is set to template_p87ey1j
   - Ensure NEXT_PUBLIC_EMAILJS_PUBLIC_KEY is set to your public key
`);

console.log(`${colors.green}Run the fix-emailjs.bat script to apply these changes automatically.${colors.reset}\n`); 