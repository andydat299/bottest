/**
 * Seasonal Events System - Hệ thống sự kiện theo mùa
 */

export const SEASONAL_EVENTS = {
  SPRING_FESTIVAL: {
    id: 'spring_festival',
    name: 'Lễ hội mùa xuân',
    emoji: '🌸',
    description: 'Cá xuân nở rộ, tỷ lệ cá hiếm tăng cao',
    startMonth: 3, // Tháng 3
    endMonth: 5,   // Tháng 5
    duration: 7,   // 7 ngày
    modifiers: {
      fishRateMultiplier: 1.2,
      rareFishBonus: 0.15,
      experienceMultiplier: 1.3,
      coinMultiplier: 1.1
    },
    specialFish: [
      { name: 'Cá Hoa Anh Đào', rarity: 'legendary', price: 800 },
      { name: 'Cá Xuân Tinh', rarity: 'mythical', price: 2000 }
    ],
    rewards: {
      daily: { coins: 200, experience: 100 },
      completion: { coins: 1000, experience: 500, title: '🌸 Thần Câu Mùa Xuân' }
    }
  },

  SUMMER_HEAT: {
    id: 'summer_heat',
    name: 'Hè nóng bỏng',
    emoji: '🏖️',
    description: 'Mùa hè sôi động, cá biển xuất hiện nhiều',
    startMonth: 6, // Tháng 6
    endMonth: 8,   // Tháng 8
    duration: 10,  // 10 ngày
    modifiers: {
      fishRateMultiplier: 1.0,
      rareFishBonus: 0.1,
      experienceMultiplier: 1.2,
      coinMultiplier: 1.2
    },
    specialFish: [
      { name: 'Cá Mặt Trời', rarity: 'legendary', price: 700 },
      { name: 'Cá Rồng Hè', rarity: 'mythical', price: 1800 }
    ],
    specialLocation: 'ocean', // Ưu tiên đại dương
    rewards: {
      daily: { coins: 250, experience: 120 },
      completion: { coins: 1200, experience: 600, title: '🏖️ Vua Câu Mùa Hè' }
    }
  },

  AUTUMN_HARVEST: {
    id: 'autumn_harvest',
    name: 'Thu hoạch mùa thu',
    emoji: '🍂',
    description: 'Mùa thu phong phú, phần thưởng xu tăng cao',
    startMonth: 9,  // Tháng 9
    endMonth: 11,   // Tháng 11
    duration: 8,    // 8 ngày
    modifiers: {
      fishRateMultiplier: 1.1,
      rareFishBonus: 0.08,
      experienceMultiplier: 1.1,
      coinMultiplier: 1.4 // Thu hoạch = nhiều xu
    },
    specialFish: [
      { name: 'Cá Lá Vàng', rarity: 'rare', price: 300 },
      { name: 'Cá Rồng Thu', rarity: 'legendary', price: 900 }
    ],
    rewards: {
      daily: { coins: 300, experience: 80 },
      completion: { coins: 1500, experience: 400, title: '🍂 Thương Gia Mùa Thu' }
    }
  },

  WINTER_MAGIC: {
    id: 'winter_magic',
    name: 'Phép thuật mùa đông',
    emoji: '❄️',
    description: 'Mùa đông huyền bí, cá băng huyền thoại xuất hiện',
    startMonth: 12, // Tháng 12
    endMonth: 2,    // Tháng 2
    duration: 12,   // 12 ngày (Giáng sinh + Tết)
    modifiers: {
      fishRateMultiplier: 0.9,
      rareFishBonus: 0.25, // Cá hiếm nhiều nhất
      experienceMultiplier: 1.5,
      coinMultiplier: 1.0
    },
    specialFish: [
      { name: 'Cá Tuyết Tinh', rarity: 'legendary', price: 1000 },
      { name: 'Rồng Băng Huyền Thoại', rarity: 'mythical', price: 3000 }
    ],
    specialLocation: 'ice_lake', // Ưu tiên hồ băng
    rewards: {
      daily: { coins: 150, experience: 200 },
      completion: { coins: 2000, experience: 1000, title: '❄️ Pháp Sư Băng Giá' }
    }
  },

  // Events đặc biệt không theo mùa
  LUNAR_NEW_YEAR: {
    id: 'lunar_new_year',
    name: 'Tết Nguyên Đán',
    emoji: '🧧',
    description: 'Tết cổ truyền, may mắn và thịnh vượng',
    isSpecial: true, // Event đặc biệt
    duration: 15,    // 15 ngày Tết
    modifiers: {
      fishRateMultiplier: 1.5,
      rareFishBonus: 0.2,
      experienceMultiplier: 2.0,
      coinMultiplier: 2.0 // Double xu!
    },
    specialFish: [
      { name: 'Cá Chép Vàng Thần Tài', rarity: 'mythical', price: 5000 },
      { name: 'Rồng Vàng Phú Quý', rarity: 'mythical', price: 8888 }
    ],
    rewards: {
      daily: { coins: 888, experience: 200 },
      completion: { coins: 8888, experience: 2000, title: '🧧 Thần Tài Câu Cá' }
    }
  },

  HALLOWEEN_SPOOKY: {
    id: 'halloween_spooky',
    name: 'Halloween Ma Quái',
    emoji: '🎃',
    description: 'Đêm Halloween, cá ma quái xuất hiện',
    isSpecial: true,
    duration: 3, // 3 ngày Halloween
    modifiers: {
      fishRateMultiplier: 0.8,
      rareFishBonus: 0.3,
      experienceMultiplier: 1.5,
      coinMultiplier: 1.2
    },
    specialFish: [
      { name: 'Cá Ma Đen', rarity: 'legendary', price: 666 },
      { name: 'Quái Vật Đáy Biển', rarity: 'mythical', price: 1666 }
    ],
    timeRestriction: 'night', // Chỉ hoạt động vào đêm
    rewards: {
      daily: { coins: 333, experience: 150 },
      completion: { coins: 1666, experience: 666, title: '🎃 Ma Vương Câu Cá' }
    }
  }
};

