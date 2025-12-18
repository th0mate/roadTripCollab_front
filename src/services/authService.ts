import apiClient from './api'
import type { User } from '@/types/user'

const TOKEN_KEY = 'authToken'

export const login = async (credentials: Pick<User, 'email' | 'password'>): Promise<any> => {
  const response = await apiClient.post('/auth/login', credentials)
  if (response.data.data.token) {
    setToken(response.data.data.token)
  }
  return response.data
}

export const register = async (
  userData: Pick<User, 'fullName' | 'email' | 'password'>
): Promise<any> => {
  const response = await apiClient.post('/auth/register', userData)
  if (response.data.data.token) {
    setToken(response.data.data.token)
  }
  return response.data
}

export const logout = async (): Promise<any> => {
  const response = await apiClient.post('/auth/logout')
  removeToken()
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me')
  return response.data.data.user
}

export const updateMe = async (userData: Partial<User>): Promise<User> => {
  const response = await apiClient.put('/auth/me', userData)
  return response.data.data.user
}

export const deleteAccount = async (): Promise<any> => {
  const response = await apiClient.delete('/auth/me')
  removeToken()
  return response.data
}

export const forgotPassword = async (payload: { email: string }): Promise<any> => {
  // Le backend ne gère pas encore cette route, ceci est un placeholder.
  // Lorsque le backend sera prêt, vous pourrez décommenter la ligne suivante.
  // const response = await apiClient.post('/auth/forgot-password', payload);
  // return response.data;

  // Simulation d'une réponse réussie
  console.log('Demande de réinitialisation de mot de passe pour:', payload.email)
  return Promise.resolve({
    message: 'If an account with this email exists, a reset link has been sent.',
  })
}

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isAuthenticated = (): boolean => {
  const token = getToken()
  return !!token
}
