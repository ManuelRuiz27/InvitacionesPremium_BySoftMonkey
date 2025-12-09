// User Model
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;  // Optional - not in backend User table
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  DIRECTOR_GLOBAL = 'DIRECTOR_GLOBAL',
  PLANNER = 'PLANNER',
  STAFF = 'STAFF'
}

// Planner Model
export interface Planner {
  id: string;
  userId: string;
  orgName: string;
  createdAt: Date;
  updatedAt: Date;
}
