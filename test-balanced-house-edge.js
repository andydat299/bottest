// Test cuối cùng - cân bằng để đạt đúng 70%
// Chạy: node test-balanced-house-edge.js

console.log('🎯 BALANCED HOUSE EDGE - Targeting Exactly 70%\n');

function simulateBalancedHouseEdge(playerValue, dealerValue, dealerBust = false, iterations = 1000) {
  let dealerWins = 0;
  let playerWins = 0;
  let pushes = 0;
  
  const HOUSE_WIN_RATE = 0.65; // 65% house edge + push = ~70% total dealer advantage
  
  for (let i = 0; i < iterations; i++) {
    const houseEdgeRoll = Math.random();
    let result;
    
    if (dealerBust) {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 65%: "Cứu" dealer
        const targetValue = Math.max(17, Math.min(21, playerValue + Math.floor(Math.random() * 2)));
        const newDealerValue = targetValue;
        
        if (newDealerValue >= playerValue) {
          result = newDealerValue > playerValue ? 'dealerWin' : 'push';
        } else {
          result = 'dealerWin'; // House edge
        }
      } else {
        // 35%: Dealer thực sự bust
        result = 'dealerBust';
      }
    } else {
      if (houseEdgeRoll <= HOUSE_WIN_RATE) {
        // 65%: Ưu tiên dealer
        if (dealerValue >= playerValue) {
          result = dealerValue > playerValue ? 'dealerWin' : 'push';
        } else {
          const pointDiff = playerValue - dealerValue;
          if (pointDiff <= 2) {
            result = 'dealerWin'; // House edge
          } else if (pointDiff <= 4) {
            result = 'push'; // Hòa
          } else {
            result = 'playerWin'; // Player thắng
          }
        }
      } else {
        // 35%: Logic công bằng
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
    dealerWins,
    playerWins,
    pushes,
    dealerWinRate: (dealerWins / iterations * 100).toFixed(1),
    playerWinRate: (playerWins / iterations * 100).toFixed(1),
    pushRate: (pushes / iterations * 100).toFixed(1)
  };
}

// Test các scenarios thực tế
const realGameScenarios = [
  { name: 'Player 21, Dealer 17 (Player có blackjack)', player: 21, dealer: 17 },
  { name: 'Player 20, Dealer 18 (Gần nhau)', player: 20, dealer: 18 },
  { name: 'Player 19, Dealer 19 (Hòa)', player: 19, dealer: 19 },
  { name: 'Player 18, Dealer 20 (Dealer tốt hơn)', player: 18, dealer: 20 },
  { name: 'Player 17, Dealer 21 (Dealer thắng rõ)', player: 17, dealer: 21 },
  { name: 'Player 20, Dealer 22 (Dealer bust)', player: 20, dealer: 22, bust: true },
  { name: 'Player 19, Dealer 23 (Dealer bust)', player: 19, dealer: 23, bust: true },
  { name: 'Player 21, Dealer 15 (Player tốt hơn nhiều)', player: 21, dealer: 15 }
];

console.log('🧪 TESTING BALANCED LOGIC:\n');

let totalDealerWins = 0;
let totalPlayerWins = 0;
let totalPushes = 0;
let totalGames = 0;

realGameScenarios.forEach((scenario, index) => {
  const result = simulateBalancedHouseEdge(scenario.player, scenario.dealer, scenario.bust, 1000);
  
  console.log(`📋 ${scenario.name}`);
  console.log(`   🤖 Dealer: ${result.dealerWinRate}% (${result.dealerWins})`);
  console.log(`   👤 Player: ${result.playerWinRate}% (${result.playerWins})`);
  console.log(`   🤝 Push: ${result.pushRate}% (${result.pushes})`);
  
  totalDealerWins += result.dealerWins;
  totalPlayerWins += result.playerWins;
  totalPushes += result.pushes;
  totalGames += 1000;
  
  console.log('─'.repeat(55));
});

const finalDealerRate = (totalDealerWins / totalGames * 100).toFixed(1);
const finalPlayerRate = (totalPlayerWins / totalGames * 100).toFixed(1);
const finalPushRate = (totalPushes / totalGames * 100).toFixed(1);

console.log('\n📊 FINAL OVERALL STATISTICS:');
console.log(`🎮 Total Games: ${totalGames.toLocaleString()}`);
console.log(`🤖 Dealer Win Rate: ${finalDealerRate}%`);
console.log(`👤 Player Win Rate: ${finalPlayerRate}%`);
console.log(`🤝 Push Rate: ${finalPushRate}%`);

console.log(`\n🎯 PERFORMANCE CHECK:`);
console.log(`Target: 70% dealer advantage`);
console.log(`Actual: ${finalDealerRate}% dealer wins`);

const isWithinTarget = parseFloat(finalDealerRate) >= 68 && parseFloat(finalDealerRate) <= 72;
console.log(`✅ Within Target (68-72%): ${isWithinTarget ? 'YES' : 'NO'}`);

if (isWithinTarget) {
  console.log('\n🎊 THÀNH CÔNG!');
  console.log('🎰 Bot đã đạt được tỷ lệ thắng ~70% như mong muốn!');
  console.log('🏠 House edge đã được cân bằng hoàn hảo!');
} else {
  console.log('\n⚠️ Cần điều chỉnh thêm để đạt chính xác 70%.');
}

console.log('\n🎮 HỆ THỐNG HOUSE EDGE CUỐI CÙNG:');
console.log('• 65% cơ hội áp dụng house edge');
console.log('• Dealer bust → 65% được cứu');
console.log('• Chênh lệch ≤2 điểm → Dealer thắng');
console.log('• Chênh lệch 3-4 điểm → Hòa');  
console.log('• Chênh lệch >4 điểm → Player mới thắng');
console.log('• 35% thời gian áp dụng luật công bằng');
console.log('• Kết hợp push để đạt tổng ~70% dealer advantage');
