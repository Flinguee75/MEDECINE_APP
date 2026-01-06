import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AppointmentStatus, BillingStatus, PrescriptionStatus, Role } from '@prisma/client';

describe('Complete Clinical Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // User IDs
  let adminId: string;
  let doctorId: string;
  let biologistId: string;
  let nurseId: string;
  let secretaryId: string;

  // Test data IDs
  let patientId: string;
  let appointmentId: string;
  let prescriptionId: string;
  let resultId: string;

  // Session cookies for each role
  let secretaryCookie: string;
  let nurseCookie: string;
  let doctorCookie: string;
  let biologistCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.result.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('test123', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin.test@hospital.com',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    const doctor = await prisma.user.create({
      data: {
        name: 'Dr. Test',
        email: 'doctor.test@hospital.com',
        password: hashedPassword,
        role: Role.DOCTOR,
      },
    });
    doctorId = doctor.id;

    const biologist = await prisma.user.create({
      data: {
        name: 'Biologist Test',
        email: 'biologist.test@hospital.com',
        password: hashedPassword,
        role: Role.BIOLOGIST,
      },
    });
    biologistId = biologist.id;

    const nurse = await prisma.user.create({
      data: {
        name: 'Nurse Test',
        email: 'nurse.test@hospital.com',
        password: hashedPassword,
        role: Role.NURSE,
      },
    });
    nurseId = nurse.id;

    const secretary = await prisma.user.create({
      data: {
        name: 'Secretary Test',
        email: 'secretary.test@hospital.com',
        password: hashedPassword,
        role: Role.SECRETARY,
      },
    });
    secretaryId = secretary.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Step 1-10: Complete Patient Journey', () => {
    it('Step 1: Secretary logs in and creates patient', async () => {
      // Login as secretary
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'secretary.test@hospital.com',
          password: 'test123',
        })
        .expect(200);

      secretaryCookie = loginResponse.headers['set-cookie'];
      expect(loginResponse.body.data.user.role).toBe(Role.SECRETARY);

      // Create patient
      const patientResponse = await request(app.getHttpServer())
        .post('/api/patients')
        .set('Cookie', secretaryCookie)
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          birthDate: '1980-05-15T00:00:00Z',
          sex: 'M',
          phone: '+33612345678',
          address: '123 Rue de la Paix, Paris',
        })
        .expect(201);

      patientId = patientResponse.body.data.id;
      expect(patientResponse.body.data.firstName).toBe('Jean');
      expect(patientResponse.body.data.lastName).toBe('Dupont');
    });

    it('Step 2: Secretary creates appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Cookie', secretaryCookie)
        .send({
          date: tomorrow.toISOString(),
          motif: 'Consultation initiale - Test E2E',
          patientId,
          doctorId,
        })
        .expect(201);

      appointmentId = response.body.data.id;
      expect(response.body.data.status).toBe(AppointmentStatus.SCHEDULED);
      expect(response.body.data.patientId).toBe(patientId);
      expect(response.body.data.doctorId).toBe(doctorId);
    });

    it('Step 3: Secretary checks in patient', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/check-in`)
        .set('Cookie', secretaryCookie)
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(response.body.data.checkedInAt).toBeDefined();
    });

    it('Step 4: Nurse logs in and enters vitals', async () => {
      // Login as nurse
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nurse.test@hospital.com',
          password: 'test123',
        })
        .expect(200);

      nurseCookie = loginResponse.headers['set-cookie'];
      expect(loginResponse.body.data.user.role).toBe(Role.NURSE);

      // Enter vitals
      const vitalsResponse = await request(app.getHttpServer())
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
          medicalHistoryNotes: 'Patient reports seasonal pollen allergies. No chronic conditions.',
        })
        .expect(200);

      expect(vitalsResponse.body.data.status).toBe(AppointmentStatus.IN_CONSULTATION);
      expect(vitalsResponse.body.data.vitalsEnteredBy).toBe(nurseId);
      expect(vitalsResponse.body.data.vitalsEnteredAt).toBeDefined();
      expect(vitalsResponse.body.data.vitals.weight).toBe(75.5);
    });

    it('Step 5: Doctor logs in and completes consultation', async () => {
      // Login as doctor
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'doctor.test@hospital.com',
          password: 'test123',
        })
        .expect(200);

      doctorCookie = loginResponse.headers['set-cookie'];
      expect(loginResponse.body.data.user.role).toBe(Role.DOCTOR);

      // Complete consultation
      const consultationResponse = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/consultation`)
        .set('Cookie', doctorCookie)
        .send({
          consultationNotes:
            'Patient in good health. Vitals within normal range. Allergies noted. Recommend complete blood count and allergy panel to investigate further.',
        })
        .expect(200);

      expect(consultationResponse.body.data.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);
      expect(consultationResponse.body.data.consultedBy).toBe(doctorId);
      expect(consultationResponse.body.data.consultedAt).toBeDefined();
    });

    it('Step 6: Doctor creates prescription and sends to lab', async () => {
      // Create prescription
      const prescriptionResponse = await request(app.getHttpServer())
        .post('/api/prescriptions')
        .set('Cookie', doctorCookie)
        .send({
          text: 'Complete Blood Count (CBC)\nAllergy Panel (IgE specific)',
          patientId,
        })
        .expect(201);

      prescriptionId = prescriptionResponse.body.data.id;
      expect(prescriptionResponse.body.data.status).toBe(PrescriptionStatus.CREATED);

      // Send to lab
      const sendToLabResponse = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/send-to-lab`)
        .set('Cookie', doctorCookie)
        .expect(200);

      expect(sendToLabResponse.body.data.status).toBe(PrescriptionStatus.SENT_TO_LAB);
    });

    it('Step 7: Nurse collects sample', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/collect-sample`)
        .set('Cookie', nurseCookie)
        .send({
          notes: 'Blood sample collected at 14:30. Stored in refrigerator B2.',
        })
        .expect(200);

      expect(response.body.data.sampleCollectedAt).toBeDefined();
      expect(response.body.data.nurseId).toBe(nurseId);
    });

    it('Step 8: Biologist logs in and starts analysis', async () => {
      // Login as biologist
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'biologist.test@hospital.com',
          password: 'test123',
        })
        .expect(200);

      biologistCookie = loginResponse.headers['set-cookie'];
      expect(loginResponse.body.data.user.role).toBe(Role.BIOLOGIST);

      // Start analysis
      const response = await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescriptionId}/start-analysis`)
        .set('Cookie', biologistCookie)
        .expect(200);

      expect(response.body.data.status).toBe(PrescriptionStatus.IN_PROGRESS);
      expect(response.body.data.analysisStartedAt).toBeDefined();
    });

    it('Step 9: Biologist creates results', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/results')
        .set('Cookie', biologistCookie)
        .send({
          prescriptionId,
          text: `Complete Blood Count:
