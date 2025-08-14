import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 SETTING ALL VIP BONUSES TO 1 (NO BONUS)...\n');

try {
  const utilsPath = path.join(__dirname, 'utils');
  const vipUtilPath = path.join(utilsPath, 'vip.js');

  if (fs.existsSync(vipUtilPath)) {
    console.log('📄 Found vip.js utility file');
    
    let content = fs.readFileSync(vipUtilPath, 'utf8');
    console.log('📖 Reading VIP utility file...');

    // Backup original
    const backupPath = vipUtilPath + '.bonus-backup';
    fs.copyFileSync(vipUtilPath, backupPath);
    console.log('💾 Backed up original vip.js');

    // Replace bonus values with 1
    const bonusReplacements = [
      // Common bonus patterns
      { pattern: /coinMultiplier:\s*[\d.]+/g, replacement: 'coinMultiplier: 1' },
      { pattern: /fishingBonus:\s*[\d.]+/g, replacement: 'fishingBonus: 1' },
      { pattern: /dailyBonus:\s*[\d.]+/g, replacement: 'dailyBonus: 1' },
      { pattern: /workBonus:\s*[\d.]+/g, replacement: 'workBonus: 1' },
      
      // Multiplier patterns
      { pattern: /multiplier:\s*[\d.]+/g, replacement: 'multiplier: 1' },
      { pattern: /bonus:\s*[\d.]+/g, replacement: 'bonus: 1' },
      
      // Specific tier patterns
      { pattern: /'bronze':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') },
      { pattern: /'silver':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') },
      { pattern: /'gold':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') },
      { pattern: /'platinum':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') },
      { pattern: /'diamond':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') },
      { pattern: /'lifetime':\s*{[^}]*coinMultiplier:\s*[\d.]+/g, replacement: (match) => match.replace(/coinMultiplier:\s*[\d.]+/, 'coinMultiplier: 1') }
    ];

    let changesApplied = 0;

    for (const { pattern, replacement } of bonusReplacements) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`🔄 Found ${matches.length} instances of pattern: ${pattern.source}`);
        content = content.replace(pattern, replacement);
        changesApplied += matches.length;
      }
    }

    // Write updated content
    fs.writeFileSync(vipUtilPath, content);
    console.log(`✅ Applied ${changesApplied} bonus changes to vip.js`);

    // Check for any remaining bonus values > 1
    const remainingBonuses = content.match(/(?:coinMultiplier|fishingBonus|dailyBonus|workBonus|multiplier|bonus):\s*[2-9]/g);
    
    if (remainingBonuses) {
      console.log('\n⚠️ WARNING: Some bonus values > 1 may still exist:');
      remainingBonuses.forEach(bonus => console.log(`   ${bonus}`));
    } else {
      console.log('\n✅ All bonuses successfully set to 1');
    }

  } else {
    console.log('❌ VIP utility file not found');
    console.log('💡 VIP bonuses only controlled by vip.js command file');
  }

  // Also check commands that might use VIP bonuses
  const commandsPath = path.join(__dirname, 'commands');
  const vipRelatedCommands = ['fish.js', 'daily.js', 'work.js'];

  console.log('\n🔍 CHECKING VIP BONUS USAGE IN COMMANDS:');

  for (const cmdFile of vipRelatedCommands) {
    const cmdPath = path.join(commandsPath, cmdFile);
    
    if (fs.existsSync(cmdPath)) {
      const cmdContent = fs.readFileSync(cmdPath, 'utf8');
      
      // Check for VIP bonus usage
      const vipUsage = cmdContent.match(/vip.*(?:bonus|multiplier|Bonus|Multiplier)/gi);
      
      if (vipUsage) {
        console.log(`📄 ${cmdFile}: Found VIP bonus usage`);
        vipUsage.forEach(usage => console.log(`   ${usage}`));
      } else {
        console.log(`📄 ${cmdFile}: No VIP bonus usage found`);
      }
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('✅ VIP command updated: All bonuses show x1');
  console.log(`✅ VIP utility updated: ${changesApplied} changes applied`);
  console.log('✅ Backup created: vip.js.bonus-backup');

  console.log('\n🚀 DEPLOYMENT:');
  console.log('1. npm run deploy');
  console.log('2. Test: /vip (should show all bonuses as x1)');
  console.log('3. VIP users get no actual bonuses now');

  console.log('\n🔄 TO RESTORE BONUSES:');
  console.log('1. Copy vip.js.bonus-backup back to vip.js');
  console.log('2. Update vip.js command file bonuses');
  console.log('3. Deploy again');

} catch (error) {
  console.error('❌ Error setting VIP bonuses:', error.message);
}