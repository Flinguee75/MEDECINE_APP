import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const TEST_PASSWORD = 'test123';
export const HASHED_TEST_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

export const testUsers = {
  admin: {
    id: 'admin-test-uuid',
    name: 'Admin Test',
    email: 'admin.test@hospital.com',
    password: HASHED_TEST_PASSWORD,
    role: Role.ADMIN,
  },
  doctor: {
    id: 'doctor-test-uuid',
    name: 'Dr. Martin Test',
    email: 'doctor.test@hospital.com',
    password: HASHED_TEST_PASSWORD,
    role: Role.DOCTOR,
  },
  biologist: {
    id: 'biologist-test-uuid',
    name: 'Biologist Test',
    email: 'biologist.test@hospital.com',
    password: HASHED_TEST_PASSWORD,
    role: Role.BIOLOGIST,
  },
  nurse: {
    id: 'nurse-test-uuid',
    name: 'Nurse Test',
    email: 'nurse.test@hospital.com',
    password: HASHED_TEST_PASSWORD,
    role: Role.NURSE,
  },
  secretary: {
    id: 'secretary-test-uuid',
    name: 'Secretary Test',
    email: 'secretary.test@hospital.com',
    password: HASHED_TEST_PASSWORD,
    role: Role.SECRETARY,
  },
};

export const createTestUser = (role: Role, overrides = {}) => {
  const baseUser = testUsers[role.toLowerCase() as keyof typeof testUsers];
  return {
    ...baseUser,
    ...overrides,
  };
};
