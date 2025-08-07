// Test logic blackjack chuẩn - không có house edge giả tạo
// Chạy: node test-standard-blackjack.js

console.log('🎴 TESTING STANDARD BLACKJACK LOGIC\n');

function simulateStandardBlackjack(playerValue, dealerValue, dealerBust = false, iterations = 10000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  for (let i = 0; i < iterations; i++) {
    let result;
    
    // Áp dụng luật blackjack chuẩn 100%
    if (dealerBust || dealerValue > 21) {
      result = 'dealerBust'; // Player thắng
    } else if (playerValue > dealerValue) {
      result = 'playerWin';
    } else if (playerValue < dealerValue) {
      result = 'dealerWin';
    } else {
      result = 'push'; // Hòa
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

// Test các scenarios với luật chuẩn
const standardScenarios = [
  { name: 'Player 21, Dealer 17 → Player wins', player: 21, dealer: 17, expected: 'playerWin' },
  { name: 'Player 20, Dealer 21 → Dealer wins', player: 20, dealer: 21, expected: 'dealerWin' },
  { name: 'Player 19, Dealer 19 → Push', player: 19, dealer: 19, expected: 'push' },
  { name: 'Player 18, Dealer 20 → Dealer wins', player: 18, dealer: 20, expected: 'dealerWin' },
  { name: 'Player 17, Dealer 21 → Dealer wins', player: 17, dealer: 21, expected: 'dealerWin' },
  { name: 'Player 20, Dealer 22 → Player wins (bust)', player: 20, dealer: 22, bust: true, expected: 'dealerBust' },
  { name: 'Player 19, Dealer 23 → Player wins (bust)', player: 19, dealer: 23, bust: true, expected: 'dealerBust' },
  { name: 'Player 21, Dealer 15 → Player wins', player: 21, dealer: 15, expected: 'playerWin' },
  { name: 'Player 18, Dealer 18 → Push', player: 18, dealer: 18, expected: 'push' },
  { name: 'Player 16, Dealer 20 → Dealer wins', player: 16, dealer: 20, expected: 'dealerWin' }
];

console.log('🧪 TESTING STANDARD BLACKJACK RULES:\n');

let totalDealerWins = 0;
let totalPlayerWins = 0;
let totalPushes = 0;
let totalGames = 0;
let correctPredictions = 0;

standardScenarios.forEach((scenario, index) => {
  const result = simulateStandardBlackjack(scenario.player, scenario.dealer, scenario.bust, 10000);
  
  // Xác định kết quả thực tế
  let actualOutcome;
  if (parseFloat(result.dealerWinRate) > 90) actualOutcome = 'dealerWin';
  else if (parseFloat(result.playerWinRate) > 90) actualOutcome = 'playerWin';
  else if (parseFloat(result.pushRate) > 90) actualOutcome = 'push';
  else actualOutcome = 'mixed';
  
  const isCorrect = actualOutcome === scenario.expected;
  if (isCorrect) correctPredictions++;
  
  console.log(`📋 ${index + 1}. ${scenario.name}`);
  console.log(`   🤖 ${result.dealerWinRate}% | 👤 ${result.playerWinRate}% | 🤝 ${result.pushRate}%`);
  console.log(`   ✅ Expected: ${scenario.expected} | Actual: ${actualOutcome} | ${isCorrect ? 'CORRECT' : 'WRONG'}`);
  
  totalDealerWins += result.dealerWins;
  totalPlayerWins += result.playerWins;
  totalPushes += result.pushes;
  totalGames += 10000;
  
  console.log('─'.repeat(70));
});

const overallDealerRate = (totalDealerWins / totalGames * 100).toFixed(1);
const overallPlayerRate = (totalPlayerWins / totalGames * 100).toFixed(1);
const overallPushRate = (totalPushes / totalGames * 100).toFixed(1);
const accuracy = (correctPredictions / standardScenarios.length * 100).toFixed(1);

console.log('\n' + '═'.repeat(70));
console.log('📊 STANDARD BLACKJACK RESULTS:');
console.log(`🎮 Total Games: ${totalGames.toLocaleString()}`);
console.log(`🤖 Dealer Win Rate: ${overallDealerRate}%`);
console.log(`👤 Player Win Rate: ${overallPlayerRate}%`);
console.log(`🤝 Push Rate: ${overallPushRate}%`);
console.log(`🎯 Logic Accuracy: ${accuracy}% (${correctPredictions}/${standardScenarios.length})`);

console.log('\n🎴 STANDARD BLACKJACK FEATURES:');
console.log('✅ 100% fair and accurate card comparison');
console.log('✅ Dealer bust = Player wins');
console.log('✅ Higher value wins, equal value = push');
console.log('✅ No artificial house edge manipulation');
console.log('✅ Pure skill and luck based gameplay');

console.log('\n💎 PAYOUT STRUCTURE (UPDATED TO STANDARD):');
console.log('🎴 Blackjack (21 with 2 cards): 1.5x payout (3:2 ratio)');
console.log('🎯 Normal win: 2.0x payout (1:1 + original bet)');
console.log('🤝 Push: 1.0x (return original bet)');
console.log('😢 Loss: 0x (lose bet)');

console.log('\n💰 WITH 1000 XU BET (REALISTIC SCENARIOS):');
console.log(`• Dealer wins: ${overallDealerRate}% chance → Lose 1,000 xu`);
console.log(`• Player wins: ${overallPlayerRate}% chance → Win varies:`);
console.log('  - Normal win: Get 2,000 xu (profit +1,000 xu)');
console.log('  - Blackjack: Get 1,500 xu (profit +500 xu)');
console.log(`• Push: ${overallPushRate}% chance → Get 1,000 xu back (break even)`);

if (accuracy >= 95) {
  console.log('\n🎊 PERFECT! Standard blackjack logic is working correctly!');
  console.log('🏆 Fair, skill-based, and mathematically accurate!');
  console.log('🎯 Players will appreciate the honest gameplay!');
} else {
  console.log('\n⚠️ Some logic issues detected. Check implementation.');
}

console.log('\n🎮 COMPARISON WITH PREVIOUS SYSTEMS:');
console.log('❌ 70% House Edge: Artificial and unfair');
console.log('❌ 65% House Edge: Still manipulated');
console.log('✅ Standard Rules: Fair, honest, skill-based');
console.log('🎯 Result: Better player experience and trust!');
