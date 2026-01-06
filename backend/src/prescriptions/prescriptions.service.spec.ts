import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrescriptionStatus, Role } from '@prisma/client';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    prescription: {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('sendToLab', () => {
    const mockPrescription = {
      id: 'presc-123',
      text: 'Complete Blood Count',
      status: PrescriptionStatus.CREATED,
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      result: null,
    };

    const mockDoctor = {
      id: 'doctor-123',
      name: 'Dr. Martin',
      email: 'doctor@hospital.com',
      role: Role.DOCTOR,
    };

    const mockSecretary = {
      id: 'secretary-123',
      name: 'Secretary Test',
      email: 'secretary@hospital.com',
      role: Role.SECRETARY,
    };

    it('should send prescription to lab when status is CREATED', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.SENT_TO_LAB,
      });

      const result = await service.sendToLab('presc-123', 'doctor-123', {});

      expect(result.status).toBe(PrescriptionStatus.SENT_TO_LAB);
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: {
          status: PrescriptionStatus.SENT_TO_LAB,
        },
        include: expect.any(Object),
      });
    });

    it('should allow SECRETARY to send to lab', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockSecretary);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.SENT_TO_LAB,
      });

      const result = await service.sendToLab('presc-123', 'secretary-123', {});

      expect(result.status).toBe(PrescriptionStatus.SENT_TO_LAB);
    });

    it('should fail if prescription not in CREATED status', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.SENT_TO_LAB,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        service.sendToLab('presc-123', 'doctor-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.sendToLab('presc-123', 'doctor-123', {}),
      ).rejects.toThrow('La prescription doit être au statut CREATED');
    });

    it('should fail if user is not DOCTOR or SECRETARY', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'nurse-123',
        role: Role.NURSE,
      });

      await expect(
        service.sendToLab('presc-123', 'nurse-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.sendToLab('presc-123', 'nurse-123', {}),
      ).rejects.toThrow(
        'Seuls les médecins et secrétaires peuvent envoyer au laboratoire',
      );
    });

    it('should update status to SENT_TO_LAB', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.SENT_TO_LAB,
      });

      const result = await service.sendToLab('presc-123', 'doctor-123', {});

      expect(result.status).toBe(PrescriptionStatus.SENT_TO_LAB);
    });
  });

  describe('collectSample', () => {
    const mockPrescription = {
      id: 'presc-123',
      text: 'Complete Blood Count',
      status: PrescriptionStatus.SENT_TO_LAB,
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      nurseId: null,
      sampleCollectedAt: null,
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      result: null,
    };

    const mockNurse = {
      id: 'nurse-123',
      name: 'Nurse Test',
      email: 'nurse@hospital.com',
      role: Role.NURSE,
    };

    it('should record sample collection', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockNurse);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        sampleCollectedAt: new Date(),
        nurseId: 'nurse-123',
      });

      const result = await service.collectSample('presc-123', 'nurse-123', {});

      expect(result.sampleCollectedAt).toBeDefined();
      expect(result.nurseId).toBe('nurse-123');
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: {
          sampleCollectedAt: expect.any(Date),
          nurseId: 'nurse-123',
        },
        include: expect.any(Object),
      });
    });

    it('should fail if prescription not sent to lab', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.CREATED,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockNurse);

      await expect(
        service.collectSample('presc-123', 'nurse-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.collectSample('presc-123', 'nurse-123', {}),
      ).rejects.toThrow('La prescription doit être au statut SENT_TO_LAB');
    });

    it('should fail if user is not NURSE', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'secretary-123',
        role: Role.SECRETARY,
      });

      await expect(
        service.collectSample('presc-123', 'secretary-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.collectSample('presc-123', 'secretary-123', {}),
      ).rejects.toThrow(
        'Seules les infirmières peuvent collecter les échantillons',
      );
    });

    it('should update sampleCollectedAt timestamp', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockNurse);
      const now = new Date();
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        sampleCollectedAt: now,
        nurseId: 'nurse-123',
      });

      const result = await service.collectSample('presc-123', 'nurse-123', {});

      expect(result.sampleCollectedAt).toEqual(now);
    });

    it('should store nurse ID who collected sample', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockNurse);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        nurseId: 'nurse-123',
        sampleCollectedAt: new Date(),
      });

      const result = await service.collectSample('presc-123', 'nurse-123', {});

      expect(result.nurseId).toBe('nurse-123');
    });
  });

  describe('startAnalysis', () => {
    const mockPrescription = {
      id: 'presc-123',
      text: 'Complete Blood Count',
      status: PrescriptionStatus.SENT_TO_LAB,
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      nurseId: 'nurse-123',
      sampleCollectedAt: new Date(),
      analysisStartedAt: null,
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      result: null,
    };

    const mockBiologist = {
      id: 'biologist-123',
      name: 'Biologist Test',
      email: 'biologist@hospital.com',
      role: Role.BIOLOGIST,
    };

    it('should start analysis on collected sample', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockBiologist);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.IN_PROGRESS,
        analysisStartedAt: new Date(),
      });

      const result = await service.startAnalysis('presc-123', 'biologist-123', {});

      expect(result.status).toBe(PrescriptionStatus.IN_PROGRESS);
      expect(result.analysisStartedAt).toBeDefined();
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: {
          status: PrescriptionStatus.IN_PROGRESS,
          analysisStartedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should fail if sample not collected', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        sampleCollectedAt: null,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockBiologist);

      await expect(
        service.startAnalysis('presc-123', 'biologist-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.startAnalysis('presc-123', 'biologist-123', {}),
      ).rejects.toThrow(
        'L\'échantillon doit être collecté avant de commencer l\'analyse',
      );
    });

    it('should fail if user is not BIOLOGIST', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'doctor-123',
        role: Role.DOCTOR,
      });

      await expect(
        service.startAnalysis('presc-123', 'doctor-123', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.startAnalysis('presc-123', 'doctor-123', {}),
      ).rejects.toThrow('Seuls les biologistes peuvent démarrer l\'analyse');
    });

    it('should update status to IN_PROGRESS', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockBiologist);
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.IN_PROGRESS,
      });

      const result = await service.startAnalysis('presc-123', 'biologist-123', {});

      expect(result.status).toBe(PrescriptionStatus.IN_PROGRESS);
    });

    it('should record analysisStartedAt timestamp', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.user.findUnique.mockResolvedValue(mockBiologist);
      const now = new Date();
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.IN_PROGRESS,
        analysisStartedAt: now,
      });

      const result = await service.startAnalysis('presc-123', 'biologist-123', {});

      expect(result.analysisStartedAt).toEqual(now);
    });
  });

  describe('create', () => {
    const createDto = {
      text: 'Complete Blood Count (CBC)',
      patientId: 'patient-123',
    };

    const mockPatient = {
      id: 'patient-123',
      firstName: 'Jean',
      lastName: 'Dupont',
    };

    it('should create prescription successfully', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.create.mockResolvedValue({
        id: 'presc-123',
        ...createDto,
        status: PrescriptionStatus.CREATED,
        doctorId: 'doctor-123',
        patient: mockPatient,
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      });

      const result = await service.create(createDto, 'doctor-123');

      expect(result.status).toBe(PrescriptionStatus.CREATED);
      expect(result.doctorId).toBe('doctor-123');
      expect(prisma.prescription.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if patient not found', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'doctor-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto, 'doctor-123')).rejects.toThrow(
        'Patient non trouvé',
      );
    });
  });

  describe('findOne', () => {
    it('should return prescription if found', async () => {
      const mockPrescription = {
        id: 'presc-123',
        text: 'Complete Blood Count',
        status: PrescriptionStatus.CREATED,
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
        result: null,
      };

      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);

      const result = await service.findOne('presc-123');

      expect(result).toEqual(mockPrescription);
    });

    it('should throw NotFoundException if prescription not found', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(null);

      await expect(service.findOne('presc-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('presc-123')).rejects.toThrow(
        'Prescription non trouvée',
      );
    });
  });
});
