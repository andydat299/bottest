// Demo test cho Wheel of Fortune game
// Chạy: node test-wheel.js

const WHEEL_CONFIG = {
  sectors: [
    { emoji: '💀', name: 'Phá sản', multiplier: 0, chance: 20, color: '#000000' },
    { emoji: '😢', name: 'Mất nửa', multiplier: 0.5, chance: 25, color: '#ff4444' },
    { emoji: '😐', name: 'Hòa vốn', multiplier: 1, chance: 25, color: '#888888' },
    { emoji: '😊', name: 'Thắng ít', multiplier: 1.5, chance: 18, color: '#44ff44' },
    { emoji: '🤑', name: 'Thắng lớn', multiplier: 2.5, chance: 10, color: '#ffff44' },
    { emoji: '💎', name: 'Siêu thắng', multiplier: 5, chance: 2, color: '#44ffff' },
    { emoji: '🎰', name: 'JACKPOT!', multiplier: 10, chance: 0.5, color: '#ff44ff' }
  ]
};

function spinWheel() {
  const totalChance = WHEEL_CONFIG.sectors.reduce((sum, sector) => sum + sector.chance, 0);
  const random = Math.random() * totalChance;
  
  let currentChance = 0;
  for (const sector of WHEEL_CONFIG.sectors) {
    currentChance += sector.chance;
    if (random <= currentChance) {
      return sector;
    }
  }
  
  return WHEEL_CONFIG.sectors[2]; // Fallback
}

// Test 1000 lần quay
console.log('🎡 TESTING WHEEL OF FORTUNE - 1000 SPINS\n');

const results = {};
const betAmount = 100;
let totalWinnings = 0;

for (let i = 0; i < 1000; i++) {
  const result = spinWheel();
  const winAmount = Math.floor(betAmount * result.multiplier);
  const profit = winAmount - betAmount;
  
  if (!results[result.name]) {
    results[result.name] = { count: 0, totalProfit: 0 };
  }
  
  results[result.name].count++;
  results[result.name].totalProfit += profit;
  totalWinnings += profit;
}

console.log('📊 RESULTS AFTER 1000 SPINS:');
console.log('═'.repeat(50));

WHEEL_CONFIG.sectors.forEach(sector => {
  const data = results[sector.name] || { count: 0, totalProfit: 0 };
  const actualChance = (data.count / 1000 * 100).toFixed(1);
  const avgProfit = data.count > 0 ? (data.totalProfit / data.count).toFixed(1) : 0;
  
  console.log(`${sector.emoji} ${sector.name.padEnd(12)} | ${data.count.toString().padStart(3)} times (${actualChance}%) | Expected: ${sector.chance}% | Avg: ${avgProfit} xu`);
});

console.log('═'.repeat(50));
console.log(`💰 Total profit/loss: ${totalWinnings >= 0 ? '+' : ''}${totalWinnings} xu`);
console.log(`📈 House edge: ${((Math.abs(totalWinnings) / (1000 * betAmount)) * 100).toFixed(2)}%`);
console.log(`🎯 Expected return: ${(WHEEL_CONFIG.sectors.reduce((sum, s) => sum + (s.multiplier * s.chance), 0) / 100).toFixed(2)}x`);

// Test với cược khác nhau
console.log('\n🎲 TESTING DIFFERENT BET AMOUNTS:');
console.log('═'.repeat(40));

[10, 50, 100, 500, 1000].forEach(bet => {
  const result = spinWheel();
  const win = Math.floor(bet * result.multiplier);
  const profit = win - bet;
  
  console.log(`💸 Bet: ${bet.toString().padStart(4)} xu → ${result.emoji} ${result.name} → Win: ${win} xu (${profit >= 0 ? '+' : ''}${profit})`);
});

console.log('\n🎡 Wheel of Fortune game ready to deploy!');
console.log('✅ Use /wheel play to start playing!');
console.log('ℹ️  Use /wheel info to see all sectors');
console.log('📊 Use /wheel stats to see your statistics');
