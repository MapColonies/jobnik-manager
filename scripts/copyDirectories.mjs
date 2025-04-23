#!/usr/bin/env zx

import { $, argv, fs, path } from 'zx';

// Validate command line arguments
function validateArgs() {
  if (argv._.length !== 2) {
    console.error('Error: Please provide source and destination directories.');
    process.exit(1);
  }

  const [source, destination] = argv._;

  // Check if source exists
  if (!fs.existsSync(source)) {
    console.error(`Error: Source directory '${source}' does not exist.`);
    process.exit(1);
  }

  // Check if source is a directory
  if (!fs.statSync(source).isDirectory()) {
    console.error(`Error: '${source}' is not a directory.`);
    process.exit(1);
  }

  return { source, destination };
}

// Function to copy files directly preserving structure but not including source path
function copyFilesCorrectly(source, destination) {
  try {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Get a list of all files and directories in the source directory
    const entries = fs.readdirSync(source, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy directories
        copyFilesCorrectly(sourcePath, destPath);
      } else if (entry.isFile() && !entry.name.endsWith('.d.ts')) {
        // Copy files that don't end with .d.ts
        // Ensure the destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        // Copy the file
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  } catch (error) {
    console.error('Error copying directory:', error);
    process.exit(1);
  }
}

// Main function
function main() {
  const { source, destination } = validateArgs();
  copyFilesCorrectly(source, destination);
}

// Execute the script
try {
  main();
} catch (err) {
  console.error('Unexpected error:', err);
  process.exit(1);
}
