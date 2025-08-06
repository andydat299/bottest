import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { activateSpecialEvent, SEASONAL_EVENTS, getActiveEvents } from '../utils/seasonalEvents.js';
import { logAdminAction } from '../utils/logger.js';
import { isAdmin } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('eventadmin')
    .setDescription('🛠️ [ADMIN] Quản lý sự kiện')
    .addSubcommand(subcommand =>
        subcommand
            .setName('activate')
            .setDescription('Kích hoạt event đặc biệt')
            .addStringOption(option =>
                option
                    .setName('event')
                    .setDescription('Tên event cần kích hoạt')
                    .setRequired(true)
                    .addChoices(
                        { name: '🧧 Tết Nguyên Đán', value: 'LUNAR_NEW_YEAR' },
                        { name: '🎃 Halloween Ma Quái', value: 'HALLOWEEN_SPOOKY' }
                    ))
            .addIntegerOption(option =>
                option
                    .setName('duration')
                    .setDescription('Thời gian kích hoạt (giờ) - mặc định theo event')
                    .setMinValue(1)
                    .setMaxValue(168))) // Tối đa 1 tuần
    .addSubcommand(subcommand =>
        subcommand
            .setName('status')
            .setDescription('Xem trạng thái events hiện tại'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('deactivate')
            .setDescription('Tắt event đặc biệt')
            .addStringOption(option =>
                option
                    .setName('event')
                    .setDescription('Tên event cần tắt')
                    .setRequired(true)));

export async function execute(interaction) {
    // Kiểm tra quyền admin
    if (!isAdmin(interaction.user.id)) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Không Có Quyền')
            .setDescription('Chỉ admin mới có thể sử dụng lệnh này!')
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    try {
        if (subcommand === 'activate') {
            await activateEvent(interaction);
        } else if (subcommand === 'status') {
            await showEventStatus(interaction);
        } else if (subcommand === 'deactivate') {
            await deactivateEvent(interaction);
        }
    } catch (error) {
        console.error('Lỗi khi quản lý events:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi quản lý sự kiện!',
            ephemeral: true
        });
    }
}

async function activateEvent(interaction) {
    const eventId = interaction.options.getString('event');
    const duration = interaction.options.getInteger('duration');
    
    const result = activateSpecialEvent(eventId, duration);
    
    const embed = new EmbedBuilder()
        .setTimestamp();
    
    if (result.success) {
        const event = SEASONAL_EVENTS[eventId];
        
        embed.setColor('#2ecc71')
            .setTitle('✅ Kích Hoạt Event Thành Công')
            .setDescription(`${event.emoji} **${event.name}** đã được kích hoạt!`)
            .addFields(
                {
                    name: '⏰ Thời Gian',
                    value: `${duration || event.duration} giờ`,
                    inline: true
                },
                {
                    name: '🎯 Hiệu Ứng',
                    value: [
                        `🎣 Câu cá: ${Math.round(event.modifiers.fishRateMultiplier * 100)}%`,
                        `✨ Cá hiếm: +${Math.round(event.modifiers.rareFishBonus * 100)}%`,
                        `📈 Kinh nghiệm: ${Math.round(event.modifiers.experienceMultiplier * 100)}%`,
                        `💰 Xu: ${Math.round(event.modifiers.coinMultiplier * 100)}%`
                    ].join('\n'),
                    inline: true
                }
            );
        
        // Log admin action
        await logAdminAction(
            interaction.user,
            'EVENT_ACTIVATE',
            `Kích hoạt event ${event.name} trong ${duration || event.duration} giờ`
        );
        
    } else {
        embed.setColor('#e74c3c')
            .setTitle('❌ Kích Hoạt Thất Bại')
            .setDescription(result.message);
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function showEventStatus(interaction) {
    const activeEvents = getActiveEvents();
    
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📊 Trạng Thái Events')
        .setTimestamp();
    
    if (activeEvents.length === 0) {
        embed.setDescription('🌟 Hiện tại không có event nào đang hoạt động');
    } else {
        const eventList = activeEvents.map(event => {
            const modifiers = [
                `🎣 ${Math.round(event.modifiers.fishRateMultiplier * 100)}%`,
                `✨ +${Math.round(event.modifiers.rareFishBonus * 100)}%`,
                `📈 ${Math.round(event.modifiers.experienceMultiplier * 100)}%`,
                `💰 ${Math.round(event.modifiers.coinMultiplier * 100)}%`
            ].join(' • ');
            
            return `${event.emoji} **${event.name}**\n${event.description}\n*${modifiers}*`;
        }).join('\n\n');
        
        embed.setDescription(eventList);
        embed.setFooter({
            text: `${activeEvents.length} event(s) đang hoạt động`
        });
    }
    
    // Thêm thông tin về events có thể kích hoạt
    const specialEvents = Object.entries(SEASONAL_EVENTS)
        .filter(([key, event]) => event.isSpecial)
        .map(([key, event]) => `${event.emoji} ${event.name}`)
        .join('\n');
    
    if (specialEvents) {
        embed.addFields({
            name: '⚡ Events Đặc Biệt Có Thể Kích Hoạt',
            value: specialEvents,
            inline: false
        });
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function deactivateEvent(interaction) {
    const eventId = interaction.options.getString('event');
    
    // Trong thực tế, cần logic để tắt event từ database
    // Hiện tại chỉ thông báo
    
    const embed = new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⚠️ Tính Năng Đang Phát Triển')
        .setDescription('Tính năng tắt event đang được phát triển.\nHiện tại events sẽ tự động tắt khi hết thời gian.')
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
