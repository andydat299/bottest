console.log('🚀 Starting bot...');

// Import Discord.js
import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📝 Config loaded:', {
  hasToken: !!process.env.TOKEN,
  clientId: process.env.CLIENT_ID || 'NOT_SET',
  guildId: process.env.GUILD_ID || 'NOT_SET'
});

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Initialize commands collection
client.commands = new Collection();

console.log('📂 Loading commands...');

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command files:`, commandFiles.slice(0, 10));

let loadedCommands = 0;
let failedCommands = 0;

for (const file of commandFiles) {
  try {
    console.log(`Loading command: ${file}`);
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command = await import(filePath);
    
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`✅ Loaded: ${command.default.data.name}`);
      loadedCommands++;
    } else {
      console.log(`❌ Missing data/execute: ${file}`);
      failedCommands++;
    }
  } catch (error) {
    console.error(`❌ Error loading ${file}:`, error.message);
    failedCommands++;
  }
}

console.log(`📊 Commands loaded: ${loadedCommands} success, ${failedCommands} failed`);

console.log('📂 Loading events...');

// Load events
const eventsPath = join(__dirname, 'events');
let loadedEvents = 0;

try {
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  console.log(`Found ${eventFiles.length} event files:`, eventFiles);

  for (const file of eventFiles) {
    try {
      console.log(`Loading event: ${file}`);
      const filePath = pathToFileURL(join(eventsPath, file)).href;
      const event = await import(filePath);
      
      if (event.default && event.default.name) {
        if (event.default.once) {
          client.once(event.default.name, (...args) => event.default.execute(...args));
        } else {
          client.on(event.default.name, (...args) => event.default.execute(...args));
        }
        console.log(`✅ Event loaded: ${event.default.name}`);
        loadedEvents++;
      } else {
        console.log(`❌ Invalid event structure: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error loading event ${file}:`, error.message);
    }
  }
} catch (error) {
  console.error('❌ Error reading events directory:', error.message);
}

console.log(`📊 Events loaded: ${loadedEvents}`);

// Database connection
console.log('💾 Connecting to database...');
try {
  const { default: connectDB } = await import('./config/database.js');
  await connectDB();
  console.log('✅ Database connected successfully');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} guilds`);
  console.log(`👥 Cached ${readyClient.users.cache.size} users`);
  
  // Set bot status
  readyClient.user.setActivity('🎣 Fishing & Casino Games', { type: 'PLAYING' });
});

// Error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', warn => {
  console.warn('⚠️ Discord client warning:', warn);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Login to Discord
console.log('🔑 Logging in to Discord...');
try {
  if (!process.env.TOKEN) {
    throw new Error('TOKEN not found in environment variables');
  }
  await client.login(process.env.TOKEN);
} catch (error) {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
}