// Cache event hiện tại
let currentActiveEvents = [];
let lastEventCheck = 0;
const EVENT_CHECK_INTERVAL = 60 * 60 * 1000; // 1 giờ

// Admin controls - mặc định TẮT
let eventSystemEnabled = false;

/**
 * Kiểm tra events đang hoạt động
 */
export function getActiveEvents() {
  // Nếu hệ thống event bị tắt, không có event nào hoạt động
  if (!eventSystemEnabled) {
    return [];
  }
  
  const now = Date.now();
  
  // Kiểm tra lại mỗi giờ
  if (now - lastEventCheck > EVENT_CHECK_INTERVAL) {
    currentActiveEvents = checkActiveEvents();
    lastEventCheck = now;
  }
  
  return currentActiveEvents;
}

/**
 * Kiểm tra events nào đang hoạt động
 */
function checkActiveEvents() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-11 -> 1-12
  const currentHour = now.getHours();
  const active = [];
  
  for (const [key, event] of Object.entries(SEASONAL_EVENTS)) {
    let isActive = false;
    
    if (event.isSpecial) {
      // Events đặc biệt - cần logic riêng để kích hoạt
      // Ví dụ: admin có thể kích hoạt manually
      isActive = false; // Mặc định tắt, cần kích hoạt thủ công
    } else {
      // Events theo mùa
      if (event.startMonth <= event.endMonth) {
        // Cùng năm
        isActive = currentMonth >= event.startMonth && currentMonth <= event.endMonth;
      } else {
        // Qua năm (ví dụ: 12-2)
        isActive = currentMonth >= event.startMonth || currentMonth <= event.endMonth;
      }
    }
    
    // Kiểm tra giới hạn thời gian trong ngày
    if (isActive && event.timeRestriction) {
      if (event.timeRestriction === 'night') {
        isActive = currentHour >= 20 || currentHour <= 6;
      }
    }
    
    if (isActive) {
      active.push({
        key,
        ...event
      });
    }
  }
  
  return active;
}

/**
 * Lấy hệ số tổng hợp từ tất cả events đang hoạt động
 */
export function getEventModifiers() {
  const activeEvents = getActiveEvents();
  
  if (activeEvents.length === 0) {
    return {
      fishRateMultiplier: 1.0,
      rareFishBonus: 0,
      experienceMultiplier: 1.0,
      coinMultiplier: 1.0,
      activeEvents: []
    };
  }
  
  // Tính tổng hệ số (cộng dồn) với validation
  let fishRateMultiplier = 1.0;
  let rareFishBonus = 0;
  let experienceMultiplier = 1.0;
  let coinMultiplier = 1.0;
  
  for (const event of activeEvents) {
    if (event.modifiers) {
      // Validation cho mỗi modifier
      const eventFishRate = isNaN(event.modifiers.fishRateMultiplier) || !isFinite(event.modifiers.fishRateMultiplier) ? 1.0 : event.modifiers.fishRateMultiplier;
      const eventRareBonus = isNaN(event.modifiers.rareFishBonus) || !isFinite(event.modifiers.rareFishBonus) ? 0 : event.modifiers.rareFishBonus;
      const eventExpMult = isNaN(event.modifiers.experienceMultiplier) || !isFinite(event.modifiers.experienceMultiplier) ? 1.0 : event.modifiers.experienceMultiplier;
      const eventCoinMult = isNaN(event.modifiers.coinMultiplier) || !isFinite(event.modifiers.coinMultiplier) ? 1.0 : event.modifiers.coinMultiplier;
      
      fishRateMultiplier *= eventFishRate;
      rareFishBonus += eventRareBonus;
      experienceMultiplier *= eventExpMult;
      coinMultiplier *= eventCoinMult;
    }
  }
  
  // Final validation
  const safeModifiers = {
    fishRateMultiplier: isNaN(fishRateMultiplier) || !isFinite(fishRateMultiplier) ? 1.0 : Math.round(fishRateMultiplier * 100) / 100,
    rareFishBonus: isNaN(rareFishBonus) || !isFinite(rareFishBonus) ? 0 : Math.round(rareFishBonus * 100) / 100,
    experienceMultiplier: isNaN(experienceMultiplier) || !isFinite(experienceMultiplier) ? 1.0 : Math.round(experienceMultiplier * 100) / 100,
    coinMultiplier: isNaN(coinMultiplier) || !isFinite(coinMultiplier) ? 1.0 : Math.round(coinMultiplier * 100) / 100,
    activeEvents
  };
  
  console.log('Event modifiers calculated:', safeModifiers);
  return safeModifiers;
}

