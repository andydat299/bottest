import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getAvailableLocations, canFishAtLocation, FISHING_LOCATIONS } from '../utils/fishingLocations.js';
import { User } from '../schemas/userSchema.js';

export const data = new SlashCommandBuilder()
    .setName('location')
    .setDescription('🗺️ Xem và chọn địa điểm câu cá')
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('Xem tất cả địa điểm câu cá'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('current')
            .setDescription('Xem địa điểm hiện tại'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('travel')
            .setDescription('Di chuyển đến địa điểm khác')
            .addStringOption(option =>
                option
                    .setName('destination')
                    .setDescription('Địa điểm muốn đến')
                    .setRequired(true)
                    .addChoices(
                        { name: '🏞️ Hồ Nước Ngọt', value: 'LAKE' },
                        { name: '🌊 Sông Suối', value: 'RIVER' },
                        { name: '🌊 Đại Dương', value: 'OCEAN' },
                        { name: '🌌 Vùng Biển Sâu', value: 'DEEP_SEA' },
                        { name: '🧊 Hồ Băng', value: 'ICE_LAKE' },
                        { name: '🌋 Hồ Núi Lửa', value: 'VOLCANIC_LAKE' },
                        { name: '✨ Ao Sen Huyền Bí', value: 'MYSTICAL_POND' }
                    )));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
        if (subcommand === 'list') {
            await showAllLocations(interaction);
        } else if (subcommand === 'current') {
            await showCurrentLocation(interaction);
        } else if (subcommand === 'travel') {
            await travelToLocation(interaction);
        }
    } catch (error) {
        console.error('Lỗi khi xử lý location:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi xử lý địa điểm!',
            ephemeral: true
        });
    }
}

async function showAllLocations(interaction) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });
    
    if (!user) {
        user = await User.create({ discordId });
    }
    
    const rodLevel = user.rodLevel || 1;
    const availableLocations = getAvailableLocations(rodLevel);
    
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🗺️ Tất Cả Địa Điểm Câu Cá')
        .setTimestamp();
    
    const locationList = [];
    
    for (const [key, location] of Object.entries(FISHING_LOCATIONS)) {
        const isAvailable = availableLocations.some(loc => loc.id === key);
        const access = canFishAtLocation(key, rodLevel);
        
        let status = '🔒 **Chưa mở khóa**';
        if (isAvailable) {
            if (access.canFish) {
                status = '✅ **Có thể câu cá**';
                if (access.hasCost) {
                    status += ` (${access.cost} xu/lần)`;
                }
            } else {
                status = `⚠️ **${access.reason}**`;
            }
        } else {
            status = `🔒 **Yêu cầu cần câu cấp ${location.unlockLevel}**`;
        }
        
        const specialFish = location.specialFish && location.specialFish.length > 0 
            ? `\n🐟 Cá đặc biệt: ${location.specialFish.map(f => f.name).join(', ')}`
            : '';
        
        const modifierInfo = [];
        if (location.modifiers && location.modifiers.fishRateMultiplier !== 1.0) {
            modifierInfo.push(`🎣 Tỷ lệ câu: ${Math.round(location.modifiers.fishRateMultiplier * 100)}%`);
        }
        if (location.modifiers && location.modifiers.rareFishBonus > 0) {
            modifierInfo.push(`✨ Cá hiếm: +${Math.round(location.modifiers.rareFishBonus * 100)}%`);
        }
        if (location.modifiers && location.modifiers.experienceMultiplier !== 1.0) {
            modifierInfo.push(`📈 Kinh nghiệm: ${Math.round(location.modifiers.experienceMultiplier * 100)}%`);
        }
        if (location.modifiers && location.modifiers.missRateModifier && location.modifiers.missRateModifier > 1.0) {
            modifierInfo.push(`⚠️ Khó câu: +${Math.round((location.modifiers.missRateModifier - 1) * 100)}% tỷ lệ hụt`);
        }
        
        const modifiers = modifierInfo.length > 0 ? `\n${modifierInfo.join(' • ')}` : '';
        
        locationList.push(
            `${location.emoji} **${location.name}**\n${location.description}\n${status}${specialFish}${modifiers}`
        );
    }
    
    embed.setDescription(locationList.join('\n\n'));
    embed.setFooter({
        text: `Cần câu hiện tại: Cấp ${rodLevel} • Sử dụng /location travel để di chuyển`
    });
    
    await interaction.reply({ embeds: [embed] });
}

