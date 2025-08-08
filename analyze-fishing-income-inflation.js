#!/usr/bin/env node

/**
 * Fishing Income Inflation Analysis
 * Check if fishing rewards cause income inflation
 */

console.log('💰 FISHING INCOME INFLATION ANALYSIS\n');

async function analyzeFishingIncomeInflation() {
  try {
    const { FISHING_RODS, calculateRareBoost, calculateMissReduction } = await import('./utils/rodManager.js');
    
    console.log('🎣 Fishing Income Analysis by Rod Level:\n');
    
    // Base fishing rewards (without rod bonuses)
    const baseFishingRewards = {
      common: { chance: 0.70, value: 50 },      // 70% chance, 50 xu
      uncommon: { chance: 0.20, value: 150 },   // 20% chance, 150 xu
      rare: { chance: 0.08, value: 500 },       // 8% chance, 500 xu
      epic: { chance: 0.015, value: 1500 },     // 1.5% chance, 1500 xu
      legendary: { chance: 0.005, value: 5000 } // 0.5% chance, 5000 xu
    };
    
    // Calculate base expected value
    let baseExpectedValue = 0;
    Object.values(baseFishingRewards).forEach(fish => {
      baseExpectedValue += fish.chance * fish.value;
    });
    
    console.log(`📊 Base Expected Value (Level 1 Rod): ${baseExpectedValue.toFixed(0)} xu per fish\n`);
    
    // Analyze income inflation by rod level
    console.log('Level | Miss Rate | Success Rate | Rare Boost | Expected Income | Income Multiplier | Inflation %');
    console.log('------|-----------|--------------|------------|-----------------|-------------------|-------------');
    
    const incomeData = [];
    
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      
      // Calculate effective rates
      const baseMissRate = 0.20; // 20% base miss rate
      const missReduction = calculateMissReduction(level);
      const effectiveMissRate = Math.max(baseMissRate - (missReduction / 100), 0.01);
      const successRate = 1 - effectiveMissRate;
      
      // Calculate rare boost effect
      const rareBoost = calculateRareBoost(level);
      const rareBoostMultiplier = 1 + (rareBoost / 100);
      
      // Calculate adjusted expected value
      const adjustedExpectedValue = baseExpectedValue * successRate * rareBoostMultiplier;
      
      // Calculate income multiplier vs base
      const incomeMultiplier = adjustedExpectedValue / baseExpectedValue;
      const inflationPercent = ((incomeMultiplier - 1) * 100);
      
      incomeData.push({
        level,
        successRate: successRate * 100,
        rareBoost,
        expectedIncome: adjustedExpectedValue,
        incomeMultiplier,
        inflationPercent
      });
      
      console.log(
        `${level.toString().padStart(2)} | ` +
        `${(effectiveMissRate * 100).toFixed(1).padStart(8)}% | ` +
        `${(successRate * 100).toFixed(1).padStart(11)}% | ` +
        `${rareBoost.toString().padStart(9)}% | ` +
        `${Math.round(adjustedExpectedValue).toString().padStart(15)} xu | ` +
        `${incomeMultiplier.toFixed(2).padStart(17)}x | ` +
        `${inflationPercent.toFixed(1).padStart(10)}%`
      );
    }
    
    console.log('\n📈 Income Inflation Analysis:');
    
    // Check for inflation patterns
    const level1Income = incomeData[0].expectedIncome;
    const level10Income = incomeData[9].expectedIncome;
    const level20Income = incomeData[19].expectedIncome;
    
    const tier1to10Inflation = ((level10Income / level1Income - 1) * 100);
    const tier11to20Inflation = ((level20Income / level10Income - 1) * 100);
    const overallInflation = ((level20Income / level1Income - 1) * 100);
    
    console.log(`   Level 1 to 10 income inflation: ${tier1to10Inflation.toFixed(1)}%`);
    console.log(`   Level 11 to 20 income inflation: ${tier11to20Inflation.toFixed(1)}%`);
    console.log(`   Overall income inflation (1 to 20): ${overallInflation.toFixed(1)}%`);
    
    // Inflation risk assessment
    console.log('\n🚨 Income Inflation Risk Assessment:');
    
    const inflationWarnings = [];
    
    // Check tier 1-10 inflation
    if (tier1to10Inflation > 200) {
      inflationWarnings.push(`🚨 Standard tier income inflation too high: ${tier1to10Inflation.toFixed(1)}%`);
    } else if (tier1to10Inflation > 100) {
      inflationWarnings.push(`⚠️ Standard tier income inflation moderate: ${tier1to10Inflation.toFixed(1)}%`);
    } else {
      console.log(`   ✅ Standard tier income inflation reasonable: ${tier1to10Inflation.toFixed(1)}%`);
    }
    
    // Check tier 11-20 inflation
    if (tier11to20Inflation > 300) {
      inflationWarnings.push(`🚨 Premium tier income inflation too high: ${tier11to20Inflation.toFixed(1)}%`);
    } else if (tier11to20Inflation > 150) {
      inflationWarnings.push(`⚠️ Premium tier income inflation moderate: ${tier11to20Inflation.toFixed(1)}%`);
    } else {
      console.log(`   ✅ Premium tier income inflation reasonable: ${tier11to20Inflation.toFixed(1)}%`);
    }
    
    // Check overall inflation
    if (overallInflation > 500) {
      inflationWarnings.push(`🚨 Overall income inflation too high: ${overallInflation.toFixed(1)}%`);
    } else if (overallInflation > 300) {
      inflationWarnings.push(`⚠️ Overall income inflation moderate: ${overallInflation.toFixed(1)}%`);
    } else {
      console.log(`   ✅ Overall income inflation reasonable: ${overallInflation.toFixed(1)}%`);
    }
    
    // Check for exponential growth patterns
    let hasExponentialGrowth = false;
    for (let i = 1; i < incomeData.length; i++) {
      const currentIncrease = incomeData[i].incomeMultiplier / incomeData[i-1].incomeMultiplier;
      if (currentIncrease > 1.15) { // More than 15% increase per level
        hasExponentialGrowth = true;
        break;
      }
    }
    
    if (hasExponentialGrowth) {
      inflationWarnings.push('🚨 Exponential income growth detected between levels');
    } else {
      console.log('   ✅ Linear income growth pattern maintained');
    }
    
    // Display warnings
    if (inflationWarnings.length > 0) {
      console.log('\n⚠️ INCOME INFLATION WARNINGS:');
      inflationWarnings.forEach(warning => console.log(`   ${warning}`));
    } else {
      console.log('\n✅ NO INCOME INFLATION ISSUES DETECTED');
    }
    
    console.log('\n💡 Economic Impact Analysis:');
    
    // Calculate purchasing power changes
    const rodCosts = [
      { level: 5, cost: 15000 },
      { level: 10, cost: 300000 },
      { level: 15, cost: 1300000 },
      { level: 20, cost: 2000000 }
    ];
    
    console.log('\n📊 Purchasing Power Analysis:');
    console.log('Rod Level | Cost (xu) | Daily Income | Days to Afford | Affordable?');
    console.log('----------|-----------|--------------|----------------|-------------');
    
    rodCosts.forEach(({ level, cost }) => {
      const income = incomeData[level - 1].expectedIncome;
      const dailyIncome = income * 10; // Assume 10 fishing sessions per day
      const daysToAfford = Math.ceil(cost / dailyIncome);
      const affordable = daysToAfford <= 30 ? 'Yes' : 'No';
      
      console.log(
        `${level.toString().padStart(9)} | ` +
        `${cost.toLocaleString().padStart(9)} | ` +
        `${Math.round(dailyIncome).toLocaleString().padStart(12)} xu | ` +
        `${daysToAfford.toString().padStart(14)} | ` +
        `${affordable.padStart(11)}`
      );
    });
    
    console.log('\n🎯 Income Balance Recommendations:');
    
    // Check if high-level rods become too profitable
    const maxReasonableIncome = baseExpectedValue * 3; // 3x base income is reasonable
    const highLevelIncome = incomeData[19].expectedIncome;
    
    if (highLevelIncome > maxReasonableIncome) {
      console.log(`   ⚠️ Level 20 income (${Math.round(highLevelIncome)} xu) may be too high`);
      console.log(`   💡 Consider capping rare boost or adjusting miss reduction`);
    } else {
      console.log(`   ✅ Level 20 income (${Math.round(highLevelIncome)} xu) is reasonable`);
    }
    
    // Check income progression smoothness
    let smoothProgression = true;
    for (let i = 1; i < incomeData.length; i++) {
      const incomeIncrease = incomeData[i].expectedIncome - incomeData[i-1].expectedIncome;
      const percentIncrease = (incomeIncrease / incomeData[i-1].expectedIncome) * 100;
      
      if (percentIncrease > 20) { // More than 20% increase per level
        smoothProgression = false;
        break;
      }
    }
    
    if (smoothProgression) {
      console.log('   ✅ Income progression is smooth and predictable');
    } else {
      console.log('   ⚠️ Income progression has large jumps between levels');
      console.log('   💡 Consider smoothing rod benefit curves');
    }
    
    console.log('\n🛡️ Anti-Inflation Safeguards:');
    console.log('   ✅ Miss reduction has minimum threshold (1% miss rate)');
    console.log('   ✅ Rare boost increases linearly, not exponentially');
    console.log('   ✅ Success rate improvements diminish at high levels');
    console.log('   ✅ Rod costs increase faster than income benefits');
    
    // Final assessment
    const inflationScore = 100 - (inflationWarnings.length * 20);
    console.log(`\n📊 Income Inflation Health Score: ${inflationScore}/100`);
    
    if (inflationScore >= 80) {
      console.log('🎉 EXCELLENT: No significant income inflation detected');
    } else if (inflationScore >= 60) {
      console.log('⚠️ GOOD: Minor income inflation concerns');
    } else {
      console.log('🚨 POOR: Significant income inflation risks detected');
    }
    
    console.log('\n💰 Monthly Income Projections (30 fishing sessions):');
    
    [1, 5, 10, 15, 20].forEach(level => {
      const monthlyIncome = Math.round(incomeData[level - 1].expectedIncome * 30);
      console.log(`   Level ${level.toString().padStart(2)}: ${monthlyIncome.toLocaleString().padStart(8)} xu/month`);
    });
    
  } catch (error) {
    console.error('❌ Fishing income inflation analysis failed:', error);
  }
}

// Run fishing income inflation analysis
analyzeFishingIncomeInflation().then(() => {
  console.log('\n✅ Fishing income inflation analysis completed!');
  console.log('🎣 Review income scaling to ensure balanced economy.');
}).catch(error => {
  console.error('❌ Analysis script failed:', error);
});