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