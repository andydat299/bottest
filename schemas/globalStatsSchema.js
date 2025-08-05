import mongoose from 'mongoose';

const globalStatsSchema = new mongoose.Schema({
  statsId: { type: String, default: 'global', unique: true },
  totalFishCaught: { type: Map, of: Number, default: {} }, // Tổng số cá đã câu được theo loại
  totalPlayers: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export const GlobalStats = mongoose.model('GlobalStats', globalStatsSchema);
