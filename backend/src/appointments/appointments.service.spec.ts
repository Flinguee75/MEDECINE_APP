import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, BillingStatus, Role } from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      date: '2026-01-10T14:00:00Z',
      motif: 'Consultation initiale',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
    };

    const mockPatient = {
      id: 'patient-123',
      firstName: 'Jean',
      lastName: 'Dupont',
    };

    const mockDoctor = {
      id: 'doctor-123',
      name: 'Dr. Martin',
      email: 'doctor@hospital.com',
      role: Role.DOCTOR,
    };

    it('should create an appointment successfully', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.appointment.create.mockResolvedValue({
        id: 'apt-123',
        ...createDto,
        date: new Date(createDto.date),
        status: AppointmentStatus.SCHEDULED,
        patient: mockPatient,
        doctor: mockDoctor,
      });

      const result = await service.create(createDto);

      expect(result.status).toBe(AppointmentStatus.SCHEDULED);
      expect(prisma.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.patientId },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.doctorId },
      });
      expect(prisma.appointment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Patient introuvable',
      );
    });

    it('should throw BadRequestException if doctor not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user is not a doctor', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockDoctor,
        role: Role.NURSE,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        'Médecin introuvable ou rôle incorrect',
      );
    });
  });

  describe('checkIn', () => {
    const mockAppointment = {
      id: 'apt-123',
      status: AppointmentStatus.SCHEDULED,
      date: new Date('2026-01-10T14:00:00Z'),
      motif: 'Test',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
    };

    it('should check in a scheduled appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      });

      const result = await service.checkIn('apt-123');

      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(result.checkedInAt).toBeDefined();
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-123' },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should fail if appointment is not in SCHEDULED status', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
      });

      await expect(service.checkIn('apt-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkIn('apt-123')).rejects.toThrow(
        'Impossible d\'enregistrer : le rendez-vous doit être au statut SCHEDULED',
      );
    });

    it('should fail if appointment already checked in', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_CONSULTATION,
      });

      await expect(service.checkIn('apt-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail if appointment is completed', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      });

      await expect(service.checkIn('apt-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('enterVitals', () => {
    const mockAppointment = {
      id: 'apt-123',
      status: AppointmentStatus.CHECKED_IN,
      date: new Date('2026-01-10T14:00:00Z'),
      motif: 'Test',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
    };

    const validVitalsDto = {
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
      medicalHistoryNotes: 'Patient reports pollen allergies',
    };

    it('should record vitals for checked-in appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
        vitals: validVitalsDto.vitals,
        medicalHistoryNotes: validVitalsDto.medicalHistoryNotes,
        vitalsEnteredBy: 'nurse-123',
        vitalsEnteredAt: new Date(),
      });

      const result = await service.enterVitals('apt-123', validVitalsDto, 'nurse-123');

      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(result.vitalsEnteredBy).toBe('nurse-123');
      expect(result.vitalsEnteredAt).toBeDefined();
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-123' },
        data: {
          vitals: validVitalsDto.vitals,
          medicalHistoryNotes: validVitalsDto.medicalHistoryNotes,
          vitalsRequestedAt: null,
          vitalsRequestedBy: null,
          vitalsEnteredBy: 'nurse-123',
          vitalsEnteredAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should fail if appointment not checked in', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.SCHEDULED,
      });

      await expect(
        service.enterVitals('apt-123', validVitalsDto, 'nurse-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.enterVitals('apt-123', validVitalsDto, 'nurse-123'),
      ).rejects.toThrow(
        'Impossible de saisir les constantes : le rendez-vous doit être au statut CHECKED_IN',
      );
    });

    it('should update vitals if appointment already in consultation', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_CONSULTATION,
      });

      await expect(
        service.enterVitals('apt-123', validVitalsDto, 'nurse-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should keep appointment status unchanged when vitals are entered', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
      });

      const result = await service.enterVitals('apt-123', validVitalsDto, 'nurse-123');

      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
    });
  });

  describe('completeConsultation', () => {
    const mockAppointment = {
      id: 'apt-123',
      status: AppointmentStatus.IN_CONSULTATION,
      date: new Date('2026-01-10T14:00:00Z'),
      motif: 'Test',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
    };

    const consultationDto = {
      consultationNotes: 'Patient in good health. Recommend routine blood work.',
    };

    it('should complete consultation with diagnosis', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONSULTATION_COMPLETED,
        consultationNotes: consultationDto.consultationNotes,
        consultedBy: 'doctor-123',
        consultedAt: new Date(),
      });

      const result = await service.completeConsultation('apt-123', consultationDto, 'doctor-123');

      expect(result.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);
      expect(result.consultationNotes).toBe(consultationDto.consultationNotes);
      expect(result.consultedBy).toBe('doctor-123');
      expect(result.consultedAt).toBeDefined();
    });

    it('should fail if appointment not in consultation', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CHECKED_IN,
      });

      await expect(
        service.completeConsultation('apt-123', consultationDto, 'doctor-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.completeConsultation('apt-123', consultationDto, 'doctor-123'),
      ).rejects.toThrow(
        'Impossible de terminer la consultation : le rendez-vous doit être au statut IN_CONSULTATION ou WAITING_RESULTS',
      );
    });

    it('should update status to CONSULTATION_COMPLETED', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONSULTATION_COMPLETED,
      });

      const result = await service.completeConsultation('apt-123', consultationDto, 'doctor-123');

      expect(result.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);
    });
  });

  describe('closeAppointment', () => {
    const mockAppointment = {
      id: 'apt-123',
      status: AppointmentStatus.CONSULTATION_COMPLETED,
      date: new Date('2026-01-10T14:00:00Z'),
      motif: 'Test',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
    };

    const closeDto = {
      billingAmount: 150.00,
      billingStatus: BillingStatus.PAID,
    };

    it('should close completed appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
        billingAmount: closeDto.billingAmount,
        billingStatus: closeDto.billingStatus,
        closedBy: 'secretary-123',
        closedAt: new Date(),
      });

      const result = await service.closeAppointment('apt-123', closeDto, 'secretary-123');

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(result.billingAmount).toBe(closeDto.billingAmount);
      expect(result.billingStatus).toBe(closeDto.billingStatus);
      expect(result.closedBy).toBe('secretary-123');
      expect(result.closedAt).toBeDefined();
    });

    it('should fail if consultation not completed', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.IN_CONSULTATION,
      });

      await expect(
        service.closeAppointment('apt-123', closeDto, 'secretary-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.closeAppointment('apt-123', closeDto, 'secretary-123'),
      ).rejects.toThrow(
        'Impossible de clôturer : le rendez-vous doit être au statut CONSULTATION_COMPLETED',
      );
    });

    it('should update billing status', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
        billingAmount: 150.00,
        billingStatus: BillingStatus.PAID,
      });

      const result = await service.closeAppointment('apt-123', closeDto, 'secretary-123');

      expect(result.billingStatus).toBe(BillingStatus.PAID);
    });

    it('should accept zero billing amount', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
        billingAmount: 0,
        billingStatus: BillingStatus.PENDING,
      });

      const zeroBillingDto = {
        billingAmount: 0,
        billingStatus: BillingStatus.PENDING,
      };

      const result = await service.closeAppointment('apt-123', zeroBillingDto, 'secretary-123');

      expect(result.billingAmount).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return appointment if found', async () => {
      const mockAppointment = {
        id: 'apt-123',
        status: AppointmentStatus.SCHEDULED,
        date: new Date(),
        motif: 'Test',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com', role: Role.DOCTOR },
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.findOne('apt-123');

      expect(result).toEqual(mockAppointment);
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'apt-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('apt-123')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('apt-123')).rejects.toThrow(
        'Rendez-vous avec l\'ID apt-123 introuvable',
      );
    });
  });

  describe('remove', () => {
    it('should cancel appointment instead of deleting', async () => {
      const mockAppointment = {
        id: 'apt-123',
        status: AppointmentStatus.SCHEDULED,
        date: new Date(),
        motif: 'Test',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com', role: Role.DOCTOR },
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.appointment.update.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      const result = await service.remove('apt-123');

      expect(result.message).toBe('Rendez-vous annulé avec succès');
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-123' },
        data: { status: AppointmentStatus.CANCELLED },
      });
    });
  });
});
