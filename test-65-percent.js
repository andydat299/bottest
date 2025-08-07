// Test 65% dealer win rate
// Chạy: node test-65-percent.js

console.log('🎯 TESTING 65% DEALER WIN RATE\n');

function simulate65Percent(playerValue, dealerValue, dealerBust = false, iterations = 10000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const DEALER_WIN_RATE = 0.52; // Điều chỉnh để đạt ~65%
  
  for (let i = 0; i < iterations; i++) {
    const roll = Math.random();
    let result;
    
    if (roll <= DEALER_WIN_RATE) {
      // 52%: Dealer thắng (house edge)
      result = 'dealerWin';
    } else {
      // 48%: Luật thực tế
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

// Test scenarios for 65% target
const scenarios = [
  { name: 'Player 21, Dealer 17', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18', player: 20, dealer: 18 },
  { name: 'Player 19, Dealer 19', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 20', player: 18, dealer: 20 },
  { name: 'Player 17, Dealer 21', player: 17, dealer: 21 },
  { name: 'Player 20, Dealer bust', player: 20, dealer: 22, bust: true },
  { name: 'Player 21, Dealer 15', player: 21, dealer: 15 },
  { name: 'Player 19, Dealer 18', player: 19, dealer: 18 }
];

console.log('🧪 TESTING 65% TARGET (10K games each):\n');

let totalDealerWins = 0;
let totalPlayerWins = 0;
let totalPushes = 0;
let totalGames = 0;

scenarios.forEach((scenario, index) => {
  const result = simulate65Percent(scenario.player, scenario.dealer, scenario.bust, 10000);
  
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
console.log('📊 RESULTS FOR 65% TARGET:');
console.log(`🎮 Total Games: ${totalGames.toLocaleString()}`);
console.log(`🤖 Dealer Win Rate: ${overallDealerRate}%`);
console.log(`👤 Player Win Rate: ${overallPlayerRate}%`);
console.log(`🤝 Push Rate: ${overallPushRate}%`);

console.log('\n🎯 PERFORMANCE CHECK:');
console.log(`Target: 65% dealer wins`);
console.log(`Actual: ${overallDealerRate}% dealer wins`);
console.log(`Error: ${Math.abs(65 - parseFloat(overallDealerRate)).toFixed(1)}%`);

const isSuccess = Math.abs(65 - parseFloat(overallDealerRate)) <= 1;
console.log(`✅ Within 1% tolerance: ${isSuccess ? 'YES' : 'NO'}`);

if (isSuccess) {
  console.log('\n🎊 SUCCESS! 65% dealer win rate achieved!');
  console.log('🏆 More balanced house edge system!');
  
  console.log('\n💎 65% HOUSE EDGE SYSTEM:');
  console.log('• 52% probability: Dealer wins (reduced house edge)');
  console.log('• 48% probability: Fair blackjack rules applied');
  console.log('• Better chances for players while maintaining edge');
  
  console.log('\n🎰 IMPROVED PLAYER EXPERIENCE:');
  console.log(`• ${overallDealerRate}% chance to lose bet (reduced from 70%)`);
  console.log(`• ${overallPlayerRate}% chance to win 1.8x payout (increased)`);
  console.log(`• ${overallPushRate}% chance to get bet back (push)`);
  console.log('• More fair gameplay while keeping house advantage');
  
} else {
  console.log('\n⚠️ Needs adjustment to hit 65% target.');
  
  const error = parseFloat(overallDealerRate) - 65;
  const suggestedRate = (0.52 - (error * 0.01)).toFixed(3);
  console.log(`💡 Suggested rate: ${suggestedRate} (currently 0.52)`);
}

console.log('\n🎮 COMPARISON WITH 70% SYSTEM:');
console.log('📉 Dealer win rate: 70% → 65% (-5%)');
console.log('📈 Player win rate: ~21% → ~' + overallPlayerRate + '% (+' + (parseFloat(overallPlayerRate) - 21).toFixed(1) + '%)');
console.log('🎯 More balanced and fair for players!');

console.log('\n💰 WITH 1000 XU BET:');
console.log(`• ${overallDealerRate}% lose: -1,000 xu`);
console.log(`• ${overallPlayerRate}% win: +1,800 xu (profit +800 xu)`);
console.log(`• ${overallPushRate}% push: +1,000 xu (break even)`);
console.log('• Better odds for players while maintaining house edge!');
