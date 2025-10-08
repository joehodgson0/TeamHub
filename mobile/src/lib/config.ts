import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // In development, use the Replit URL
  // In production, use the deployed backend URL
  const devUrl = Constants.expoConfig?.extra?.apiUrl || 'https://workspace.joehodgson0.repl.co';
  
  return __DEV__ ? devUrl : 'https://workspace.joehodgson0.repl.co';
};

export const API_BASE_URL = getApiBaseUrl();
