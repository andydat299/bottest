import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Discord bot credentials from environment variables
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for guild-specific commands (faster testing)
const token = process.env.DISCORD_TOKEN;

// Validate required environment variables
if (!clientId || !token) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLIENT_ID:', clientId ? '✅ Set' : '❌ Missing');
  console.error('   DISCORD_TOKEN:', token ? '✅ Set' : '❌ Missing');
  console.error('   GUILD_ID:', guildId ? '✅ Set' : '⚪ Optional (for guild commands)');
  console.error('\n💡 Add these to your .env file or Railway environment variables');
  process.exit(1);
}

const commands = [];

// Load all command files from commands directory
const commandsPath = path.join(process.cwd(), 'commands');

if (!fs.existsSync(commandsPath)) {
  console.error('❌ Commands directory not found:', commandsPath);
  console.error('💡 Make sure you have a "commands" folder with your command files');
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`🔍 Loading ${commandFiles.length} command files from commands directory...\n`);

// Load and validate each command file
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  
  try {
    const command = await import(filePath);
    
    // Check if command has required structure
    if ('data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
      console.log(`  ✅ Loaded: /${command.default.data.name} - ${command.default.data.description}`);
    } else {
      console.log(`  ❌ Invalid command format: ${file}`);
      console.log(`     Missing 'data' or 'execute' property`);
      console.log(`     Expected: export default { data: ..., execute: ... }`);
    }
  } catch (error) {
    console.error(`  ❌ Error loading ${file}:`, error.message);
    console.error(`     Check file syntax and export format`);
  }
}

// Validate we have commands to deploy
if (commands.length === 0) {
  console.error('\n❌ No valid commands found to deploy!');
  console.error('💡 Check your command files have proper export format:');
  console.error('   export default { data: SlashCommandBuilder, execute: function }');
  process.exit(1);
}

console.log(`\n🚀 Preparing to deploy ${commands.length} commands...\n`);

// Create REST instance and deploy commands
const rest = new REST().setToken(token);

try {
  console.log('🔄 Started refreshing application (/) commands...');

  let data;
  
  if (guildId) {
    // Deploy to specific guild (faster for testing - appears immediately)
    console.log(`📡 Deploying to guild: ${guildId}`);
    data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    console.log(`✅ Successfully deployed ${data.length} commands to guild!`);
    console.log('⚡ Guild commands appear immediately');
  } else {
    // Deploy globally (slower - takes up to 1 hour to propagate)
    console.log('🌍 Deploying globally to all servers...');
    data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log(`✅ Successfully deployed ${data.length} global commands!`);
    console.log('⏰ Global commands may take up to 1 hour to appear everywhere');
  }

  console.log('\n📋 Successfully deployed commands:');
  data.forEach(cmd => {
    console.log(`   • /${cmd.name} - ${cmd.description}`);
  });

  console.log('\n🎉 Command deployment completed successfully!');
  console.log('\n🎮 Your slash commands should now be available in Discord!');
  
  if (!guildId) {
    console.log('\n💡 Pro tip: Use GUILD_ID for faster testing:');
    console.log('   GUILD_ID=your_server_id node deploy-commands.js');
  }
  
} catch (error) {
  console.error('\n❌ Command deployment failed:', error);
  
  // Provide helpful error messages
  if (error.code === 50001) {
    console.error('\n💡 Error 50001: Missing Access');
    console.error('   • Check your CLIENT_ID is correct');
    console.error('   • Make sure bot has "applications.commands" scope');
    console.error('   • Verify bot is invited to the server');
  } else if (error.code === 50013) {
    console.error('\n💡 Error 50013: Missing Permissions'); 
    console.error('   • Bot needs "Use Slash Commands" permission');
    console.error('   • Check bot role permissions in Discord server');
  } else if (error.code === 10002) {
    console.error('\n💡 Error 10002: Unknown Application');
    console.error('   • CLIENT_ID is incorrect');
    console.error('   • Check Discord Developer Portal for correct Application ID');
  } else {
    console.error('\n💡 General troubleshooting:');
    console.error('   • Verify all environment variables are set correctly');
    console.error('   • Check Discord Developer Portal bot settings');
    console.error('   • Ensure bot token is valid and not regenerated');
  }
  
  process.exit(1);
}
