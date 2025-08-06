/**
 * Utility để quản lý độ bền cần câu
 */

/**
 * Lấy độ bền tối đa theo rod level
 * @param {number} rodLevel - Cấp cần câu
 * @returns {number} - Độ bền tối đa
 */
export function getMaxDurability(rodLevel) {
  // Độ bền tăng theo level: 100 + (level-1) * 20
  return 100 + (rodLevel - 1) * 20;
}

/**
 * Tính toán độ hao mòn khi câu cá
 * @param {number} rodLevel - Cấp cần câu
 * @param {boolean} isMiss - Có phải câu hụt không
 * @returns {number} - Độ hao mòn
 */
export function calculateDurabilityLoss(rodLevel, isMiss = false) {
  // Cần cao cấp hư ít hơn
  const baseLoss = Math.max(10 - rodLevel, 2); // Từ 9 xuống 2
  
  // Câu hụt làm hư nhiều hơn
  const missMultiplier = isMiss ? 1.5 : 1;
  
  // Random từ 50% đến 150% base loss
  const randomFactor = 0.5 + Math.random();
  
  return Math.floor(baseLoss * missMultiplier * randomFactor);
}

/**
 * Tính phí sửa chữa cần câu
 * @param {number} rodLevel - Cấp cần câu
 * @param {number} currentDurability - Độ bền hiện tại
 * @param {number} maxDurability - Độ bền tối đa
 * @param {string} repairType - Loại sửa chữa (full, partial, minimal)
 * @returns {number} - Phí sửa chữa theo loại
 */
export function calculateRepairCost(rodLevel, currentDurability, maxDurability, repairType = 'full') {
  // Phí sửa chữa theo loại
  const repairCosts = {
    full: 75,      // Hoàn toàn (100%)
    partial: 50,   // Một phần (50%)
    minimal: 25    // Tối thiểu (25%)
  };
  
  return repairCosts[repairType] || 75;
}

/**
 * Kiểm tra xem cần câu có bị hỏng hoàn toàn không
 * @param {number} durability - Độ bền hiện tại
 * @returns {boolean}
 */
export function isRodBroken(durability) {
  return durability <= 0;
}

/**
 * Tính hiệu suất câu cá dựa trên độ bền
 * @param {number} currentDurability - Độ bền hiện tại
 * @param {number} maxDurability - Độ bền tối đa
 * @returns {number} - Hệ số hiệu suất (0.3 - 1.0)
 */
export function getDurabilityEfficiency(currentDurability, maxDurability) {
  const durabilityPercent = currentDurability / maxDurability;
  
  // Hiệu suất giảm từ 100% xuống 30% khi độ bền giảm
  return Math.max(0.3, durabilityPercent);
}

/**
 * Lấy emoji trạng thái độ bền
 * @param {number} currentDurability - Độ bền hiện tại
 * @param {number} maxDurability - Độ bền tối đa
 * @returns {string} - Emoji trạng thái
 */
export function getDurabilityEmoji(currentDurability, maxDurability) {
  const percent = (currentDurability / maxDurability) * 100;
  
  if (percent >= 80) return '🟢'; // Tốt
  if (percent >= 60) return '🟡'; // Khá
  if (percent >= 40) return '🟠'; // Trung bình
  if (percent >= 20) return '🔴'; // Kém
  if (percent > 0) return '💀';   // Sắp hỏng
  return '💥';                     // Đã hỏng
}

/**
 * Lấy mô tả trạng thái độ bền
 * @param {number} currentDurability - Độ bền hiện tại
 * @param {number} maxDurability - Độ bền tối đa
 * @returns {string} - Mô tả trạng thái
 */
export function getDurabilityStatus(currentDurability, maxDurability) {
  const percent = (currentDurability / maxDurability) * 100;
  
  if (percent >= 80) return 'Tuyệt vời';
  if (percent >= 60) return 'Tốt';
  if (percent >= 40) return 'Khá';
  if (percent >= 20) return 'Kém';
  if (percent > 0) return 'Sắp hỏng';
  return 'Đã hỏng';
}
