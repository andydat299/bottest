// Thêm field autoFishingToday vào userSchema để track quota hằng ngày
// Chỉ thêm field này, giữ nguyên toàn bộ logic cũ

const originalSchema = userSchema;

// Thêm autoFishingToday field
userSchema.add({
  autoFishingToday: {
    date: { type: String, default: null },
    minutes: { type: Number, default: 0 }
  }
});