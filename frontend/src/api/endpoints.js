export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
};

export const HABITS = {
  BASE: '/habits',
  COMPLETE: (id) => `/habits/${id}/complete`,
};

export const GAMIFICATION = {
  STATS: '/gamification/stats',
};

export const PUSH = {
  SUBSCRIBE: '/push/subscribe',
};

export const REWARDS = {
  BASE: '/rewards',
  MINE: '/rewards/mine',
  REDEEM: (id) => `/rewards/${id}/redeem`,
};

export const PROFILE = {
  BASE: '/profile',
  BANNERS: '/profile/banners',
  PURCHASE_BANNER: (id) => `/profile/banners/${id}/purchase`,
};

export const STORE = {
  BASE: '/store',
  MY_ITEMS: '/store/my-items',
  ITEM: (id) => `/store/${id}`,
  PURCHASE: (id) => `/store/${id}/purchase`,
};

export const CALENDAR = {
  BASE: '/calendar',
  EVENT: (id) => `/calendar/${id}`,
};

export const SCHEDULE = {
  BASE: '/schedule',
};

export const AGENT = {
  SUGGESTIONS: '/agent/suggestions',
};

export const FRIENDS = {
  BASE: '/friends',
  ALL: '/friends/all',
  SEARCH: '/friends/search',
  PENDING: '/friends/pending',
  ACCEPT: (id) => `/friends/${id}/accept`,
  REJECT: (id) => `/friends/${id}/reject`,
  REMOVE: (id) => `/friends/${id}`,
};

export const FRIEND_CHALLENGES = {
  BASE: '/friend-challenges',
  ACCEPT: (id) => `/friend-challenges/${id}/accept`,
  COMPLETE: (id) => `/friend-challenges/${id}/complete`,
};

export const ACHIEVEMENTS = {
  BASE: '/achievements',
};

export const SKINS = {
  BASE: '/skins',
  BUY: (id) => `/skins/${id}/buy`,
  EQUIP: (id) => `/skins/${id}/equip`,
};

export const SESSIONS = {
  BASE: '/sessions',
  REVOKE: (id) => `/sessions/${id}`,
};

export const PAYMENT = {
  CREATE_ORDER: '/payment/create-order',
  SUBSCRIPTION_STATUS: '/payment/subscription/status',
  HISTORY: '/payment/history',
};

export const PREMIUM_CHALLENGES = {
  BASE: '/premium-challenges',
  COMPLETE: (id) => `/premium-challenges/${id}/complete`,
};

export const INVOICES = {
  BASE: '/invoices',
  GENERATE: '/invoices/generate',
  DOWNLOAD: (number) => `/invoices/${number}/download`,
};
