/**
 * Blackjack (Xì Dách) Game System
 */
import { User } from '../schemas/userSchema.js';
import { logMoneySpent, logMoneyReceived, logMoneyDeducted } from './logger.js';

// Cấu hình game
const GAME_CONFIG = {
  minBet: 1,
  maxBet: 1000,
  dealerStandOn: 17,
  blackjackPayout: 1.8, // 1.8x cho blackjack (21 với 2 lá)
  normalPayout: 1.8,    // 1.8x cho thắng thường
  playerWinRate: 0.3    // Bỏ rate này vì không dùng nữa
};

// Card values và suits
const SUITS = ['♠️', '♥️', '♣️', '♦️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Class để quản lý bài
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }

  getValue() {
    if (this.rank === 'A') return 11; // Ace có thể là 1 hoặc 11
    if (['J', 'Q', 'K'].includes(this.rank)) return 10;
    return parseInt(this.rank);
  }

  toString() {
    return `${this.rank}${this.suit}`;
  }
}

// Class để quản lý bộ bài
class Deck {
  constructor() {
    this.cards = [];
    this.reset();
    this.shuffle();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) {
      this.reset();
      this.shuffle();
    }
    return this.cards.pop();
  }
}

// Class để quản lý tay bài
class Hand {
  constructor() {
    this.cards = [];
  }

  addCard(card) {
    this.cards.push(card);
  }

  getValue() {
    let value = 0;
    let aces = 0;

    for (const card of this.cards) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.getValue();
      }
    }

    // Điều chỉnh Ace từ 11 thành 1 nếu cần
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  isBlackjack() {
    return this.cards.length === 2 && this.getValue() === 21;
  }

  isBust() {
    return this.getValue() > 21;
  }

  toString() {
    return this.cards.map(card => card.toString()).join(' ');
  }

  getHiddenString() {
    // Hiển thị chỉ lá đầu tiên, lá thứ 2 ẩn
    if (this.cards.length === 0) return '';
    return `${this.cards[0].toString()} 🎴`;
  }
}

// Class quản lý game chính
class BlackjackGame {
  constructor(userId, betAmount) {
    this.userId = userId;
    this.betAmount = betAmount;
    this.deck = new Deck();
    this.playerHand = new Hand();
    this.dealerHand = new Hand();
    this.gameState = 'playing'; // playing, playerWin, dealerWin, push, playerBust, dealerBust
    this.isFinished = false;
  }

  // Bắt đầu game
  start() {
    // Chia 2 lá cho player, 2 lá cho dealer
    this.playerHand.addCard(this.deck.draw());
    this.dealerHand.addCard(this.deck.draw());
    this.playerHand.addCard(this.deck.draw());
    this.dealerHand.addCard(this.deck.draw());

    // Kiểm tra blackjack ngay lập tức
    if (this.playerHand.isBlackjack()) {
      if (this.dealerHand.isBlackjack()) {
        this.gameState = 'push';
        this.isFinished = true;
      } else {
        this.gameState = 'playerWin';
        this.isFinished = true;
      }
    }

    return this.getGameStatus();
  }

  // Player rút thêm bài
  hit() {
    if (this.isFinished) return this.getGameStatus();

    this.playerHand.addCard(this.deck.draw());

    if (this.playerHand.isBust()) {
      this.gameState = 'playerBust';
      this.isFinished = true;
    }

    return this.getGameStatus();
  }

  // Player dừng
  stand() {
    if (this.isFinished) return this.getGameStatus();

    // Dealer rút bài theo luật (phải rút nếu < 17)
    while (this.dealerHand.getValue() < GAME_CONFIG.dealerStandOn) {
      this.dealerHand.addCard(this.deck.draw());
    }

    // Xác định người thắng theo luật blackjack chuẩn (không có house edge giả tạo)
    const playerValue = this.playerHand.getValue();
    const dealerValue = this.dealerHand.getValue();
    
    // Áp dụng luật blackjack thực tế 100%
    if (this.dealerHand.isBust()) {
      // Dealer bust → Player thắng
      this.gameState = 'dealerBust';
    } else if (playerValue > dealerValue) {
      // Player điểm cao hơn → Player thắng
      this.gameState = 'playerWin';
    } else if (playerValue < dealerValue) {
      // Dealer điểm cao hơn → Dealer thắng
      this.gameState = 'dealerWin';
    } else {
      // Điểm bằng nhau → Hòa
      this.gameState = 'push';
    }

    this.isFinished = true;
    return this.getGameStatus();
  }

