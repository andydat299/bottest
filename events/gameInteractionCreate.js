// File đã bị xóa để fix conflict với interactionCreate.js
// Game panel buttons sẽ được handle trong interactionCreate.js

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Command execution error:', error);
        
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle button interactions from game panel
    else if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
      } catch (error) {
        console.error('Button interaction error:', error);
        await interaction.reply({
          content: '❌ **Có lỗi khi xử lý button!**',
          ephemeral: true
        });
      }
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      try {
        await handleModalSubmit(interaction);
      } catch (error) {
        console.error('Modal submit error:', error);
        await interaction.reply({
          content: '❌ **Có lỗi khi xử lý form!**',
          ephemeral: true
        });
      }
    }
  }
};

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  switch (customId) {
    case 'play_slots':
      await showGameModal(interaction, 'slots', '🎰 Slots Machine', 'Nhập số xu muốn bet (1-1000)');
      break;
      
    case 'play_dice':
      await showDiceModal(interaction);
      break;
      
    case 'play_wheel':
      await showGameModal(interaction, 'wheel', '🎡 Lucky Wheel', 'Nhập số xu muốn bet (1-1000) hoặc để trống để dùng free spin');
      break;
      
    case 'check_balance':
      await showBalance(interaction);
      break;
      
    case 'daily_claim':
      await handleDailyClaim(interaction);
      break;
      
    case 'game_stats':
      await showGameStats(interaction);
      break;
      
    default:
      await interaction.reply({
        content: '❌ **Button không được hỗ trợ!**',
        ephemeral: true
      });
  }
}

async function showGameModal(interaction, gameType, title, placeholder) {
  const modal = new ModalBuilder()
    .setCustomId(`${gameType}_modal`)
    .setTitle(title);

  const betInput = new TextInputBuilder()
    .setCustomId('bet_amount')
    .setLabel('Số xu đặt cược')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(4);

  modal.addComponents(new ActionRowBuilder().addComponents(betInput));
  await interaction.showModal(modal);
}

async function showDiceModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('dice_modal')
    .setTitle('🎲 Dice - Tài Xỉu');

  const betInput = new TextInputBuilder()
    .setCustomId('bet_amount')
    .setLabel('Số xu đặt cược')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Nhập số xu (1-1000)')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(4);

  const choiceInput = new TextInputBuilder()
    .setCustomId('dice_choice')
    .setLabel('Chọn Tài hoặc Xỉu')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Nhập "tai" hoặc "xiu"')
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(3);

  modal.addComponents(
    new ActionRowBuilder().addComponents(betInput),
    new ActionRowBuilder().addComponents(choiceInput)
  );
  
  await interaction.showModal(modal);
}

