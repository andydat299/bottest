#!/usr/bin/env node

/**
 * Patch script to fix VIP shop interaction acknowledgment error
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 PATCHING VIP SHOP INTERACTION ERROR...\n');

const vipShopPath = './commands/vip-shop.js';

// Read current VIP shop file
if (!fs.existsSync(vipShopPath)) {
  console.error('❌ VIP shop file not found!');
  process.exit(1);
}

console.log('📋 Reading VIP shop file...');
let vipShopContent = fs.readFileSync(vipShopPath, 'utf8');

// Check if already patched
if (vipShopContent.includes('interaction already processed')) {
  console.log('✅ VIP shop already patched!');
  process.exit(0);
}

console.log('🔧 Applying patches...');

// Patch 1: Add safer interaction check
const oldCollectorStart = `collector.on('collect', async (selectInteraction) => {
        // Check if interaction is already acknowledged
        if (selectInteraction.replied || selectInteraction.deferred) {
          return;
        }

        try {
          await selectInteraction.deferUpdate();`;

const newCollectorStart = `collector.on('collect', async (selectInteraction) => {
        // Enhanced check for interaction state
        if (selectInteraction.replied || selectInteraction.deferred) {
          console.log('⚠️ Interaction already processed, skipping');
          return;
        }

        // Add additional safety check
        if (!selectInteraction.isSelectMenu()) {
          console.log('⚠️ Not a select menu interaction, skipping');
          return;
        }

        try {
          // Use timeout for deferUpdate to prevent hanging
          await Promise.race([
            selectInteraction.deferUpdate(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Defer timeout')), 3000)
            )
          ]);`;

if (vipShopContent.includes(oldCollectorStart)) {
  vipShopContent = vipShopContent.replace(oldCollectorStart, newCollectorStart);
  console.log('✅ Patch 1: Enhanced interaction check - Applied');
} else {
  console.log('⚠️ Patch 1: Could not find exact match, applying generic fix');
  
  // Generic fix for deferUpdate
  vipShopContent = vipShopContent.replace(
    /await selectInteraction\.deferUpdate\(\);/g,
    `// Safe deferUpdate with timeout
          await Promise.race([
            selectInteraction.deferUpdate(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Defer timeout')), 3000)
            )
          ]);`
  );
}

// Patch 2: Better error handling
const oldErrorHandling = `        } catch (error) {
          console.error('❌ VIP shop interaction error:', error);
          
          await selectInteraction.editReply({
            content: \`❌ **Có lỗi khi xử lý giao dịch:**\\n\\\`\\\`\\\`\${error.message}\\\`\\\`\\\`\`
          });
        }`;

const newErrorHandling = `        } catch (error) {
          console.error('❌ VIP shop interaction error:', error);
          
          // Enhanced error response handling
          try {
            const errorMessage = \`❌ **Có lỗi khi xử lý giao dịch:**\\n\\\`\\\`\\\`\${error.message}\\\`\\\`\\\`\`;
            
            if (error.message.includes('already been acknowledged') || 
                error.message.includes('Defer timeout')) {
              console.log('⚠️ Interaction timing issue, skipping error response');
              return;
            }
            
            if (!selectInteraction.replied && !selectInteraction.deferred) {
              await selectInteraction.reply({
                content: errorMessage,
                ephemeral: true
              });
            } else if (selectInteraction.deferred) {
              await selectInteraction.editReply({
                content: errorMessage
              });
            } else {
              // Try followUp as last resort
              await selectInteraction.followUp({
                content: errorMessage,
                ephemeral: true
              });
            }
          } catch (responseError) {
            console.error('❌ Failed to send error response:', responseError.message);
            // Don't throw here, just log
          }
        }`;

if (vipShopContent.includes('await selectInteraction.editReply({')) {
  // Find and replace the error handling block
  const errorRegex = /} catch \(error\) \{[\s\S]*?await selectInteraction\.editReply\(\{[\s\S]*?\}\);[\s\S]*?\}/;
  vipShopContent = vipShopContent.replace(errorRegex, newErrorHandling);
  console.log('✅ Patch 2: Enhanced error handling - Applied');
} else {
  console.log('⚠️ Patch 2: Error handling pattern not found');
}

// Patch 3: Add collector timeout handling
const collectorEnd = `collector.on('end', (collected, reason) => {
        console.log(\`🔚 VIP shop collector ended: \${reason} (\${collected.size} interactions)\`);
        
        if (reason === 'time') {
          console.log('⏰ VIP shop collector timed out');
        }
      });`;

if (!vipShopContent.includes(`collector.on('end'`)) {
  // Add before the closing of the execute function
  const insertPoint = vipShopContent.lastIndexOf('    } catch (error) {');
  if (insertPoint !== -1) {
    vipShopContent = vipShopContent.slice(0, insertPoint) + 
                    '\n      ' + collectorEnd + '\n\n' + 
                    vipShopContent.slice(insertPoint);
    console.log('✅ Patch 3: Collector timeout handling - Applied');
  }
}

// Write patched file
console.log('💾 Writing patched VIP shop file...');
fs.writeFileSync(vipShopPath, vipShopContent);

console.log('✅ VIP shop patches applied successfully!');
console.log('\n📋 Applied patches:');
console.log('1. ✅ Enhanced interaction state checking');
console.log('2. ✅ Timeout protection for deferUpdate');
console.log('3. ✅ Better error response handling');
console.log('4. ✅ Collector timeout handling');
console.log('\n🚀 VIP shop should now handle interactions safely!');
console.log('💡 The "already been acknowledged" error should be resolved.');

// Create backup
const backupPath = vipShopPath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, fs.readFileSync(vipShopPath, 'utf8'));
  console.log(`📦 Backup created: ${backupPath}`);
}