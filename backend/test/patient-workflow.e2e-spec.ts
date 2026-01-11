/**
 * E2E Test: Complete Patient Clinical Workflow
 *
 * Tests the full patient journey:
 * 1. Secretary creates a patient
 * 2. Secretary creates an appointment
 * 3. Nurse checks in patient and enters vitals
 * 4. Doctor completes consultation
 * 5. Doctor creates prescription
 * 6. Secretary/Doctor sends prescription to lab
 * 7. Nurse collects sample
 * 8. Biologist starts analysis
 * 9. Biologist creates result
 * 10. Doctor reviews result and completes prescription
 * 11. Secretary closes appointment with billing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { cleanDatabase, setupTestUsers, createTestPatient, prismaTest } from './test-helpers';
import { AppointmentStatus, PrescriptionStatus, BillingStatus } from '@prisma/client';
import * as session from 'express-session';

describe('Patient Clinical Workflow (E2E)', () => {
  let app: INestApplication;
  let users: any;
  let patient: any;
  let appointmentId: string;
  let prescriptionId: string;
  let resultId: string;

  // Session cookies for each user role
  let doctorCookie: string;
  let biologistCookie: string;
  let nurseCookie: string;
  let secretaryCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure session middleware (same as main.ts)
    app.use(
      session({
        secret: 'test-secret-key-for-e2e-tests',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
        },
      }),
    );

    app.setGlobalPrefix('api');
    await app.init();

    // Clean database and setup test users
    await cleanDatabase();
    users = await setupTestUsers();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prismaTest.$disconnect();
    await app.close();
  });

  describe('Step 1: Setup - Login all users', () => {
    it('should login as Doctor', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'doctor.test@hospital.com',
          password: 'doctor123',
        })
        .expect(200);

      expect(response.body.data.role).toBe('DOCTOR');
      doctorCookie = response.headers['set-cookie'][0];
    });

    it('should login as Biologist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'biologist.test@hospital.com',
          password: 'biologist123',
        })
        .expect(200);

      expect(response.body.data.role).toBe('BIOLOGIST');
      biologistCookie = response.headers['set-cookie'][0];
    });

    it('should login as Nurse', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nurse.test@hospital.com',
          password: 'nurse123',
        })
        .expect(200);

      expect(response.body.data.role).toBe('NURSE');
      nurseCookie = response.headers['set-cookie'][0];
    });

    it('should login as Secretary', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'secretary.test@hospital.com',
          password: 'secretary123',
        })
        .expect(200);

      expect(response.body.data.role).toBe('SECRETARY');
      secretaryCookie = response.headers['set-cookie'][0];
    });
  });

  describe('Step 2: Secretary creates patient', () => {
    it('should create a new patient', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/patients')
        .set('Cookie', secretaryCookie)
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          birthDate: '1980-01-01',
          sex: 'M',
          phone: '0123456789',
          address: '123 Rue de la Santé, Paris',
          emergencyContact: 'Marie Dupont - 0987654321',
          insurance: 'Mutuelle Générale',
          consentMedicalData: true,
          consentContact: true,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.firstName).toBe('Jean');
      expect(response.body.data.lastName).toBe('Dupont');

      patient = response.body.data;
    });
  });

  describe('Step 3: Secretary creates appointment', () => {
    it('should create appointment for patient', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Cookie', secretaryCookie)
        .send({
          date: tomorrow.toISOString(),
          motif: 'Consultation générale - Bilan de santé annuel',
          patientId: patient.id,
          doctorId: users.doctor.id,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe(AppointmentStatus.SCHEDULED);
      expect(response.body.data.patientId).toBe(patient.id);
      expect(response.body.data.doctorId).toBe(users.doctor.id);

      appointmentId = response.body.data.id;
    });
  });

  describe('Step 4: Nurse checks in patient', () => {
    it('should check in the patient', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/check-in`)
        .set('Cookie', nurseCookie)
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(response.body.data.checkedInAt).toBeDefined();
    });
  });

  describe('Step 5: Nurse enters patient vitals', () => {
    it('should enter vitals and medical history', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/vitals`)
        .set('Cookie', nurseCookie)
        .send({
          vitals: {
            weight: 75.5,
            height: 175,
            temperature: 37.2,
            bloodPressure: {
              systolic: 120,
              diastolic: 80,
            },
            heartRate: 72,
            respiratoryRate: 16,
            oxygenSaturation: 98,
          },
          medicalHistoryNotes: 'Patient signale allergies au pollen. Pas d\'autres antécédents médicaux notables.',
        })
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.IN_CONSULTATION);
      expect(response.body.data.vitals).toBeDefined();
      expect(response.body.data.vitals.weight).toBe(75.5);
      expect(response.body.data.vitalsEnteredBy).toBe(users.nurse.id);
      expect(response.body.data.vitalsEnteredAt).toBeDefined();
    });
  });

  describe('Step 6: Doctor completes consultation', () => {
    it('should complete consultation with notes', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/complete-consultation`)
        .set('Cookie', doctorCookie)
        .send({
          consultationNotes: 'Patient en bonne santé générale. Constantes vitales normales. Recommande bilan sanguin de routine (NFS, CRP, Glycémie à jeun).',
        })
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);
      expect(response.body.data.consultationNotes).toContain('bonne santé générale');
      expect(response.body.data.consultedBy).toBe(users.doctor.id);
      expect(response.body.data.consultedAt).toBeDefined();
    });
  });

  describe('Step 7: Doctor creates prescription', () => {
    it('should create lab prescription', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', doctorCookie)
        .send({
          text: 'BILAN SANGUIN:\n- NFS (Numération Formule Sanguine)\n- CRP (Protéine C-Réactive)\n- Glycémie à jeun\n\nÀ réaliser le matin à jeun.',
          patientId: patient.id,
          appointmentId: appointmentId,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe(PrescriptionStatus.CREATED);
      expect(response.body.data.text).toContain('NFS');
      expect(response.body.data.doctorId).toBe(users.doctor.id);

      prescriptionId = response.body.data.id;
    });
  });

  describe('Step 8: Doctor sends prescription to lab', () => {
    it('should send prescription to laboratory', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/send-to-lab`)
        .set('Cookie', doctorCookie)
        .send({})
        .expect(200);

      expect(response.body.data.status).toBe(PrescriptionStatus.SENT_TO_LAB);
    });
  });

  describe('Step 9: Nurse collects sample', () => {
    it('should record sample collection', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/collect-sample`)
        .set('Cookie', nurseCookie)
        .send({})
        .expect(200);

      expect(response.body.data.sampleCollectedAt).toBeDefined();
      expect(response.body.data.nurseId).toBe(users.nurse.id);
    });
  });

  describe('Step 10: Biologist starts analysis', () => {
    it('should start laboratory analysis', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/start-analysis`)
        .set('Cookie', biologistCookie)
        .send({})
        .expect(200);

      expect(response.body.data.status).toBe(PrescriptionStatus.IN_PROGRESS);
      expect(response.body.data.analysisStartedAt).toBeDefined();
    });
  });

  describe('Step 11: Biologist creates result', () => {
    it('should create lab results', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/results')
        .set('Cookie', biologistCookie)
        .send({
          prescriptionId: prescriptionId,
          text: `RÉSULTATS D'ANALYSES BIOLOGIQUES

NFS (Numération Formule Sanguine):
- Hémoglobine: 14.5 g/dL (N: 13-17)
- Globules blancs: 7200 /mm³ (N: 4000-10000)
- Plaquettes: 250000 /mm³ (N: 150000-400000)

CRP (Protéine C-Réactive):
- 3.2 mg/L (N: <10)

Glycémie à jeun:
- 5.5 mmol/L (N: 3.9-6.1)

CONCLUSION: Tous les paramètres sont dans les normes.`,
          data: {
            hemoglobin: 14.5,
            wbc: 7200,
            platelets: 250000,
            crp: 3.2,
            glucose: 5.5,
          },
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.text).toContain('RÉSULTATS');
      expect(response.body.data.prescription.status).toBe(PrescriptionStatus.RESULTS_AVAILABLE);

      resultId = response.body.data.id;
    });
  });

  describe('Step 12: Doctor reviews results', () => {
    it('should review and interpret lab results', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/results/${resultId}/review`)
        .set('Cookie', doctorCookie)
        .send({
          interpretation: 'Tous les paramètres biologiques sont dans les limites de la normale. Aucune anomalie détectée.',
          recommendations: 'Contrôle de routine dans 12 mois. Maintenir hygiène de vie actuelle.',
        })
        .expect(200);

      expect(response.body.data.interpretation).toContain('dans les limites de la normale');
      expect(response.body.data.interpretation).toContain('Contrôle de routine');
      expect(response.body.data.reviewedBy).toBe(users.doctor.id);
      expect(response.body.data.reviewedAt).toBeDefined();
    });

    it('should have updated prescription status to COMPLETED', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/prescriptions/${prescriptionId}`)
        .set('Cookie', doctorCookie)
        .expect(200);

      expect(response.body.data.status).toBe(PrescriptionStatus.COMPLETED);
    });
  });

  describe('Step 13: Secretary closes appointment', () => {
    it('should close appointment with billing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/close`)
        .set('Cookie', secretaryCookie)
        .send({
          billingAmount: 150.00,
          billingStatus: BillingStatus.PAID,
        })
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.COMPLETED);
      expect(response.body.data.billingAmount).toBe('150.00');
      expect(response.body.data.billingStatus).toBe(BillingStatus.PAID);
      expect(response.body.data.closedBy).toBe(users.secretary.id);
      expect(response.body.data.closedAt).toBeDefined();
    });
  });

  describe('Step 14: Verify complete workflow data integrity', () => {
    it('should have complete appointment record', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/appointments/${appointmentId}`)
        .set('Cookie', doctorCookie)
        .expect(200);

      const appointment = response.body.data;

      // Verify all workflow steps are recorded
      expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
      expect(appointment.checkedInAt).toBeDefined();
      expect(appointment.vitalsEnteredAt).toBeDefined();
      expect(appointment.vitalsEnteredBy).toBe(users.nurse.id);
      expect(appointment.consultedAt).toBeDefined();
      expect(appointment.consultedBy).toBe(users.doctor.id);
      expect(appointment.closedAt).toBeDefined();
      expect(appointment.closedBy).toBe(users.secretary.id);

      // Verify vitals data
      expect(appointment.vitals).toBeDefined();
      expect(appointment.vitals.weight).toBe(75.5);
      expect(appointment.vitals.bloodPressure.systolic).toBe(120);

      // Verify notes
      expect(appointment.medicalHistoryNotes).toContain('allergies au pollen');
      expect(appointment.consultationNotes).toContain('bonne santé générale');
    });

    it('should have complete prescription record', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/prescriptions/${prescriptionId}`)
        .set('Cookie', doctorCookie)
        .expect(200);

      const prescription = response.body.data;

      // Verify prescription workflow
      expect(prescription.status).toBe(PrescriptionStatus.COMPLETED);
      expect(prescription.sampleCollectedAt).toBeDefined();
      expect(prescription.nurseId).toBe(users.nurse.id);
      expect(prescription.analysisStartedAt).toBeDefined();

      // Verify result exists
      expect(prescription.result).toBeDefined();
      expect(prescription.result.text).toContain('RÉSULTATS');
      expect(prescription.result.interpretation).toBeDefined();
      expect(prescription.result.reviewedBy).toBe(users.doctor.id);
    });

    it('should have complete patient record with history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/patients/${patient.id}`)
        .set('Cookie', doctorCookie)
        .expect(200);

      const patientData = response.body.data;

      // Verify patient has appointments
      expect(patientData.appointments).toHaveLength(1);
      expect(patientData.appointments[0].id).toBe(appointmentId);

      // Verify patient has prescriptions
      expect(patientData.prescriptions).toHaveLength(1);
      expect(patientData.prescriptions[0].id).toBe(prescriptionId);
    });
  });
});
