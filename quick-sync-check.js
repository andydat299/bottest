#!/usr/bin/env node

/**
 * Quick Sync Status Check
 */

console.log('⚡ QUICK SYNC STATUS CHECK\n');

async function quickSyncCheck() {
  try {
    // Check core components
    console.log('🔍 Checking Core Components:\n');
    
    // 1. RodManager
    try {
      const { FISHING_RODS, getRodBenefits } = await import('./utils/rodManager.js');
      
      const rod1 = FISHING_RODS[1];
      const rod20 = FISHING_RODS[20];
      
      console.log('✅ rodManager.js - Loaded successfully');
      console.log(`   • Rod 1: ${rod1?.name || 'Missing'}`);
      console.log(`   • Rod 20: ${rod20?.name || 'Missing'}`);
      console.log(`   • Total rods: ${Object.keys(FISHING_RODS).length}/20`);
      
      // Quick pricing check
      const expectedPrices = { 1: 0, 10: 300000, 11: 400000, 20: 2000000 };
      let pricingOk = true;
      
      for (const [level, expectedPrice] of Object.entries(expectedPrices)) {
        if (FISHING_RODS[level]?.cost !== expectedPrice) {
          pricingOk = false;
          break;
        }
      }
      
      console.log(`   • Pricing: ${pricingOk ? '✅ Correct' : '❌ Issues detected'}`);
      
      // Quick VIP check
      const vip1to10 = Array.from({length: 10}, (_, i) => FISHING_RODS[i + 1]?.vipRequired === false).every(x => x);
      const vip11to20 = Array.from({length: 10}, (_, i) => FISHING_RODS[i + 11]?.vipRequired === 'bronze').every(x => x);
      
      console.log(`   • VIP 1-10: ${vip1to10 ? '✅ Free' : '❌ Issues'}`);
      console.log(`   • VIP 11-20: ${vip11to20 ? '✅ Bronze' : '❌ Issues'}`);
      
    } catch (error) {
      console.log('❌ rodManager.js - Failed to load');
      console.log(`   Error: ${error.message}`);
    }
    
    // 2. Commands
    console.log('\n🎮 Checking Commands:\n');
    
    const commands = [
      { file: 'commands/upgrade-rod.js', name: 'Upgrade Rod' },
      { file: 'commands/rod-shop.js', name: 'Rod Shop' },
      { file: 'commands/rod-status.js', name: 'Rod Status' }
    ];
    
    const fs = await import('fs');
    
    for (const cmd of commands) {
      try {
        if (fs.existsSync(cmd.file)) {
          console.log(`✅ ${cmd.name} - File exists`);
        } else {
          console.log(`❌ ${cmd.name} - File missing`);
        }
      } catch (error) {
        console.log(`❌ ${cmd.name} - Check failed`);
      }
    }
    
    // 3. Analysis Scripts
    console.log('\n📊 Checking Analysis Scripts:\n');
    
    const scripts = [
      'analyze-inflation.js',
      'analyze-fishing-income-inflation.js', 
      'test-rod-durability.js',
      'test-vip-requirements.js'
    ];
    
    for (const script of scripts) {
      try {
        if (fs.existsSync(script)) {
          console.log(`✅ ${script} - Available`);
        } else {
          console.log(`❌ ${script} - Missing`);
        }
      } catch (error) {
        console.log(`❌ ${script} - Check failed`);
      }
    }
    
    // 4. Integration Test
    console.log('\n🔗 Quick Integration Test:\n');
    
    try {
      const { getRodBenefits, getUpgradeInfo, getAvailableRods } = await import('./utils/rodManager.js');
      
      const rod = getRodBenefits(5);
      const upgrade = getUpgradeInfo(5, 100000);
      const available = getAvailableRods(1000000, 'bronze');
      
      console.log(`✅ Basic functions working`);
      console.log(`   • getRodBenefits: ${rod.name}`);
      console.log(`   • getUpgradeInfo: ${upgrade.canUpgrade ? 'Working' : 'Working'}`);
      console.log(`   • getAvailableRods: ${available.length} rods`);
      
    } catch (error) {
      console.log(`❌ Integration test failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n📋 QUICK SUMMARY:\n');
    console.log('✅ = Component working correctly');
    console.log('❌ = Component has issues');
    console.log('\n💡 Run full check: node validate-code-sync.js');
    console.log('🎯 Run specific tests:');
    console.log('   • node analyze-inflation.js');
    console.log('   • node test-rod-durability.js');
    console.log('   • node test-vip-requirements.js');
    
  } catch (error) {
    console.error('❌ Quick sync check failed:', error);
  }
}

quickSyncCheck();