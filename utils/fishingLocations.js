/**
 * Fishing Locations System - Hệ thống địa điểm câu cá
 */

export const FISHING_LOCATIONS = {
  LAKE: {
    id: 'lake',
    name: 'Hồ nước ngọt',
    emoji: '🏞️',
    description: 'Hồ nước ngọt yên tĩnh, dễ câu cá nước ngọt',
    cost: 0, // Miễn phí
    unlockLevel: 1,
    modifiers: {
      fishRateMultiplier: 1.0,
      rareFishBonus: 0,
      experienceMultiplier: 1.0
    },
    availableFish: ['common', 'rare'],
    specialFish: [
      { name: 'Cá Chép Vàng', rarity: 'rare', bonus: 0.1 },
      { name: 'Cá Trắm', rarity: 'common', bonus: 0.2 }
    ]
  },
  
  RIVER: {
    id: 'river',
    name: 'Dòng sông',
    emoji: '🏔️',
    description: 'Dòng sông chảy xiết, cá đa dạng hơn',
    cost: 50,
    unlockLevel: 3,
    modifiers: {
      fishRateMultiplier: 1.1,
      rareFishBonus: 0.05,
      experienceMultiplier: 1.1
    },
    availableFish: ['common', 'rare', 'legendary'],
    specialFish: [
      { name: 'Cá Hồi', rarity: 'rare', bonus: 0.15 },
      { name: 'Cá Tầm', rarity: 'legendary', bonus: 0.08 }
    ]
  },
  
  OCEAN: {
    id: 'ocean',
    name: 'Đại dương',
    emoji: '🌊',
    description: 'Đại dương bao la, cá biển hiếm và quý',
    cost: 100,
    unlockLevel: 5,
    modifiers: {
      fishRateMultiplier: 0.9,
      rareFishBonus: 0.15,
      experienceMultiplier: 1.3
    },
    availableFish: ['common', 'rare', 'legendary', 'mythical'],
    specialFish: [
      { name: 'Cá Mập Trắng', rarity: 'legendary', bonus: 0.1 },
      { name: 'Cá Voi Xanh', rarity: 'mythical', bonus: 0.05 }
    ]
  },
  
  DEEP_SEA: {
    id: 'deep_sea',
    name: 'Biển sâu',
    emoji: '🌌',
    description: 'Vùng biển sâu thẳm, sinh vật huyền bí',
    cost: 200,
    unlockLevel: 7,
    modifiers: {
      fishRateMultiplier: 0.7,
      rareFishBonus: 0.25,
      experienceMultiplier: 1.5
    },
    availableFish: ['rare', 'legendary', 'mythical'],
    specialFish: [
      { name: 'Cá Rồng Biển Sâu', rarity: 'mythical', bonus: 0.08 },
      { name: 'Quái Vật Biển', rarity: 'mythical', bonus: 0.03 }
    ]
  },
  
  ICE_LAKE: {
    id: 'ice_lake',
    name: 'Hồ băng',
    emoji: '❄️',
    description: 'Hồ băng lạnh giá, cá băng hiếm có',
    cost: 150,
    unlockLevel: 6,
    modifiers: {
      fishRateMultiplier: 0.8,
      rareFishBonus: 0.2,
      experienceMultiplier: 1.4
    },
    availableFish: ['rare', 'legendary', 'mythical'],
    specialFish: [
      { name: 'Cá Băng Tinh', rarity: 'legendary', bonus: 0.12 },
      { name: 'Cá Rồng Băng', rarity: 'mythical', bonus: 0.06 }
    ]
  },
  
  VOLCANIC_LAKE: {
    id: 'volcanic_lake',
    name: 'Hồ núi lửa',
    emoji: '🌋',
    description: 'Hồ núi lửa nóng bỏng, cá lửa huyền thoại',
    cost: 300,
    unlockLevel: 8,
    modifiers: {
      fishRateMultiplier: 0.6,
      rareFishBonus: 0.3,
      experienceMultiplier: 2.0
    },
    availableFish: ['legendary', 'mythical'],
    specialFish: [
      { name: 'Cá Lửa Địa Ngục', rarity: 'mythical', bonus: 0.1 },
      { name: 'Phượng Hoàng Cá', rarity: 'mythical', bonus: 0.04 }
    ]
  },
  
  MYSTICAL_POND: {
    id: 'mystical_pond',
    name: 'Ao huyền bí',
    emoji: '✨',
    description: 'Ao nước huyền bí, chỉ xuất hiện vào đêm trăng tròn',
    cost: 500,
    unlockLevel: 10,
    modifiers: {
      fishRateMultiplier: 0.5,
      rareFishBonus: 0.4,
      experienceMultiplier: 3.0
    },
    availableFish: ['mythical'],
    specialFish: [
      { name: 'Cá Thiên Thần', rarity: 'mythical', bonus: 0.15 },
      { name: 'Rồng Thần Nước', rarity: 'mythical', bonus: 0.08 }
    ],
    specialRequirement: 'Chỉ mở vào đêm (22h-6h)'
  }
};

