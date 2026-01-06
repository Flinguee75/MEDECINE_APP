export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  BIOLOGIST = 'BIOLOGIST',
  NURSE = 'NURSE',
  SECRETARY = 'SECRETARY',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
