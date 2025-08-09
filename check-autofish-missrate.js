#!/usr/bin/env node

/**
 * Check Auto-Fishing Miss Rate Implementation
 * Analyze if miss rate is properly implemented in autoFishingManager.js
 */

import fs from 'fs';

console.log('🔍 CHECKING AUTO-FISHING MISS RATE IMPLEMENTATION\n');

// Check autoFishingManager.js
const managerPath = './utils/autoFishingManager.js';

if (fs.existsSync(managerPath)) {
  console.log('📁 Found autoFishingManager.js');
  
  const content = fs.readFileSync(managerPath, 'utf8');
  
  // Check for miss rate related keywords
  const missRateChecks = {
    'miss': content.includes('miss'),
    'missReduction': content.includes('missReduction'),
    'fail': content.includes('fail'),
    'success rate': content.includes('success'),
    'catch rate': content.includes('catch'),
    'rodManager import': content.includes('rodManager'),
    'getRodBenefits': content.includes('getRodBenefits'),
    'Math.random': content.includes('Math.random'),
    'percentage': content.includes('%') || content.includes('percent')
  };
  
  console.log('🎯 Miss Rate Analysis:');
  Object.entries(missRateChecks).forEach(([check, found]) => {
    console.log(`   ${found ? '✅' : '❌'} ${check}: ${found}`);
  });
  
  // Extract fishing logic functions
  const functions = content.match(/(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || [];
  console.log('\n📋 Functions found:');
  functions.forEach(func => {
    console.log(`   - ${func.replace(/const\s+|function\s+|async\s+|\s*=.*$/g, '')}`);
  });
  
  // Look for fishing simulation logic
  const lines = content.split('\n');
  const fishingLogicLines = lines.filter((line, index) => {
    const lineContent = line.toLowerCase();
    return (lineContent.includes('fish') || lineContent.includes('catch') || lineContent.includes('miss')) &&
           (lineContent.includes('random') || lineContent.includes('rate') || lineContent.includes('%'));
  });
  
  console.log('\n🎣 Fishing Logic Lines:');
  if (fishingLogicLines.length > 0) {
    fishingLogicLines.forEach((line, index) => {
      console.log(`   ${index + 1}. ${line.trim()}`);
    });
  } else {
    console.log('   ❌ No fishing logic with miss rate found!');
  }
  
  // Check if miss rate is calculated properly
  const hasMissRateLogic = content.includes('missReduction') && content.includes('Math.random');
  console.log(`\n🎯 Has Miss Rate Logic: ${hasMissRateLogic ? '✅ YES' : '❌ NO'}`);
  
  if (!hasMissRateLogic) {
    console.log('\n🚨 ISSUE DETECTED:');
    console.log('   ❌ Auto-fishing does NOT implement miss rate!');
    console.log('   ❌ This means autofish never misses = unrealistic');
    console.log('   ❌ Rod missReduction stats are ignored');
    console.log('\n🔧 NEEDS TO BE FIXED:');
    console.log('   1. Import getRodBenefits from rodManager');
    console.log('   2. Calculate miss rate based on rod stats');
    console.log('   3. Use Math.random() for miss chance');
    console.log('   4. Track missed attempts in results');
  }
  
} else {
  console.log('❌ autoFishingManager.js not found!');
  
  // Check if autoFishingManager exists in different location
  const possiblePaths = [
    './utils/autoFishing.js',
    './utils/fishing.js', 
    './managers/autoFishingManager.js',
    './lib/autoFishingManager.js'
  ];
  
  console.log('\n🔍 Checking alternative paths:');
  possiblePaths.forEach(path => {
    if (fs.existsSync(path)) {
      console.log(`   ✅ Found: ${path}`);
    } else {
      console.log(`   ❌ Not found: ${path}`);
    }
  });
}

// Check auto-fishing.js for clues
console.log('\n📋 Auto-fishing.js Analysis:');
const autoFishingPath = './commands/auto-fishing.js';
if (fs.existsSync(autoFishingPath)) {
  const autoContent = fs.readFileSync(autoFishingPath, 'utf8');
  
  // Look for miss rate mentions
  const hasMissRateMention = autoContent.includes('miss') || 
                            autoContent.includes('Tỷ lệ hụt') ||
                            autoContent.includes('actualMissRate');
  
  console.log(`   Has miss rate mention: ${hasMissRateMention ? '✅' : '❌'}`);
  
  if (hasMissRateMention) {
    console.log('   📊 Found miss rate tracking in results display');
    console.log('   🔍 But need to check if calculation is implemented');
  }
  
  // Check import statements
  const imports = autoContent.match(/from\s+['"][^'"]+['"]/g) || [];
  console.log('\n📦 Imports:');
  imports.forEach(imp => {
    console.log(`   - ${imp}`);
  });
}

console.log('\n🎯 CONCLUSION:');
console.log('Auto-fishing command exists but likely missing proper miss rate logic.');
console.log('Need to check/create autoFishingManager.js with realistic miss rates.');

console.log('\n✅ Miss rate check completed!');