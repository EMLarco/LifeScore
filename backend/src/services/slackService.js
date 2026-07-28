const axios = require('axios');

const sendSlackNotification = async (webhookUrl, message) => {
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
};

module.exports = { sendSlackNotification };
