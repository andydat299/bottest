import { SlashCommandBuilder, EmbedBuilder, codeBlock } from 'discord.js';
import { isAdmin, createNoPermissionEmbed, createErrorEmbed } from '../utils/adminUtils.js';
import { User } from '../schemas/userSchema.js';
import { logAdminAction } from '../utils/logger.js';
import util from 'util';

const data = new SlashCommandBuilder()
  .setName('eval')
  .setDescription('[ADMIN] Thực thi code JavaScript (Cực kỳ nguy hiểm!)')
  .addStringOption(option =>
    option.setName('code')
      .setDescription('Code JavaScript để thực thi')
      .setRequired(true));

async function execute(interaction) {
  // Kiểm tra quyền admin
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ 
      embeds: [createNoPermissionEmbed(EmbedBuilder)], 
      ephemeral: true 
    });
  }

  const code = interaction.options.getString('code');
  
  // Blacklist các từ khóa nguy hiểm
  const dangerousKeywords = [
    'process.exit',
    'child_process',
    'fs.unlink',
    'fs.rm',
    'fs.rmdir',
    'fs.writeFile',
    'require(',
    'import(',
    'eval(',
    'Function(',
    'setTimeout',
    'setInterval',
    'process.env',
    'process.kill',
    'process.abort',
    '__dirname',
    '__filename',
    'Buffer.from',
    'global',
    'globalThis'
  ];

  // Kiểm tra keywords nguy hiểm
  for (const keyword of dangerousKeywords) {
    if (code.includes(keyword)) {
      const embed = createErrorEmbed(
        EmbedBuilder,
        '⚠️ Từ khóa nguy hiểm',
        `Code chứa từ khóa bị cấm: \`${keyword}\``
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  // Giới hạn độ dài code
  if (code.length > 1000) {
    const embed = createErrorEmbed(
      EmbedBuilder,
      '📏 Code quá dài',
      'Code không được vượt quá 1000 ký tự!'
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Tạo context an toàn cho eval
    const context = {
      interaction,
      client: interaction.client,
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      User, // Model User
      EmbedBuilder,
      console: {
        log: (...args) => console.log('[EVAL]', ...args),
        error: (...args) => console.error('[EVAL]', ...args),
        warn: (...args) => console.warn('[EVAL]', ...args)
      }
    };

    // Wrap code trong async function để support await
    const asyncCode = `
      (async () => {
        ${code}
      })()
    `;

    // Thực thi code với timeout
    const result = await Promise.race([
      eval(asyncCode),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Code thực thi quá 10 giây')), 10000)
      )
    ]);

    // Format kết quả
    let output = result;
    if (typeof result === 'object') {
      output = util.inspect(result, { depth: 2, maxArrayLength: 10 });
    }

    // Giới hạn output
    const outputStr = String(output);
    const truncated = outputStr.length > 1900 ? outputStr.slice(0, 1900) + '...' : outputStr;

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Eval thành công')
      .setColor('#00ff00')
      .addFields(
        {
          name: '📝 Code',
          value: codeBlock('javascript', code.slice(0, 500) + (code.length > 500 ? '...' : '')),
          inline: false
        },
        {
          name: '📤 Output',
          value: codeBlock('javascript', truncated || 'undefined'),
          inline: false
        },
        {
          name: '⏱️ Execution Time',
          value: `${Date.now() - interaction.createdTimestamp}ms`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: `Executed by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL() 
      });

    // Log admin action
    await logAdminAction(
      interaction.user,
      'EVAL_EXECUTE',
      `Executed code: ${code.slice(0, 100)}${code.length > 100 ? '...' : ''}`
    );

    await interaction.editReply({ embeds: [successEmbed] });

  } catch (error) {
    console.error('Eval error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Eval thất bại')
      .setColor('#ff0000')
      .addFields(
        {
          name: '📝 Code',
          value: codeBlock('javascript', code.slice(0, 500) + (code.length > 500 ? '...' : '')),
          inline: false
        },
        {
          name: '🐛 Error',
          value: codeBlock('javascript', error.message || String(error)),
          inline: false
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
      'EVAL_ERROR',
      `Error executing: ${error.message}`
    );

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

export default { data, execute };
