const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// FORCE VERCEL DEPLOYMENT REFRESH - 2025-01-31 20:00
// AGGRESSIVE CACHE CLEARING for wedding event form issues

// Paths to clean - comprehensive cache clearing
const pathsToClean = [
  '.next',
  'node_modules/.cache',
  '.vercel',
  'dist',
  'build'
];

console.log('🚀 AGGRESSIVE CACHE CLEARING - Wedding form deployment fix');
console.log('⏰ Timestamp: 2025-01-31 20:00');
console.log('🎯 Target: Fix main contract wedding event recognition');

// Force complete rebuild
pathsToClean.forEach(pathToClean => {
  try {
    if (fs.existsSync(pathToClean)) {
      console.log(`🗑️ Clearing cache: ${pathToClean}`);
      fs.rmSync(pathToClean, { recursive: true, force: true });
      console.log(`✅ Cleared: ${pathToClean}`);
    }
  } catch (error) {
    console.log(`⚠️ Could not clear ${pathToClean}:`, error.message);
  }
});

console.log('🎉 Cache clearing complete - forcing fresh deployment');

// Run additional cleanup commands
console.log('Running additional cleanup...');

// Execute npm cache clean
exec('npm cache clean --force', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error cleaning npm cache: ${error}`);
    return;
  }
  console.log('NPM cache cleaned successfully');
  console.log(stdout);
  
  console.log('All cache cleaning operations completed.');
  console.log('You can now run the build command: npm run build');
});

console.log('Clearing Next.js cache...');

const cacheDir = path.join(process.cwd(), '.next/cache');

try {
  if (fs.existsSync(cacheDir)) {
    console.log(`Removing cache directory: ${cacheDir}`);
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('Cache directory successfully removed');
  } else {
    console.log('Cache directory does not exist, no need to clear');
  }
  
  // Also remove the .next/server directory which can cause issues
  const serverDir = path.join(process.cwd(), '.next/server');
  if (fs.existsSync(serverDir)) {
    console.log(`Removing server directory: ${serverDir}`);
    fs.rmSync(serverDir, { recursive: true, force: true });
    console.log('Server directory successfully removed');
  }
  
  console.log('Cache cleanup completed successfully');
} catch (error) {
  console.error('Error cleaning cache:', error);
  // Don't fail the build if cache cleaning fails
} 