/**
 * E2E Test: Security and Role-Based Permissions
 *
 * Tests that verify:
 * - Only authenticated users can access protected routes
 * - Each role can only perform authorized actions
 * - Status transitions are properly validated
 * - Unauthorized access attempts are blocked
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { cleanDatabase, setupTestUsers, createTestPatient, createTestAppointment, createTestPrescription, prismaTest } from './test-helpers';
import { AppointmentStatus, PrescriptionStatus } from '@prisma/client';
import * as session from 'express-session';

describe('Security and Permissions (E2E)', () => {
  let app: INestApplication;
  let users: any;
  let patient: any;
  let appointment: any;
  let prescription: any;

  let doctorCookie: string;
  let biologistCookie: string;
  let nurseCookie: string;
  let secretaryCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(
      session({
        secret: 'test-secret-key-for-security-tests',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 24 * 60 * 60 * 1000,
          httpOnly: true,
        },
      }),
    );

    app.setGlobalPrefix('api');
    await app.init();

    // Setup test data
    await cleanDatabase();
    users = await setupTestUsers();
    patient = await createTestPatient();
    appointment = await createTestAppointment({
      patientId: patient.id,
      doctorId: users.doctor.id,
      status: AppointmentStatus.SCHEDULED,
    });
    prescription = await createTestPrescription({
      patientId: patient.id,
      doctorId: users.doctor.id,
      appointmentId: appointment.id,
      status: PrescriptionStatus.CREATED,
    });

    // Login all users
    const doctorResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'doctor.test@hospital.com', password: 'doctor123' });
    doctorCookie = doctorResponse.headers['set-cookie'][0];

    const biologistResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'biologist.test@hospital.com', password: 'biologist123' });
    biologistCookie = biologistResponse.headers['set-cookie'][0];

    const nurseResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nurse.test@hospital.com', password: 'nurse123' });
    nurseCookie = nurseResponse.headers['set-cookie'][0];

    const secretaryResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'secretary.test@hospital.com', password: 'secretary123' });
    secretaryCookie = secretaryResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await cleanDatabase();
    await prismaTest.$disconnect();
    await app.close();
  });

  describe('Authentication Protection', () => {
    it('should reject unauthenticated access to appointments', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments')
        .expect(401);
    });

    it('should reject unauthenticated access to prescriptions', async () => {
      await request(app.getHttpServer())
        .get('/api/prescriptions')
        .expect(401);
    });

    it('should reject unauthenticated access to patients', async () => {
      await request(app.getHttpServer())
        .get('/api/patients')
        .expect(401);
    });

    it('should reject unauthenticated access to results', async () => {
      await request(app.getHttpServer())
        .get('/api/results')
        .expect(401);
    });

    it('should allow authenticated access', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments')
        .set('Cookie', doctorCookie)
        .expect(200);
    });
  });

  describe('Prescription Creation Permissions', () => {
    it('should allow DOCTOR to create prescription', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', doctorCookie)
        .send({
          text: 'Test prescription by doctor',
          patientId: patient.id,
          appointmentId: appointment.id,
        })
        .expect(201);

      expect(response.body.data.doctorId).toBe(users.doctor.id);
    });

    it('should deny BIOLOGIST from creating prescription', async () => {
      await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', biologistCookie)
        .send({
          text: 'Test prescription by biologist',
          patientId: patient.id,
          appointmentId: appointment.id,
        })
        .expect(403);
    });

    it('should deny NURSE from creating prescription', async () => {
      await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', nurseCookie)
        .send({
          text: 'Test prescription by nurse',
          patientId: patient.id,
          appointmentId: appointment.id,
        })
        .expect(403);
    });

    it('should deny SECRETARY from creating prescription', async () => {
      await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', secretaryCookie)
        .send({
          text: 'Test prescription by secretary',
          patientId: patient.id,
          appointmentId: appointment.id,
        })
        .expect(403);
    });
  });

  describe('Prescription Send to Lab Permissions', () => {
    let testPrescription: any;

    beforeEach(async () => {
      testPrescription = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.CREATED,
      });
    });

    it('should allow DOCTOR to send to lab', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/send-to-lab`)
        .set('Cookie', doctorCookie)
        .send({})
        .expect(200);
    });

    it('should allow SECRETARY to send to lab', async () => {
      const presc = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.CREATED,
      });

      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${presc.id}/send-to-lab`)
        .set('Cookie', secretaryCookie)
        .send({})
        .expect(200);
    });

    it('should deny NURSE from sending to lab', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/send-to-lab`)
        .set('Cookie', nurseCookie)
        .send({})
        .expect(403);
    });

    it('should deny BIOLOGIST from sending to lab', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/send-to-lab`)
        .set('Cookie', biologistCookie)
        .send({})
        .expect(403);
    });
  });

  describe('Sample Collection Permissions', () => {
    let testPrescription: any;

    beforeEach(async () => {
      testPrescription = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.SENT_TO_LAB,
      });
    });

    it('should allow NURSE to collect sample', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/collect-sample`)
        .set('Cookie', nurseCookie)
        .send({})
        .expect(200);
    });

    it('should deny DOCTOR from collecting sample', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/collect-sample`)
        .set('Cookie', doctorCookie)
        .send({})
        .expect(403);
    });

    it('should deny SECRETARY from collecting sample', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/collect-sample`)
        .set('Cookie', secretaryCookie)
        .send({})
        .expect(403);
    });

    it('should deny BIOLOGIST from collecting sample', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/collect-sample`)
        .set('Cookie', biologistCookie)
        .send({})
        .expect(403);
    });
  });

  describe('Analysis Start Permissions', () => {
    let testPrescription: any;

    beforeEach(async () => {
      testPrescription = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.SENT_TO_LAB,
      });

      // Collect sample first
      await prismaTest.prescription.update({
        where: { id: testPrescription.id },
        data: { sampleCollectedAt: new Date(), nurseId: users.nurse.id },
      });
    });

    it('should allow BIOLOGIST to start analysis', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/start-analysis`)
        .set('Cookie', biologistCookie)
        .send({})
        .expect(200);
    });

    it('should deny DOCTOR from starting analysis', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/start-analysis`)
        .set('Cookie', doctorCookie)
        .send({})
        .expect(403);
    });

    it('should deny NURSE from starting analysis', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/start-analysis`)
        .set('Cookie', nurseCookie)
        .send({})
        .expect(403);
    });

    it('should deny SECRETARY from starting analysis', async () => {
      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${testPrescription.id}/start-analysis`)
        .set('Cookie', secretaryCookie)
        .send({})
        .expect(403);
    });
  });

  describe('Result Review Permissions', () => {
    let testPrescription: any;
    let testResult: any;

    beforeEach(async () => {
      testPrescription = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.RESULTS_AVAILABLE,
      });

      testResult = await prismaTest.result.create({
        data: {
          prescriptionId: testPrescription.id,
          text: 'Test results',
          data: { test: 'value' },
        },
      });
    });

    it('should allow DOCTOR to review results', async () => {
      await request(app.getHttpServer())
        .patch(`/api/results/${testResult.id}/review`)
        .set('Cookie', doctorCookie)
        .send({
          interpretation: 'Test interpretation',
          recommendations: 'Test recommendations',
        })
        .expect(200);
    });

    it('should deny BIOLOGIST from reviewing results', async () => {
      const result = await prismaTest.result.create({
        data: {
          prescriptionId: (await createTestPrescription({
            patientId: patient.id,
            doctorId: users.doctor.id,
            status: PrescriptionStatus.RESULTS_AVAILABLE,
          })).id,
          text: 'Test results',
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/results/${result.id}/review`)
        .set('Cookie', biologistCookie)
        .send({
          interpretation: 'Test interpretation',
        })
        .expect(403);
    });

    it('should deny NURSE from reviewing results', async () => {
      const result = await prismaTest.result.create({
        data: {
          prescriptionId: (await createTestPrescription({
            patientId: patient.id,
            doctorId: users.doctor.id,
            status: PrescriptionStatus.RESULTS_AVAILABLE,
          })).id,
          text: 'Test results',
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/results/${result.id}/review`)
        .set('Cookie', nurseCookie)
        .send({
          interpretation: 'Test interpretation',
        })
        .expect(403);
    });
  });

  describe('Appointment Workflow Permissions', () => {
    it('should allow NURSE to check in patient', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.SCHEDULED,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/check-in`)
        .set('Cookie', nurseCookie)
        .expect(200);
    });

    it('should allow NURSE to enter vitals', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.CHECKED_IN,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/vitals`)
        .set('Cookie', nurseCookie)
        .send({
          vitals: {
            weight: 70,
            height: 170,
            temperature: 37,
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 75,
            respiratoryRate: 16,
            oxygenSaturation: 98,
          },
        })
        .expect(200);
    });

    it('should allow DOCTOR to complete consultation', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.IN_CONSULTATION,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/complete-consultation`)
        .set('Cookie', doctorCookie)
        .send({
          consultationNotes: 'Test consultation notes',
        })
        .expect(200);
    });

    it('should allow SECRETARY to close appointment', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.CONSULTATION_COMPLETED,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/close`)
        .set('Cookie', secretaryCookie)
        .send({
          billingAmount: 100,
          billingStatus: 'PAID',
        })
        .expect(200);
    });
  });

  describe('Invalid Status Transitions', () => {
    it('should reject check-in on already checked-in appointment', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.CHECKED_IN,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/check-in`)
        .set('Cookie', nurseCookie)
        .expect(400);
    });

    it('should reject vitals entry on non-checked-in appointment', async () => {
      const apt = await createTestAppointment({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: AppointmentStatus.SCHEDULED,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${apt.id}/vitals`)
        .set('Cookie', nurseCookie)
        .send({
          vitals: { weight: 70, height: 170 },
        })
        .expect(400);
    });

    it('should reject sending to lab when prescription not in CREATED status', async () => {
      const presc = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.IN_PROGRESS,
      });

      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${presc.id}/send-to-lab`)
        .set('Cookie', doctorCookie)
        .send({})
        .expect(403);
    });

    it('should reject analysis start without sample collection', async () => {
      const presc = await createTestPrescription({
        patientId: patient.id,
        doctorId: users.doctor.id,
        status: PrescriptionStatus.SENT_TO_LAB,
      });

      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${presc.id}/start-analysis`)
        .set('Cookie', biologistCookie)
        .send({})
        .expect(403);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across multiple requests', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', doctorCookie)
        .expect(200);

      expect(response1.body.data.email).toBe('doctor.test@hospital.com');

      const response2 = await request(app.getHttpServer())
        .get('/api/appointments')
        .set('Cookie', doctorCookie)
        .expect(200);

      expect(response2.status).toBe(200);
    });

    it('should logout and invalidate session', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'doctor.test@hospital.com',
          password: 'doctor123',
        })
        .expect(200);

      const cookie = loginResponse.headers['set-cookie'][0];

      // Verify logged in
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      // Verify session invalidated
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
