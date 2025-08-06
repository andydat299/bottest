import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../schemas/userSchema.js';
import { 
  getMaxDurability, 
  calculateRepairCost, 
  isRodBroken,
  getDurabilityEmoji,
  getDurabilityStatus 
} from '../utils/durabilityManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('repair')
    .setDescription('Sửa chữa cần câu 🔧')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Loại sửa chữa')
        .setRequired(false)
        .addChoices(
          { name: 'Sửa chữa hoàn toàn (100%)', value: 'full' },
          { name: 'Sửa chữa một phần (50%)', value: 'partial' },
          { name: 'Sửa chữa tối thiểu (25%)', value: 'minimal' }
        )),

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id }) || await User.create({ discordId: interaction.user.id });
    
    // Đảm bảo durability tồn tại
    const maxDurability = getMaxDurability(user.rodLevel || 1);
    if (user.rodDurability === undefined || user.rodMaxDurability === undefined) {
      user.rodDurability = maxDurability;
      user.rodMaxDurability = maxDurability;
      await user.save();
    }

    const repairType = interaction.options.getString('type');
    
    // Nếu không chọn loại sửa chữa, hiển thị menu
    if (!repairType) {
      return showRepairMenu(interaction, user);
    }

    await handleRepair(interaction, user, repairType);
  }
};

async function showRepairMenu(interaction, user) {
  const currentDurability = user.rodDurability;
  const maxDurability = user.rodMaxDurability;
  const rodLevel = user.rodLevel || 1;
  
  if (currentDurability >= maxDurability) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔧 Trạng thái cần câu')
      .setDescription('Cần câu của bạn đang ở trạng thái hoàn hảo!')
      .addFields({
        name: '📊 Thông tin',
        value: `${getDurabilityEmoji(currentDurability, maxDurability)} **Độ bền:** ${currentDurability}/${maxDurability} (100%)\n🎣 **Cấp cần:** ${rodLevel}\n✅ **Trạng thái:** Hoàn hảo`,
        inline: false
      });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Tính chi phí cho các loại sửa chữa - giá cố định 150 xu
  const fullRepairTarget = maxDurability;
  const partialRepairTarget = Math.min(currentDurability + Math.floor(maxDurability * 0.5), maxDurability);
  const minimalRepairTarget = Math.min(currentDurability + Math.floor(maxDurability * 0.25), maxDurability);

  const fullCost = 100;      // Giá cố định
  const partialCost = 50;   // Giá cố định  
  const minimalCost = 250;   // Giá cố định

  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('🔧 Sửa chữa cần câu')
    .setDescription(`Chọn loại sửa chữa cho cần câu cấp ${rodLevel} của bạn:`)
    .addFields(
      {
        name: '📊 Trạng thái hiện tại',
        value: `${getDurabilityEmoji(currentDurability, maxDurability)} **Độ bền:** ${currentDurability}/${maxDurability} (${Math.round((currentDurability/maxDurability)*100)}%)\n📈 **Trạng thái:** ${getDurabilityStatus(currentDurability, maxDurability)}\n💰 **Số dư:** ${user.balance.toLocaleString()} xu`,
        inline: false
      },
      {
        name: '🔧 Tùy chọn sửa chữa',
        value: `**🟢 Hoàn toàn (100%):** 150 xu\n**🟡 Một phần (50%):** 150 xu\n**🟠 Tối thiểu (25%):** 150 xu`,
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({ 
      text: `${interaction.user.username} - Rod Level ${rodLevel}`, 
      iconURL: interaction.user.displayAvatarURL() 
    });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('repair_full')
        .setLabel(`Hoàn toàn (150 xu)`)
        .setStyle(user.balance >= 150 ? ButtonStyle.Success : ButtonStyle.Danger)
        .setDisabled(user.balance < 150),
      new ButtonBuilder()
        .setCustomId('repair_partial')
        .setLabel(`Một phần (150 xu)`)
        .setStyle(user.balance >= 150 ? ButtonStyle.Primary : ButtonStyle.Danger)
        .setDisabled(user.balance < 150),
      new ButtonBuilder()
        .setCustomId('repair_minimal')
        .setLabel(`Tối thiểu (150 xu)`)
        .setStyle(user.balance >= 150 ? ButtonStyle.Secondary : ButtonStyle.Danger)
        .setDisabled(user.balance < 150)
    );

  const msg = await interaction.reply({ 
    embeds: [embed], 
    components: [row],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 60000
  });

  collector.on('collect', async (btnInteraction) => {
    const repairType = btnInteraction.customId.replace('repair_', '');
    await handleRepair(btnInteraction, user, repairType);
    collector.stop();
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      await interaction.editReply({ 
        content: '⏰ Hết thời gian chọn. Vui lòng thử lại!', 
        embeds: [], 
        components: [] 
      });
    }
  });
}

async function handleRepair(interaction, user, repairType) {
  const currentDurability = user.rodDurability;
  const maxDurability = user.rodMaxDurability;
  const rodLevel = user.rodLevel || 1;

  let repairAmount, cost, repairPercent;

  switch (repairType) {
    case 'full':
      repairAmount = maxDurability - currentDurability;
      cost = 150; // Giá cố định
      repairPercent = 100;
      break;
    case 'partial':
      repairAmount = Math.floor(maxDurability * 0.5);
      cost = 150; // Giá cố định
      repairPercent = 50;
      break;
    case 'minimal':
      repairAmount = Math.floor(maxDurability * 0.25);
      cost = 150; // Giá cố định
      repairPercent = 25;
      break;
    default:
      return interaction.reply({ content: '❌ Loại sửa chữa không hợp lệ!', ephemeral: true });
  }

  if (user.balance < cost) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Không đủ xu')
      .setDescription(`Bạn cần **${cost.toLocaleString()} xu** để sửa chữa nhưng chỉ có **${user.balance.toLocaleString()} xu**.`)
      .addFields({
        name: '💡 Gợi ý',
        value: '• Bán cá để có thêm xu\n• Hoàn thành quest hàng ngày\n• Chọn loại sửa chữa rẻ hơn',
        inline: false
      });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Thực hiện sửa chữa
  const oldDurability = user.rodDurability;
  user.rodDurability = Math.min(currentDurability + repairAmount, maxDurability);
  user.balance -= cost;
  await user.save();

  const actualRepair = user.rodDurability - oldDurability;

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ Sửa chữa thành công')
    .setDescription(`Đã sửa chữa cần câu cấp ${rodLevel} thành công!`)
    .addFields(
      {
        name: '🔧 Chi tiết sửa chữa',
        value: `**Loại:** Sửa chữa ${repairType === 'full' ? 'hoàn toàn' : repairType === 'partial' ? 'một phần' : 'tối thiểu'}\n**Chi phí:** ${cost.toLocaleString()} xu\n**Độ bền phục hồi:** +${actualRepair}`,
        inline: true
      },
      {
        name: '📊 Trước/Sau',
        value: `**Trước:** ${oldDurability}/${maxDurability}\n**Sau:** ${user.rodDurability}/${maxDurability}\n**Số dư còn lại:** ${user.balance.toLocaleString()} xu`,
        inline: true
      },
      {
        name: '📈 Trạng thái mới',
        value: `${getDurabilityEmoji(user.rodDurability, maxDurability)} **${getDurabilityStatus(user.rodDurability, maxDurability)}** (${Math.round((user.rodDurability/maxDurability)*100)}%)`,
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({ 
      text: `${interaction.user.username}`, 
      iconURL: interaction.user.displayAvatarURL() 
    });

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed], components: [] });
  } else {
    await interaction.reply({ embeds: [embed] });
  }
}
