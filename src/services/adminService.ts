import apiClient from './api'
import type { AdminStats, AdminUser, AdminTrip, AdminStop, AdminPhoto, PaginatedResponse } from '@/types/admin'

export const getStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/stats')
  return response.data
}

export const getUsers = async (
  page = 1,
  search = ''
): Promise<PaginatedResponse<AdminUser>> => {
  const response = await apiClient.get('/admin/users', { params: { page, limit: 20, search } })
  return response.data
}

export const getUser = async (id: number): Promise<AdminUser> => {
  const response = await apiClient.get(`/admin/users/${id}`)
  return response.data
}

export const updateUser = async (id: number, data: Partial<AdminUser>): Promise<AdminUser> => {
  const response = await apiClient.patch(`/admin/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`)
}

export const getTrips = async (
  page = 1,
  search = '',
  status = ''
): Promise<PaginatedResponse<AdminTrip>> => {
  const response = await apiClient.get('/admin/trips', { params: { page, limit: 20, search, status } })
  return response.data
}

export const getTrip = async (id: number): Promise<AdminTrip> => {
  const response = await apiClient.get(`/admin/trips/${id}`)
  return response.data
}

export const updateTrip = async (id: number, data: { status?: string }): Promise<AdminTrip> => {
  const response = await apiClient.patch(`/admin/trips/${id}`, data)
  return response.data
}

export const deleteTrip = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/trips/${id}`)
}

export const getStops = async (page = 1, tripId = ''): Promise<PaginatedResponse<AdminStop>> => {
  const response = await apiClient.get('/admin/stops', { params: { page, limit: 20, tripId } })
  return response.data
}

export const getAllTrips = async (): Promise<AdminTrip[]> => {
  const response = await apiClient.get('/admin/trips', { params: { page: 1, limit: 500 } })
  return response.data.data
}

export const deleteStop = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/stops/${id}`)
}

export const getPhotos = async (page = 1): Promise<PaginatedResponse<AdminPhoto>> => {
  const response = await apiClient.get('/admin/photos', { params: { page, limit: 24 } })
  return response.data
}

export const deletePhoto = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/photos/${id}`)
}
