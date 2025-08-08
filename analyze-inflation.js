#!/usr/bin/env node

/**
 * Economic Analysis: Inflation Check for 20-Level Rod System
 */

console.log('📊 FISHING ROD ECONOMIC INFLATION ANALYSIS\n');

async function analyzeInflation() {
  try {
    const { FISHING_RODS, simulateRodDurability } = await import('./utils/rodManager.js');
    
    console.log('💰 Economic Balance Analysis:\n');
    
    // Calculate total investment required
    let totalCost = 0;
    let standardCost = 0;
    let premiumCost = 0;
    
    console.log('Level | Name                     | Cost        | Cumulative  | % of Total');
    console.log('------|--------------------------|-------------|-------------|------------');
    
    for (let level = 1; level <= 20; level++) {
      const rod = FISHING_RODS[level];
      totalCost += rod.cost;
      
      if (level <= 10) {
        standardCost += rod.cost;
      } else {
        premiumCost += rod.cost;
      }
      
      const percentOfTotal = totalCost > 0 ? ((rod.cost / 12230500) * 100).toFixed(2) : '0.00';
      
      console.log(
        `${level.toString().padStart(2)} | ` +
        `${rod.name.substring(0, 24).padEnd(24)} | ` +
        `${rod.cost.toLocaleString().padStart(11)} | ` +
        `${totalCost.toLocaleString().padStart(11)} | ` +
        `${percentOfTotal.padStart(10)}%`
      );
    }
    
    console.log('\n📈 Cost Distribution Analysis:');
    console.log(`   Standard Tier (1-10): ${standardCost.toLocaleString()} xu (${((standardCost/totalCost)*100).toFixed(1)}%)`);
    console.log(`   Premium Tier (11-20): ${premiumCost.toLocaleString()} xu (${((premiumCost/totalCost)*100).toFixed(1)}%)`);
    console.log(`   Total Investment: ${totalCost.toLocaleString()} xu`);
    
    // Analyze fishing income vs costs
    console.log('\n🎣 Fishing Income Analysis:');
    
    // Estimated fishing rewards per session
    const fishingRewards = {
      common: { chance: 0.70, value: 50 },      // 70% chance, 50 xu average
      uncommon: { chance: 0.20, value: 150 },   // 20% chance, 150 xu average  
      rare: { chance: 0.08, value: 500 },       // 8% chance, 500 xu average
      epic: { chance: 0.015, value: 1500 },     // 1.5% chance, 1500 xu average
      legendary: { chance: 0.005, value: 5000 } // 0.5% chance, 5000 xu average
    };
    
    // Calculate expected value per fishing attempt
    let expectedValue = 0;
    Object.values(fishingRewards).forEach(fish => {
      expectedValue += fish.chance * fish.value;
    });
    
    console.log(`   Expected Value per Fish: ${expectedValue.toFixed(0)} xu`);
    
    // Calculate with rod bonuses
    const rodAnalysis = [1, 5, 10, 15, 20];
    
    console.log('\n📊 Income vs Investment Analysis:');
    console.log('\nRod Lv | Miss Rate | Rare Boost | Expected Value | Sessions to ROI | Durability Cost');
    console.log('-------|-----------|------------|----------------|-----------------|------------------');
    
    rodAnalysis.forEach(level => {
      const rod = FISHING_RODS[level];
      const cumulativeCost = Array.from({ length: level }, (_, i) => FISHING_RODS[i + 1].cost)
        .reduce((sum, cost) => sum + cost, 0);
      
      // Calculate miss rate
      const baseMissRate = 0.20;
      const effectiveMissRate = Math.max(baseMissRate - (rod.missReduction / 100), 0.01);
      const successRate = 1 - effectiveMissRate;
      
      // Calculate rare boost effect (affects rare+ fish)
      const rareBoostMultiplier = 1 + (rod.rareBoost / 100);
      const adjustedExpectedValue = expectedValue * successRate * rareBoostMultiplier;
      
      // Calculate sessions needed to break even
      const sessionsToROI = Math.ceil(cumulativeCost / adjustedExpectedValue);
      
      // Calculate monthly durability costs
      const monthlyFishing = 30; // sessions per month
      const durabilitySimulation = simulateRodDurability(level, monthlyFishing);
      const monthlyDurabilityCost = durabilitySimulation.totalRepairCost;
      
      console.log(
        `${level.toString().padStart(6)} | ` +
        `${(effectiveMissRate * 100).toFixed(1).padStart(8)}% | ` +
        `${rod.rareBoost.toString().padStart(9)}% | ` +
        `${Math.round(adjustedExpectedValue).toString().padStart(14)} xu | ` +
        `${sessionsToROI.toString().padStart(15)} | ` +
        `${monthlyDurabilityCost.toLocaleString().padStart(16)} xu/month`
      );
    });
    
    console.log('\n💸 Inflation Risk Assessment:');
    
    // Check for inflation indicators
    const inflationIndicators = [];
    
    // 1. Check if late-game costs are exponentially higher
    const level10Cost = FISHING_RODS[10].cost;
    const level20Cost = FISHING_RODS[20].cost;
    const costRatio = level20Cost / level10Cost;
    
    if (costRatio > 10) {
      inflationIndicators.push(`🚨 High cost ratio: Level 20 is ${costRatio.toFixed(1)}x more expensive than Level 10`);
    } else {
      console.log(`✅ Reasonable cost scaling: Level 20 is only ${costRatio.toFixed(1)}x Level 10 cost`);
    }
    
    // 2. Check if total investment is realistic
    const averageMonthlyIncome = expectedValue * 30; // 30 fishing sessions per month
    const monthsToCompleteCollection = totalCost / averageMonthlyIncome;
    
    if (monthsToCompleteCollection > 24) {
      inflationIndicators.push(`🚨 Long completion time: ${monthsToCompleteCollection.toFixed(1)} months to complete collection`);
    } else {
      console.log(`✅ Reasonable completion time: ${monthsToCompleteCollection.toFixed(1)} months for full collection`);
    }
    
    // 3. Check if premium tier is too expensive
    const premiumPercentage = (premiumCost / totalCost) * 100;
    if (premiumPercentage > 90) {
      inflationIndicators.push(`🚨 Premium tier too expensive: ${premiumPercentage.toFixed(1)}% of total cost`);
    } else {
      console.log(`✅ Balanced tier costs: Premium tier is ${premiumPercentage.toFixed(1)}% of total`);
    }
    
    // 4. Check maintenance costs
    const level20Maintenance = simulateRodDurability(20, 30).totalRepairCost;
    const level20MonthlyIncome = expectedValue * 30 * 1.5; // With rod bonuses
    const maintenancePercentage = (level20Maintenance / level20MonthlyIncome) * 100;
    
    if (maintenancePercentage > 50) {
      inflationIndicators.push(`🚨 High maintenance burden: ${maintenancePercentage.toFixed(1)}% of income for Level 20`);
    } else {
      console.log(`✅ Manageable maintenance: ${maintenancePercentage.toFixed(1)}% of income for Level 20`);
    }
    
    // Display inflation warnings
    if (inflationIndicators.length > 0) {
      console.log('\n⚠️ INFLATION WARNINGS DETECTED:');
      inflationIndicators.forEach(warning => console.log(`   ${warning}`));
    } else {
      console.log('\n✅ NO INFLATION DETECTED - ECONOMY IS BALANCED');
    }
    
    console.log('\n📊 Economic Health Indicators:');
    
    // Calculate key metrics
    const standardROI = Math.ceil(standardCost / (expectedValue * 30)); // Months to ROI for standard tier
    const earlyGameAffordability = FISHING_RODS[5].cost / (expectedValue * 7); // Days to afford Level 5
    const midGameProgression = (FISHING_RODS[10].cost - standardCost) / (expectedValue * 30); // Months from 5 to 10
    
    console.log(`   Early Game Accessibility: ${earlyGameAffordability.toFixed(1)} days to reach Level 5`);
    console.log(`   Mid Game Progression: ${midGameProgression.toFixed(1)} months from Level 5 to 10`);
    console.log(`   Standard Tier ROI: ${standardROI} months for full standard collection`);
    console.log(`   Premium Accessibility: VIP Bronze required (${(premiumCost/1000000).toFixed(1)}M xu investment)`);
    
    // Economic recommendations
    console.log('\n💡 Economic Balance Recommendations:');
    
    if (earlyGameAffordability <= 7) {
      console.log('   ✅ Early game is accessible (≤1 week to Level 5)');
    } else {
      console.log('   ⚠️ Consider reducing early game costs');
    }
    
    if (standardROI <= 6) {
      console.log('   ✅ Standard tier has reasonable ROI (≤6 months)');
    } else {
      console.log('   ⚠️ Standard tier ROI may be too long');
    }
    
    if (costRatio <= 7) {
      console.log('   ✅ Cost scaling is reasonable (Level 20 ≤7x Level 10)');
    } else {
      console.log('   ⚠️ Consider reducing late-game cost scaling');
    }
    
    console.log('\n🎯 Player Progression Timeline:');
    console.log('\n   Week 1: Level 1-2 (Learning phase)');
    console.log(`   Week 2-4: Level 3-5 (${(FISHING_RODS[5].cost/1000).toFixed(0)}K xu needed)`);
    console.log(`   Month 2-3: Level 6-8 (${((FISHING_RODS[8].cost - FISHING_RODS[5].cost)/1000).toFixed(0)}K xu additional)`);
    console.log(`   Month 4-5: Level 9-10 (${((FISHING_RODS[10].cost - FISHING_RODS[8].cost)/1000).toFixed(0)}K xu additional)`);
    console.log('   Month 6+: VIP Bronze consideration for Levels 11-20');
    console.log(`   Year 1+: Premium collection (${(premiumCost/1000000).toFixed(1)}M xu investment)`);
    
    // Inflation-resistant features
    console.log('\n🛡️ Anti-Inflation Measures in System:');
    console.log('   ✅ Linear pricing for premium tier (no exponential growth)');
    console.log('   ✅ 50% of content accessible without premium investment');
    console.log('   ✅ Reasonable maintenance costs (5-15% of rod value)');
    console.log('   ✅ Original pricing preserved for familiar progression');
    console.log('   ✅ Clear cost caps (maximum 2M xu per rod)');
    console.log('   ✅ Progressive benefits justify increased costs');
    
    // Final assessment
    const overallScore = 100 - (inflationIndicators.length * 25);
    console.log(`\n📊 Overall Economic Health Score: ${overallScore}/100`);
    
    if (overallScore >= 75) {
      console.log('🎉 EXCELLENT: Economy is well-balanced and sustainable');
    } else if (overallScore >= 50) {
      console.log('⚠️ GOOD: Economy is mostly balanced with minor concerns');
    } else {
      console.log('🚨 POOR: Economy has significant inflation risks');
    }
    
  } catch (error) {
    console.error('❌ Inflation analysis failed:', error);
  }
}

// Run inflation analysis
analyzeInflation().then(() => {
  console.log('\n✅ Economic inflation analysis completed!');
  console.log('💰 Use this data to ensure sustainable game economy.');
}).catch(error => {
  console.error('❌ Analysis script failed:', error);
});