import { fishTypes, totalWeight } from './fishTypes.js';

/**
 * Chọn cá ngẫu nhiên dựa trên weight, rod level và bonus
 * @param {number} rodLevel - Cấp độ cần câu
 * @param {number} rareFishBonus - Bonus cá hiếm từ môi trường/sự kiện
 * @returns {object} - Loại cá được chọn
 */
export function selectRandomFish(rodLevel = 1, rareFishBonus = 0) {
  // Bonus luck dựa trên rod level (tăng cơ hội cá hiếm)
  const luckBonus = Math.max(0, (rodLevel - 1) * 0.1); // 10% bonus per level
  
  // Tổng bonus cá hiếm
  const totalRareBonus = luckBonus + rareFishBonus;
  
  // Điều chỉnh weight dựa trên rod level và bonus
  const adjustedFish = fishTypes.map(fish => {
    let adjustedWeight = fish.weight;
    
    // Tăng cơ hội cá hiếm với rod level và bonus từ môi trường
    if (fish.rarity === 'rare') {
      adjustedWeight *= (1 + totalRareBonus * 0.5); // 50% hiệu quả cho rare
    } else if (fish.rarity === 'legendary') {
      adjustedWeight *= (1 + totalRareBonus * 1); // 100% hiệu quả cho legendary  
    } else if (fish.rarity === 'mythical') {
      adjustedWeight *= (1 + totalRareBonus * 2); // 200% hiệu quả cho mythical
    }
    
    return { ...fish, adjustedWeight };
  });
  
  // Tính tổng weight đã điều chỉnh
  const adjustedTotalWeight = adjustedFish.reduce((sum, fish) => sum + fish.adjustedWeight, 0);
  
  // Random number từ 0 đến tổng weight
  const random = Math.random() * adjustedTotalWeight;
  
  // Tìm cá tương ứng
  let currentWeight = 0;
  for (const fish of adjustedFish) {
    currentWeight += fish.adjustedWeight;
    if (random <= currentWeight) {
      return fish;
    }
  }
  
  // Fallback (không bao giờ xảy ra)
  return adjustedFish[0];
}

/**
 * Tính tỷ lệ thực tế của từng loại cá
 * @param {number} rodLevel - Cấp độ cần câu
 * @returns {Array} - Danh sách cá với tỷ lệ
 */
export function getFishProbabilities(rodLevel = 1) {
  const luckBonus = Math.max(0, (rodLevel - 1) * 0.1);
  
  const adjustedFish = fishTypes.map(fish => {
    let adjustedWeight = fish.weight;
    
    if (fish.rarity === 'rare') {
      adjustedWeight *= (1 + luckBonus * 0.5);
    } else if (fish.rarity === 'legendary') {
      adjustedWeight *= (1 + luckBonus * 1);
    } else if (fish.rarity === 'mythical') {
      adjustedWeight *= (1 + luckBonus * 2);
    }
    
    return { ...fish, adjustedWeight };
  });
  
  const adjustedTotalWeight = adjustedFish.reduce((sum, fish) => sum + fish.adjustedWeight, 0);
  
  return adjustedFish.map(fish => ({
    ...fish,
    probability: ((fish.adjustedWeight / adjustedTotalWeight) * 100).toFixed(3) + '%',
    ratio: Math.round(adjustedTotalWeight / fish.adjustedWeight)
  }));
}
