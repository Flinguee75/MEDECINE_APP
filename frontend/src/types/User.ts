export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  BIOLOGIST = 'BIOLOGIST',
  NURSE = 'NURSE',
  SECRETARY = 'SECRETARY',
  RADIOLOGIST = 'RADIOLOGIST',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
