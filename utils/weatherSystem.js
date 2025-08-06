/**
 * Weather System - Hệ thống thời tiết ảnh hưởng câu cá
 */

const WEATHER_TYPES = {
  SUNNY: {
    name: 'Nắng',
    emoji: '☀️',
    description: 'Trời nắng đẹp, cá hoạt động bình thường',
    fishRateMultiplier: 1.0,
    rareFishBonus: 0,
    weight: 30
  },
  CLOUDY: {
    name: 'Nhiều mây',
    emoji: '☁️', 
    description: 'Trời nhiều mây, cá dễ câu hơn',
    fishRateMultiplier: 1.1,
    rareFishBonus: 0.05,
    weight: 25
  },
  RAINY: {
    name: 'Mưa',
    emoji: '🌧️',
    description: 'Trời mưa, cá rất hoạt động',
    fishRateMultiplier: 1.3,
    rareFishBonus: 0.1,
    weight: 20
  },
  STORMY: {
    name: 'Bão',
    emoji: '⛈️',
    description: 'Trời bão, khó câu nhưng cá hiếm xuất hiện',
    fishRateMultiplier: 0.7,
    rareFishBonus: 0.2,
    weight: 8
  },
  FOGGY: {
    name: 'Sương mù',
    emoji: '🌫️',
    description: 'Sương mù dày đặc, cá huyền bí xuất hiện',
    fishRateMultiplier: 0.9,
    rareFishBonus: 0.15,
    weight: 12
  },
  WINDY: {
    name: 'Gió mạnh',
    emoji: '💨',
    description: 'Gió mạnh, cá nhảy nhiều hơn',
    fishRateMultiplier: 1.2,
    rareFishBonus: 0.08,
    weight: 15
  }
};

const TIME_PERIODS = {
  DAWN: {
    name: 'Bình minh',
    emoji: '🌅',
    hours: [5, 6, 7],
    description: 'Buổi bình minh, cá rất hoạt động',
    fishRateMultiplier: 1.2,
    rareFishBonus: 0.1
  },
  MORNING: {
    name: 'Buổi sáng',
    emoji: '🌞',
    hours: [8, 9, 10, 11],
    description: 'Buổi sáng, thời gian tốt để câu cá',
    fishRateMultiplier: 1.1,
    rareFishBonus: 0.05
  },
  NOON: {
    name: 'Buổi trưa',
    emoji: '🌇',
    hours: [12, 13, 14, 15],
    description: 'Buổi trưa, cá ít hoạt động',
    fishRateMultiplier: 0.8,
    rareFishBonus: 0
  },
  AFTERNOON: {
    name: 'Buổi chiều',
    emoji: '🌆',
    hours: [16, 17, 18],
    description: 'Buổi chiều, cá bắt đầu hoạt động trở lại',
    fishRateMultiplier: 1.0,
    rareFishBonus: 0.03
  },
  EVENING: {
    name: 'Buổi tối',
    emoji: '🌃',
    hours: [19, 20, 21],
    description: 'Buổi tối, cá đêm xuất hiện',
    fishRateMultiplier: 1.15,
    rareFishBonus: 0.08
  },
  NIGHT: {
    name: 'Đêm khuya',
    emoji: '🌙',
    hours: [22, 23, 0, 1, 2, 3, 4],
    description: 'Đêm khuya, cá đêm hiếm xuất hiện',
    fishRateMultiplier: 0.9,
    rareFishBonus: 0.15
  }
};

// Cache thời tiết (reset mỗi 30 phút)
let currentWeather = null;
let weatherLastUpdate = 0;
const WEATHER_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 phút

/**
 * Lấy thời tiết hiện tại
 */
export function getCurrentWeather() {
  const now = Date.now();
  
  // Kiểm tra nếu cần update thời tiết
  if (!currentWeather || (now - weatherLastUpdate) > WEATHER_UPDATE_INTERVAL) {
    currentWeather = generateRandomWeather();
    weatherLastUpdate = now;
  }
  
  return currentWeather;
}

