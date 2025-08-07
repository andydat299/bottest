// Tính toán số tiền nhận được khi thắng blackjack với cược 1000 xu
// Chạy: node calculate-blackjack-winnings.js

console.log('💰 TÍNH TOÁN TIỀN THƯỞNG BLACKJACK\n');

const GAME_CONFIG = {
  blackjackPayout: 1.8, // 1.8x payout cho blackjack
  normalPayout: 1.8     // 1.8x payout cho thắng thường
};

const betAmount = 1000;

console.log(`🎯 Mức cược: ${betAmount.toLocaleString()} xu\n`);

// Scenario 1: Thắng thường (không phải blackjack)
const normalWin = Math.floor(betAmount * GAME_CONFIG.normalPayout);
console.log('📊 THẮNG THƯỜNG:');
console.log(`💸 Tiền cược ban đầu: ${betAmount.toLocaleString()} xu (đã bị trừ)`);
console.log(`🎁 Tiền thưởng nhận được: ${normalWin.toLocaleString()} xu`);
console.log(`💎 Lời thực tế: ${(normalWin - betAmount).toLocaleString()} xu`);
console.log(`📈 Tổng balance tăng: +${normalWin.toLocaleString()} xu\n`);

// Scenario 2: Blackjack (21 điểm với 2 lá đầu)
const blackjackWin = Math.floor(betAmount * GAME_CONFIG.blackjackPayout);
console.log('🎴 BLACKJACK (21 điểm với 2 lá):');
console.log(`💸 Tiền cược ban đầu: ${betAmount.toLocaleString()} xu (đã bị trừ)`);
console.log(`🎁 Tiền thưởng nhận được: ${blackjackWin.toLocaleString()} xu`);
console.log(`💎 Lời thực tế: ${(blackjackWin - betAmount).toLocaleString()} xu`);
console.log(`📈 Tổng balance tăng: +${blackjackWin.toLocaleString()} xu\n`);

// Scenario 3: Dealer bust
console.log('💥 DEALER BUST:');
console.log(`💸 Tiền cược ban đầu: ${betAmount.toLocaleString()} xu (đã bị trừ)`);
console.log(`🎁 Tiền thưởng nhận được: ${normalWin.toLocaleString()} xu`);
console.log(`💎 Lời thực tế: ${(normalWin - betAmount).toLocaleString()} xu`);
console.log(`📈 Tổng balance tăng: +${normalWin.toLocaleString()} xu\n`);

// Scenario 4: Hòa (Push)
console.log('🤝 HÒA (PUSH):');
console.log(`💸 Tiền cược ban đầu: ${betAmount.toLocaleString()} xu (đã bị trừ)`);
console.log(`🎁 Tiền hoàn lại: ${betAmount.toLocaleString()} xu`);
console.log(`💎 Lời thực tế: 0 xu (không lời không lỗ)`);
console.log(`📈 Tổng balance tăng: +${betAmount.toLocaleString()} xu\n`);

// Scenario 5: Thua
console.log('😢 THUA:');
console.log(`💸 Tiền cược ban đầu: ${betAmount.toLocaleString()} xu (đã bị trừ)`);
console.log(`🎁 Tiền nhận được: 0 xu`);
console.log(`💎 Lỗ thực tế: -${betAmount.toLocaleString()} xu`);
console.log(`📈 Tổng balance tăng: +0 xu\n`);

console.log('═'.repeat(60));
console.log('📋 TÓM TẮT PAYOUT:');
console.log(`🎴 Blackjack: ${GAME_CONFIG.blackjackPayout}x = ${blackjackWin.toLocaleString()} xu (lời ${(blackjackWin - betAmount).toLocaleString()} xu)`);
console.log(`🎯 Thắng thường: ${GAME_CONFIG.normalPayout}x = ${normalWin.toLocaleString()} xu (lời ${(normalWin - betAmount).toLocaleString()} xu)`);
console.log(`🤝 Hòa: 1x = ${betAmount.toLocaleString()} xu (lời 0 xu)`);
console.log(`😢 Thua: 0x = 0 xu (lỗ ${betAmount.toLocaleString()} xu)`);

console.log('\n🎯 LƯU Ý:');
console.log('• Tiền cược được trừ ngay khi bắt đầu game');
console.log('• Khi thắng, balance tăng = tiền thưởng nhận được');
console.log('• Lời thực tế = tiền thưởng - tiền cược ban đầu');
console.log('• Tỷ lệ thắng được điều chỉnh: 30% thắng, 70% thua');

// Tính tỷ lệ ROI (Return on Investment)
console.log('\n📊 ROI (Return on Investment):');
console.log(`🎴 Blackjack ROI: +${((blackjackWin - betAmount) / betAmount * 100).toFixed(1)}%`);
console.log(`🎯 Thắng thường ROI: +${((normalWin - betAmount) / betAmount * 100).toFixed(1)}%`);
console.log(`🤝 Hòa ROI: 0%`);
console.log(`😢 Thua ROI: -100%`);
