#!/usr/bin/env node

/**
 * Quick Income Inflation Check
 */

console.log('💰 QUICK FISHING INCOME INFLATION CHECK\n');

async function quickIncomeCheck() {
  try {
    const { FISHING_RODS } = await import('./utils/rodManager.js');
    
    // Base fishing rewards
    const baseRewards = [50, 150, 500, 1500, 5000]; // Common to Legendary
    const baseChances = [0.70, 0.20, 0.08, 0.015, 0.005];
    
    let baseExpectedValue = 0;
    for (let i = 0; i < baseRewards.length; i++) {
      baseExpectedValue += baseRewards[i] * baseChances[i];
    }
    
    console.log(`📊 Base Expected Income: ${baseExpectedValue.toFixed(0)} xu per fish\n`);
    
    // Calculate income for key levels
    const keyLevels = [1, 5, 10, 15, 20];
    const incomes = [];
    
    console.log('Level | Miss Reduction | Rare Boost | Expected Income | Income Multiplier');
    console.log('------|----------------|------------|-----------------|------------------');
    
    keyLevels.forEach(level => {
      const rod = FISHING_RODS[level];
      
      // Calculate effective rates
      const baseMissRate = 0.20;
      const effectiveMissRate = Math.max(baseMissRate - (rod.missReduction / 100), 0.01);
      const successRate = 1 - effectiveMissRate;
      
      // Calculate with bonuses
      const rareBoostMultiplier = 1 + (rod.rareBoost / 100);
      const adjustedIncome = baseExpectedValue * successRate * rareBoostMultiplier;
      const incomeMultiplier = adjustedIncome / baseExpectedValue;
      
      incomes.push({ level, income: adjustedIncome, multiplier: incomeMultiplier });
      
      console.log(
        `${level.toString().padStart(5)} | ` +
        `${rod.missReduction.toString().padStart(13)}% | ` +
        `${rod.rareBoost.toString().padStart(9)}% | ` +
        `${Math.round(adjustedIncome).toString().padStart(15)} xu | ` +
        `${incomeMultiplier.toFixed(2).padStart(17)}x`
      );
    });
    
    // Check inflation indicators
    console.log('\n🔍 INCOME INFLATION INDICATORS:');
    
    const level1Income = incomes[0].income;
    const level10Income = incomes[2].income;
    const level20Income = incomes[4].income;
    
    const standardInflation = ((level10Income / level1Income - 1) * 100);
    const premiumInflation = ((level20Income / level10Income - 1) * 100);
    const overallInflation = ((level20Income / level1Income - 1) * 100);
    
    console.log(`   Standard tier (1-10) inflation: ${standardInflation.toFixed(1)}% ${standardInflation > 200 ? '🚨' : standardInflation > 100 ? '⚠️' : '✅'}`);
    console.log(`   Premium tier (11-20) inflation: ${premiumInflation.toFixed(1)}% ${premiumInflation > 300 ? '🚨' : premiumInflation > 150 ? '⚠️' : '✅'}`);
    console.log(`   Overall inflation (1-20): ${overallInflation.toFixed(1)}% ${overallInflation > 500 ? '🚨' : overallInflation > 300 ? '⚠️' : '✅'}`);
    
    // Quick assessment
    const warnings = [];
    if (standardInflation > 200) warnings.push('Standard tier income too high');
    if (premiumInflation > 300) warnings.push('Premium tier income too high');
    if (overallInflation > 500) warnings.push('Overall income inflation excessive');
    
    console.log('\n📊 QUICK ASSESSMENT:');
    if (warnings.length === 0) {
      console.log('   ✅ NO INCOME INFLATION ISSUES - Rewards are balanced');
    } else {
      console.log(`   🚨 ${warnings.length} income inflation warning(s):`);
      warnings.forEach(w => console.log(`      • ${w}`));
    }
    
    console.log('\n💡 INCOME SCALING ANALYSIS:');
    console.log(`   Level 1-10: Income increases ${standardInflation.toFixed(0)}% (${(standardInflation/9).toFixed(1)}% per level)`);
    console.log(`   Level 11-20: Income increases ${premiumInflation.toFixed(0)}% (${(premiumInflation/10).toFixed(1)}% per level)`);
    
    console.log('\n🎯 DAILY INCOME PROJECTIONS (10 fish/day):');
    incomes.forEach(({ level, income }) => {
      const dailyIncome = Math.round(income * 10);
      console.log(`   Level ${level.toString().padStart(2)}: ${dailyIncome.toLocaleString().padStart(6)} xu/day`);
    });
    
    console.log('\n💰 RECOMMENDATIONS:');
    if (warnings.length === 0) {
      console.log('   • Current income scaling is balanced');
      console.log('   • No immediate adjustments needed');
    } else {
      console.log('   • Consider reducing rare boost scaling');
      console.log('   • Review miss reduction benefits');
      console.log('   • Run full analysis: node analyze-fishing-income-inflation.js');
    }
    
  } catch (error) {
    console.error('❌ Quick income check failed:', error);
  }
}

quickIncomeCheck();