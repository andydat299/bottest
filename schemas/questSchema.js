import mongoose from 'mongoose';

// Schema riêng cho quest item
const questItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // 'fish', 'chat', 'earn', 'upgrade'
  description: { type: String, required: true },
  target: { type: Number, required: true }, // Mục tiêu cần đạt
  current: { type: Number, default: 0 }, // Tiến độ hiện tại
  reward: { type: Number, required: true }, // Phần thưởng xu
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false }, // Đã nhận thưởng chưa
  channelId: { type: String } // Cho quest chat (optional)
}, { _id: false }); // Không tạo _id cho subdocument

const questSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  dailyQuests: {
    date: { type: String, default: () => new Date().toDateString() }, // Ngày tạo quest
    quests: [questItemSchema] // Sử dụng schema riêng
  },
  totalQuestsCompleted: { type: Number, default: 0 }
});

export const Quest = mongoose.model('Quest', questSchema);
