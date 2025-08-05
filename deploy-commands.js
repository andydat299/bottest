import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command files:`, commandFiles);

for (const file of commandFiles) {
  console.log(`Loading ${file}...`);
  try {
    const command = (await import(`./commands/${file}`)).default;
    if (command && command.data) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`❌ Failed to load command from ${file}: missing data`);
    }
  } catch (error) {
    console.log(`❌ Error loading command from ${file}:`, error.message);
  }
}

console.log(`Total commands to deploy: ${commands.length}`);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🔁 Refreshing slash commands globally...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('✅ Global slash commands reloaded.');
} catch (err) {
  console.error('❌ Error deploying commands:', err);
}
