import apiClient from './api';
import type { User } from '@/types/user';

export const login = async (credentials: Pick<User, 'email' | 'password'>): Promise<any> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: Pick<User, 'fullName' | 'email' | 'password'>): Promise<any> => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};
