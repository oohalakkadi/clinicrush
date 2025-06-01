import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:2000'}/api`;

export const searchTrials = async (condition: string, location?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trials/search`, {
      params: { condition, location }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching trials:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};