const axios = require('axios');
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const getGoogleToken = async (code) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_CALLBACK_URL,
    grant_type: 'authorization_code',
  });
  return response.data;
};

const getGoogleUserInfo = async (accessToken) => {
  const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

module.exports = { getGoogleToken, getGoogleUserInfo };
