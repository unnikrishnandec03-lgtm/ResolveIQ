export type UserRole = 'customer' | 'officer' | 'admin' | 'operator' | 'engineer';

export interface UserProfile {
  uid: string;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  organization?: string;
  createdAt: string;
  lastLoginAt: string;
}
