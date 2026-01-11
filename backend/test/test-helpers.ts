/**
 * Test Helpers for Hospital Management System
 * Provides utilities for creating test data and managing test database
 */

import { PrismaClient, Role, AppointmentStatus, PrescriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

/**
 * Clean all test data from database
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prismaTest.auditLog.deleteMany();
  await prismaTest.vitalHistory.deleteMany();
  await prismaTest.document.deleteMany();
  await prismaTest.result.deleteMany();
  await prismaTest.prescription.deleteMany();
  await prismaTest.appointment.deleteMany();
  await prismaTest.patient.deleteMany();
  await prismaTest.user.deleteMany();
}

/**
 * Create a test user
 */
export async function createTestUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prismaTest.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });
}

/**
 * Create a test patient
 */
export async function createTestPatient(data?: {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  sex?: string;
  phone?: string;
  address?: string;
}) {
  return prismaTest.patient.create({
    data: {
      firstName: data?.firstName || 'Jean',
      lastName: data?.lastName || 'Dupont',
      birthDate: data?.birthDate || new Date('1980-01-01'),
      sex: data?.sex || 'M',
      phone: data?.phone || '0123456789',
      address: data?.address || '123 Rue de la Santé, Paris',
      emergencyContact: 'Marie Dupont - 0987654321',
      insurance: 'Mutuelle Générale',
      consentMedicalData: true,
      consentContact: true,
    },
  });
}

/**
 * Create a test appointment
 */
export async function createTestAppointment(data: {
  patientId: string;
  doctorId: string;
  date?: Date;
  motif?: string;
  status?: AppointmentStatus;
}) {
  return prismaTest.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      date: data.date || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      motif: data.motif || 'Consultation générale',
      status: data.status || AppointmentStatus.SCHEDULED,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });
}

/**
 * Create a test prescription
 */
export async function createTestPrescription(data: {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  text?: string;
  status?: PrescriptionStatus;
}) {
  return prismaTest.prescription.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      text: data.text || 'NFS + CRP + Glycémie à jeun',
      status: data.status || PrescriptionStatus.CREATED,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });
}

/**
 * Create a test result
 */
export async function createTestResult(data: {
  prescriptionId: string;
  text?: string;
  data?: any;
}) {
  return prismaTest.result.create({
    data: {
      prescriptionId: data.prescriptionId,
      text: data.text || 'Résultats dans les normes',
      data: data.data || {
        hemoglobin: 14.5,
        crp: 3.2,
        glucose: 5.5,
      },
    },
    include: {
      prescription: {
        include: {
          patient: true,
          doctor: true,
        },
      },
    },
  });
}

/**
 * Setup standard test users (Admin, Doctor, Biologist, Nurse, Secretary)
 */
export async function setupTestUsers() {
  const admin = await createTestUser({
    name: 'Admin Test',
    email: 'admin.test@hospital.com',
    password: 'admin123',
    role: Role.ADMIN,
  });

  const doctor = await createTestUser({
    name: 'Dr. Test',
    email: 'doctor.test@hospital.com',
    password: 'doctor123',
    role: Role.DOCTOR,
  });

  const biologist = await createTestUser({
    name: 'Biologiste Test',
    email: 'biologist.test@hospital.com',
    password: 'biologist123',
    role: Role.BIOLOGIST,
  });

  const nurse = await createTestUser({
    name: 'Infirmière Test',
    email: 'nurse.test@hospital.com',
    password: 'nurse123',
    role: Role.NURSE,
  });

  const secretary = await createTestUser({
    name: 'Secrétaire Test',
    email: 'secretary.test@hospital.com',
    password: 'secretary123',
    role: Role.SECRETARY,
  });

  return { admin, doctor, biologist, nurse, secretary };
}

/**
 * Login helper for E2E tests
 */
export async function loginUser(app: any, email: string, password: string) {
  const response = await app
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  // Extract session cookie from response
  const cookies = response.headers['set-cookie'];
  return cookies;
}

/**
 * Complete workflow helper - creates full patient journey
 */
export async function createCompleteWorkflow() {
  const users = await setupTestUsers();
  const patient = await createTestPatient();

  const appointment = await createTestAppointment({
    patientId: patient.id,
    doctorId: users.doctor.id,
    status: AppointmentStatus.SCHEDULED,
  });

  const prescription = await createTestPrescription({
    patientId: patient.id,
    doctorId: users.doctor.id,
    appointmentId: appointment.id,
    status: PrescriptionStatus.CREATED,
  });

  return {
    users,
    patient,
    appointment,
    prescription,
  };
}
