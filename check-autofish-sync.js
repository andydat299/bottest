#!/usr/bin/env node

/**
 * Complete Auto-Fishing System Sync Check
 * Verify all components are synchronized and working together
 */

import fs from 'fs';

console.log('🔍 COMPLETE AUTO-FISHING SYSTEM SYNC CHECK\n');

const syncIssues = [];
const syncSuccess = [];

// 1. Check autoFishingManager.js issues
console.log('📊 1. CHECKING AUTOFISHING MANAGER...');

const managerPath = './utils/autoFishingManager.js';
if (fs.existsSync(managerPath)) {
  const managerContent = fs.readFileSync(managerPath, 'utf8');
  
  // Issue 1: Double session creation
  const hasDoubleCreate = managerContent.includes('await AutoFishing.create({') && 
                         managerContent.split('await AutoFishing.create({').length > 2;
  
  if (hasDoubleCreate) {
    syncIssues.push({
      file: 'autoFishingManager.js',
      issue: 'Double session creation - creates DB record twice',
      line: 'Lines ~160 and ~270',
      fix: 'Update existing record instead of creating new one'
    });
  } else {
    syncSuccess.push('✅ AutoFishing manager - no double creation');
  }
  
  // Issue 2: Memory vs Database sync
  const hasMemorySync = managerContent.includes('activeSessions.set') && 
                       managerContent.includes('activeSessions.delete');
  
  if (!hasMemorySync) {
    syncIssues.push({
      file: 'autoFishingManager.js', 
      issue: 'Memory session management incomplete',
      fix: 'Ensure activeSessions Map is properly managed'
    });
  } else {
    syncSuccess.push('✅ Memory session management');
  }
  
} else {
  syncIssues.push({
    file: 'autoFishingManager.js',
    issue: 'File not found',
    fix: 'Create missing autoFishingManager.js'
  });
}

// 2. Check autoFishingJobs.js compatibility
console.log('📊 2. CHECKING BACKGROUND JOBS...');

const jobsPath = './utils/autoFishingJobs.js';
if (fs.existsSync(jobsPath)) {
  const jobsContent = fs.readFileSync(jobsPath, 'utf8');
  
  // Check if jobs can handle current session format
  const hasCompatibleProcessing = jobsContent.includes('stopAutoFishingSession') &&
                                 jobsContent.includes('status: { $ne: \'completed\' }');
  
  if (!hasCompatibleProcessing) {
    syncIssues.push({
      file: 'autoFishingJobs.js',
      issue: 'Background jobs not compatible with session format',
      fix: 'Update job processing logic'
    });
  } else {
    syncSuccess.push('✅ Background jobs compatibility');
  }
  
} else {
  syncIssues.push({
    file: 'autoFishingJobs.js',
    issue: 'File not found',
    fix: 'Create missing autoFishingJobs.js'
  });
}

// 3. Check schema compatibility
console.log('📊 3. CHECKING DATABASE SCHEMA...');

const schemaPath = './schemas/autoFishingSchema.js';
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const hasStatusField = schemaContent.includes('status:') && 
                        schemaContent.includes('enum: [\'active\', \'completed\'');
  
  if (!hasStatusField) {
    syncIssues.push({
      file: 'autoFishingSchema.js',
      issue: 'Missing status field or wrong enum values', 
      fix: 'Add status field with proper enum'
    });
  } else {
    syncSuccess.push('✅ Database schema with status field');
  }
  
} else {
  syncIssues.push({
    file: 'autoFishingSchema.js', 
    issue: 'File not found',
    fix: 'Create missing autoFishingSchema.js'
  });
}

// 4. Check auto-fishing command compatibility
console.log('📊 4. CHECKING AUTO-FISHING COMMAND...');

const commandPath = './commands/auto-fishing.js';
if (fs.existsSync(commandPath)) {
  const commandContent = fs.readFileSync(commandPath, 'utf8');
  
  const hasUpdatedImports = commandContent.includes('autoFishingManager.js') &&
                           commandContent.includes('startAutoFishingSession');
  
  if (!hasUpdatedImports) {
    syncIssues.push({
      file: 'auto-fishing.js',
      issue: 'Missing imports from autoFishingManager',
      fix: 'Update import statements'
    });
  } else {
    syncSuccess.push('✅ Auto-fishing command imports');
  }
  
} else {
  syncIssues.push({
    file: 'auto-fishing.js',
    issue: 'File not found', 
    fix: 'Create missing auto-fishing.js command'
  });
}

// 5. Check integration files
console.log('📊 5. CHECKING INTEGRATION FILES...');

const integrationFiles = [
  'debug-vip-autofish.js',
  'fix-vip-autofish.js', 
  'autofish-jobs-status.js'
];

integrationFiles.forEach(file => {
  const filePath = `./commands/${file}`;
  if (fs.existsSync(filePath)) {
    syncSuccess.push(`✅ ${file} exists`);
  } else {
    syncIssues.push({
      file: file,
      issue: 'Integration command missing',
      fix: `Create ${file} command`
    });
  }
});

// Results
console.log('\n📊 SYNC CHECK RESULTS:');
console.log(`   ✅ Success: ${syncSuccess.length} items`);
console.log(`   ❌ Issues: ${syncIssues.length} items`);

if (syncSuccess.length > 0) {
  console.log('\n✅ SYNCHRONIZED COMPONENTS:');
  syncSuccess.forEach(item => {
    console.log(`   ${item}`);
  });
}

if (syncIssues.length > 0) {
  console.log('\n❌ SYNCHRONIZATION ISSUES:');
  syncIssues.forEach((issue, index) => {
    console.log(`\n   ${index + 1}. ${issue.file}:`);
    console.log(`      Issue: ${issue.issue}`);
    console.log(`      Fix: ${issue.fix}`);
    if (issue.line) {
      console.log(`      Location: ${issue.line}`);
    }
  });
} else {
  console.log('\n🎉 ALL COMPONENTS SYNCHRONIZED!');
}

console.log('\n🎯 NEXT STEPS:');
if (syncIssues.length > 0) {
  console.log('❌ Fix synchronization issues above');
  console.log('   Run: node fix-autofish-sync.js');
} else {
  console.log('✅ Deploy to Railway');
  console.log('   git add . && git commit -m "Sync: Complete auto-fishing system" && git push');
}

console.log('\n✅ Sync check completed!');