WBC: 7.2 x10^3/μL (normal range: 4.5-11.0)
RBC: 4.8 x10^6/μL (normal range: 4.5-5.5)
Hemoglobin: 14.5 g/dL (normal range: 13.5-17.5)
Hematocrit: 42% (normal range: 40-50%)
Platelets: 250 x10^3/μL (normal range: 150-400)

Allergy Panel (IgE):
Total IgE: 85 IU/mL (slightly elevated)
Grass pollen: Positive (Class 3)
Tree pollen: Positive (Class 2)
Dust mites: Negative`,
        })
        .expect(201);

      resultId = response.body.data.id;
      expect(response.body.data.text).toContain('Complete Blood Count');

      // Verify prescription status changed to RESULTS_AVAILABLE
      const prescriptionCheck = await request(app.getHttpServer())
        .get(`/api/prescriptions/${prescriptionId}`)
        .set('Cookie', biologistCookie)
        .expect(200);

      expect(prescriptionCheck.body.data.status).toBe(PrescriptionStatus.RESULTS_AVAILABLE);
    });

    it('Step 10: Doctor reviews results', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/results/${resultId}/review`)
        .set('Cookie', doctorCookie)
        .send({
          interpretation:
            'All blood count values within normal limits. No anemia or infection indicated. Elevated IgE confirms seasonal allergies to grass and tree pollen.',
          recommendations:
            'Recommend antihistamine therapy during allergy season. Avoid outdoor activities during high pollen count days. Follow-up in 6 months.',
        })
        .expect(200);

      expect(response.body.data.interpretation).toContain('All blood count values within normal limits');
      expect(response.body.data.interpretation).toContain('Recommandations:');
      expect(response.body.data.reviewedBy).toBe(doctorId);
      expect(response.body.data.reviewedAt).toBeDefined();

      // Verify prescription status changed to COMPLETED
      const prescriptionCheck = await request(app.getHttpServer())
        .get(`/api/prescriptions/${prescriptionId}`)
        .set('Cookie', doctorCookie)
        .expect(200);

      expect(prescriptionCheck.body.data.status).toBe(PrescriptionStatus.COMPLETED);
    });

    it('Step 11: Secretary closes appointment with billing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/close`)
        .set('Cookie', secretaryCookie)
        .send({
          billingAmount: 150.0,
          billingStatus: BillingStatus.PAID,
        })
        .expect(200);

      expect(response.body.data.status).toBe(AppointmentStatus.COMPLETED);
      expect(response.body.data.billingAmount).toBe('150');
      expect(response.body.data.billingStatus).toBe(BillingStatus.PAID);
      expect(response.body.data.closedBy).toBe(secretaryId);
      expect(response.body.data.closedAt).toBeDefined();
    });
  });

  describe('Role-Based Access Control Tests', () => {
    it('should prevent NURSE from checking in patient', async () => {
      // Create a new appointment for this test
      const appointment = await prisma.appointment.create({
        data: {
          date: new Date(),
          motif: 'Test RBAC',
          status: AppointmentStatus.SCHEDULED,
          patientId,
          doctorId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${appointment.id}/check-in`)
        .set('Cookie', nurseCookie)
        .expect(403);
    });

    it('should prevent SECRETARY from entering vitals', async () => {
      await request(app.getHttpServer())
        .patch(`/api/appointments/${appointmentId}/vitals`)
        .set('Cookie', secretaryCookie)
        .send({
          vitals: {
            weight: 70,
            height: 170,
            temperature: 36.8,
            bloodPressure: { systolic: 120, diastolic: 80 },
            heartRate: 72,
          },
        })
        .expect(403);
    });

    it('should prevent DOCTOR from collecting samples', async () => {
      // Create test prescription
      const prescription = await prisma.prescription.create({
        data: {
          text: 'Test',
          status: PrescriptionStatus.SENT_TO_LAB,
          patientId,
          doctorId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescription.id}/collect-sample`)
        .set('Cookie', doctorCookie)
        .expect(403);
    });

    it('should prevent NURSE from creating results', async () => {
      await request(app.getHttpServer())
        .post('/api/results')
        .set('Cookie', nurseCookie)
        .send({
          prescriptionId,
          text: 'Unauthorized result',
        })
        .expect(403);
    });
  });

  describe('Invalid State Transition Tests', () => {
    it('should prevent completing consultation before check-in', async () => {
      const appointment = await prisma.appointment.create({
        data: {
          date: new Date(),
          motif: 'Test state',
          status: AppointmentStatus.SCHEDULED,
          patientId,
          doctorId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${appointment.id}/consultation`)
        .set('Cookie', doctorCookie)
        .send({
          consultationNotes: 'This should fail',
        })
        .expect(400);
    });

    it('should prevent collecting sample before sending to lab', async () => {
      const prescription = await prisma.prescription.create({
        data: {
          text: 'Test',
          status: PrescriptionStatus.CREATED,
          patientId,
          doctorId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/prescriptions/${prescription.id}/collect-sample`)
        .set('Cookie', nurseCookie)
        .expect(400);
    });

    it('should prevent reviewing results before validation', async () => {
      const prescription = await prisma.prescription.create({
        data: {
          text: 'Test',
          status: PrescriptionStatus.IN_PROGRESS,
          patientId,
          doctorId,
        },
      });

      const result = await prisma.result.create({
        data: {
          text: 'Test result',
          prescriptionId: prescription.id,
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/results/${result.id}/review`)
        .set('Cookie', doctorCookie)
        .send({
          interpretation: 'This should fail',
        })
        .expect(400);
    });
  });
});
