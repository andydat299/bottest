import { SlashCommandBuilder, EmbedBuilder, codeBlock, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isAdmin, createNoPermissionEmbed, createErrorEmbed } from '../utils/adminUtils.js';
import { User } from '../schemas/userSchema.js';
import { logAdminAction } from '../utils/logger.js';
import util from 'util';
import vm from 'vm';

const data = new SlashCommandBuilder()
  .setName('evalvm')
  .setDescription('[ADMIN] Thực thi code JavaScript trong sandbox VM (Cẩn thận!)')
  .addStringOption(option =>
    option.setName('code')
      .setDescription('Code JavaScript để thực thi')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('silent')
      .setDescription('Thực thi im lặng (không hiển thị output)')
      .setRequired(false));

// Lưu trữ context cho mỗi user
const userContexts = new Map();

// Tạo context an toàn
function createSafeContext(userId, username, guild, user) {
  return {
    // Utility objects
    console: {
      log: (...args) => console.log(`[EVAL-${username}]`, ...args),
      error: (...args) => console.error(`[EVAL-${username}]`, ...args),
      warn: (...args) => console.warn(`[EVAL-${username}]`, ...args),
      info: (...args) => console.info(`[EVAL-${username}]`, ...args)
    },
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    
    // Safe guild info
    guild: {
      id: guild?.id,
      name: guild?.name,
      memberCount: guild?.memberCount
    },
    
    // Safe user info
    user: {
      id: user.id,
      username: user.username,
      tag: user.tag,
      displayName: user.displayName
    },
    
    // Utility functions
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, Math.min(ms, 3000))),
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    formatNumber: (num) => num.toLocaleString(),
    
    // Restricted globals
    setTimeout: undefined,
    setInterval: undefined,
    setImmediate: undefined,
    process: undefined,
    global: undefined,
    globalThis: undefined,
    require: undefined,
    module: undefined,
    exports: undefined,
    __dirname: undefined,
    __filename: undefined
  };
}

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const code = interaction.options.getString('code');
  const silent = interaction.options.getBoolean('silent') || false;
  
  // Giới hạn độ dài code
  if (code.length > 2000) {
    const embed = createErrorEmbed(
      EmbedBuilder,
      '📏 Code quá dài',
      'Code không được vượt quá 2000 ký tự!'
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Tạo hoặc lấy context cho user
    let context = userContexts.get(interaction.user.id);
    if (!context) {
      context = createSafeContext(
        interaction.user.id,
        interaction.user.username,
        interaction.guild,
        interaction.user
      );
      userContexts.set(interaction.user.id, context);
    }

    const startTime = Date.now();
    
    // Tạo VM context với timeout
    const vmContext = vm.createContext(context);
    
    // Thực thi code trong VM với timeout
    const result = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          const script = new vm.Script(code);
          const output = script.runInContext(vmContext, {
            timeout: 5000, // 5 giây timeout
            breakOnSigint: true
          });
          resolve(output);
        } catch (error) {
          reject(error);
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout (5s)')), 5000)
      )
    ]);
    
    const executionTime = Date.now() - startTime;

    if (silent) {
      const silentEmbed = new EmbedBuilder()
        .setTitle('🤫 Eval thực thi im lặng')
        .setColor('#ffa500')
        .setDescription('Code đã được thực thi mà không hiển thị output.')
        .addFields({
          name: '⏱️ Execution Time',
          value: `${executionTime}ms`,
          inline: true
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [silentEmbed] });
    }

    // Format kết quả
    let output = result;
    if (typeof result === 'object' && result !== null) {
      output = util.inspect(result, { 
        depth: 3, 
        maxArrayLength: 15,
        maxStringLength: 100,
        compact: true
      });
    }

    // Giới hạn output
    const outputStr = String(output);
    const truncated = outputStr.length > 1800 ? outputStr.slice(0, 1800) + '...' : outputStr;

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ VM Eval thành công')
      .setColor('#00ff00')
      .addFields(
        {
          name: '📝 Code',
          value: codeBlock('javascript', code.slice(0, 800) + (code.length > 800 ? '...' : '')),
          inline: false
        },
        {
          name: '📤 Output',
          value: codeBlock('javascript', truncated || 'undefined'),
          inline: false
        },
        {
          name: '⏱️ Execution Time',
          value: `${executionTime}ms`,
          inline: true
        },
        {
          name: '🛡️ Security',
          value: 'VM Context',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: `Executed by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Tạo buttons để quản lý VM
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`eval_clear_${interaction.user.id}`)
          .setLabel('🗑️ Clear VM')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`eval_info_${interaction.user.id}`)
          .setLabel('ℹ️ VM Info')
          .setStyle(ButtonStyle.Secondary)
      );

    // Log admin action
    await logAdminAction(
      interaction.user,
      'EVALVM_EXECUTE',
      `VM executed code: ${code.slice(0, 100)}${code.length > 100 ? '...' : ''}`
    );

    await interaction.editReply({ embeds: [successEmbed], components: [buttons] });

  } catch (error) {
    console.error('VM Eval error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ VM Eval thất bại')
      .setColor('#ff0000')
      .addFields(
        {
          name: '📝 Code',
          value: codeBlock('javascript', code.slice(0, 800) + (code.length > 800 ? '...' : '')),
          inline: false
        },
        {
          name: '🐛 Error',
          value: codeBlock('javascript', error.message || String(error)),
          inline: false
        },
        {
          name: '🛡️ Security',
          value: 'VM Context',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: `Executed by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Log admin action (error)
    await logAdminAction(
      interaction.user,
      'EVALVM_ERROR',
      `VM error: ${error.message}`
    );

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Handle button interactions
export async function handleEvalButtons(interaction) {
  if (!interaction.customId.startsWith('eval_')) return false;
  
  const [, action, userId] = interaction.customId.split('_');
  
  // Chỉ user thực thi mới có thể dùng buttons
  if (interaction.user.id !== userId) {
    return interaction.reply({
      content: '❌ Chỉ người thực thi eval mới có thể sử dụng buttons này!',
      ephemeral: true
    });
  }

  if (action === 'clear') {
    userContexts.delete(userId);
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Context đã được xóa')
      .setDescription('VM Context của bạn đã được reset.')
      .setColor('#ff9900')
      .setTimestamp();
      
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
  } else if (action === 'info') {
    const hasContext = userContexts.has(userId);
    
    const embed = new EmbedBuilder()
      .setTitle('ℹ️ Thông tin VM')
      .addFields(
        { name: '🛡️ Security Level', value: 'VM Context Sandbox', inline: true },
        { name: '⏱️ Timeout', value: '5 seconds', inline: true },
        { name: '💾 Context Status', value: hasContext ? '✅ Active' : '❌ Not created', inline: true },
        { name: '🔧 Available Objects', value: 'console, Math, Date, JSON, Array, Object, String, Number, Boolean, guild, user, sleep(), random(), formatNumber()', inline: false }
      )
      .setColor('#3498db')
      .setTimestamp();
      
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  return true;
}

export default { data, execute };
