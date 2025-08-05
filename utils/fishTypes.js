export const fishTypes = [
  // Cá thường (70% tổng tỷ lệ)
  { name: 'Cá cơm', price: 10, rarity: 'common', weight: 120 },
  { name: 'Cá trê', price: 20, rarity: 'common', weight: 100 },
  { name: 'Cá chép', price: 30, rarity: 'common', weight: 80 },
  { name: 'Cá thu', price: 40, rarity: 'common', weight: 60 },
  { name: 'Cá hồi', price: 50, rarity: 'common', weight: 40 },
  
  // Cá hiếm (25% tổng tỷ lệ)
  { name: 'Cá trắng', price: 60, rarity: 'rare', weight: 25 },
  { name: 'Cá ngừ', price: 60, rarity: 'rare', weight: 25 },
  { name: 'Cá đuối', price: 70, rarity: 'rare', weight: 20 },
  { name: 'Cá vàng', price: 80, rarity: 'rare', weight: 15 },
  { name: 'Cá đen', price: 90, rarity: 'rare', weight: 15 },
  { name: 'Cá voi', price: 100, rarity: 'rare', weight: 10 },
  
  // Cá huyền thoại (4.5% tổng tỷ lệ)
  { name: 'Cá rồng', price: 200, rarity: 'legendary', weight: 8 },
  { name: 'Cá mập', price: 500, rarity: 'legendary', weight: 5 },
  { name: 'Cá thần', price: 1000, rarity: 'legendary', weight: 2 },
  
  // Cá cực hiếm (0.05% = 1/2000 tỷ lệ)
  { name: 'Cá boss', price: 5000, rarity: 'mythical', weight: 0.15 } // 1/2000 tỷ lệ
];

// Tổng weight để tính tỷ lệ
export const totalWeight = fishTypes.reduce((sum, fish) => sum + fish.weight, 0);
