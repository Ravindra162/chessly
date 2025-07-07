/**
 * API Configuration
 * Centralized configuration for backend URLs and API endpoints
 */

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
};

const getWebSocketUrl = () => {
  return import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5000';
};

export const API_CONFIG = {
  BACKEND_URL: getBackendUrl(),
  WEBSOCKET_URL: getWebSocketUrl(),
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    
    // User endpoints
    USER: '/user/user',
    USER_GAMES: '/user/games',
    USER_GAME_BY_ID: '/user/games',
    UPDATE_WINNER: '/user/game/update/winnerId',
    
    // Friends endpoints
    FRIENDS: '/friends/friends',
    FRIEND_REQUESTS_RECEIVED: '/friends/friend-requests/received',
    FRIEND_REQUESTS_SENT: '/friends/friend-requests/sent',
    FRIEND_REQUEST_SEND: '/friends/friend-request/send',
    FRIEND_REQUEST_ACCEPT: '/friends/friend-request/accept',
    FRIEND_REQUEST_REJECT: '/friends/friend-request/reject',
    FRIEND_REMOVE: '/friends/friend/remove',
    FRIEND_SEARCH: '/friends/search',
    FRIEND_CHALLENGE: '/friends/challenge',
    
    // Bot game endpoints (these are WebSocket-based but kept for consistency)
    BOT_GAME_CREATE: '/bot/create',
    BOT_GAME_DIFFICULTIES: '/bot/difficulties'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
});
