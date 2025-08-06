import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getEventDisplayInfo, getActiveEvents, SEASONAL_EVENTS } from '../utils/seasonalEvents.js';

export const data = new SlashCommandBuilder()
    .setName('events')
    .setDescription('🌟 Xem sự kiện đang diễn ra và sắp tới')
    .addSubcommand(subcommand =>
        subcommand
            .setName('current')
            .setDescription('Xem events đang hoạt động'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('upcoming')
            .setDescription('Xem events sắp tới'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('Xem tất cả events trong năm'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
        if (subcommand === 'current') {
            await showCurrentEvents(interaction);
        } else if (subcommand === 'upcoming') {
            await showUpcomingEvents(interaction);
        } else if (subcommand === 'list') {
            await showAllEvents(interaction);
        }
    } catch (error) {
        console.error('Lỗi khi hiển thị events:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi hiển thị thông tin sự kiện!',
            ephemeral: true
        });
    }
}

async function showCurrentEvents(interaction) {
    const eventInfo = getEventDisplayInfo();
    
    const embed = new EmbedBuilder()
        .setColor(eventInfo.hasEvents ? '#ff6b6b' : '#95a5a6')
        .setTitle('🌟 Sự Kiện Đang Diễn Ra')
        .setTimestamp();
    
    if (eventInfo.hasEvents) {
        embed.setDescription(eventInfo.events);
        
        if (eventInfo.effects) {
            embed.addFields({
                name: '⚡ Hiệu Ứng Đang Hoạt Động',
                value: eventInfo.effects,
                inline: false
            });
        }
        
        embed.setFooter({
            text: `${eventInfo.count} sự kiện đang hoạt động`
        });
    } else {
        embed.setDescription(eventInfo.message);
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function showUpcomingEvents(interaction) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const upcoming = [];
    
    // Tìm events sắp tới trong 3 tháng tới
    for (let i = 1; i <= 3; i++) {
        const futureMonth = ((currentMonth + i - 1) % 12) + 1;
        
        for (const [key, event] of Object.entries(SEASONAL_EVENTS)) {
            if (event.isSpecial) continue; // Bỏ qua events đặc biệt
            
            let willActivate = false;
            if (event.startMonth <= event.endMonth) {
                willActivate = futureMonth >= event.startMonth && futureMonth <= event.endMonth;
            } else {
                willActivate = futureMonth >= event.startMonth || futureMonth <= event.endMonth;
            }
            
            if (willActivate && !upcoming.find(e => e.key === key)) {
                upcoming.push({
                    key,
                    ...event,
                    monthsUntil: i
                });
            }
        }
    }
    
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📅 Sự Kiện Sắp Tới')
        .setTimestamp();
    
    if (upcoming.length === 0) {
        embed.setDescription('🌟 Không có sự kiện nào trong 3 tháng tới');
    } else {
        const eventList = upcoming.map(event => {
            const monthText = event.monthsUntil === 1 ? 'tháng tới' : `${event.monthsUntil} tháng tới`;
            return `${event.emoji} **${event.name}** (${monthText})\n${event.description}`;
        }).join('\n\n');
        
        embed.setDescription(eventList);
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function showAllEvents(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('📋 Tất Cả Sự Kiện Trong Năm')
        .setTimestamp();
    
    const seasonalEvents = [];
    const specialEvents = [];
    
    for (const [key, event] of Object.entries(SEASONAL_EVENTS)) {
        const eventInfo = `${event.emoji} **${event.name}**\n${event.description}`;
        
        if (event.isSpecial) {
            specialEvents.push(eventInfo);
        } else {
            const monthRange = event.startMonth <= event.endMonth 
                ? `Tháng ${event.startMonth}-${event.endMonth}`
                : `Tháng ${event.startMonth}-12, 1-${event.endMonth}`;
            seasonalEvents.push(`${eventInfo}\n*${monthRange}*`);
        }
    }
    
    if (seasonalEvents.length > 0) {
        embed.addFields({
            name: '🗓️ Sự Kiện Theo Mùa',
            value: seasonalEvents.join('\n\n'),
            inline: false
        });
    }
    
    if (specialEvents.length > 0) {
        embed.addFields({
            name: '⭐ Sự Kiện Đặc Biệt',
            value: specialEvents.join('\n\n') + '\n*Cần admin kích hoạt*',
            inline: false
        });
    }
    
    embed.setFooter({
        text: 'Sử dụng /events current để xem events đang hoạt động'
    });
    
    await interaction.reply({ embeds: [embed] });
}
