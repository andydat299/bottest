#!/usr/bin/env node

/**
 * Code Synchronization Check
 * Validates consistency across all rod system components
 */

console.log('🔄 CODE SYNCHRONIZATION VALIDATION\n');

async function validateCodeSync() {
  try {
    console.log('📊 Checking Rod System Components...\n');
    
    // Import all related modules
    const rodManager = await import('./utils/rodManager.js');
    const { FISHING_RODS } = rodManager;
    
    console.log('✅ Successfully imported rodManager.js');
    
    // Validate rod data consistency
    console.log('\n🎣 Validating Rod Data Structure:');
    
    let structureValid = true;
    const requiredFields = ['name', 'cost', 'missReduction', 'rareBoost', 'durability', 'tier', 'vipRequired', 'description'];
    
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      
      if (!rod) {
        console.log(`❌ Missing rod data for level ${level}`);
        structureValid = false;
        continue;
      }
      
      for (const field of requiredFields) {
        if (rod[field] === undefined) {
          console.log(`❌ Level ${level}: Missing field '${field}'`);
          structureValid = false;
        }
      }
    }
    
    if (structureValid) {
      console.log('✅ All rod data structures are valid');
    }
    
    // Check VIP requirements consistency
    console.log('\n👑 Validating VIP Requirements:');
    
    let vipConsistent = true;
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      const expectedVip = level <= 10 ? false : 'bronze';
      
      if (rod.vipRequired !== expectedVip) {
        console.log(`❌ Level ${level}: VIP requirement mismatch. Expected: ${expectedVip}, Got: ${rod.vipRequired}`);
        vipConsistent = false;
      }
    }
    
    if (vipConsistent) {
      console.log('✅ VIP requirements are consistent (1-10: free, 11-20: bronze)');
    }
    
    // Check pricing consistency 
    console.log('\n💰 Validating Pricing Structure:');
    
    const expectedPrices = {
      1: 0, 2: 500, 3: 5000, 4: 10000, 5: 15000,
      6: 20000, 7: 50000, 8: 100000, 9: 150000, 10: 300000,
      11: 400000, 12: 550000, 13: 750000, 14: 1000000, 15: 1300000,
      16: 1650000, 17: 2050000, 18: 2000000, 19: 2000000, 20: 2000000
    };
    
    let pricingValid = true;
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      const expectedCost = expectedPrices[level];
      
      if (rod.cost !== expectedCost) {
        console.log(`❌ Level ${level}: Price mismatch. Expected: ${expectedCost}, Got: ${rod.cost}`);
        pricingValid = false;
      }
    }
    
    if (pricingValid) {
      console.log('✅ All rod prices match expected values');
    }
    
    // Check benefit progression
    console.log('\n📈 Validating Benefit Progression:');
    
    let progressionValid = true;
    for (let level = 2; level <= 20; level++) {
      const currentRod = FISHING_RODS[level];
      const previousRod = FISHING_RODS[level - 1];
      
      if (currentRod.missReduction < previousRod.missReduction) {
        console.log(`❌ Level ${level}: Miss reduction decreased from previous level`);
        progressionValid = false;
      }
      
      if (currentRod.rareBoost < previousRod.rareBoost) {
        console.log(`❌ Level ${level}: Rare boost decreased from previous level`);
        progressionValid = false;
      }
      
      if (currentRod.durability < previousRod.durability) {
        console.log(`❌ Level ${level}: Durability decreased from previous level`);
        progressionValid = false;
      }
    }
    
    if (progressionValid) {
      console.log('✅ All benefits show proper progression');
    }
    
    // Test function exports
    console.log('\n🔧 Validating Function Exports:');
    
    const requiredFunctions = [
      'getRodBenefits',
      'calculateMissReduction', 
      'calculateRareBoost',
      'getUpgradeInfo',
      'getAvailableRods',
      'getRodTierColor',
      'getRodProgression',
      'calculateDurabilityDamage',
      'getRodDurabilityInfo',
      'calculateRepairCost',
      'getRodDurabilityStatus',
      'getRodDurabilityTier',
      'simulateRodDurability'
    ];
    
    let functionsValid = true;
    for (const funcName of requiredFunctions) {
      if (typeof rodManager[funcName] !== 'function') {
        console.log(`❌ Missing or invalid function: ${funcName}`);
        functionsValid = false;
      }
    }
    
    if (functionsValid) {
      console.log('✅ All required functions are exported');
    }
    
    // Test function calls
    console.log('\n🧪 Testing Function Calls:');
    
    try {
      // Test basic functions
      const rod1 = rodManager.getRodBenefits(1);
      const rod20 = rodManager.getRodBenefits(20);
      
      if (rod1.name && rod20.name) {
        console.log('✅ getRodBenefits() working correctly');
      }
      
      const upgradeInfo = rodManager.getUpgradeInfo(5, 100000);
      if (upgradeInfo.hasOwnProperty('canUpgrade')) {
        console.log('✅ getUpgradeInfo() working correctly');
      }
      
      const availableRods = rodManager.getAvailableRods(1000000, 'bronze');
      if (Array.isArray(availableRods) && availableRods.length === 20) {
        console.log('✅ getAvailableRods() working correctly');
      }
      
      const durabilityDamage = rodManager.calculateDurabilityDamage(10);
      if (durabilityDamage.hasOwnProperty('damage')) {
        console.log('✅ calculateDurabilityDamage() working correctly');
      }
      
    } catch (error) {
      console.log(`❌ Function test failed: ${error.message}`);
      functionsValid = false;
    }
    
    // Check command files existence
    console.log('\n📁 Checking Command Files:');
    
    const commandFiles = [
      'commands/upgrade-rod.js',
      'commands/rod-shop.js', 
      'commands/rod-status.js'
    ];
    
    const fs = await import('fs');
    const path = await import('path');
    
    let commandsValid = true;
    for (const cmdFile of commandFiles) {
      try {
        const filePath = path.resolve(cmdFile);
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${cmdFile} exists`);
        } else {
          console.log(`❌ ${cmdFile} missing`);
          commandsValid = false;
        }
      } catch (error) {
        console.log(`❌ Error checking ${cmdFile}: ${error.message}`);
        commandsValid = false;
      }
    }
    
    // Check analysis scripts
    console.log('\n📊 Checking Analysis Scripts:');
    
    const analysisFiles = [
      'analyze-inflation.js',
      'analyze-fishing-income-inflation.js',
      'quick-inflation-check.js',
      'quick-income-inflation-check.js',
      'test-rod-durability.js',
      'test-vip-requirements.js'
    ];
    
    let analysisValid = true;
    for (const scriptFile of analysisFiles) {
      try {
        const filePath = path.resolve(scriptFile);
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${scriptFile} exists`);
        } else {
          console.log(`❌ ${scriptFile} missing`);
          analysisValid = false;
        }
      } catch (error) {
        console.log(`❌ Error checking ${scriptFile}: ${error.message}`);
        analysisValid = false;
      }
    }
    
    // Final sync assessment
    console.log('\n📋 SYNCHRONIZATION SUMMARY:');
    
    const checks = [
      { name: 'Rod Data Structure', valid: structureValid },
      { name: 'VIP Requirements', valid: vipConsistent },
      { name: 'Pricing Structure', valid: pricingValid },
      { name: 'Benefit Progression', valid: progressionValid },
      { name: 'Function Exports', valid: functionsValid },
      { name: 'Command Files', valid: commandsValid },
      { name: 'Analysis Scripts', valid: analysisValid }
    ];
    
    let totalValid = 0;
    checks.forEach(check => {
      const status = check.valid ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (check.valid) totalValid++;
    });
    
    const syncPercentage = (totalValid / checks.length * 100).toFixed(1);
    console.log(`\n📊 Overall Sync Status: ${totalValid}/${checks.length} (${syncPercentage}%)`);
    
    if (syncPercentage === '100.0') {
      console.log('🎉 PERFECT SYNC: All components are synchronized');
    } else if (syncPercentage >= '80.0') {
      console.log('✅ GOOD SYNC: Minor issues detected');
    } else {
      console.log('⚠️ SYNC ISSUES: Multiple components need attention');
    }
    
    // Integration test
    console.log('\n🔗 Integration Test:');
    
    try {
      // Test full workflow
      const testLevel = 5;
      const testBalance = 50000;
      const testVip = 'bronze';
      
      const rod = rodManager.getRodBenefits(testLevel);
      const upgrade = rodManager.getUpgradeInfo(testLevel, testBalance);
      const available = rodManager.getAvailableRods(testBalance, testVip);
      const progression = rodManager.getRodProgression(testLevel);
      const durability = rodManager.calculateDurabilityDamage(testLevel);
      
      console.log('✅ Full integration test passed');
      console.log(`   Test rod: ${rod.name}`);
      console.log(`   Upgrade status: ${upgrade.canUpgrade ? 'Can upgrade' : 'Cannot upgrade'}`);
      console.log(`   Available rods: ${available.length}`);
      console.log(`   Progression: ${progression.progressPercent}%`);
      console.log(`   Durability loss: ${durability.durabilityLoss}`);
      
    } catch (error) {
      console.log(`❌ Integration test failed: ${error.message}`);
    }
    
    // Recommendations
    if (syncPercentage < '100.0') {
      console.log('\n💡 RECOMMENDATIONS:');
      
      if (!structureValid) {
        console.log('   • Fix rod data structure issues in rodManager.js');
      }
      if (!vipConsistent) {
        console.log('   • Update VIP requirements to match 1-10 free, 11-20 bronze');
      }
      if (!pricingValid) {
        console.log('   • Correct rod pricing to match specification');
      }
      if (!progressionValid) {
        console.log('   • Fix benefit progression to ensure increasing values');
      }
      if (!functionsValid) {
        console.log('   • Add missing function exports to rodManager.js');
      }
      if (!commandsValid) {
        console.log('   • Create missing command files');
      }
      if (!analysisValid) {
        console.log('   • Create missing analysis scripts');
      }
    }
    
  } catch (error) {
    console.error('❌ Sync validation failed:', error);
  }
}

// Run synchronization check
validateCodeSync().then(() => {
  console.log('\n✅ Code synchronization check completed!');
  console.log('🔄 Review results to ensure all components are in sync.');
}).catch(error => {
  console.error('❌ Validation script failed:', error);
});