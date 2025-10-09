import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // Both development and production use the same backend URL
  // The backend determines auth method based on NODE_ENV:
  // - Development: Email/password auth
  // - Production: Replit OAuth auth
  const backendUrl = Constants.expoConfig?.extra?.apiUrl || 'https://workspace.joehodgson0.repl.co';
  
  return backendUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Mobile apps always use email/password for now
// Production Replit OAuth is web-only
export const USE_EMAIL_AUTH = true;
