import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getCurrentWeather, getEnvironmentModifiers, WEATHER_TYPES, TIME_PERIODS } from '../utils/weatherSystem.js';
import { getEventDisplayInfo } from '../utils/seasonalEvents.js';

export const data = new SlashCommandBuilder()
    .setName('weather')
    .setDescription('🌤️ Xem thông tin thời tiết và môi trường câu cá')
    .addSubcommand(subcommand =>
        subcommand
            .setName('current')
            .setDescription('Xem thời tiết hiện tại'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('forecast')
            .setDescription('Xem dự báo thời tiết'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('guide')
            .setDescription('Hướng dẫn về thời tiết và thời gian'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
        if (subcommand === 'current') {
            await showCurrentWeather(interaction);
        } else if (subcommand === 'forecast') {
            await showWeatherForecast(interaction);
        } else if (subcommand === 'guide') {
            await showWeatherGuide(interaction);
        }
    } catch (error) {
        console.error('Lỗi khi hiển thị thời tiết:', error);
        await interaction.reply({
            content: '❌ Có lỗi xảy ra khi hiển thị thông tin thời tiết!',
            ephemeral: true
        });
    }
}

async function showCurrentWeather(interaction) {
    const environmentModifiers = getEnvironmentModifiers();
    const { weather, timePeriod } = environmentModifiers;
    const eventInfo = getEventDisplayInfo();
    
    const embed = new EmbedBuilder()
        .setColor(getWeatherColor(weather.name))
        .setTitle('🌤️ Thông Tin Môi Trường Hiện Tại')
        .setTimestamp();
    
    // Thông tin thời tiết và thời gian
    embed.addFields(
        {
            name: '🌤️ Thời Tiết',
            value: `${weather.emoji} **${weather.name}**\n${weather.description}`,
            inline: true
        },
        {
            name: '🕐 Thời Gian',
            value: `${timePeriod.emoji} **${timePeriod.name}**\n${timePeriod.description}`,
            inline: true
        }
    );
    
    // Hiệu ứng môi trường
    const effectInfo = [];
    if (environmentModifiers.fishRateMultiplier !== 1.0) {
        const sign = environmentModifiers.fishRateMultiplier > 1.0 ? '+' : '';
        const percent = Math.round((environmentModifiers.fishRateMultiplier - 1) * 100);
        effectInfo.push(`🎣 Tỷ lệ câu cá: ${sign}${percent}%`);
    }
    
    if (environmentModifiers.rareFishBonus !== 0) {
        const sign = environmentModifiers.rareFishBonus > 0 ? '+' : '';
        const percent = Math.round(environmentModifiers.rareFishBonus * 100);
        effectInfo.push(`✨ Cá hiếm: ${sign}${percent}%`);
    }
    
    if (environmentModifiers.experienceMultiplier !== 1.0) {
        const sign = environmentModifiers.experienceMultiplier > 1.0 ? '+' : '';
        const percent = Math.round((environmentModifiers.experienceMultiplier - 1) * 100);
        effectInfo.push(`📈 Kinh nghiệm: ${sign}${percent}%`);
    }
    
    if (environmentModifiers.coinMultiplier !== 1.0) {
        const sign = environmentModifiers.coinMultiplier > 1.0 ? '+' : '';
        const percent = Math.round((environmentModifiers.coinMultiplier - 1) * 100);
        effectInfo.push(`💰 Xu: ${sign}${percent}%`);
    }
    
    if (effectInfo.length > 0) {
        embed.addFields({
            name: '⚡ Hiệu Ứng Môi Trường',
            value: effectInfo.join('\n'),
            inline: false
        });
    } else {
        embed.addFields({
            name: '⚡ Hiệu Ứng Môi Trường',
            value: '🔹 Không có hiệu ứng đặc biệt',
            inline: false
        });
    }
    
    // Thông tin sự kiện
    if (eventInfo.hasEvents) {
        embed.addFields({
            name: '🌟 Sự Kiện Đang Diễn Ra',
            value: `${eventInfo.count} sự kiện đang hoạt động\n${eventInfo.effects}`,
            inline: false
        });
    }
    
    // Lời khuyên
    const advice = getWeatherAdvice(weather.name, timePeriod.name);
    if (advice) {
        embed.addFields({
            name: '💡 Lời Khuyên',
            value: advice,
            inline: false
        });
    }
    
    // Cá đặc biệt có thể xuất hiện
    const specialFishInfo = [];
    if (weather.specialFish && weather.specialFish.length > 0) {
        const weatherFish = weather.specialFish.map(fish => 
            `${fish.rarity === 'mythical' ? '⭐' : fish.rarity === 'legendary' ? '🐋' : '🐠'} ${fish.name} (${Math.round(fish.chance * 100)}%)`
        ).join('\n');
        specialFishInfo.push(`**${weather.emoji} Thời tiết:**\n${weatherFish}`);
    }
    
    if (timePeriod.specialFish && timePeriod.specialFish.length > 0) {
        const timeFish = timePeriod.specialFish.map(fish => 
            `${fish.rarity === 'mythical' ? '⭐' : fish.rarity === 'legendary' ? '🐋' : '🐠'} ${fish.name} (${Math.round(fish.chance * 100)}%)`
        ).join('\n');
        specialFishInfo.push(`**${timePeriod.emoji} Thời gian:**\n${timeFish}`);
    }
    
    if (specialFishInfo.length > 0) {
        embed.addFields({
            name: '🐟 Cá Đặc Biệt Có Thể Xuất Hiện',
            value: specialFishInfo.join('\n\n'),
            inline: false
        });
    }
    
    embed.setFooter({
        text: 'Thời tiết thay đổi mỗi giờ • Thời gian thay đổi theo thực tế'
    });
    
    await interaction.reply({ embeds: [embed] });
}

async function showWeatherForecast(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🔮 Dự Báo Thời Tiết')
        .setDescription('Dự báo thời tiết và thời gian trong 6 giờ tới')
        .setTimestamp();
    
    const forecasts = [];
    const now = new Date();
    
    for (let i = 1; i <= 6; i++) {
        const futureDate = new Date(now.getTime() + (i * 60 * 60 * 1000)); // +i giờ
        const futureWeather = getCurrentWeather(futureDate);
        const futureModifiers = getEnvironmentModifiers(futureWeather.weather, futureWeather.timeOfDay);
        
        const timeText = i === 1 ? 'Giờ tới' : `${i} giờ tới`;
        const effects = [];
        
        if (futureModifiers.fishRateMultiplier !== 1.0) {
            effects.push(`🎣 x${futureModifiers.fishRateMultiplier.toFixed(1)}`);
        }
        if (futureModifiers.rareFishBonus > 0) {
            effects.push(`✨ +${Math.round(futureModifiers.rareFishBonus * 100)}%`);
        }
        
        const effectText = effects.length > 0 ? ` (${effects.join(' • ')})` : '';
        
        forecasts.push(
            `**${timeText}**\n${futureWeather.weatherEmoji} ${futureWeather.weather} - ${futureWeather.timeEmoji} ${futureWeather.timeOfDay}${effectText}`
        );
    }
    
    embed.setDescription(forecasts.join('\n\n'));
    embed.setFooter({
        text: 'Dự báo có thể thay đổi • Sử dụng /weather current để xem hiện tại'
    });
    
    await interaction.reply({ embeds: [embed] });
}

async function showWeatherGuide(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('📖 Hướng Dẫn Thời Tiết & Thời Gian')
        .setTimestamp();
    
    // Thông tin thời tiết
    const weatherGuide = Object.entries(WEATHER_TYPES).map(([key, weather]) => {
        const effects = [];
        if (weather.fishRateMultiplier !== 1.0) {
            effects.push(`🎣 x${weather.fishRateMultiplier}`);
        }
        if (weather.rareFishBonus !== 0) {
            const sign = weather.rareFishBonus > 0 ? '+' : '';
            effects.push(`✨ ${sign}${Math.round(weather.rareFishBonus * 100)}%`);
        }
        
        const effectText = effects.length > 0 ? ` (${effects.join(' • ')})` : '';
        return `${weather.emoji} **${weather.name}**${effectText}\n${weather.description}`;
    }).join('\n\n');
    
    embed.addFields({
        name: '🌤️ Các Loại Thời Tiết',
        value: weatherGuide,
        inline: false
    });
    
    // Thông tin thời gian
    const timeGuide = Object.entries(TIME_PERIODS).map(([key, time]) => {
        const effects = [];
        if (time.fishRateMultiplier !== 1.0) {
            effects.push(`🎣 x${time.fishRateMultiplier}`);
        }
        if (time.experienceMultiplier !== 1.0) {
            effects.push(`📈 x${time.experienceMultiplier}`);
        }
        
        const effectText = effects.length > 0 ? ` (${effects.join(' • ')})` : '';
        return `${time.emoji} **${time.name}** (${time.hours})${effectText}`;
    }).join('\n');
    
    embed.addFields({
        name: '🕐 Thời Gian Trong Ngày',
        value: timeGuide,
        inline: false
    });
    
    embed.addFields({
        name: '💡 Mẹo Câu Cá',
        value: [
            '🌧️ **Mưa Bão** tốt nhất cho cá hiếm',
            '🌅 **Bình Minh & Hoàng Hôn** cho nhiều kinh nghiệm',
            '🌙 **Đêm Khuya** thích hợp câu cá đặc biệt',
            '☀️ **Nắng Đẹp** ổn định cho người mới',
            '🌫️ **Sương Mù** giảm tỷ lệ câu nhưng tăng cá hiếm'
        ].join('\n'),
        inline: false
    });
    
    await interaction.reply({ embeds: [embed] });
}

function getWeatherColor(weather) {
    const colors = {
        'Nắng': '#f39c12',
        'Mây': '#95a5a6',
        'Mưa': '#3498db',
        'Bão': '#2c3e50',
        'Sương Mù': '#bdc3c7',
        'Gió': '#16a085'
    };
    return colors[weather] || '#3498db';
}

function getWeatherAdvice(weather, timeOfDay) {
    const advice = {
        'Nắng': {
            'Bình Minh': '🌅 Thời điểm hoàn hảo cho người mới bắt đầu!',
            'Sáng': '☀️ Thời gian tốt để câu cá ổn định.',
            'Trưa': '🌞 Cá ít hoạt động, hãy thử địa điểm khác.',
            'Chiều': '🌇 Cá bắt đầu hoạt động trở lại.',
            'Hoàng Hôn': '🌅 Kinh nghiệm tăng cao!',
            'Đêm': '🌙 Cá đêm xuất hiện.'
        },
        'Mưa': {
            'Bình Minh': '🌧️ Cá hiếm có thể xuất hiện!',
            'Sáng': '☔ Tỷ lệ câu cá tăng nhẹ.',
            'Trưa': '🌧️ Cá thích hoạt động trong mưa.',
            'Chiều': '☔ Thời điểm tốt để câu cá.',
            'Hoàng Hôn': '🌧️ Cơ hội câu cá hiếm cao!',
            'Đêm': '☔ Cá đêm xuất hiện nhiều hơn.'
        },
        'Bão': {
            default: '⚡ Cực kỳ nguy hiểm nhưng cá hiếm xuất hiện nhiều!'
        },
        'Sương Mù': {
            default: '🌫️ Tỷ lệ câu giảm nhưng cá hiếm tăng cao!'
        }
    };
    
    return advice[weather]?.[timeOfDay] || advice[weather]?.default || null;
}
