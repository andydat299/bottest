#!/usr/bin/env node

/**
 * Quick Inflation Check Summary
 */

console.log('🚨 QUICK INFLATION ASSESSMENT\n');

async function quickInflationCheck() {
  try {
    const { FISHING_RODS } = await import('./utils/rodManager.js');
    
    // Calculate key metrics
    let totalCost = 0;
    let standardCost = 0;
    let premiumCost = 0;
    
    for (let level = 1; level <= 20; level++) {
      const cost = FISHING_RODS[level].cost;
      totalCost += cost;
      
      if (level <= 10) {
        standardCost += cost;
      } else {
        premiumCost += cost;
      }
    }
    
    console.log('💰 COST BREAKDOWN:');
    console.log(`   Standard Tier (1-10): ${standardCost.toLocaleString()} xu`);
    console.log(`   Premium Tier (11-20): ${premiumCost.toLocaleString()} xu`);
    console.log(`   Total Investment: ${totalCost.toLocaleString()} xu`);
    
    // Inflation indicators
    console.log('\n🔍 INFLATION INDICATORS:');
    
    // 1. Cost scaling
    const level10Cost = FISHING_RODS[10].cost;
    const level20Cost = FISHING_RODS[20].cost;
    const costRatio = level20Cost / level10Cost;
    console.log(`   Level 20 vs Level 10: ${costRatio.toFixed(1)}x increase ${costRatio > 10 ? '🚨' : '✅'}`);
    
    // 2. Premium tier percentage
    const premiumPercentage = (premiumCost / totalCost) * 100;
    console.log(`   Premium tier cost: ${premiumPercentage.toFixed(1)}% of total ${premiumPercentage > 90 ? '🚨' : '✅'}`);
    
    // 3. Early game accessibility
    const level5Cost = Array.from({ length: 5 }, (_, i) => FISHING_RODS[i + 1].cost).reduce((a, b) => a + b, 0);
    console.log(`   Level 5 total cost: ${level5Cost.toLocaleString()} xu ${level5Cost > 50000 ? '🚨' : '✅'}`);
    
    // 4. Linear vs exponential growth
    const costs = [];
    for (let i = 11; i <= 20; i++) {
      costs.push(FISHING_RODS[i].cost);
    }
    
    let isLinear = true;
    for (let i = 1; i < costs.length - 1; i++) {
      const diff1 = costs[i] - costs[i-1];
      const diff2 = costs[i+1] - costs[i];
      if (Math.abs(diff2 - diff1) > costs[i] * 0.5) { // Allow 50% variance
        isLinear = false;
        break;
      }
    }
    
    console.log(`   Premium pricing: ${isLinear ? 'Linear' : 'Exponential'} ${isLinear ? '✅' : '🚨'}`);
    
    // Quick assessment
    const warnings = [];
    if (costRatio > 10) warnings.push('High cost scaling');
    if (premiumPercentage > 90) warnings.push('Premium too expensive');
    if (level5Cost > 50000) warnings.push('Early game too expensive');
    if (!isLinear) warnings.push('Exponential growth detected');
    
    console.log('\n📊 QUICK ASSESSMENT:');
    if (warnings.length === 0) {
      console.log('   ✅ NO INFLATION DETECTED - Economy looks balanced');
    } else {
      console.log(`   🚨 ${warnings.length} inflation warning(s):`);
      warnings.forEach(w => console.log(`      • ${w}`));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   • Run full analysis: node analyze-inflation.js');
    console.log('   • Monitor player progression rates');
    console.log('   • Adjust costs based on player feedback');
    
  } catch (error) {
    console.error('❌ Quick check failed:', error);
  }
}

quickInflationCheck();