async function showBalance(interaction) {
  const { User } = await import('../schemas/userSchema.js');
  
  let user = await User.findOne({ discordId: interaction.user.id });
  if (!user) {
    user = new User({
      discordId: interaction.user.id,
      username: interaction.user.username,
      balance: 0
    });
    await user.save();
  }

  const embed = new EmbedBuilder()
    .setTitle('💳 Số Dư Tài Khoản')
    .setDescription(`**${interaction.user.username}**`)
    .addFields(
      { name: '💰 Số dư hiện tại', value: `${user.balance.toLocaleString()} xu`, inline: true },
      { name: '🎮 Game limit', value: '1 - 1,000 xu/bet', inline: true },
      { name: '💡 Lấy thêm xu', value: 'Dùng `/daily` để nhận xu miễn phí!', inline: false }
    )
    .setColor('#00ff00')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleDailyClaim(interaction) {
  // Import daily command and execute
  try {
    const dailyCommand = await import('../commands/daily.js');
    // Simulate slash command interaction for daily
    const fakeInteraction = {
      ...interaction,
      options: { getInteger: () => null, getString: () => null },
      commandName: 'daily'
    };
    
    await dailyCommand.default.execute(fakeInteraction);
  } catch (error) {
    console.error('Daily claim error:', error);
    await interaction.reply({
      content: '❌ **Có lỗi khi claim daily!** Vui lòng sử dụng `/daily` command.',
      ephemeral: true
    });
  }
}

async function showGameStats(interaction) {
  const { User } = await import('../schemas/userSchema.js');
  const { DailyReward } = await import('../schemas/dailyRewardSchema.js');
  
  let user = await User.findOne({ discordId: interaction.user.id });
  let dailyReward = await DailyReward.findOne({ userId: interaction.user.id });
  
  if (!user) {
    user = { balance: 0, username: interaction.user.username };
  }
  
  if (!dailyReward) {
    dailyReward = { currentStreak: 0, totalClaims: 0, totalRewards: 0 };
  }

  const embed = new EmbedBuilder()
    .setTitle('📊 Game Statistics')
    .setDescription(`**${interaction.user.username}**`)
    .addFields(
      { name: '💰 Current Balance', value: `${user.balance?.toLocaleString() || 0} xu`, inline: true },
      { name: '🔥 Daily Streak', value: `${dailyReward.currentStreak} ngày`, inline: true },
      { name: '🎁 Total Claims', value: `${dailyReward.totalClaims} lần`, inline: true },
      { name: '💎 Total Earned', value: `${dailyReward.totalRewards?.toLocaleString() || 0} xu`, inline: true },
      { name: '🎮 Game Limits', value: '1 - 1,000 xu per bet', inline: true },
      { name: '🏆 Status', value: user.balance >= 1000 ? '🎯 Ready to play!' : '💡 Need more xu - use /daily', inline: true }
    )
    .setColor('#3498db')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleModalSubmit(interaction) {
  const { customId } = interaction;
  
  if (customId === 'slots_modal') {
    await handleSlotsGame(interaction);
  } else if (customId === 'dice_modal') {
    await handleDiceGame(interaction);
  } else if (customId === 'wheel_modal') {
    await handleWheelGame(interaction);
  }
}

async function handleSlotsGame(interaction) {
  const betInput = interaction.fields.getTextInputValue('bet_amount');
  const betAmount = parseInt(betInput);
  
  if (isNaN(betAmount) || betAmount < 1 || betAmount > 1000) {
    return await interaction.reply({
      content: '❌ **Số xu không hợp lệ!** Vui lòng nhập từ 1 đến 1,000 xu.',
      ephemeral: true
    });
  }
  
  // Import and execute slots logic
  try {
    const slotsCommand = await import('../commands/slots.js');
    // Create fake interaction for slots
    const fakeInteraction = {
      ...interaction,
      options: {
        getInteger: (name) => name === 'bet' ? betAmount : null
      },
      commandName: 'slots',
      editReply: interaction.reply.bind(interaction),
      deferReply: async () => await interaction.deferReply()
    };
    
    await slotsCommand.default.execute(fakeInteraction);
  } catch (error) {
    console.error('Slots game error:', error);
    await interaction.reply({
      content: '❌ **Có lỗi khi chơi slots!**',
      ephemeral: true
    });
  }
}

async function handleDiceGame(interaction) {
  const betInput = interaction.fields.getTextInputValue('bet_amount');
  const choiceInput = interaction.fields.getTextInputValue('dice_choice').toLowerCase();
  
  const betAmount = parseInt(betInput);
  
  if (isNaN(betAmount) || betAmount < 1 || betAmount > 1000) {
    return await interaction.reply({
      content: '❌ **Số xu không hợp lệ!** Vui lòng nhập từ 1 đến 1,000 xu.',
      ephemeral: true
    });
  }
  
  if (choiceInput !== 'tai' && choiceInput !== 'xiu') {
    return await interaction.reply({
      content: '❌ **Lựa chọn không hợp lệ!** Vui lòng nhập "tai" hoặc "xiu".',
      ephemeral: true
    });
  }
  
  // Import and execute dice logic
  try {
    const diceCommand = await import('../commands/dice.js');
    const fakeInteraction = {
      ...interaction,
      options: {
        getInteger: (name) => name === 'bet' ? betAmount : null,
        getString: (name) => name === 'choice' ? choiceInput : null
      },
      commandName: 'dice',
      editReply: interaction.reply.bind(interaction),
      deferReply: async () => await interaction.deferReply()
    };
    
    await diceCommand.default.execute(fakeInteraction);
  } catch (error) {
    console.error('Dice game error:', error);
    await interaction.reply({
      content: '❌ **Có lỗi khi chơi dice!**',
      ephemeral: true
    });
  }
}

async function handleWheelGame(interaction) {
  const betInput = interaction.fields.getTextInputValue('bet_amount');
  
  // If empty, try free spin
  if (!betInput.trim()) {
    try {
      const wheelCommand = await import('../commands/wheel.js');
      const fakeInteraction = {
        ...interaction,
        options: {
          getBoolean: (name) => name === 'free' ? true : false
        },
        commandName: 'wheel',
        editReply: interaction.reply.bind(interaction),
        deferReply: async () => await interaction.deferReply()
      };
      
      await wheelCommand.default.execute(fakeInteraction);
    } catch (error) {
      console.error('Wheel free spin error:', error);
      await interaction.reply({
        content: '❌ **Có lỗi khi quay wheel miễn phí!**',
        ephemeral: true
      });
    }
    return;
  }
  
  const betAmount = parseInt(betInput);
  
  if (isNaN(betAmount) || betAmount < 1 || betAmount > 1000) {
    return await interaction.reply({
      content: '❌ **Số xu không hợp lệ!** Vui lòng nhập từ 1 đến 1,000 xu hoặc để trống để dùng free spin.',
      ephemeral: true
    });
  }
  
  await interaction.reply({
    content: '❌ **Wheel với custom bet chưa được hỗ trợ!** Vui lòng dùng `/wheel` command hoặc để trống để free spin.',
    ephemeral: true
  });
}