/* eslint-disable no-console */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to download/update the countries-states-cities-database repository
 */

const WORKSPACE_ROOT = process.cwd();
const SOURCES_DIR = path.join(WORKSPACE_ROOT, 'sources');
const DATABASE_DIR = path.join(SOURCES_DIR, 'countries-states-cities-database');
const REPO_URL = 'https://github.com/dr5hn/countries-states-cities-database.git';

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isGitRepository(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, '.git'));
}

function downloadDatabase(): void {
  console.log('Starting database download/update...');
  
  // Ensure sources directory exists
  ensureDirectoryExists(SOURCES_DIR);
  
  if (isGitRepository(DATABASE_DIR)) {
    console.log('Repository exists, updating...');
    try {
      // Update existing repository
      execSync('git pull origin master', { 
        cwd: DATABASE_DIR,
        stdio: 'inherit'
      });
      console.log('Repository updated successfully');
    } catch (error) {
      console.error('Failed to update repository:', error);
      throw error;
    }
  } else {
    console.log('Repository not found, cloning...');
    try {
      // Clone the repository
      execSync(`git clone ${REPO_URL} "${DATABASE_DIR}"`, {
        stdio: 'inherit'
      });
      console.log('Repository cloned successfully');
    } catch (error) {
      console.error('Failed to clone repository:', error);
      throw error;
    }
  }
  
  // Verify the required files exist
  const requiredFiles = [
    'json/countries.json',
    'json/states.json',
    'json/cities.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(DATABASE_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file not found: ${filePath}`);
    }
  }
  
  console.log('All required files verified');
  
  // Get the latest commit hash for tracking
  try {
    const commitHash = execSync('git rev-parse HEAD', { 
      cwd: DATABASE_DIR,
      encoding: 'utf8'
    }).trim();
    
    const commitDate = execSync('git log -1 --format=%ci', { 
      cwd: DATABASE_DIR,
      encoding: 'utf8'
    }).trim();
    
    console.log(`Latest commit: ${commitHash}`);
    console.log(`Commit date: ${commitDate}`);
    
    // Save metadata
    const metadata = {
      lastUpdated: new Date().toISOString(),
      commitHash,
      commitDate,
      repository: REPO_URL
    };
    
    const metadataPath = path.join(SOURCES_DIR, 'database-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to: ${metadataPath}`);
    
  } catch (error) {
    console.warn('Could not get commit information:', error);
  }
}

function main(): void {
  try {
    downloadDatabase();
    console.log('Database download/update completed successfully!');
  } catch (error) {
    console.error('Database download/update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
