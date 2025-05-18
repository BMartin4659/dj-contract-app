#!/usr/bin/env node

/**
 * Payment Links Verification Script
 * 
 * This script verifies all payment links (Venmo, CashApp, PayPal) are valid before deployment.
 * It can be run manually or as part of CI/CD pipelines.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env files
const loadEnvVariables = () => {
  // Try to load from various possible .env files
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  let loadedEnv = {};

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`Loading environment from ${file}`);
      const envConfig = dotenv.parse(fs.readFileSync(file));
      loadedEnv = { ...loadedEnv, ...envConfig };
    }
  });

  return loadedEnv;
};

// Payment URL patterns to validate
const paymentServices = [
  {
    name: 'Venmo',
    envVar: 'NEXT_PUBLIC_VENMO_URL',
    defaultUrl: 'https://venmo.com/u/Bobby-Martin-64',
    validateUrl: (url) => url.startsWith('https://venmo.com/u/') || url.startsWith('https://venmo.com/code?user_id=')
  },
  {
    name: 'CashApp',
    envVar: 'NEXT_PUBLIC_CASHAPP_URL',
    defaultUrl: 'https://cash.app/$LiveCity',
    validateUrl: (url) => url.startsWith('https://cash.app/$')
  },
  {
    name: 'PayPal',
    envVar: 'NEXT_PUBLIC_PAYPAL_URL',
    defaultUrl: 'https://paypal.me/bmartin4659',
    validateUrl: (url) => url.startsWith('https://paypal.me/')
  }
];

// Check if URL returns a valid response
const checkUrlExists = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ valid: true, status: res.statusCode });
      } else {
        resolve({ valid: false, status: res.statusCode });
      }
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
};

// Validate payment URLs
const validatePaymentUrls = async (env) => {
  console.log('Verifying payment URLs...');
  let errors = 0;
  let warnings = 0;

  for (const service of paymentServices) {
    const url = env[service.envVar] || service.defaultUrl;
    
    // First validate URL format
    if (!service.validateUrl(url)) {
      console.error(`❌ ${service.name} URL format invalid: ${url}`);
      console.error(`   Expected format: ${service.validateUrl.toString()}`);
      errors++;
      continue;
    }
    
    // Then check if URL is reachable
    try {
      const result = await checkUrlExists(url);
      if (result.valid) {
        console.log(`✅ ${service.name} URL verified: ${url}`);
      } else {
        console.warn(`⚠️ ${service.name} URL may be invalid (status ${result.status}): ${url}`);
        console.warn(`   This might be a false negative if the service blocks automated requests.`);
        warnings++;
      }
    } catch (error) {
      console.error(`❌ Error checking ${service.name} URL: ${error.message}`);
      errors++;
    }
  }

  return { errors, warnings };
};

// Main function
const main = async () => {
  console.log('Payment Links Verification');
  console.log('-------------------------');
  
  // Load environment variables
  const env = loadEnvVariables();
  
  // Validate payment URLs
  const { errors, warnings } = await validatePaymentUrls(env);
  
  // Summary
  console.log('\nVerification Summary:');
  console.log(`- ${paymentServices.length} payment services checked`);
  console.log(`- ${errors} errors found`);
  console.log(`- ${warnings} warnings found`);
  
  // Exit with error code if errors are found
  if (errors > 0) {
    console.error('\n❌ Verification failed - fix errors before deploying.');
    process.exit(1);
  } else if (warnings > 0) {
    console.warn('\n⚠️ Verification completed with warnings - review before deploying.');
    // Exit with success but provide visibility to the warnings
    process.exit(0);
  } else {
    console.log('\n✅ All payment links verified successfully!');
    process.exit(0);
  }
};

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 