/**
 * Tạo thời tiết ngẫu nhiên dựa trên weight
 */
function generateRandomWeather() {
  const totalWeight = Object.values(WEATHER_TYPES).reduce((sum, weather) => sum + weather.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [key, weather] of Object.entries(WEATHER_TYPES)) {
    random -= weather.weight;
    if (random <= 0) {
      return {
        type: key,
        ...weather
      };
    }
  }
  
  // Fallback
  return {
    type: 'SUNNY',
    ...WEATHER_TYPES.SUNNY
  };
}

/**
 * Lấy thời gian hiện tại (theo giờ Việt Nam)
 */
export function getCurrentTimePeriod() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  const hour = vietnamTime.getUTCHours();
  
  for (const [key, period] of Object.entries(TIME_PERIODS)) {
    if (period.hours.includes(hour)) {
      return {
        type: key,
        hour,
        ...period
      };
    }
  }
  
  // Fallback
  return {
    type: 'MORNING',
    hour,
    ...TIME_PERIODS.MORNING
  };
}

/**
 * Tính hệ số ảnh hưởng tổng hợp từ thời tiết và thời gian
 */
export function getEnvironmentModifiers() {
  const weather = getCurrentWeather();
  const timePeriod = getCurrentTimePeriod();
  
  // Tổng hợp hệ số
  const fishRateMultiplier = weather.fishRateMultiplier * timePeriod.fishRateMultiplier;
  const rareFishBonus = weather.rareFishBonus + timePeriod.rareFishBonus;
  
  return {
    weather,
    timePeriod,
    modifiers: {
      fishRateMultiplier: Math.round(fishRateMultiplier * 100) / 100, // Làm tròn 2 chữ số
      rareFishBonus: Math.round(rareFishBonus * 100) / 100,
      combinedMultiplier: fishRateMultiplier
    }
  };
}

/**
 * Áp dụng hệ số môi trường vào tỷ lệ câu hụt
 */
export function applyEnvironmentToMissRate(baseMissRate) {
  const { modifiers } = getEnvironmentModifiers();
  
  // Hệ số tích cực giảm tỷ lệ câu hụt
  const adjustedMissRate = baseMissRate / modifiers.fishRateMultiplier;
  
  return Math.min(0.8, Math.max(0.05, adjustedMissRate)); // Giới hạn 5%-80%
}

/**
 * Kiểm tra xem có được bonus cá hiếm không
 */
export function shouldGetRareFishBonus() {
  const { modifiers } = getEnvironmentModifiers();
  return Math.random() < modifiers.rareFishBonus;
}

/**
 * Lấy thông tin môi trường để hiển thị
 */
export function getEnvironmentDisplay() {
  const { weather, timePeriod, modifiers } = getEnvironmentModifiers();
  
  const effectDescription = [];
  
  if (modifiers.fishRateMultiplier > 1.0) {
    effectDescription.push('🎣 Dễ câu hơn');
  } else if (modifiers.fishRateMultiplier < 1.0) {
    effectDescription.push('🎣 Khó câu hơn');
  }
  
  if (modifiers.rareFishBonus > 0) {
    effectDescription.push('✨ Tăng cá hiếm');
  }
  
  return {
    weather: `${weather.emoji} ${weather.name}`,
    time: `${timePeriod.emoji} ${timePeriod.name}`,
    effects: effectDescription.join(', ') || 'Bình thường',
    details: {
      weatherDesc: weather.description,
      timeDesc: timePeriod.description,
      multiplier: `${Math.round(modifiers.fishRateMultiplier * 100)}%`,
      rareBonus: `+${Math.round(modifiers.rareFishBonus * 100)}%`
    }
  };
}

/**
 * Force update thời tiết (cho admin)
 */
export function forceUpdateWeather() {
  currentWeather = generateRandomWeather();
  weatherLastUpdate = Date.now();
  return currentWeather;
}
