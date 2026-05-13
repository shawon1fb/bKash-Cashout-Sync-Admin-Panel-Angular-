export type UserRole = 'admin' | 'agent';

export interface UserResponse {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