async function showCurrentLocation(interaction) {
    const discordId = interaction.user.id;
    let user = await User.findOne({ discordId });
    
    if (!user) {
        user = await User.create({ discordId });
    }
    
    const currentLocation = user.currentFishingLocation || 'LAKE';
    const location = FISHING_LOCATIONS[currentLocation];
    const rodLevel = user.rodLevel || 1;
    const access = canFishAtLocation(currentLocation, rodLevel);
    
    const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`${location.emoji} ${location.name}`)
        .setDescription(location.description)
        .setTimestamp();
    
    // Trạng thái truy cập
    let statusInfo = '✅ **Đang câu cá tại đây**';
    if (!access.canFish) {
        statusInfo = `⚠️ **${access.reason}**`;
    } else if (access.hasCost) {
        statusInfo += ` (${access.cost} xu/lần)`;
    }
    
    embed.addFields({
        name: '📍 Trạng Thái',
        value: statusInfo,
        inline: false
    });
    
    // Hiệu ứng địa điểm
    const modifierInfo = [];
    if (location.fishRateModifier !== 1.0) {
        modifierInfo.push(`🎣 Tỷ lệ câu: x${location.fishRateModifier}`);
    }
    if (location.rareFishBonus > 0) {
        modifierInfo.push(`✨ Cá hiếm: +${Math.round(location.rareFishBonus * 100)}%`);
    }
    if (location.experienceBonus > 0) {
        modifierInfo.push(`📈 Kinh nghiệm: +${Math.round(location.experienceBonus * 100)}%`);
    }
    
    if (modifierInfo.length > 0) {
        embed.addFields({
            name: '⚡ Hiệu Ứng Địa Điểm',
            value: modifierInfo.join('\n'),
            inline: true
        });
    }
    
    // Cá đặc biệt
    if (location.specialFish && location.specialFish.length > 0) {
        const specialFishList = location.specialFish.map(fish => 
            `${fish.rarity === 'mythical' ? '⭐' : fish.rarity === 'legendary' ? '🐋' : '🐠'} ${fish.name}`
        ).join('\n');
        
        embed.addFields({
            name: '🐟 Cá Đặc Biệt',
            value: specialFishList,
            inline: true
        });
    }
    
    embed.setFooter({
        text: 'Sử dụng /location travel để di chuyển đến địa điểm khác'
    });
    
    await interaction.reply({ embeds: [embed] });
}

async function travelToLocation(interaction) {
    const discordId = interaction.user.id;
    const destination = interaction.options.getString('destination');
    
    let user = await User.findOne({ discordId });
    if (!user) {
        user = await User.create({ discordId });
    }
    
    const currentLocation = user.currentFishingLocation || 'LAKE';
    
    // Kiểm tra nếu đã ở địa điểm đó
    if (currentLocation === destination) {
        const location = FISHING_LOCATIONS[destination];
        return await interaction.reply({
            content: `📍 Bạn đã đang ở **${location.name}** rồi!`,
            ephemeral: true
        });
    }
    
    const rodLevel = user.rodLevel || 1;
    const access = canFishAtLocation(destination, rodLevel);
    
    if (!access.canFish) {
        const location = FISHING_LOCATIONS[destination];
        return await interaction.reply({
            content: `🚫 **Không thể di chuyển!**\n\n📍 **${location.name}**: ${access.reason}`,
            ephemeral: true
        });
    }
    
    // Kiểm tra chi phí di chuyển
    if (access.hasCost && user.balance < access.cost) {
        const location = FISHING_LOCATIONS[destination];
        return await interaction.reply({
            content: `💰 **Không đủ xu!**\n\n📍 **${location.name}** cần ${access.cost} xu để di chuyển.\n💳 Số dư hiện tại: ${user.balance} xu`,
            ephemeral: true
        });
    }
    
    // Thực hiện di chuyển
    if (access.hasCost) {
        user.balance -= access.cost;
    }
    
    user.currentFishingLocation = destination;
    await user.save();
    
    const newLocation = FISHING_LOCATIONS[destination];
    const oldLocation = FISHING_LOCATIONS[currentLocation];
    
    const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🗺️ Di Chuyển Thành Công!')
        .setDescription(`Bạn đã di chuyển từ **${oldLocation.name}** đến **${newLocation.name}**`)
        .addFields({
            name: `${newLocation.emoji} ${newLocation.name}`,
            value: newLocation.description,
            inline: false
        })
        .setTimestamp();
    
    if (access.hasCost) {
        embed.addFields({
            name: '💰 Chi Phí Di Chuyển',
            value: `${access.cost} xu`,
            inline: true
        });
    }
    
    // Hiệu ứng địa điểm mới
    const modifierInfo = [];
    if (newLocation.fishRateModifier !== 1.0) {
        modifierInfo.push(`🎣 Tỷ lệ câu: x${newLocation.fishRateModifier}`);
    }
    if (newLocation.rareFishBonus > 0) {
        modifierInfo.push(`✨ Cá hiếm: +${Math.round(newLocation.rareFishBonus * 100)}%`);
    }
    if (newLocation.experienceBonus > 0) {
        modifierInfo.push(`📈 EXP: +${Math.round(newLocation.experienceBonus * 100)}%`);
    }
    
    if (modifierInfo.length > 0) {
        embed.addFields({
            name: '⚡ Hiệu Ứng Mới',
            value: modifierInfo.join('\n'),
            inline: true
        });
    }
    
    embed.setFooter({
        text: 'Giờ bạn có thể câu cá tại địa điểm mới!'
    });
    
    await interaction.reply({ embeds: [embed] });
}
