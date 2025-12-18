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
  const response = await apiClient.post('/auth/forgot-password', payload)
  return response.data
}

export const resetPassword = async (payload: { token: string; password: string }): Promise<any> => {
  const response = await apiClient.post('/auth/reset-password', payload)
  return response.data
}

export const verifyChangeEmail = async (token: string): Promise<any> => {
  const response = await apiClient.post('/auth/verify-email-change', { token })
  return response.data
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