/**
 * Lấy danh sách địa điểm mà user có thể truy cập
 */
export function getAvailableLocations(userLevel, currentHour = null) {
  const available = [];
  
  for (const [key, location] of Object.entries(FISHING_LOCATIONS)) {
    if (userLevel >= location.unlockLevel) {
      // Kiểm tra điều kiện đặc biệt
      if (location.specialRequirement && location.id === 'mystical_pond') {
        const hour = currentHour || new Date().getHours();
        if (hour < 22 && hour >= 6) {
          continue; // Ao huyền bí chỉ mở vào đêm
        }
      }
      
      available.push({
        key,
        ...location
      });
    }
  }
  
  return available;
}

/**
 * Lấy thông tin chi tiết của một địa điểm
 */
export function getLocationInfo(locationId) {
  return FISHING_LOCATIONS[locationId] || FISHING_LOCATIONS.LAKE;
}

/**
 * Kiểm tra xem user có thể câu ở địa điểm này không
 */
export function canFishAtLocation(locationId, userLevel, userBalance) {
  const location = FISHING_LOCATIONS[locationId];
  if (!location) return { canFish: false, reason: 'Địa điểm không tồn tại' };
  
  if (userLevel < location.unlockLevel) {
    return { 
      canFish: false, 
      reason: `Cần rod level ${location.unlockLevel} để mở khóa` 
    };
  }
  
  if (userBalance < location.cost) {
    return { 
      canFish: false, 
      reason: `Cần ${location.cost} xu để câu ở đây` 
    };
  }
  
  // Kiểm tra điều kiện đặc biệt
  if (location.specialRequirement && location.id === 'mystical_pond') {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 22) {
      return { 
        canFish: false, 
        reason: 'Ao huyền bí chỉ mở vào đêm (22h-6h)' 
      };
    }
  }
  
  return { canFish: true };
}

/**
 * Áp dụng hệ số của địa điểm vào câu cá
 */
export function applyLocationModifiers(locationId, baseFishRate, baseRareRate) {
  const location = FISHING_LOCATIONS[locationId] || FISHING_LOCATIONS.LAKE;
  
  const modifiedFishRate = baseFishRate * location.modifiers.fishRateMultiplier;
  const modifiedRareRate = baseRareRate + location.modifiers.rareFishBonus;
  
  return {
    fishRate: Math.min(0.95, Math.max(0.05, modifiedFishRate)),
    rareRate: Math.min(0.5, Math.max(0, modifiedRareRate)),
    experienceMultiplier: location.modifiers.experienceMultiplier
  };
}

/**
 * Lấy cá đặc biệt của địa điểm (nếu may mắn)
 */
export function getLocationSpecialFish(locationId) {
  const location = FISHING_LOCATIONS[locationId];
  if (!location || !location.specialFish) return null;
  
  // Kiểm tra có trúng cá đặc biệt không
  for (const specialFish of location.specialFish) {
    if (Math.random() < specialFish.bonus) {
      return {
        name: specialFish.name,
        rarity: specialFish.rarity,
        price: getSpecialFishPrice(specialFish.rarity),
        isSpecial: true,
        location: location.name
      };
    }
  }
  
  return null;
}

/**
 * Tính giá của cá đặc biệt
 */
function getSpecialFishPrice(rarity) {
  const basePrices = {
    common: 50,
    rare: 150,
    legendary: 500,
    mythical: 1500
  };
  
  const basePrice = basePrices[rarity] || 50;
  return Math.floor(basePrice * (1.2 + Math.random() * 0.8)); // 120%-200% của giá base
}

/**
 * Tạo description cho địa điểm
 */
export function getLocationDisplayInfo(locationId, userLevel) {
  const location = FISHING_LOCATIONS[locationId];
  if (!location) return null;
  
  const isUnlocked = userLevel >= location.unlockLevel;
  const canAccess = canFishAtLocation(locationId, userLevel, Infinity); // Ignore balance for display
  
  return {
    ...location,
    isUnlocked,
    canAccess: canAccess.canFish,
    lockReason: !isUnlocked ? `Cần rod level ${location.unlockLevel}` : 
                !canAccess.canFish ? canAccess.reason : null,
    modifierText: [
      `Tỷ lệ câu: ${Math.round(location.modifiers.fishRateMultiplier * 100)}%`,
      `Cá hiếm: +${Math.round(location.modifiers.rareFishBonus * 100)}%`,
      `Kinh nghiệm: ${Math.round(location.modifiers.experienceMultiplier * 100)}%`
    ].join(' • ')
  };
}
