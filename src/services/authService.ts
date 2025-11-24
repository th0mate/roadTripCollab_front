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

export const forgotPassword = async (payload: { email: string }): Promise<any> => {
  // Le backend ne gère pas encore cette route, ceci est un placeholder.
  // Lorsque le backend sera prêt, vous pourrez décommenter la ligne suivante.
  // const response = await apiClient.post('/auth/forgot-password', payload);
  // return response.data;

  // Simulation d'une réponse réussie
  console.log('Demande de réinitialisation de mot de passe pour:', payload.email);
  return Promise.resolve({ message: 'If an account with this email exists, a reset link has been sent.' });
};
