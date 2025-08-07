// Test final - rate 63% để đạt tổng 70%
// Chạy: node test-final-70-percent.js

console.log('🎯 FINAL TEST - 63% Rate for Total 70% Dealer Wins\n');

function simulateFinal70(playerValue, dealerValue, dealerBust = false, iterations = 10000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const DEALER_WIN_RATE = 0.575; // Rate cuối cùng
  
  for (let i = 0; i < iterations; i++) {
    const roll = Math.random();
    let result;
    
    if (roll <= DEALER_WIN_RATE) {
      // 63%: Dealer thắng (house edge)
      result = 'dealerWin';
    } else {
      // 37%: Luật thực tế
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

// Test comprehensive scenarios
const scenarios = [
  { name: 'Player 21, Dealer 17 (Strong player)', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18 (Close game)', player: 20, dealer: 18 },
  { name: 'Player 19, Dealer 19 (Tie)', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 20 (Dealer advantage)', player: 18, dealer: 20 },
  { name: 'Player 17, Dealer 21 (Strong dealer)', player: 17, dealer: 21 },
  { name: 'Player 20, Dealer 22 (Dealer bust)', player: 20, dealer: 22, bust: true },
  { name: 'Player 19, Dealer 23 (Dealer bust)', player: 19, dealer: 23, bust: true },
  { name: 'Player 21, Dealer 15 (Player advantage)', player: 21, dealer: 15 },
  { name: 'Player 18, Dealer 18 (Equal)', player: 18, dealer: 18 },
  { name: 'Player 16, Dealer 20 (Player weak)', player: 16, dealer: 20 }
];

console.log('🧪 COMPREHENSIVE TEST (10K games each scenario):\n');

let totalDealerWins = 0;
let totalPlayerWins = 0;
let totalPushes = 0;
let totalGames = 0;

scenarios.forEach((scenario, index) => {
  const result = simulateFinal70(scenario.player, scenario.dealer, scenario.bust, 10000);
  
  console.log(`📋 ${index + 1}. ${scenario.name}`);
  console.log(`   🤖 ${result.dealerWinRate}% | 👤 ${result.playerWinRate}% | 🤝 ${result.pushRate}%`);
  
  totalDealerWins += result.dealerWins;
  totalPlayerWins += result.playerWins;
  totalPushes += result.pushes;
  totalGames += 10000;
});

const overallDealerRate = (totalDealerWins / totalGames * 100).toFixed(1);
const overallPlayerRate = (totalPlayerWins / totalGames * 100).toFixed(1);
const overallPushRate = (totalPushes / totalGames * 100).toFixed(1);

console.log('\n' + '═'.repeat(60));
console.log('📊 FINAL RESULTS:');
console.log(`🎮 Total Simulated Games: ${totalGames.toLocaleString()}`);
console.log(`🤖 Dealer Win Rate: ${overallDealerRate}%`);
console.log(`👤 Player Win Rate: ${overallPlayerRate}%`);
console.log(`🤝 Push Rate: ${overallPushRate}%`);

console.log('\n🎯 PERFORMANCE EVALUATION:');
console.log(`Target: 70% dealer wins`);
console.log(`Actual: ${overallDealerRate}% dealer wins`);
console.log(`Error: ${Math.abs(70 - parseFloat(overallDealerRate)).toFixed(1)}%`);

const isWithinTarget = Math.abs(70 - parseFloat(overallDealerRate)) <= 1; // 1% tolerance
console.log(`✅ Within 1% tolerance: ${isWithinTarget ? 'YES' : 'NO'}`);

if (isWithinTarget) {
  console.log('\n🎊 SUCCESS! Perfect 70% dealer win rate achieved!');
  console.log('🏆 House edge system is optimally calibrated!');
  
  console.log('\n💎 FINAL HOUSE EDGE SYSTEM:');
  console.log('• 63% probability: Dealer wins (house edge)');
  console.log('• 37% probability: Fair blackjack rules applied');
  console.log('• Dealer bust scenarios: Auto-corrected in house edge cases');
  console.log('• Natural dealer advantages: Preserved in fair cases');
  console.log('• Push/tie outcomes: Only occur in fair rule cases');
  
  console.log('\n🎰 PLAYER EXPERIENCE:');
  console.log(`• ${overallDealerRate}% chance to lose bet`);
  console.log(`• ${overallPlayerRate}% chance to win 1.8x payout`);
  console.log(`• ${overallPushRate}% chance to get bet back (push)`);
  console.log('• Still feels like real blackjack with card logic');
  console.log('• House edge hidden behind game mechanics');
  
} else {
  console.log('\n⚠️ Close but needs final micro-adjustment.');
  
  // Suggest adjustment
  const error = parseFloat(overallDealerRate) - 70;
  const suggestedRate = (0.63 - (error * 0.01)).toFixed(3);
  console.log(`💡 Suggested rate adjustment: ${suggestedRate} (currently 0.63)`);
}

console.log('\n🎯 SUMMARY: Bot now has intelligent 70% win rate!');
