// Test logic đơn giản - 70% dealer thắng trực tiếp
// Chạy: node test-simple-70-percent.js

console.log('🎯 SIMPLE 70% HOUSE EDGE - Direct Approach\n');

function simulateSimple70Percent(playerValue, dealerValue, dealerBust = false, iterations = 10000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const DEALER_WIN_RATE = 0.7; // 70% dealer thắng trực tiếp
  
  for (let i = 0; i < iterations; i++) {
    const houseEdgeRoll = Math.random();
    let result;
    
    if (houseEdgeRoll <= DEALER_WIN_RATE) {
      // 70%: Dealer thắng (bất kể điều kiện)
      result = 'dealerWin';
    } else {
      // 30%: Áp dụng luật thực tế
      if (dealerBust || dealerValue > 21) {
        result = 'dealerBust';
      } else if (playerValue > dealerValue) {
        result = 'playerWin';
      } else if (playerValue < dealerValue) {
        result = 'dealerWin';
      } else {
        result = 'push';
      }
    }
    
    if (result === 'dealerWin') dealerWins++;
    else if (result === 'playerWin' || result === 'dealerBust') playerWins++;
    else pushes++;
  }
  
  return {
    dealerWins,
    playerWins,
    pushes,
    dealerWinRate: (dealerWins / iterations * 100).toFixed(1),
    playerWinRate: (playerWins / iterations * 100).toFixed(1),
    pushRate: (pushes / iterations * 100).toFixed(1)
  };
}

// Test nhiều scenarios với sample size lớn
const testScenarios = [
  { name: 'Player 21, Dealer 17', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18', player: 20, dealer: 18 },
  { name: 'Player 19, Dealer 19', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 20', player: 18, dealer: 20 },
  { name: 'Player 17, Dealer 21', player: 17, dealer: 21 },
  { name: 'Player 20, Dealer bust', player: 20, dealer: 22, bust: true },
  { name: 'Player 21, Dealer 15', player: 21, dealer: 15 },
  { name: 'Player 19, Dealer 18', player: 19, dealer: 18 }
];

console.log('🧪 TESTING SIMPLE 70% LOGIC (10,000 games each):\n');

let overallDealerWins = 0;
let overallPlayerWins = 0;
let overallPushes = 0;
let totalTestGames = 0;

testScenarios.forEach((scenario, index) => {
  const result = simulateSimple70Percent(scenario.player, scenario.dealer, scenario.bust, 10000);
  
  console.log(`📋 Test ${index + 1}: ${scenario.name}`);
  console.log(`   🤖 Dealer: ${result.dealerWinRate}%`);
  console.log(`   👤 Player: ${result.playerWinRate}%`);
  console.log(`   🤝 Push: ${result.pushRate}%`);
  
  overallDealerWins += result.dealerWins;
  overallPlayerWins += result.playerWins;
  overallPushes += result.pushes;
  totalTestGames += 10000;
  
  console.log('─'.repeat(50));
});

const finalDealerRate = (overallDealerWins / totalTestGames * 100).toFixed(1);
const finalPlayerRate = (overallPlayerWins / totalTestGames * 100).toFixed(1);
const finalPushRate = (overallPushes / totalTestGames * 100).toFixed(1);

console.log('\n📊 COMBINED RESULTS:');
console.log(`🎮 Total Test Games: ${totalTestGames.toLocaleString()}`);
console.log(`🤖 Overall Dealer Win Rate: ${finalDealerRate}%`);
console.log(`👤 Overall Player Win Rate: ${finalPlayerRate}%`);
console.log(`🤝 Overall Push Rate: ${finalPushRate}%`);

console.log(`\n🎯 TARGET ANALYSIS:`);
console.log(`Expected: 70% dealer wins`);
console.log(`Achieved: ${finalDealerRate}% dealer wins`);
console.log(`Difference: ${(parseFloat(finalDealerRate) - 70).toFixed(1)}%`);

const isSuccess = Math.abs(parseFloat(finalDealerRate) - 70) <= 2; // Within 2% tolerance
console.log(`✅ Success (within 2%): ${isSuccess ? 'YES' : 'NO'}`);

console.log('\n🎰 SIMPLE HOUSE EDGE SYSTEM:');
console.log('• 70% chance: Dealer wins automatically');
console.log('• 30% chance: Apply real blackjack rules');
console.log('• Dealer bust in 30% case: Player wins');
console.log('• Fair comparison in 30% case: Best hand wins');
console.log('• Push only occurs in the 30% fair case');

if (isSuccess) {
  console.log('\n🎊 PERFECT! Achieved target 70% dealer win rate!');
  console.log('🎯 Simple direct approach works best!');
} else {
  console.log('\n⚠️ Still needs minor adjustment to hit exactly 70%.');
}

// Test với các tỷ lệ khác nhau để so sánh
console.log('\n🔬 TESTING DIFFERENT RATES:');
const rates = [0.65, 0.68, 0.70, 0.72, 0.75];
rates.forEach(rate => {
  let wins = 0;
  const tests = 10000;
  for (let i = 0; i < tests; i++) {
    if (Math.random() <= rate) wins++;
  }
  const actualRate = (wins / tests * 100).toFixed(1);
  console.log(`Rate ${(rate * 100).toFixed(0)}%: Achieved ${actualRate}%`);
});
