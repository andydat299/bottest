// Test cuối cùng với logic tối ưu - 70% dealer thắng
// Chạy: node test-optimized-house-edge.js

console.log('🎰 OPTIMIZED HOUSE EDGE - Target 70% Dealer Wins\n');

function simulateOptimizedHouseEdge(playerValue, dealerValue, dealerBust = false, iterations = 1000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const HOUSE_WIN_RATE = 0.72; // Tăng lên 72% để bù push
  
  for (let i = 0; i < iterations; i++) {
    const houseEdgeRoll = Math.random();
    let result;
    
    if (dealerBust) {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 72%: "Cứu" dealer và dealer thắng
        result = 'dealerWin';
      } else {
        // 28%: Dealer thực sự bust
        result = 'dealerBust';
      }
    } else {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 72%: Dealer thắng luôn
        result = 'dealerWin';
      } else {
        // 28%: Logic thực tế
        if (playerValue > dealerValue) {
          const pointDiff = playerValue - dealerValue;
          if (pointDiff >= 4) {
            result = 'playerWin';
          } else {
            result = 'push';
          }
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
    pushRate: (pushes / iterations * 100).toFixed(1)
  };
}

// Test nhiều scenarios
const testCases = [
  { name: 'Player 21, Dealer 17', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18', player: 20, dealer: 18 },
  { name: 'Player 19, Dealer 19', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 20', player: 18, dealer: 20 },
  { name: 'Player 21, Dealer 15', player: 21, dealer: 15 },
  { name: 'Player bust scenario', player: 18, dealer: 22, bust: true },
  { name: 'Close game', player: 20, dealer: 19 },
  { name: 'Player disadvantage', player: 17, dealer: 21 }
];

console.log('🧪 TESTING OPTIMIZED LOGIC:\n');

let totalDealer = 0;
let totalPlayer = 0;
let totalPush = 0;

testCases.forEach((test, index) => {
  const result = simulateOptimizedHouseEdge(test.player, test.dealer, test.bust, 1000);
  
  console.log(`📋 ${test.name}`);
  console.log(`   🤖 Dealer: ${result.dealerWinRate}%`);
  console.log(`   👤 Player: ${result.playerWinRate}%`);
  console.log(`   🤝 Push: ${result.pushRate}%`);
  
  totalDealer += parseFloat(result.dealerWinRate);
  totalPlayer += parseFloat(result.playerWinRate);
  totalPush += parseFloat(result.pushRate);
});

const avgDealer = (totalDealer / testCases.length).toFixed(1);
const avgPlayer = (totalPlayer / testCases.length).toFixed(1);
const avgPush = (totalPush / testCases.length).toFixed(1);

console.log('\n📊 AVERAGE ACROSS ALL SCENARIOS:');
console.log(`🤖 Dealer Average: ${avgDealer}%`);
console.log(`👤 Player Average: ${avgPlayer}%`);
console.log(`🤝 Push Average: ${avgPush}%`);

console.log(`\n🎯 TARGET: 70% dealer wins`);
console.log(`📈 ACHIEVED: ${avgDealer}% dealer wins`);

const success = parseFloat(avgDealer) >= 68 && parseFloat(avgDealer) <= 72;
console.log(`✅ SUCCESS: ${success ? 'YES' : 'NO'}`);

console.log('\n🏠 FINAL HOUSE EDGE SYSTEM:');
console.log('✅ 72% cơ hội dealer thắng trực tiếp');
console.log('✅ Dealer bust → 72% được cứu và thắng');
console.log('✅ 28% thời gian áp dụng logic thực tế');
console.log('✅ Player cần chênh lệch ≥4 điểm mới thắng');
console.log('✅ Tất cả các trường hợp khác → dealer thắng hoặc hòa');

if (success) {
  console.log('\n🎊 HOÀN HẢO! Bot đạt mục tiêu 70% thắng!');
  console.log('🎰 House edge đã được tối ưu hóa thành công!');
} else {
  console.log('\n⚠️ Cần điều chỉnh thêm để đạt chính xác 70%.');
}
