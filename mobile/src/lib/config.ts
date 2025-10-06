import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // In development, use the Replit URL or localhost
  // In production, use the deployed backend URL
  const devUrl = Constants.expoConfig?.extra?.apiUrl || 'https://your-replit-url.repl.co';
  
  return __DEV__ ? devUrl : 'https://your-production-url.com';
};

export const API_BASE_URL = getApiBaseUrl();
