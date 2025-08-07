// Test cuối cùng - house edge 70% thông minh
// Chạy: node test-final-house-edge.js

console.log('🎰 FINAL HOUSE EDGE TEST - 70% Dealer Advantage\n');

// Mô phỏng logic house edge cải tiến
function simulateImprovedHouseEdge(playerValue, dealerValue, dealerBust = false, iterations = 1000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const HOUSE_WIN_RATE = 0.7;
  
  for (let i = 0; i < iterations; i++) {
    const houseEdgeRoll = Math.random();
    let result;
    
    if (dealerBust) {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 70%: "Sửa" dealer thành 17-21
        const targetValue = Math.max(17, Math.min(21, playerValue + Math.floor(Math.random() * 2)));
        if (targetValue >= playerValue) {
          result = targetValue > playerValue ? 'dealerWin' : 'push';
        } else {
          result = 'dealerWin'; // House edge
        }
      } else {
        // 30%: Dealer thực sự bust
        result = 'dealerBust';
      }
    } else {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 70%: Logic ưu tiên dealer
        if (dealerValue >= playerValue) {
          result = dealerValue > playerValue ? 'dealerWin' : 'push';
        } else {
          const pointDiff = playerValue - dealerValue;
          if (pointDiff <= 5) {
            result = 'dealerWin'; // House edge mạnh
          } else {
            result = 'push'; // Chênh lệch lớn → hòa thay vì thắng
          }
        }
      } else {
        // 30%: Logic gần công bằng
        if (playerValue > dealerValue + 1) {
          result = 'playerWin';
        } else if (playerValue <= dealerValue) {
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

// Test cases khác nhau
const scenarios = [
  { name: 'Player 21, Dealer 17', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18', player: 20, dealer: 18 },
  { name: 'Player 21, Dealer 15', player: 21, dealer: 15 },
  { name: 'Player 19, Dealer 19', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 22 (bust)', player: 18, dealer: 22, bust: true },
  { name: 'Player 20, Dealer 19', player: 20, dealer: 19 },
  { name: 'Player 17, Dealer 21', player: 17, dealer: 21 }
];

console.log('🧪 TESTING IMPROVED HOUSE EDGE:\n');

let totalDealerWins = 0;
let totalPlayerWins = 0;
let totalPushes = 0;
let totalGames = 0;

scenarios.forEach((scenario, index) => {
  console.log(`📋 Test ${index + 1}: ${scenario.name}`);
  
  const result = simulateImprovedHouseEdge(
    scenario.player, 
    scenario.dealer, 
    scenario.bust,
    1000
  );
  
  console.log(`📊 Results:`);
  console.log(`   🤖 Dealer: ${result.dealerWinRate}%`);
  console.log(`   👤 Player: ${result.playerWinRate}%`);
  console.log(`   🤝 Push: ${result.pushRate}%`);
  
  totalDealerWins += result.dealerWins;
  totalPlayerWins += result.playerWins;
  totalPushes += result.pushes;
  totalGames += 1000;
  
  console.log('─'.repeat(50));
});

console.log('\n📊 OVERALL STATISTICS:');
console.log(`🎮 Total Games Simulated: ${totalGames.toLocaleString()}`);
console.log(`🤖 Dealer Win Rate: ${(totalDealerWins / totalGames * 100).toFixed(1)}%`);
console.log(`👤 Player Win Rate: ${(totalPlayerWins / totalGames * 100).toFixed(1)}%`);
console.log(`🤝 Push Rate: ${(totalPushes / totalGames * 100).toFixed(1)}%`);

const dealerAdvantage = (totalDealerWins / totalGames * 100);
console.log(`\n🎯 TARGET: 70% dealer wins`);
console.log(`📈 ACTUAL: ${dealerAdvantage.toFixed(1)}% dealer wins`);
console.log(`✅ SUCCESS: ${dealerAdvantage >= 65 && dealerAdvantage <= 75 ? 'YES' : 'NO'}`);

console.log('\n🏠 HOUSE EDGE FEATURES:');
console.log('✅ 70% cơ hội dealer có lợi thế');
console.log('✅ Dealer bust có thể được "cứu" thành 17-21');
console.log('✅ Chênh lệch ≤5 điểm: Dealer thắng (house edge)');
console.log('✅ Chênh lệch >5 điểm: Hòa (không cho player thắng dễ)');
console.log('✅ 30% thời gian: Logic gần công bằng nhưng vẫn ưu tiên dealer');
console.log('✅ Player cần chênh lệch >1 điểm mới có cơ hội thắng');

console.log('\n💰 KẾT LUẬN:');
if (dealerAdvantage >= 65 && dealerAdvantage <= 75) {
  console.log('🎊 HOÀN HẢO! Bot có lợi thế ~70% như mong muốn!');
} else {
  console.log('⚠️ Cần điều chỉnh thêm để đạt 70% chính xác.');
}