/**
 * Lấy cá đặc biệt từ events
 */
export function getEventSpecialFish() {
  const activeEvents = getActiveEvents();
  
  for (const event of activeEvents) {
    if (event.specialFish && event.specialFish.length > 0) {
      // 20% chance để có cá event
      if (Math.random() < 0.2) {
        const randomFish = event.specialFish[Math.floor(Math.random() * event.specialFish.length)];
        return {
          ...randomFish,
          isEventFish: true,
          eventName: event.name,
          eventEmoji: event.emoji
        };
      }
    }
  }
  
  return null;
}

/**
 * Kích hoạt event đặc biệt (cho admin)
 */
export function activateSpecialEvent(eventId, durationHours = null) {
  const event = SEASONAL_EVENTS[eventId];
  if (!event || !event.isSpecial) {
    return { success: false, message: 'Event không tồn tại hoặc không phải event đặc biệt' };
  }
  
  // Lưu thông tin kích hoạt (trong thực tế sẽ lưu vào database)
  const activationData = {
    eventId,
    startTime: Date.now(),
    duration: durationHours || event.duration,
    activatedBy: 'admin'
  };
  
  // Force refresh events
  currentActiveEvents = checkActiveEvents();
  lastEventCheck = Date.now();
  
  return { 
    success: true, 
    message: `Đã kích hoạt event ${event.name} trong ${activationData.duration} giờ`,
    data: activationData
  };
}

/**
 * Hiển thị thông tin events
 */
export function getEventDisplayInfo() {
  const activeEvents = getActiveEvents();
  const modifiers = getEventModifiers();
  
  if (!eventSystemEnabled) {
    return {
      hasEvents: false,
      message: '🌟 Hệ thống sự kiện đang tắt'
    };
  }
  
  if (activeEvents.length === 0) {
    return {
      hasEvents: false,
      message: '🌟 Hiện tại không có sự kiện nào đang diễn ra'
    };
  }
  
  const eventList = activeEvents.map(event => 
    `${event.emoji} **${event.name}**\n${event.description}`
  ).join('\n\n');
  
  const effectList = [];
  if (modifiers.fishRateMultiplier !== 1.0) {
    effectList.push(`🎣 Câu cá: ${Math.round(modifiers.fishRateMultiplier * 100)}%`);
  }
  if (modifiers.rareFishBonus > 0) {
    effectList.push(`✨ Cá hiếm: +${Math.round(modifiers.rareFishBonus * 100)}%`);
  }
  if (modifiers.experienceMultiplier !== 1.0) {
    effectList.push(`📈 Kinh nghiệm: ${Math.round(modifiers.experienceMultiplier * 100)}%`);
  }
  if (modifiers.coinMultiplier !== 1.0) {
    effectList.push(`💰 Xu: ${Math.round(modifiers.coinMultiplier * 100)}%`);
  }
  
  return {
    hasEvents: true,
    events: eventList,
    effects: effectList.join(' • '),
    count: activeEvents.length
  };
}

/**
 * Admin functions - Bật/tắt hệ thống events
 */
export function enableEventSystem() {
  eventSystemEnabled = true;
  // Force refresh events
  currentActiveEvents = checkActiveEvents();
  lastEventCheck = Date.now();
  return { success: true, message: '✅ Đã bật hệ thống sự kiện!' };
}

export function disableEventSystem() {
  eventSystemEnabled = false;
  currentActiveEvents = [];
  return { success: true, message: '❌ Đã tắt hệ thống sự kiện!' };
}

export function getEventSystemStatus() {
  return {
    eventEnabled: eventSystemEnabled,
    activeEventsCount: currentActiveEvents.length,
    status: `🎉 Hệ thống sự kiện: ${eventSystemEnabled ? '✅ BẬT' : '❌ TẮT'}`
  };
}
