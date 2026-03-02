export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  pivot?: {
    id: number;
    role: string;
    invitationStatus: string;
    invitedAt?: string;
    joinedAt?: string;
  };
}

export interface ExpenseSplit {
  id: number;
  expenseId: number;
  userId: number;
  amount: number;
}

export interface Expense {
  id: number;
  tripId: number;
  title: string;
  description?: string;
  amount: number;
  category: 'transport' | 'fuel' | 'tolls' | 'accommodation' | 'food' | 'activity' | 'other';
  paidBy: number;
  payer?: User;
  expenseDate: string;
  splits: ExpenseSplit[];
}

export interface Stop {
  id: number;
  title: string;
  description?: string;
  address?: string;
  type: 'poi' | 'accommodation' | 'restaurant' | 'activity' | 'city';
  latitude: number;
  longitude: number;
  arrivalDate?: string;
  departureDate?: string;
  order: number;
}

export interface Trip {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  creatorId: number;
  creator?: User;
  participants: User[];
  stops: Stop[];
  expenses: Expense[];

  carConsumption: number;
  fuelPrice: number;
  settings?: Record<string, { startTime?: string; [key: string]: any }>;
}
