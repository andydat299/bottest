import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export function createWithdrawModal() {
  const modal = new ModalBuilder()
    .setCustomId('withdraw_modal')
    .setTitle('💰 Đổi Xu Thành Tiền VNĐ');

  // Số xu muốn rút
  const amountInput = new TextInputBuilder()
    .setCustomId('withdraw_amount')
    .setLabel('Số xu muốn đổi (50,000 - 1,000,000)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ví dụ: 100000')
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(7);

  // Tên ngân hàng
  const bankInput = new TextInputBuilder()
    .setCustomId('withdraw_bank')
    .setLabel('Tên ngân hàng')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ví dụ: Vietcombank, Techcombank, BIDV...')
    .setRequired(true)
    .setMaxLength(50);

  // Số tài khoản
  const accountInput = new TextInputBuilder()
    .setCustomId('withdraw_account')
    .setLabel('Số tài khoản ngân hàng')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ví dụ: 1234567890')
    .setRequired(true)
    .setMinLength(6)
    .setMaxLength(20);

  // Tên chủ tài khoản
  const nameInput = new TextInputBuilder()
    .setCustomId('withdraw_name')
    .setLabel('Họ tên chủ tài khoản (đúng như trên thẻ)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ví dụ: NGUYEN VAN A')
    .setRequired(true)
    .setMaxLength(100);

  // Ghi chú (tùy chọn)
  const noteInput = new TextInputBuilder()
    .setCustomId('withdraw_note')
    .setLabel('Ghi chú (tùy chọn)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Ghi chú thêm cho admin (nếu có)...')
    .setRequired(false)
    .setMaxLength(200);

  // Thêm inputs vào modal
  modal.addComponents(
    new ActionRowBuilder().addComponents(amountInput),
    new ActionRowBuilder().addComponents(bankInput),
    new ActionRowBuilder().addComponents(accountInput),
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(noteInput)
  );

  return modal;
}