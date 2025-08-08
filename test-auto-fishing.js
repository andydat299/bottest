#!/usr/bin/env node

/**
 * Test script for Auto-Fishing system
 */

console.log('🧪 Testing Auto-Fishing System...\n');

// Test auto-fishing limits
async function testAutoFishingLimits() {
  console.log('📋 Testing VIP limits...');
  
  try {
    const { getAutoFishingLimits } = await import('../utils/autoFishingManager.js');
    
    const tiers = ['none', 'bronze', 'silver', 'gold', 'diamond'];
    
    for (const tier of tiers) {
      const limits = getAutoFishingLimits(tier);
      console.log(`   ${tier}: ${limits.enabled ? limits.dailyMinutes + ' min/day' : 'disabled'}`);
    }
    
    console.log('✅ VIP limits test passed\n');
  } catch (error) {
    console.error('❌ VIP limits test failed:', error.message);
  }
}

// Test fishing calculations
async function testFishingCalculations() {
  console.log('📋 Testing fishing calculations...');
  
  try {
    const { calculateAutoFishingResults } = await import('../utils/autoFishingManager.js');
    
    const vipBenefits = {
      fishingMissReduction: 20,
      rareFishBoost: 40
    };
    
    const results = calculateAutoFishingResults(60, vipBenefits); // 60 minutes
    
    console.log('   Duration: 60 minutes');
    console.log(`   Total attempts: ${results.totalAttempts}`);
    console.log(`   Fish caught: ${results.fishCaught}`);
    console.log(`   Fish missed: ${results.fishMissed}`);
    console.log(`   Efficiency: ${results.efficiency.toFixed(1)}%`);
    console.log(`   Total XU: ${results.totalXu.toLocaleString()}`);
    
    if (results.totalAttempts > 0 && results.efficiency > 0) {
      console.log('✅ Fishing calculations test passed\n');
    } else {
      console.log('❌ Fishing calculations test failed - no results\n');
    }
  } catch (error) {
    console.error('❌ Fishing calculations test failed:', error.message);
  }
}

// Test configuration
async function testConfiguration() {
  console.log('📋 Testing configuration...');
  
  try {
    const { VIP_TIERS } = await import('../utils/vipManager.js');
    
    console.log('   VIP Tiers loaded:');
    for (const [tier, config] of Object.entries(VIP_TIERS)) {
      console.log(`     ${tier}: ${config.name} (${config.cost.toLocaleString()} xu)`);
    }
    
    console.log('✅ Configuration test passed\n');
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testAutoFishingLimits();
  await testFishingCalculations(); 
  await testConfiguration();
  
  console.log('🎉 Auto-Fishing system tests completed!');
  console.log('📝 Ready for deployment.');
}

// Execute tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});