  // Lấy trạng thái game hiện tại
  getGameStatus() {
    const playerValue = this.playerHand.getValue();
    const dealerValue = this.dealerHand.getValue();
    
    return {
      playerHand: this.playerHand.toString(),
      dealerHand: this.isFinished ? this.dealerHand.toString() : this.dealerHand.getHiddenString(),
      playerValue,
      dealerValue: this.isFinished ? dealerValue : this.dealerHand.cards[0].getValue(),
      gameState: this.gameState,
      isFinished: this.isFinished,
      betAmount: this.betAmount,
      canHit: !this.isFinished && playerValue < 21,
      canStand: !this.isFinished
    };
  }

  // Tính toán kết quả cuối game
  async getGameResult() {
    if (!this.isFinished) return null;

    let winAmount = 0;
    let resultMessage = '';

    switch (this.gameState) {
      case 'playerWin':
        if (this.playerHand.isBlackjack()) {
          winAmount = Math.floor(this.betAmount * GAME_CONFIG.blackjackPayout);
          resultMessage = '🎉 BLACKJACK! Bạn thắng!';
        } else {
          winAmount = Math.floor(this.betAmount * GAME_CONFIG.normalPayout);
          resultMessage = '🎉 Bạn thắng!';
        }
        break;
      case 'dealerBust':
        winAmount = Math.floor(this.betAmount * GAME_CONFIG.normalPayout);
        resultMessage = '🎉 Dealer bị bust! Bạn thắng!';
        break;
      case 'push':
        winAmount = this.betAmount; // Hoàn lại tiền cược gốc khi hòa
        resultMessage = '🤝 Hòa! Hoàn tiền cược';
        break;
      case 'playerBust':
      case 'dealerWin':
        winAmount = -this.betAmount;
        resultMessage = '😢 Bạn thua!';
        break;
    }

    // Cập nhật database
    try {
      let balanceChange = 0;
      let winningsChange = 0;
      
      if (this.gameState === 'push') {
        // Khi hòa: hoàn lại tiền cược, winnings không đổi
        balanceChange = this.betAmount; // Hoàn tiền cược
        winningsChange = 0; // Không tính là thắng hay thua
      } else if (winAmount > 0) {
        // Thắng: nhận tiền thưởng
        balanceChange = winAmount;
        winningsChange = winAmount - this.betAmount; // Lời thực tế
      } else {
        // Thua: không hoàn gì cả
        balanceChange = 0;
        winningsChange = winAmount; // Số âm (lỗ)
      }
      
      const updatedUser = await User.findOneAndUpdate(
        { discordId: this.userId },
        { 
          $inc: { 
            balance: balanceChange,
            'stats.blackjackGames': 1,
            'stats.blackjackWinnings': winningsChange
          }
        },
        { upsert: true, new: true }
      );
      
      // Log money transaction
      if (this.gameState === 'push') {
        // Không log gì cho trường hợp hòa vì không có thay đổi balance thực tế
        console.log(`🤝 Blackjack game tied - money returned to user ${this.userId}`);
      } else if (balanceChange > this.betAmount) {
        // Player thắng - log số tiền thắng thực tế (không bao gồm tiền cược gốc)
        const actualWin = balanceChange - this.betAmount;
        await logMoneyReceived(updatedUser, actualWin, 'blackjack-win', {
          gameState: this.gameState,
          betAmount: this.betAmount,
          totalReceived: balanceChange
        });
      } else if (this.gameState === 'playerBust' || this.gameState === 'dealerWin') {
        // Player thua - log số tiền mất (tiền cược đã bị trừ lúc bắt đầu)
        await logMoneyDeducted(updatedUser, this.betAmount, 'blackjack-loss', {
          gameState: this.gameState,
          betAmount: this.betAmount
        });
      }
      
    } catch (error) {
      console.error('Error updating user after blackjack game:', error);
    }

    return {
      winAmount,
      resultMessage,
      gameState: this.gameState
    };
  }
}

