// List các files có thể duplicate command names:

// VIP Admin commands:
// - vip-admin.js ✅ (main)
// - vip-admin-new.js ❌ (delete)
// - vip-admin-replace.js ❌ (delete) 
// - vip-admin-fixed.js ❌ (delete)
// - vip-admin-clean.js ❌ (delete)

// Repair cost commands:
// - repair-cost-admin.js ✅ (new)
// - repair-costs.js ✅ (new)

// Auto-fishing commands:
// - auto-fishing.js ✅ (main)
// - stop-autofish.js ✅ (main)
// - autofish-status.js ✅ (new)
// - debug-autofish.js ✅ (new)
// - reset-autofish-quota.js ✅ (new)
// - check-quota.js ✅ (new)

// MANUAL STEPS TO FIX:
// 1. Delete duplicate files:
console.log('Files to delete:');
console.log('- vip-admin-new.js');
console.log('- vip-admin-replace.js'); 
console.log('- vip-admin-fixed.js');
console.log('- vip-admin-clean.js');

// 2. Ensure only one command per file name
// 3. Check for any other duplicate .js files in commands folder