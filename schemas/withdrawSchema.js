import mongoose from 'mongoose';

const withdrawRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 50000
  },
  fee: {
    type: Number,
    required: true,
    default: 0
  },
  xuAfterFee: {
    type: Number,
    required: true
  },
  vndAmount: {
    type: Number,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountHolder: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminId: {
    type: String,
    default: null
  },
  adminNote: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index cho query hiệu quả
withdrawRequestSchema.index({ userId: 1, status: 1 });
withdrawRequestSchema.index({ createdAt: -1 });

export const WithdrawRequest = mongoose.model('WithdrawRequest', withdrawRequestSchema);