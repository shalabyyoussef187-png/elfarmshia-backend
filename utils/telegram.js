const axios = require('axios');

const sendTelegramMessage = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram token or chat ID is missing. Message not sent.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
    console.log('Telegram message sent successfully');
  } catch (error) {
    console.error('Failed to send Telegram message:', error.message);
  }
};

module.exports = { sendTelegramMessage };