// Storage cho active games
const activeGames = new Map();

/**
 * Bắt đầu game mới
 */
export async function startBlackjackGame(userId, betAmount) {
  // Validate bet amount
  if (betAmount < GAME_CONFIG.minBet || betAmount > GAME_CONFIG.maxBet) {
    return {
      success: false,
      message: `❌ Số xu cược phải từ ${GAME_CONFIG.minBet.toLocaleString()} đến ${GAME_CONFIG.maxBet.toLocaleString()} xu!`
    };
  }

  // Kiểm tra user có đủ xu không
  try {
    const user = await User.findOne({ discordId: userId });
    if (!user || user.balance < betAmount) {
      return {
        success: false,
        message: `❌ Bạn không đủ xu để cược! Cần ${betAmount.toLocaleString()} xu.`
      };
    }

    // Trừ xu cược trước
    await User.findOneAndUpdate(
      { discordId: userId },
      { $inc: { balance: -betAmount } }
    );

    // Log money spent on betting
    await logMoneySpent(user, betAmount, 'blackjack-bet');

    // Tạo game mới
    const game = new BlackjackGame(userId, betAmount);
    const gameStatus = game.start();
    
    // Lưu game vào active games
    activeGames.set(userId, game);

    return {
      success: true,
      game: gameStatus,
      message: '🎴 Game xì dách bắt đầu!'
    };

  } catch (error) {
    console.error('Error starting blackjack game:', error);
    return {
      success: false,
      message: '❌ Có lỗi xảy ra khi bắt đầu game!'
    };
  }
}

/**
 * Player rút thêm bài (Hit)
 */
export function hitBlackjack(userId) {
  const game = activeGames.get(userId);
  if (!game) {
    return {
      success: false,
      message: '❌ Bạn không có game nào đang chơi!'
    };
  }

  const gameStatus = game.hit();
  return {
    success: true,
    game: gameStatus
  };
}

/**
 * Player dừng (Stand)
 */
export async function standBlackjack(userId) {
  const game = activeGames.get(userId);
  if (!game) {
    return {
      success: false,
      message: '❌ Bạn không có game nào đang chơi!'
    };
  }

  const gameStatus = game.stand();
  const result = await game.getGameResult();
  
  // Xóa game khỏi active games
  activeGames.delete(userId);

  return {
    success: true,
    game: gameStatus,
    result
  };
}

/**
 * Lấy game hiện tại của user
 */
export function getCurrentGame(userId) {
  const game = activeGames.get(userId);
  if (!game) return null;
  
  return game.getGameStatus();
}

/**
 * Hủy game hiện tại (hoàn tiền)
 */
export async function cancelBlackjackGame(userId) {
  const game = activeGames.get(userId);
  if (!game) {
    return {
      success: false,
      message: '❌ Bạn không có game nào đang chơi!'
    };
  }

  // Hoàn tiền cược
  try {
    await User.findOneAndUpdate(
      { discordId: userId },
      { $inc: { balance: game.betAmount } }
    );

    activeGames.delete(userId);

    return {
      success: true,
      message: `✅ Đã hủy game và hoàn ${game.betAmount.toLocaleString()} xu!`
    };
  } catch (error) {
    console.error('Error canceling blackjack game:', error);
    return {
      success: false,
      message: '❌ Có lỗi xảy ra khi hủy game!'
    };
  }
}

/**
 * Lấy thống kê blackjack của user
 */
export async function getBlackjackStats(userId) {
  try {
    const user = await User.findOne({ discordId: userId });
    if (!user) return null;

    return {
      gamesPlayed: user.stats?.blackjackGames || 0,
      totalWinnings: user.stats?.blackjackWinnings || 0,
      winRate: user.stats?.blackjackGames ? 
        Math.round(((user.stats.blackjackWinnings || 0) / (user.stats.blackjackGames * 1000)) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting blackjack stats:', error);
    return null;
  }
}

/**
 * Admin function - Lấy thống kê tổng quan
 */
export function getGameSystemStats() {
  return {
    activeGames: activeGames.size,
    config: GAME_CONFIG
  };
}
