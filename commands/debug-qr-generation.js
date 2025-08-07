import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug-qr-generation')
    .setDescription('🔧 [ADMIN] Debug QR generation function')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Bạn không có quyền sử dụng lệnh này!',
        ephemeral: true
      });
    }

    try {
      console.log('🔧 Starting QR generation debug...');
      
      // Test mock request
      const mockRequest = {
        _id: { toString: () => 'DEBUG12345' },
        bankName: 'vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN VAN TEST',
        vndAmount: 100000,
        userId: interaction.user.id
      };

      console.log('📋 Mock request created:', mockRequest);

      // Test import bankQR functions
      console.log('📦 Importing bankQR module...');
      const { createQREmbed } = await import('../utils/bankQR.js');
      console.log('✅ bankQR module imported successfully');

      // Test createQREmbed function
      console.log('🎯 Testing createQREmbed function...');
      const qrData = createQREmbed(EmbedBuilder, mockRequest);
      console.log('✅ createQREmbed function executed successfully');
      console.log('📊 QR data type:', typeof qrData);
      console.log('📊 QR data keys:', Object.keys(qrData));

      // Test banking link
      console.log('🔗 Banking link preview:', qrData.bankingLink.substring(0, 100) + '...');

      await interaction.reply({
        content: `✅ **QR Generation Debug Successful!**\n\n📊 **Results:**\n\`\`\`json\n${JSON.stringify({
          embedTitle: qrData.embed.data.title,
          embedColor: qrData.embed.data.color,
          fieldsCount: qrData.embed.data.fields?.length || 0,
          bankingLinkLength: qrData.bankingLink.length,
          hasImage: !!qrData.embed.data.image
        }, null, 2)}\`\`\`\n\n🎯 **QR Generation is working properly!**`,
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ QR generation debug failed:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      await interaction.reply({
        content: `❌ **QR Generation Debug Failed:**\n\n**Error:** \`${error.name}\`\n**Message:** \`${error.message}\`\n\n**Stack trace:**\n\`\`\`${error.stack?.substring(0, 1000) || 'No stack trace'}\`\`\``,
        ephemeral: true
      });
    }
  }
};