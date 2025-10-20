#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WORKSPACE_ROOT = process.cwd();
const SOURCES_DIR = path.join(WORKSPACE_ROOT, 'sources');
const CLDR_DIR = path.join(SOURCES_DIR, 'cldr-json');

/**
 * Checks if CLDR data exists and is up to date
 */
function checkCLDRStatus(): { exists: boolean; isGitRepo: boolean; hasData: boolean } {
  const exists = fs.existsSync(CLDR_DIR);
  const isGitRepo = exists && fs.existsSync(path.join(CLDR_DIR, '.git'));
  const hasData = exists && fs.existsSync(path.join(CLDR_DIR, 'cldr-json'));
  
  return { exists, isGitRepo, hasData };
}

/**
 * Initializes CLDR as a git submodule
 */
function initializeCLDRSubmodule(): void {
  console.log('Initializing CLDR as git submodule...');
  
  try {
    // Add the submodule if it doesn't exist
    execSync('git submodule add https://github.com/unicode-org/cldr-json.git sources/cldr-json', {
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit'
    });
    console.log('✅ CLDR submodule added successfully');
  } catch (error) {
    console.error('❌ Failed to add CLDR submodule:', error);
    throw error;
  }
}

/**
 * Updates CLDR to the latest version
 */
function updateCLDR(): void {
  console.log('Updating CLDR to latest version...');
  
  try {
    // Update the submodule to latest
    execSync('git submodule update --remote sources/cldr-json', {
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit'
    });
    console.log('✅ CLDR updated successfully');
  } catch (error) {
    console.error('❌ Failed to update CLDR:', error);
    throw error;
  }
}

/**
 * Initializes CLDR submodule if needed
 */
function initializeIfNeeded(): void {
  const status = checkCLDRStatus();
  
  if (!status.exists) {
    console.log('CLDR directory does not exist, initializing...');
    initializeCLDRSubmodule();
  } else if (!status.isGitRepo) {
    console.log('CLDR directory exists but is not a git repository');
    console.log('Please remove the directory and run this script again');
    process.exit(1);
  } else if (!status.hasData) {
    console.log('CLDR git repository exists but data is missing');
    console.log('Updating submodule...');
    updateCLDR();
  } else {
    console.log('✅ CLDR data is already available');
  }
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const forceUpdate = args.includes('--force') || args.includes('-f');
  
  console.log('🔍 Checking CLDR status...');
  const status = checkCLDRStatus();
  
  console.log(`CLDR Directory: ${CLDR_DIR}`);
  console.log(`Exists: ${status.exists}`);
  console.log(`Is Git Repo: ${status.isGitRepo}`);
  console.log(`Has Data: ${status.hasData}`);
  
  if (!status.exists || !status.isGitRepo || !status.hasData) {
    initializeIfNeeded();
  } else if (forceUpdate) {
    console.log('Force update requested...');
    updateCLDR();
  } else {
    console.log('✅ CLDR is up to date');
    console.log('Use --force flag to update anyway');
  }
  
  // Verify the data is accessible
  const subdivisionsDir = path.join(CLDR_DIR, 'cldr-json', 'cldr-subdivisions-full', 'subdivisions');
  const likelySubtagsFile = path.join(CLDR_DIR, 'cldr-json', 'cldr-core', 'supplemental', 'likelySubtags.json');
  
  if (!fs.existsSync(subdivisionsDir)) {
    console.error('❌ CLDR subdivisions directory not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(likelySubtagsFile)) {
    console.error('❌ CLDR likely subtags file not found');
    process.exit(1);
  }
  
  console.log('✅ CLDR data verification successful');
  
  // Show some stats
  const locales = fs.readdirSync(subdivisionsDir)
    .filter(item => fs.statSync(path.join(subdivisionsDir, item)).isDirectory());
  
  console.log(`📊 Found ${locales.length} locales in CLDR subdivisions`);
  console.log(`📊 Sample locales: ${locales.slice(0, 10).join(', ')}${locales.length > 10 ? '...' : ''}`);
}

if (require.main === module) {
  main();
}
