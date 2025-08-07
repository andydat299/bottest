// Test house edge logic - 70% bot thắng nhưng dựa trên điểm số
// Chạy: node test-house-edge.js

console.log('🎰 TESTING HOUSE EDGE LOGIC (70% Bot Advantage)\n');

// Mô phỏng logic house edge
function simulateHouseEdge(playerValue, dealerValue, dealerBust = false, iterations = 1000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const HOUSE_WIN_RATE = 0.7;
  
  for (let i = 0; i < iterations; i++) {
    const houseEdgeRoll = Math.random();
    let result;
    
    if (dealerBust) {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 70%: "Sửa" dealer không bust
        const newDealerValue = Math.min(21, Math.max(17, playerValue + Math.floor(Math.random() * 3)));
        if (newDealerValue >= playerValue) {
          result = 'dealerWin';
        } else {
          result = 'playerWin';
        }
      } else {
        // 30%: Dealer thực sự bust
        result = 'dealerBust';
      }
    } else {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 70%: Ưu tiên dealer
        if (dealerValue >= playerValue) {
          result = dealerValue > playerValue ? 'dealerWin' : 'push';
        } else {
          const pointDiff = playerValue - dealerValue;
          if (pointDiff <= 3) {
            result = 'dealerWin'; // House edge
          } else {
            result = 'playerWin';
          }
        }
      } else {
        // 30%: Luật công bằng
        if (playerValue > dealerValue) {
          result = 'playerWin';
        } else if (playerValue < dealerValue) {
          result = 'dealerWin';
        } else {
          result = 'push';
        }
      }
    }
    
    if (result === 'dealerWin') dealerWins++;
    else if (result === 'playerWin' || result === 'dealerBust') playerWins++;
    else pushes++;
  }
  
  return {
    dealerWinRate: (dealerWins / iterations * 100).toFixed(1),
    playerWinRate: (playerWins / iterations * 100).toFixed(1),
    pushRate: (pushes / iterations * 100).toFixed(1),
    dealerWins,
    playerWins,
    pushes
  };
}

// Test cases
const testScenarios = [
  {
    name: 'Player 21, Dealer 17',
    playerValue: 21,
    dealerValue: 17,
    expected: 'Player should still lose ~70% due to house edge'
  },
  {
    name: 'Player 20, Dealer 18', 
    playerValue: 20,
    dealerValue: 18,
    expected: 'Close game - house edge should favor dealer'
  },
  {
    name: 'Player 21, Dealer 15',
    playerValue: 21,
    dealerValue: 15,
    expected: 'Large gap (>3) - player might win more often'
  },
  {
    name: 'Player 19, Dealer 19',
    playerValue: 19,
    dealerValue: 19,
    expected: 'Equal values - should push or dealer wins'
  },
  {
    name: 'Player 18, Dealer bust',
    playerValue: 18,
    dealerValue: 22,
    dealerBust: true,
    expected: 'Dealer bust but 70% chance to "recover"'
  }
];

console.log('🧪 RUNNING HOUSE EDGE SIMULATIONS:\n');

testScenarios.forEach((scenario, index) => {
  console.log(`📋 Test ${index + 1}: ${scenario.name}`);
  console.log(`🎯 Expected: ${scenario.expected}`);
  
  const result = simulateHouseEdge(
    scenario.playerValue, 
    scenario.dealerValue, 
    scenario.dealerBust,
    1000
  );
  
  console.log(`📊 Results (1000 simulations):`);
  console.log(`   🤖 Dealer wins: ${result.dealerWinRate}% (${result.dealerWins} times)`);
  console.log(`   👤 Player wins: ${result.playerWinRate}% (${result.playerWins} times)`);
  console.log(`   🤝 Pushes: ${result.pushRate}% (${result.pushes} times)`);
  
  const dealerAdvantage = parseFloat(result.dealerWinRate) > parseFloat(result.playerWinRate);
  console.log(`   ✅ House Edge Working: ${dealerAdvantage ? 'YES' : 'NO'}`);
  console.log('─'.repeat(60));
});

console.log('\n🎯 HOUSE EDGE FEATURES:');
console.log('✅ 70% cơ hội dealer thắng');
console.log('✅ Dựa trên điểm số thực tế, không random hoàn toàn');
console.log('✅ Dealer bust có thể được "cứu" (70% thời gian)');
console.log('✅ Chênh lệch điểm nhỏ (≤3): Dealer thắng');
console.log('✅ Chênh lệch điểm lớn (>3): Player có cơ hội thắng');
console.log('✅ 30% thời gian áp dụng luật công bằng');

console.log('\n💡 VÍ DỤ THỰC TẾ:');
console.log('• Player 21, Dealer 17 → 70% dealer vẫn thắng');
console.log('• Player 20, Dealer 18 → Dealer thắng (chênh ≤3)');  
console.log('• Player 21, Dealer 15 → Player có cơ hội thắng (chênh >3)');
console.log('• Dealer bust → 70% được "sửa" thành không bust');

console.log('\n🎰 Kết luận: Bot có lợi thế 70% nhưng vẫn dựa trên logic blackjack!');
