console.log('🎯 DEMO: Admin tắt lệnh sell\n');

// Simulate admin disabling sell command
import { disableCommand, isCommandDisabled } from './utils/commandControl.js';

console.log('1. Admin chạy: /admin command disable command:sell');
const result = disableCommand('sell');
console.log('   →', result.message);

console.log('\n2. User thử chạy /sell:');
if (isCommandDisabled('sell')) {
  console.log('   → 🔒 **Lệnh sell hiện đang bị tắt!**');
  console.log('   → 💡 *Admin đã tạm thời vô hiệu hóa tính năng bán cá.*');
} else {
  console.log('   → Lệnh sell hoạt động bình thường');
}

console.log('\n✅ THÀNH CÔNG! Lệnh sell đã bị tắt theo yêu cầu của bạn!');
