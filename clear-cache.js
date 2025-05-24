const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Paths to clean
const pathsToClean = [
  '.next',
  'node_modules/.cache'
];

// Delete a directory recursively
function deleteFolderRecursive(filePath) {
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.readdirSync(filePath).forEach((file) => {
        const curPath = path.join(filePath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // Recursive call for directories
          deleteFolderRecursive(curPath);
        } else {
          // Delete files
          try {
            fs.unlinkSync(curPath);
          } catch (err) {
            console.error(`Failed to delete file: ${curPath}`, err);
          }
        }
      });
      
      try {
        // Delete the empty directory
        fs.rmdirSync(filePath);
      } catch (err) {
        console.error(`Failed to delete directory: ${filePath}`, err);
      }
    } else {
      // Delete file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }
  }
}

// Clean cache directories
pathsToClean.forEach(pathToClean => {
  console.log(`Cleaning ${pathToClean}...`);
  try {
    deleteFolderRecursive(pathToClean);
    console.log(`Successfully cleaned ${pathToClean}`);
  } catch (err) {
    console.error(`Error cleaning ${pathToClean}:`, err);
  }
});

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