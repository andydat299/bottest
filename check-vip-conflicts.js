#!/usr/bin/env node

import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 VIP System Conflict Checker...\n');

const conflicts = [];
const warnings = [];

// 1. Check for command name conflicts
console.log('📋 Checking command conflicts...');

const commandsDir = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsDir).filter(file => file.endsWith('.js'));

const commandNames = new Set();
const duplicateCommands = [];

for (const file of commandFiles) {
  try {
    const commandPath = join(commandsDir, file);
    const command = await import(`file://${commandPath}`);
    
    if (command.default?.data?.name) {
      const name = command.default.data.name;
      
      if (commandNames.has(name)) {
        duplicateCommands.push(name);
        conflicts.push(`❌ Duplicate command name: /${name} (${file})`);
      } else {
        commandNames.add(name);
      }
    }
  } catch (error) {
    warnings.push(`⚠️ Could not load command: ${file} - ${error.message}`);
  }
}

console.log(`   - Total commands: ${commandNames.size}`);
console.log(`   - Duplicates found: ${duplicateCommands.length}`);

// 2. Check for schema conflicts
console.log('\n📊 Checking schema conflicts...');

const schemasDir = join(__dirname, 'schemas');
const schemaFiles = readdirSync(schemasDir).filter(file => file.endsWith('.js'));

const modelNames = new Set();
const duplicateModels = [];

for (const file of schemaFiles) {
  try {
    const schemaPath = join(schemasDir, file);
    const schema = await import(`file://${schemaPath}`);
    
    // Check for exported models
    for (const [exportName, exportValue] of Object.entries(schema)) {
      if (exportValue?.modelName) {
        const modelName = exportValue.modelName;
        
        if (modelNames.has(modelName)) {
          duplicateModels.push(modelName);
          conflicts.push(`❌ Duplicate model name: ${modelName} (${file})`);
        } else {
          modelNames.add(modelName);
        }
      }
    }
  } catch (error) {
    warnings.push(`⚠️ Could not load schema: ${file} - ${error.message}`);
  }
}

console.log(`   - Total models: ${modelNames.size}`);
console.log(`   - Duplicates found: ${duplicateModels.length}`);

// 3. Check for utility function conflicts
console.log('\n🛠️ Checking utility conflicts...');

const utilsDir = join(__dirname, 'utils');
const utilFiles = readdirSync(utilsDir).filter(file => file.endsWith('.js'));

const functionNames = new Set();
const duplicateFunctions = [];

for (const file of utilFiles) {
  try {
    const utilPath = join(utilsDir, file);
    const util = await import(`file://${utilPath}`);
    
    for (const [exportName] of Object.entries(util)) {
      if (functionNames.has(exportName)) {
        duplicateFunctions.push(exportName);
        conflicts.push(`❌ Duplicate function export: ${exportName} (${file})`);
      } else {
        functionNames.add(exportName);
      }
    }
  } catch (error) {
    warnings.push(`⚠️ Could not load utility: ${file} - ${error.message}`);
  }
}

console.log(`   - Total exports: ${functionNames.size}`);
console.log(`   - Duplicates found: ${duplicateFunctions.length}`);

// 4. Check for VIP system specific conflicts
console.log('\n👑 Checking VIP system specific conflicts...');

// Check if User schema has conflicting VIP fields
try {
  const { User } = await import('./schemas/userSchema.js');
  const userSchema = User.schema;
  
  // Check for VIP-related fields that might conflict
  const vipFields = ['vipStatus', 'vipTier', 'vipExpires', 'vipBenefits'];
  const existingVipFields = [];
  
  for (const field of vipFields) {
    if (userSchema.paths[field]) {
      existingVipFields.push(field);
      warnings.push(`⚠️ User schema already has VIP field: ${field}`);
    }
  }
  
  console.log(`   - VIP fields in User schema: ${existingVipFields.length}`);
} catch (error) {
  warnings.push(`⚠️ Could not check User schema: ${error.message}`);
}

