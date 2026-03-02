export interface AdminStats {
  totalUsers: number
  totalTrips: number
  totalStops: number
  totalPhotos: number
  totalExpenses: number
  totalExpenseAmount: number
}

export interface AdminUser {
  id: number
  fullName: string
  email: string
  isVerified: boolean
  isAdmin: boolean
  createdAt: string
}

export interface AdminTrip {
  id: number
  title: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget: number
  creator: { id: number; fullName: string; email: string }
  stopsCount: number
  participantsCount: number
  createdAt: string
}

export interface AdminStop {
  id: number
  title: string
  type: string
  address: string | null
  tripId: number
  trip: { id: number; title: string }
  createdAt: string
}

export interface AdminPhoto {
  id: number
  filePath: string
  stopId: number
  stop: { id: number; title: string; tripId: number }
  userId: number
  user: { id: number; fullName: string; email: string }
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}
