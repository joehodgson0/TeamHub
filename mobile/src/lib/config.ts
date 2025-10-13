import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const backendUrl = Constants.expoConfig?.extra?.apiUrl || 'https://workspace.joehodgson0.repl.co';
  return backendUrl;
};

export const API_BASE_URL = getApiBaseUrl();
