#!/usr/bin/env node

/**
 * Fix Bot Command Deployment
 * Diagnose and fix command registration issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 FIXING BOT COMMAND DEPLOYMENT\n');

console.log('🔍 COMMON COMMAND DEPLOYMENT ISSUES:');
console.log('❌ Missing deploy-commands.js script');
console.log('❌ Commands not registered with Discord API');
console.log('❌ Wrong application ID or token');
console.log('❌ Commands folder structure changed');
console.log('❌ Export format issues in command files');

console.log('\n📊 CHECKING COMMAND STRUCTURE...');

// Check commands directory
const commandsDir = './commands';
if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir)
    .filter(file => file.endsWith('.js'));
  
  console.log(`✅ Commands directory found: ${commandFiles.length} files`);
  
  // Check each command file format
  let validCommands = 0;
  let invalidCommands = 0;
  
  commandFiles.forEach(file => {
    try {
      const filePath = path.join(commandsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for proper export format
      const hasDefaultExport = content.includes('export default');
      const hasDataProperty = content.includes('.setName(') || content.includes('data:');
      const hasExecuteFunction = content.includes('execute(') || content.includes('async execute');
      
      if (hasDefaultExport && hasDataProperty && hasExecuteFunction) {
        console.log(`  ✅ ${file} - Valid format`);
        validCommands++;
      } else {
        console.log(`  ❌ ${file} - Invalid format`);
        console.log(`     Default export: ${hasDefaultExport ? '✅' : '❌'}`);
        console.log(`     Data property: ${hasDataProperty ? '✅' : '❌'}`);
        console.log(`     Execute function: ${hasExecuteFunction ? '✅' : '❌'}`);
        invalidCommands++;
      }
    } catch (error) {
      console.log(`  ❌ ${file} - Error reading: ${error.message}`);
      invalidCommands++;
    }
  });
  
  console.log(`\n📊 Command Analysis:`);
  console.log(`   ✅ Valid commands: ${validCommands}`);
  console.log(`   ❌ Invalid commands: ${invalidCommands}`);
  
} else {
  console.log('❌ Commands directory not found!');
}

console.log('\n🚀 CREATING DEPLOY-COMMANDS SCRIPT...');

const deployCommandsScript = `import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Discord bot credentials
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for guild-specific commands
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLIENT_ID:', clientId ? '✅ Set' : '❌ Missing');
  console.error('   DISCORD_TOKEN:', token ? '✅ Set' : '❌ Missing');
  console.error('   GUILD_ID:', guildId ? '✅ Set' : '⚪ Optional (for guild commands)');
  process.exit(1);
}

const commands = [];

// Load all command files
const commandsPath = path.join(process.cwd(), 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Commands directory not found:', commandsPath);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(\`🔍 Loading \${commandFiles.length} command files...\`);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    const command = await import(filePath);
    
    if ('data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
      console.log(\`  ✅ Loaded: \${command.default.data.name}\`);
    } else {
      console.log(\`  ❌ Invalid command format: \${file}\`);
      console.log(\`     Missing 'data' or 'execute' property\`);
    }
  } catch (error) {
    console.error(\`  ❌ Error loading \${file}:\`, error.message);
  }
}

if (commands.length === 0) {
  console.error('❌ No valid commands found to deploy!');
  process.exit(1);
}

console.log(\`\\n🚀 Deploying \${commands.length} commands...\`);

// Create REST instance and deploy commands
const rest = new REST().setToken(token);

try {
  console.log('🔄 Started refreshing application (/) commands.');

  let data;
  
  if (guildId) {
    // Deploy to specific guild (faster for testing)
    data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    console.log(\`✅ Successfully deployed \${data.length} guild commands.\`);
  } else {
    // Deploy globally (takes up to 1 hour to propagate)
    data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log(\`✅ Successfully deployed \${data.length} global commands.\`);
    console.log('⏰ Global commands may take up to 1 hour to appear everywhere.');
  }

  console.log('\\n📋 Deployed commands:');
  data.forEach(cmd => {
    console.log(\`   • /\${cmd.name} - \${cmd.description}\`);
  });

  console.log('\\n✅ Command deployment completed!');
  
} catch (error) {
  console.error('❌ Command deployment failed:', error);
  
  if (error.code === 50001) {
    console.error('💡 This error usually means missing permissions or wrong CLIENT_ID');
  } else if (error.code === 50013) {
    console.error('💡 This error means the bot lacks permissions in the guild');
  }
  
  process.exit(1);
}`;

fs.writeFileSync('./deploy-commands.js', deployCommandsScript);
console.log('✅ Created deploy-commands.js');

console.log('\n🔧 CREATING PACKAGE.JSON SCRIPTS...');

const packageJsonPath = './package.json';
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['deploy'] = 'node deploy-commands.js';
    packageJson.scripts['deploy-guild'] = 'GUILD_ID=YOUR_GUILD_ID node deploy-commands.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added deploy scripts to package.json');
  } catch (error) {
    console.log('⚠️ Could not update package.json:', error.message);
  }
} else {
  console.log('⚠️ package.json not found');
}

console.log('\n🌍 ENVIRONMENT VARIABLES NEEDED:');
console.log('CLIENT_ID=your_bot_application_id');
console.log('DISCORD_TOKEN=your_bot_token');
console.log('GUILD_ID=your_server_id (optional, for faster testing)');

console.log('\n🚀 DEPLOYMENT COMMANDS:');
console.log('# Deploy to specific guild (fast, for testing):');
console.log('GUILD_ID=your_guild_id node deploy-commands.js');
console.log('');
console.log('# Deploy globally (slow, for production):');
console.log('node deploy-commands.js');
console.log('');
console.log('# Using npm scripts:');
console.log('npm run deploy        # Global deployment');
console.log('npm run deploy-guild  # Guild deployment (edit GUILD_ID first)');

console.log('\n🔍 RAILWAY DEPLOYMENT:');
console.log('1. Add environment variables to Railway:');
console.log('   • CLIENT_ID');
console.log('   • DISCORD_TOKEN');
console.log('   • GUILD_ID (optional)');
console.log('');
console.log('2. Deploy with Railway:');
console.log('   git add .');
console.log('   git commit -m "Add: Command deployment script"');
console.log('   git push');
console.log('');
console.log('3. Run deployment on Railway:');
console.log('   railway run node deploy-commands.js');
console.log('   # Or add as Railway service command');

console.log('\n🧪 TESTING DEPLOYMENT:');
console.log('1. Run deploy script locally first');
console.log('2. Check Discord server for slash commands');
console.log('3. Test a simple command like /fish');
console.log('4. If working, deploy to Railway');

console.log('\n🚨 TROUBLESHOOTING:');
console.log('❌ "Missing Permissions" error:');
console.log('   • Check bot has "applications.commands" scope');
console.log('   • Verify CLIENT_ID is correct');
console.log('   • Bot needs to be in the server for guild commands');
console.log('');
console.log('❌ "Invalid command format" errors:');
console.log('   • Check command files have proper export default');
console.log('   • Verify data and execute properties exist');
console.log('   • Fix syntax errors in command files');
console.log('');
console.log('❌ Commands not appearing:');
console.log('   • Global commands take up to 1 hour');
console.log('   • Use guild deployment for faster testing');
console.log('   • Check bot permissions in Discord server');

console.log('\n✅ Command deployment fix completed!');
console.log('🎮 Run the deploy script to register commands with Discord!');