import { BadRequestException } from '@nestjs/common';
import {
  AppointmentStatus,
  BillingStatus,
  PrescriptionStatus,
  Role,
} from '@prisma/client';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { ResultsService } from '../results/results.service';

describe('Patient Workflow Unit', () => {
  const users = [
    {
      id: 'doctor-1',
      name: 'Dr. Martin',
      email: 'doctor@test.com',
      role: Role.DOCTOR,
    },
    {
      id: 'nurse-1',
      name: 'Nurse Claire',
      email: 'nurse@test.com',
      role: Role.NURSE,
    },
    {
      id: 'biologist-1',
      name: 'Bio Sam',
      email: 'bio@test.com',
      role: Role.BIOLOGIST,
    },
    {
      id: 'secretary-1',
      name: 'Sec Lea',
      email: 'secretary@test.com',
      role: Role.SECRETARY,
    },
  ];

  const state: {
    patients: any[];
    appointments: any[];
    prescriptions: any[];
    results: any[];
  } = {
    patients: [],
    appointments: [],
    prescriptions: [],
    results: [],
  };

  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

  const withAppointmentRelations = (appointment: any) => {
    if (!appointment) return null;
    const patient = state.patients.find((p) => p.id === appointment.patientId);
    const doctor = users.find((u) => u.id === appointment.doctorId);
    return {
      ...appointment,
      patient,
      doctor: doctor
        ? {
            id: doctor.id,
            name: doctor.name,
            email: doctor.email,
            role: doctor.role,
          }
        : null,
    };
  };

  const withPrescriptionRelations = (prescription: any) => {
    if (!prescription) return null;
    const patient = state.patients.find((p) => p.id === prescription.patientId);
    const doctor = users.find((u) => u.id === prescription.doctorId);
    const appointment = state.appointments.find(
      (a) => a.id === prescription.appointmentId,
    );
    const result = state.results.find((r) => r.prescriptionId === prescription.id);

    return {
      ...prescription,
      patient,
      doctor: doctor
        ? { id: doctor.id, name: doctor.name, email: doctor.email }
        : null,
      appointment: appointment
        ? { id: appointment.id, status: appointment.status }
        : null,
      result: result || null,
    };
  };

  const withResultRelations = (result: any) => {
    if (!result) return null;
    const prescription = state.prescriptions.find(
      (p) => p.id === result.prescriptionId,
    );
    return {
      ...result,
      prescription: withPrescriptionRelations(prescription),
    };
  };

  const prismaMock: any = {
    patient: {
      create: jest.fn(({ data }: any) => {
        const patient = {
          id: nextId('patient'),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.patients.push(patient);
        return patient;
      }),
      findUnique: jest.fn(({ where }: any) => {
        return state.patients.find((p) => p.id === where.id) || null;
      }),
    },
    user: {
      findUnique: jest.fn(({ where }: any) => {
        return users.find((u) => u.id === where.id) || null;
      }),
    },
    appointment: {
      create: jest.fn(({ data }: any) => {
        const appointment = {
          id: nextId('appointment'),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.appointments.push(appointment);
        return withAppointmentRelations(appointment);
      }),
      findUnique: jest.fn(({ where }: any) => {
        const appointment = state.appointments.find((a) => a.id === where.id);
        return withAppointmentRelations(appointment);
      }),
      update: jest.fn(({ where, data }: any) => {
        const index = state.appointments.findIndex((a) => a.id === where.id);
        if (index < 0) return null;
        const updated = {
          ...state.appointments[index],
          ...data,
          updatedAt: new Date(),
        };
        state.appointments[index] = updated;
        return withAppointmentRelations(updated);
      }),
    },
    prescription: {
      create: jest.fn(({ data }: any) => {
        const prescription = {
          id: nextId('prescription'),
          ...data,
          sampleCollectedAt: null,
          nurseId: null,
          analysisStartedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.prescriptions.push(prescription);
        return withPrescriptionRelations(prescription);
      }),
      findUnique: jest.fn(({ where }: any) => {
        const prescription = state.prescriptions.find((p) => p.id === where.id);
        return withPrescriptionRelations(prescription);
      }),
      update: jest.fn(({ where, data }: any) => {
        const index = state.prescriptions.findIndex((p) => p.id === where.id);
        if (index < 0) return null;
        const updated = {
          ...state.prescriptions[index],
          ...data,
          updatedAt: new Date(),
        };
        state.prescriptions[index] = updated;
        return withPrescriptionRelations(updated);
      }),
      findMany: jest.fn(({ where }: any) => {
        const filtered = state.prescriptions.filter((p) => {
          if (where?.patientId && p.patientId !== where.patientId) return false;
          if (where?.doctorId && p.doctorId !== where.doctorId) return false;
          if (where?.appointmentId && p.appointmentId !== where.appointmentId) return false;
          if (where?.status && p.status !== where.status) return false;
          return true;
        });
        return filtered.map((p) => withPrescriptionRelations(p));
      }),
    },
    result: {
      create: jest.fn(({ data }: any) => {
        const result = {
          id: nextId('result'),
          ...data,
          interpretation: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.results.push(result);
        return withResultRelations(result);
      }),
      findUnique: jest.fn(({ where }: any) => {
        const result = state.results.find((r) => r.id === where.id);
        return withResultRelations(result);
      }),
      update: jest.fn(({ where, data }: any) => {
        const index = state.results.findIndex((r) => r.id === where.id);
        if (index < 0) return null;
        const updated = {
          ...state.results[index],
          ...data,
          updatedAt: new Date(),
        };
        state.results[index] = updated;
        return withResultRelations(updated);
      }),
    },
  };

  const auditService = {
    log: jest.fn(),
  };

  const patientsService = new PatientsService(prismaMock);
  const appointmentsService = new AppointmentsService(prismaMock, auditService as any);
  const prescriptionsService = new PrescriptionsService(prismaMock);
  const resultsService = new ResultsService(prismaMock);

  beforeEach(() => {
    state.patients = [];
    state.appointments = [];
    state.prescriptions = [];
    state.results = [];
    idCounter = 1;
    jest.clearAllMocks();
  });

  it('completes the full patient journey from registration to closed appointment', async () => {
    const patient = await patientsService.create({
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1980-01-01',
      sex: 'M',
      phone: '0102030405',
      address: '12 rue de Paris',
      emergencyContact: 'Marie Dupont - 0600000000',
      insurance: 'Mutuelle',
      idNumber: 'CNI123',
      consentMedicalData: true,
      consentContact: true,
      medicalHistory: { allergies: ['pollen'] },
    });

    const appointment = await appointmentsService.create({
      date: '2026-02-20T09:00:00.000Z',
      motif: 'Bilan cardiologique',
      patientId: patient.id,
      doctorId: 'doctor-1',
    });
    expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);

    const checkedIn = await appointmentsService.checkIn(appointment.id);
    expect(checkedIn.status).toBe(AppointmentStatus.CHECKED_IN);

    const withVitals = await appointmentsService.enterVitals(
      appointment.id,
      {
        vitals: {
          weight: 72,
          height: 175,
          temperature: 37,
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 70,
          respiratoryRate: 16,
          oxygenSaturation: 98,
        },
        medicalHistoryNotes: 'Aucune douleur thoracique',
      },
      'nurse-1',
    );
    expect(withVitals.vitalsEnteredBy).toBe('nurse-1');

    const inConsultation = await appointmentsService.update(appointment.id, {
      status: AppointmentStatus.IN_CONSULTATION,
    });
    expect(inConsultation.status).toBe(AppointmentStatus.IN_CONSULTATION);

    const consulted = await appointmentsService.completeConsultation(
      appointment.id,
      { consultationNotes: 'RAS, bilan biologique de routine prescrit.' },
      'doctor-1',
    );
    expect(consulted.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);

    const prescription = await prescriptionsService.create(
      {
        text: 'NFS, CRP, glycémie à jeun',
        category: 'BIOLOGIE',
        patientId: patient.id,
        appointmentId: appointment.id,
      },
      'doctor-1',
    );
    expect(prescription.status).toBe(PrescriptionStatus.CREATED);

    const sentToLab = await prescriptionsService.sendToLab(
      prescription.id,
      'doctor-1',
      {},
    );
    expect(sentToLab.status).toBe(PrescriptionStatus.SENT_TO_LAB);

    const sampleCollected = await prescriptionsService.collectSample(
      prescription.id,
      'nurse-1',
      {},
    );
    expect(sampleCollected.nurseId).toBe('nurse-1');

    const inAnalysis = await prescriptionsService.startAnalysis(
      prescription.id,
      'biologist-1',
      {},
    );
    expect(inAnalysis.status).toBe(PrescriptionStatus.IN_PROGRESS);

    const result = await resultsService.create({
      prescriptionId: prescription.id,
      text: 'Résultats dans les normes',
      data: { crp: 3.1, nfs: 'normal' },
    });
    expect(result.prescription.id).toBe(prescription.id);

    const reviewed = await resultsService.review(result.id, 'doctor-1', {
      interpretation: 'Normal, aucun traitement nécessaire',
      recommendations: 'Suivi annuel',
    });
    expect(reviewed.reviewedBy).toBe('doctor-1');

    const closed = await appointmentsService.closeAppointment(
      appointment.id,
      {
        billingAmount: 180,
        billingStatus: BillingStatus.PAID,
      },
      'secretary-1',
    );
    expect(closed.status).toBe(AppointmentStatus.COMPLETED);
  });

  it('blocks consultation completion if appointment is not in consultation', async () => {
    const patient = await patientsService.create({
      firstName: 'Anne',
      lastName: 'Laurent',
      birthDate: '1988-03-01',
      sex: 'F',
      phone: '0102030406',
      address: '10 avenue test',
      emergencyContact: 'Paul Laurent - 0600000001',
      insurance: 'Mutuelle',
      idNumber: 'CNI124',
      consentMedicalData: true,
      consentContact: true,
      medicalHistory: {},
    });

    const appointment = await appointmentsService.create({
      date: '2026-02-20T10:00:00.000Z',
      motif: 'Contrôle',
      patientId: patient.id,
      doctorId: 'doctor-1',
    });

    await expect(
      appointmentsService.completeConsultation(
        appointment.id,
        { consultationNotes: 'test' },
        'doctor-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps consultation open while doctor sends biology and imaging requests', async () => {
    const patient = await patientsService.create({
      firstName: 'Paul',
      lastName: 'Henry',
      birthDate: '1979-06-12',
      sex: 'M',
      phone: '0100000000',
      address: '5 rue centrale',
      emergencyContact: 'Nina Henry - 0600001111',
      insurance: 'Mutuelle',
      idNumber: 'CNI300',
      consentMedicalData: true,
      consentContact: true,
      medicalHistory: {},
    });

    const appointment = await appointmentsService.create({
      date: '2026-03-01T09:00:00.000Z',
      motif: 'Suivi tension',
      patientId: patient.id,
      doctorId: 'doctor-1',
    });

    await appointmentsService.update(appointment.id, {
      status: AppointmentStatus.IN_CONSULTATION,
    });

    const biology = await prescriptionsService.create(
      {
        text: 'Bilan biologique standard',
        category: 'BIOLOGIE',
        patientId: patient.id,
        appointmentId: appointment.id,
      },
      'doctor-1',
    );
    await prescriptionsService.sendToLab(biology.id, 'doctor-1', {});

    const imaging = await prescriptionsService.create(
      {
        text: 'Échographie cardiaque',
        category: 'IMAGERIE',
        patientId: patient.id,
        appointmentId: appointment.id,
      },
      'doctor-1',
    );
    await prescriptionsService.sendToLab(imaging.id, 'doctor-1', {});

    const updatedAppointment = await appointmentsService.findOne(appointment.id);
    expect(updatedAppointment.status).toBe(AppointmentStatus.IN_CONSULTATION);
  });

  it('routes incoming requests to biology and imaging sections and surfaces doctor alert on results', async () => {
    const patient = await patientsService.create({
      firstName: 'Luc',
      lastName: 'Bernard',
      birthDate: '1991-11-05',
      sex: 'M',
      phone: '0100000001',
      address: '16 avenue cardio',
      emergencyContact: 'Eva Bernard - 0600002222',
      insurance: 'Mutuelle',
      idNumber: 'CNI301',
      consentMedicalData: true,
      consentContact: true,
      medicalHistory: {},
    });

    const appointment = await appointmentsService.create({
      date: '2026-03-01T11:00:00.000Z',
      motif: 'Bilan complet',
      patientId: patient.id,
      doctorId: 'doctor-1',
    });

    await appointmentsService.update(appointment.id, {
      status: AppointmentStatus.WAITING_RESULTS,
    });

    const biology = await prescriptionsService.create(
      {
        text: 'NFS, CRP',
        category: 'BIOLOGIE',
        patientId: patient.id,
        appointmentId: appointment.id,
      },
      'doctor-1',
    );
    const imaging = await prescriptionsService.create(
      {
        text: 'Scanner cardiaque',
        category: 'IMAGERIE',
        patientId: patient.id,
        appointmentId: appointment.id,
      },
      'doctor-1',
    );

    await prescriptionsService.sendToLab(biology.id, 'doctor-1', {});
    await prescriptionsService.sendToLab(imaging.id, 'doctor-1', {});

    const inbox = await prescriptionsService.findAll({
      appointmentId: appointment.id,
    });
    const biologyInbox = inbox.filter((p) => p.category === 'BIOLOGIE');
    const imagingInbox = inbox.filter((p) => p.category === 'IMAGERIE');

    expect(biologyInbox).toHaveLength(1);
    expect(imagingInbox).toHaveLength(1);
    expect(biologyInbox[0].status).toBe(PrescriptionStatus.SENT_TO_LAB);
    expect(imagingInbox[0].status).toBe(PrescriptionStatus.SENT_TO_LAB);

    await prescriptionsService.collectSample(biology.id, 'nurse-1', {});
    await prescriptionsService.startAnalysis(biology.id, 'biologist-1', {});
    await resultsService.create({
      prescriptionId: biology.id,
      text: 'Résultats bio disponibles',
      data: { nfs: 'normal' },
    });

    // Signal métier côté médecin: prescription au statut RESULTS_AVAILABLE
    const doctorAlerts = await prescriptionsService.findAll({
      doctorId: 'doctor-1',
      status: PrescriptionStatus.RESULTS_AVAILABLE,
    });

    expect(doctorAlerts.some((p) => p.id === biology.id)).toBe(true);
    const waitingAppointment = await appointmentsService.findOne(appointment.id);
    expect(waitingAppointment.status).toBe(AppointmentStatus.WAITING_RESULTS);
  });
});
