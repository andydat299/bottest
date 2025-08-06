/**
 * Command Control System - Hệ thống quản lý bật/tắt lệnh
 */

// Danh sách lệnh có thể bị disable
const CONTROLLABLE_COMMANDS = [
  'sell',
  'fish', 
  'upgrade',
  'repair',
  'inventory',
  'stats',
  'profile',
  'quests'
];

// Set chứa các lệnh bị disable
let disabledCommands = new Set();

/**
 * Kiểm tra xem lệnh có bị disable không
 */
export function isCommandDisabled(commandName) {
  return disabledCommands.has(commandName);
}

/**
 * Disable một lệnh
 */
export function disableCommand(commandName) {
  if (!CONTROLLABLE_COMMANDS.includes(commandName)) {
    return {
      success: false,
      message: `❌ Lệnh "${commandName}" không thể bị disable!`
    };
  }
  
  disabledCommands.add(commandName);
  return {
    success: true,
    message: `🔒 Đã TẮT lệnh "/${commandName}"!`
  };
}

/**
 * Enable một lệnh
 */
export function enableCommand(commandName) {
  if (!CONTROLLABLE_COMMANDS.includes(commandName)) {
    return {
      success: false,
      message: `❌ Lệnh "${commandName}" không tồn tại trong danh sách quản lý!`
    };
  }
  
  disabledCommands.delete(commandName);
  return {
    success: true,
    message: `🔓 Đã BẬT lệnh "/${commandName}"!`
  };
}

/**
 * Lấy danh sách lệnh bị disable
 */
export function getDisabledCommands() {
  return Array.from(disabledCommands);
}

/**
 * Lấy danh sách tất cả lệnh có thể quản lý
 */
export function getControllableCommands() {
  return [...CONTROLLABLE_COMMANDS];
}

/**
 * Lấy trạng thái của tất cả lệnh
 */
export function getCommandStatus() {
  const status = {};
  for (const cmd of CONTROLLABLE_COMMANDS) {
    status[cmd] = !disabledCommands.has(cmd) ? '✅ Enabled' : '❌ Disabled';
  }
  
  return {
    totalCommands: CONTROLLABLE_COMMANDS.length,
    disabledCount: disabledCommands.size,
    enabledCount: CONTROLLABLE_COMMANDS.length - disabledCommands.size,
    commands: status,
    disabledList: Array.from(disabledCommands)
  };
}

/**
 * Reset tất cả lệnh về enabled
 */
export function resetAllCommands() {
  const previouslyDisabled = Array.from(disabledCommands);
  disabledCommands.clear();
  
  return {
    success: true,
    message: `🔄 Đã reset tất cả lệnh! Đã bật lại ${previouslyDisabled.length} lệnh.`,
    resetCommands: previouslyDisabled
  };
}
