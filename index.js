import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { connectDB } from './database/mongo.js';
import { initLogger, logInfo, logError } from './utils/logger.js';
import fs from 'fs';

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

console.log('🚀 Starting bot...');
console.log('📝 Config loaded:', { 
  hasToken: !!config.token, 
  clientId: config.clientId,
  guildId: config.guildId 
});

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.commands = new Collection();

console.log('📂 Loading commands...');

// Load commands và collect data để deploy
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(`Found ${commandFiles.length} command files:`, commandFiles);

for (const file of commandFiles) {
  console.log(`Loading command: ${file}`);
  try {
    const commandModule = await import(`./commands/${file}`);
    const command = commandModule.default || commandModule;
    
    if (command && command.data && command.data.name) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${command.data.name}`);
    } else {
      console.log(`❌ Failed to load ${file}: missing data or data.name`);
    }
  } catch (error) {
    console.log(`❌ Error loading ${file}:`, error.message);
  }
}

// Auto-deploy commands
console.log('🔄 Auto-deploying commands...');
try {
  const rest = new REST({ version: '10' }).setToken(config.token);
  
  console.log(`📤 Deploying ${commands.length} commands...`);
  
  // Ưu tiên guild commands nếu có guild ID (instant), nếu không thì dùng global
  if (config.guildId) {
    console.log('🏃‍♂️ Deploying to guild (instant)...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log(`✅ Guild commands deployed instantly to server ${config.guildId}`);
  } else {
    console.log('� Deploying globally (takes up to 1 hour)...');
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );
    console.log(`✅ Successfully deployed ${commands.length} global commands.`);
    console.log('⏰ Global commands may take up to 1 hour to appear.');
  }
  
} catch (error) {
  console.error('❌ Error deploying commands:', error);
}

console.log('📂 Loading events...');

// Load events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
console.log(`Found ${eventFiles.length} event files:`, eventFiles);

for (const file of eventFiles) {
  console.log(`Loading event: ${file}`);
  const event = (await import(`./events/${file}`)).default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`✅ Loaded event: ${event.name}`);
}

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  
  // Khởi tạo logger
  initLogger(client);
  
  // Log bot start
  await logInfo('Bot Started', `${client.user.tag} đã khởi động thành công`, {
    user: client.user
  });
});

console.log('🔌 Connecting to database...');
try {
  await connectDB();
} catch (error) {
  console.error('❌ Database connection failed:', error);
}

console.log('🔑 Logging in to Discord...');
try {
  await client.login(config.token);
} catch (error) {
  console.error('❌ Discord login failed:', error);
  process.exit(1);
}

// Initialize auto-fishing background jobs
async function initializeAutoFishingJobs() {
  try {
    const { AutoFishing } = await import('./schemas/autoFishingSchema.js');
    const { User } = await import('./schemas/userSchema.js');
    const { VIP } = await import('./schemas/vipSchema.js');
    const { initializeAutoFishingJobs: initJobs } = await import('./utils/autoFishingJobs.js');
    
    initJobs({ AutoFishing, User, VIP });
  } catch (error) {
    console.error('❌ Failed to initialize auto-fishing jobs:', error);
  }
}

initializeAutoFishingJobs();
