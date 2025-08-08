#!/usr/bin/env node

/**
 * Test Script: Rod Durability System for 20-Level Rods
 */

console.log('🔧 FISHING ROD DURABILITY SYSTEM TEST\n');

async function testDurabilitySystem() {
  try {
    const { 
      FISHING_RODS, 
      calculateDurabilityDamage, 
      getRodDurabilityInfo,
      getRodDurabilityTier,
      simulateRodDurability 
    } = await import('./utils/rodManager.js');
    
    console.log('📊 Rod Durability Analysis by Level:\n');
    
    // Create durability table
    console.log('Level | Name                     | Durability | Damage Range | Break Chance | Repair Cost');
    console.log('------|--------------------------|------------|--------------|--------------|-------------');
    
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      const damageInfo = calculateDurabilityDamage(level);
      const repairCost = Math.floor(rod.cost * (level <= 10 ? 0.05 : 0.15));
      
      console.log(
        `${level.toString().padStart(2)} | ` +
        `${rod.name.substring(0, 24).padEnd(24)} | ` +
        `${rod.durability.toString().padStart(10)} | ` +
        `${damageInfo.minDamage}-${damageInfo.maxDamage.toString().padEnd(8)} | ` +
        `${damageInfo.breakChance.padStart(11)}% | ` +
        `${repairCost.toLocaleString().padStart(11)} xu`
      );
    }
    
    console.log('\n🔍 Durability Tier Comparison:\n');
    
    // Standard Tier (Levels 1-10)
    console.log('📘 STANDARD TIER (Levels 1-10):');
    const standardInfo = getRodDurabilityTier(5);
    console.log(`   Description: ${standardInfo.description}`);
    console.log(`   Damage Range: ${standardInfo.damageRange}`);
    console.log(`   Break Chance: ${standardInfo.breakChance}`);
    console.log(`   Repair Frequency: ${standardInfo.repairFrequency}`);
    console.log(`   Maintenance: ${standardInfo.tier} - Low cost, high reliability`);
    
    console.log('\n📗 PREMIUM TIER (Levels 11-20):');
    const premiumInfo = getRodDurabilityTier(15);
    console.log(`   Description: ${premiumInfo.description}`);
    console.log(`   Damage Range: ${premiumInfo.damageRange}`);
    console.log(`   Break Chance: ${premiumInfo.breakChance}`);
    console.log(`   Repair Frequency: ${premiumInfo.repairFrequency}`);
    console.log(`   Maintenance: ${premiumInfo.tier} - High cost, premium performance`);
    
    console.log('\n📈 Durability Progression Analysis:');
    
    // Analyze key levels
    const keyLevels = [1, 5, 10, 15, 20];
    
    keyLevels.forEach(level => {
      const rod = FISHING_RODS[level];
      const info = getRodDurabilityInfo(level);
      
      console.log(`\n🎣 Level ${level} - ${rod.name}:`);
      console.log(`   Tier: ${info.tier}`);
      console.log(`   Maintenance: ${info.maintenance}`);
      console.log(`   Durability Loss: ${info.durabilityPerUse} per use`);
      console.log(`   Break Chance: ${info.breakChance}`);
      console.log(`   Repair Cost: ${info.repairCost}`);
      console.log(`   Expected Uses: ${info.expectedUses} before repair needed`);
      console.log(`   Description: ${info.description}`);
    });
    
    console.log('\n🧪 Simulation Results (100 fishing attempts):');
    
    // Simulate durability for different levels
    const simulationLevels = [1, 5, 10, 15, 20];
    
    console.log('\nLevel | Avg Damage | Breaks | Break Rate | Repair Cost | Expected Repairs');
    console.log('------|------------|--------|------------|-------------|------------------');
    
    simulationLevels.forEach(level => {
      const simulation = simulateRodDurability(level, 100);
      
      console.log(
        `${level.toString().padStart(2)} | ` +
        `${simulation.averageDamage.padStart(10)} | ` +
        `${simulation.breakCount.toString().padStart(6)} | ` +
        `${simulation.breakRate.padStart(9)}% | ` +
        `${simulation.totalRepairCost.toLocaleString().padStart(11)} xu | ` +
        `${simulation.expectedRepairs.toString().padStart(16)}`
      );
    });
    
    console.log('\n💡 Durability System Summary:');
    
    console.log('\n  🔹 Standard Rods (Levels 1-10):');
    console.log('     • Low maintenance cost (5% of rod cost)');
    console.log('     • Low break chance (0.15% - 0.6%)');
    console.log('     • Consistent durability loss (1-3 per use)');
    console.log('     • Perfect for regular players');
    console.log('     • Reliable and affordable');
    
    console.log('\n  🔹 Premium Rods (Levels 11-20):');
    console.log('     • High maintenance cost (15% of rod cost)');
    console.log('     • Higher break chance (1.0% - 2.8%)');
    console.log('     • Variable durability loss (3-8 per use)');
    console.log('     • For dedicated players');
    console.log('     • High risk, high reward');
    
    console.log('\n📊 Economic Impact:');
    
    // Calculate long-term costs
    const fishingSessionsPerMonth = 30;
    const monthlySimulation = simulateRodDurability(10, fishingSessionsPerMonth);
    const premiumMonthlySimulation = simulateRodDurability(20, fishingSessionsPerMonth);
    
    console.log('\n  📈 Monthly Maintenance Costs (30 fishing sessions):');
    console.log(`     Level 10 Rod: ~${monthlySimulation.totalRepairCost.toLocaleString()} xu/month`);
    console.log(`     Level 20 Rod: ~${premiumMonthlySimulation.totalRepairCost.toLocaleString()} xu/month`);
    
    const yearlyStandardCost = monthlySimulation.totalRepairCost * 12;
    const yearlyPremiumCost = premiumMonthlySimulation.totalRepairCost * 12;
    
    console.log('\n  📅 Yearly Maintenance Costs:');
    console.log(`     Level 10 Rod: ~${yearlyStandardCost.toLocaleString()} xu/year`);
    console.log(`     Level 20 Rod: ~${yearlyPremiumCost.toLocaleString()} xu/year`);
    
    console.log('\n🎯 Recommended Usage:');
    console.log('\n  🎮 Casual Players: Stick to Levels 1-10');
    console.log('     • Lower maintenance costs');
    console.log('     • More predictable expenses');
    console.log('     • Reliable performance');
    
    console.log('\n  🏆 Dedicated Players: Progress to Levels 11-20');
    console.log('     • Accept higher maintenance costs');
    console.log('     • Enjoy premium fishing benefits');
    console.log('     • Prepare for frequent repairs');
    
    console.log('\n⚖️ Balance Philosophy:');
    console.log('   • Higher rod levels = Better fishing performance');
    console.log('   • Higher rod levels = Higher maintenance costs');
    console.log('   • Choice between reliability vs performance');
    console.log('   • Economic trade-offs create meaningful decisions');
    
  } catch (error) {
    console.error('❌ Durability test failed:', error);
  }
}

// Run durability test
testDurabilitySystem().then(() => {
  console.log('\n🎉 Rod durability system test completed!');
  console.log('🔧 Durability system provides balanced risk/reward mechanics.');
}).catch(error => {
  console.error('❌ Test script failed:', error);
});