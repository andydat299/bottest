import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import fs from 'fs';

console.log('🚀 Force deploying slash commands...');

// Load all commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`📂 Loading ${commandFiles.length} command files...`);

for (const file of commandFiles) {
  try {
    const commandModule = await import(`./commands/${file}`);
    const command = commandModule.default || commandModule;
    
    if (command && command.data && command.data.name) {
      commands.push(command.data.toJSON());
      console.log(`✅ ${command.data.name}`);
    } else {
      console.log(`❌ ${file} - missing data`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Error:`, error.message);
  }
}

console.log(`\n📤 Deploying ${commands.length} commands...`);

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  // Chỉ deploy một loại để tránh duplicate
  // Ưu tiên guild commands nếu có guild ID (instant), nếu không thì dùng global
  if (config.guildId) {
    console.log('🏃‍♂️ Deploying to guild (instant)...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log(`✅ Successfully deployed ${commands.length} commands to guild ${config.guildId}`);
    console.log('💡 Guild commands are available immediately');
  } else {
    console.log('🌍 Deploying globally (takes time)...');
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );
    console.log(`✅ Successfully deployed ${commands.length} global commands`);
    console.log('⏰ Global commands may take up to 1 hour to appear');
  }
  
  console.log('\n🎉 Commands deployed successfully!');
  
} catch (error) {
  console.error('❌ Deploy failed:', error);
}
