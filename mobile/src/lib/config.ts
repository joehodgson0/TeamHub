import Constants from 'expo-constants';

// Use the API URL from app.json extra config
// This allows you to change the URL for production builds without code changes
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://82e7b365-1a35-4433-9dd4-e760ea332ce1-00-1atx8t3ayfoav.picard.replit.dev';