// Check for fishing system conflicts with VIP
try {
  const fishMissManager = await import('./utils/fishMissRateManager.js');
  const vipManager = await import('./utils/vipManager.js');
  
  // Check for function name conflicts between managers
  const fishFunctions = Object.keys(fishMissManager);
  const vipFunctions = Object.keys(vipManager);
  
  const sharedFunctions = fishFunctions.filter(fn => vipFunctions.includes(fn));
  
  if (sharedFunctions.length > 0) {
    conflicts.push(`❌ Shared functions between fishMissRateManager and vipManager: ${sharedFunctions.join(', ')}`);
  }
  
  console.log(`   - Fish manager functions: ${fishFunctions.length}`);
  console.log(`   - VIP manager functions: ${vipFunctions.length}`);
  console.log(`   - Shared functions: ${sharedFunctions.length}`);
} catch (error) {
  warnings.push(`⚠️ Could not check manager conflicts: ${error.message}`);
}

// 5. Check for database collection conflicts
console.log('\n🗄️ Checking database collection conflicts...');

const expectedCollections = [
  'users', 'dailyrewards', 'globalstats', 'vips', 'mysteryboxes'
];

// Check for potential collection name conflicts
const collectionConflicts = [];
const collectionNames = new Set();

for (const collection of expectedCollections) {
  if (collectionNames.has(collection)) {
    collectionConflicts.push(collection);
    conflicts.push(`❌ Duplicate collection name: ${collection}`);
  } else {
    collectionNames.add(collection);
  }
}

console.log(`   - Expected collections: ${expectedCollections.length}`);
console.log(`   - Conflicts found: ${collectionConflicts.length}`);

// 6. Check for command permission conflicts
console.log('\n🔐 Checking permission conflicts...');

const adminCommands = [];
const userCommands = [];

for (const file of commandFiles) {
  try {
    const commandPath = join(commandsDir, file);
    const command = await import(`file://${commandPath}`);
    
    if (command.default?.data) {
      const hasAdminPerms = command.default.data.default_member_permissions || 
                           command.default.data.defaultMemberPermissions;
      
      if (hasAdminPerms) {
        adminCommands.push(command.default.data.name);
      } else {
        userCommands.push(command.default.data.name);
      }
    }
  } catch (error) {
    // Skip failed imports
  }
}

console.log(`   - Admin commands: ${adminCommands.length}`);
console.log(`   - User commands: ${userCommands.length}`);

// Summary
console.log('\n📋 CONFLICT CHECK SUMMARY:');
console.log('='.repeat(50));

if (conflicts.length === 0) {
  console.log('✅ No critical conflicts found!');
} else {
  console.log(`❌ ${conflicts.length} conflicts found:`);
  conflicts.forEach(conflict => console.log(`   ${conflict}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️ ${warnings.length} warnings:`);
  warnings.forEach(warning => console.log(`   ${warning}`));
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('-'.repeat(30));

if (conflicts.length === 0 && warnings.length === 0) {
  console.log('🎉 VIP System is ready to deploy!');
  console.log('✅ No conflicts detected');
  console.log('✅ All systems appear compatible');
} else {
  console.log('🔧 Issues to address before deployment:');
  
  if (duplicateCommands.length > 0) {
    console.log('• Rename duplicate commands');
  }
  
  if (duplicateModels.length > 0) {
    console.log('• Resolve model name conflicts');
  }
  
  if (duplicateFunctions.length > 0) {
    console.log('• Rename conflicting functions');
  }
  
  if (warnings.length > 5) {
    console.log('• Review and resolve warnings');
  }
}

console.log('\n🚀 Next steps:');
console.log('1. Fix any conflicts listed above');
console.log('2. Run `npm run deploy` to update commands');
console.log('3. Test VIP system in development');
console.log('4. Deploy to production when ready');

// Exit with appropriate code
process.exit(conflicts.length > 0 ? 1 : 0);