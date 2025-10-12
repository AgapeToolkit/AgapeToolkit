/* eslint-disable no-console */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Master script to run all standards data update operations in sequence
 */

const WORKSPACE_ROOT = process.cwd();
const LOG_FILE = path.join(WORKSPACE_ROOT, 'tools', 'scripts', 'standards', 'update-log.json');

interface UpdateLog {
  lastRun: string;
  success: boolean;
  steps: {
    download: { success: boolean; error?: string; duration: number };
    extractCountries: { success: boolean; error?: string; duration: number };
    extractStates: { success: boolean; error?: string; duration: number };
  };
  summary: {
    totalDuration: number;
    statesProcessed?: number;
  };
}

function logStep(step: string, startTime: number, success: boolean, error?: string): void {
  const duration = Date.now() - startTime;
  console.log(`✓ ${step} completed in ${duration}ms`);
  if (error) {
    console.error(`  Error: ${error}`);
  }
}

function loadUpdateLog(): UpdateLog | null {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (error) {
      console.warn('Could not load update log:', error);
    }
  }
  return null;
}

function saveUpdateLog(log: UpdateLog): void {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function runScript(scriptName: string, description: string): { success: boolean; error?: string; duration: number } {
  const startTime = Date.now();
  console.log(`\n🔄 ${description}...`);
  
  try {
    execSync(`npm run tools:standards:${scriptName}`, { 
      stdio: 'inherit',
      cwd: WORKSPACE_ROOT
    });
    
    const duration = Date.now() - startTime;
    logStep(description, startTime, true);
    return { success: true, duration };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(description, startTime, false, errorMessage);
    return { success: false, error: errorMessage, duration };
  }
}

function generateSummaryReport(log: UpdateLog): void {
  console.log('\n📊 Update Summary Report');
  console.log('=' .repeat(50));
  
  const { steps, summary } = log;
  
  console.log(`Total Duration: ${summary.totalDuration}ms`);
  console.log(`Download: ${steps.download.success ? '✅' : '❌'} (${steps.download.duration}ms)`);
  console.log(`Extract Countries: ${steps.extractCountries.success ? '✅' : '❌'} (${steps.extractCountries.duration}ms)`);
  console.log(`Extract States: ${steps.extractStates.success ? '✅' : '❌'} (${steps.extractStates.duration}ms)`);
  
  if (summary.statesProcessed) {
    console.log(`States Processed: ${summary.statesProcessed}`);
  }
  
  if (log.success) {
    console.log('\n🎉 All operations completed successfully!');
  } else {
    console.log('\n⚠️  Some operations failed. Check the logs above for details.');
  }
  
  console.log(`\n📝 Full log saved to: ${LOG_FILE}`);
}

function checkForChanges(): boolean {
  const metadataPath = path.join(WORKSPACE_ROOT, 'sources', 'database-metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    console.log('No previous metadata found - first run detected');
    return true;
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`Last update: ${metadata.lastUpdated}`);
    console.log(`Commit: ${metadata.commitHash}`);
    return true; // For now, always run updates
  } catch (error) {
    console.warn('Could not read metadata:', error);
    return true;
  }
}

function main(): void {
  const overallStartTime = Date.now();
  console.log('🚀 Starting Standards Data Update');
  console.log('=' .repeat(50));
  
  // Check if we should run updates
  if (!checkForChanges()) {
    console.log('No changes detected. Skipping update.');
    return;
  }
  
  const log: UpdateLog = {
    lastRun: new Date().toISOString(),
    success: false,
    steps: {
      download: { success: false, duration: 0 },
      extractCountries: { success: false, duration: 0 },
      extractStates: { success: false, duration: 0 }
    },
    summary: {
      totalDuration: 0
    }
  };
  
  try {
    // Step 1: Download/Update Database
    log.steps.download = runScript('download', 'Download/Update Database');
    if (!log.steps.download.success) {
      throw new Error('Database download failed');
    }
    
    // Step 2: Extract Country Codes
    log.steps.extractCountries = runScript('extract-countries', 'Extract Country Codes');
    if (!log.steps.extractCountries.success) {
      throw new Error('Country codes extraction failed');
    }
    
    // Step 3: Extract State Codes
    log.steps.extractStates = runScript('extract-states', 'Extract State Codes');
    if (!log.steps.extractStates.success) {
      throw new Error('State codes extraction failed');
    }
    
    // All steps completed successfully
    log.success = true;
    
    // Count state files
    try {
      const statesDir = path.join(WORKSPACE_ROOT, 'libs', 'standards', 'src', 'lib', 'codes', 'states');
      if (fs.existsSync(statesDir)) {
        const files = fs.readdirSync(statesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'definitions.ts' && f !== 'all.ts');
        log.summary.statesProcessed = files.length;
      }
    } catch (error) {
      console.warn('Could not extract summary statistics:', error);
    }
    
  } catch (error) {
    console.error('\n❌ Update process failed:', error);
    log.success = false;
  } finally {
    log.summary.totalDuration = Date.now() - overallStartTime;
    saveUpdateLog(log);
    generateSummaryReport(log);
    
    if (!log.success) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}
