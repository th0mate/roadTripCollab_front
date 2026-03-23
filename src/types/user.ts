export interface User {
  id: number;
  fullName: string;
  email: string;
  password?: string;
  avatar?: string | null;
  isVerified?: boolean;
  isAdmin?: boolean;
}
