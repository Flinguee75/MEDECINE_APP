import { Test, TestingModule } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrescriptionStatus, Role } from '@prisma/client';

describe('ResultsService', () => {
  let service: ResultsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    result: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    prescription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      text: 'Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)\nRBC: 4.8 x10^6/μL (normal)',
      prescriptionId: 'presc-123',
      data: null,
    };

    const mockPrescription = {
      id: 'presc-123',
      text: 'Complete Blood Count',
      status: PrescriptionStatus.IN_PROGRESS,
      result: null,
      patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
      doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
    };

    it('should create result for prescription', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.result.create.mockResolvedValue({
        id: 'result-123',
        ...createDto,
        prescription: mockPrescription,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.RESULTS_AVAILABLE,
      });

      const result = await service.create(createDto);

      expect(result.text).toBe(createDto.text);
      expect(prisma.result.create).toHaveBeenCalled();
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: { status: PrescriptionStatus.RESULTS_AVAILABLE },
      });
    });

    it('should set prescription status to RESULTS_AVAILABLE', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.result.create.mockResolvedValue({
        id: 'result-123',
        ...createDto,
        prescription: mockPrescription,
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.RESULTS_AVAILABLE,
      });

      await service.create(createDto);

      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: { status: PrescriptionStatus.RESULTS_AVAILABLE },
      });
    });

    it('should fail if prescription not found', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Prescription non trouvée',
      );
    });

    it('should fail if prescription already has result', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        result: { id: 'existing-result' },
      });

      await expect(service.create(createDto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Cette prescription a déjà un résultat',
      );
    });

    it('should fail if prescription not in progress', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.CREATED,
      });

      await expect(service.create(createDto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto)).rejects.toThrow(
        'La prescription doit être en cours ou complétée',
      );
    });

    it('should accept COMPLETED prescription status', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.COMPLETED,
      });
      mockPrismaService.result.create.mockResolvedValue({
        id: 'result-123',
        ...createDto,
        prescription: mockPrescription,
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.RESULTS_AVAILABLE,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
    });
  });

  describe('review', () => {
    const mockResult = {
      id: 'result-123',
      text: 'Complete Blood Count:\nWBC: 7.2 x10^3/μL (normal)',
      prescriptionId: 'presc-123',
      prescription: {
        id: 'presc-123',
        status: PrescriptionStatus.RESULTS_AVAILABLE,
        patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      },
      interpretation: null,
      reviewedBy: null,
      reviewedAt: null,
      validatedBy: 'biologist-123',
      validatedAt: new Date(),
    };

    const mockDoctor = {
      id: 'doctor-123',
      name: 'Dr. Martin',
      email: 'doctor@hospital.com',
      role: Role.DOCTOR,
    };

    const reviewDto = {
      interpretation: 'All blood count values within normal limits. No action required.',
      recommendations: null,
    };

    it('should review result with interpretation', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        interpretation: reviewDto.interpretation,
        reviewedBy: 'doctor-123',
        reviewedAt: new Date(),
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockResult.prescription,
        status: PrescriptionStatus.COMPLETED,
      });

      const result = await service.review('result-123', 'doctor-123', reviewDto);

      expect(result.interpretation).toBe(reviewDto.interpretation);
      expect(result.reviewedBy).toBe('doctor-123');
      expect(result.reviewedAt).toBeDefined();
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: { status: PrescriptionStatus.COMPLETED },
      });
    });

    it('should fail if results not available', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue({
        ...mockResult,
        prescription: {
          ...mockResult.prescription,
          status: PrescriptionStatus.IN_PROGRESS,
        },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        service.review('result-123', 'doctor-123', reviewDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.review('result-123', 'doctor-123', reviewDto),
      ).rejects.toThrow('Les résultats doivent être disponibles pour être révisés');
    });

    it('should fail if user is not DOCTOR', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'nurse-123',
        role: Role.NURSE,
      });

      await expect(
        service.review('result-123', 'nurse-123', reviewDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.review('result-123', 'nurse-123', reviewDto),
      ).rejects.toThrow('Seuls les médecins peuvent réviser les résultats');
    });

    it('should update prescription status to COMPLETED', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        interpretation: reviewDto.interpretation,
        reviewedBy: 'doctor-123',
        reviewedAt: new Date(),
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockResult.prescription,
        status: PrescriptionStatus.COMPLETED,
      });

      await service.review('result-123', 'doctor-123', reviewDto);

      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 'presc-123' },
        data: { status: PrescriptionStatus.COMPLETED },
      });
    });

    it('should combine interpretation and recommendations', async () => {
      const reviewWithRecommendations = {
        interpretation: 'Results are normal.',
        recommendations: 'Repeat test in 6 months.',
      };

      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        interpretation: `${reviewWithRecommendations.interpretation}\n\nRecommandations: ${reviewWithRecommendations.recommendations}`,
        reviewedBy: 'doctor-123',
        reviewedAt: new Date(),
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockResult.prescription,
        status: PrescriptionStatus.COMPLETED,
      });

      const result = await service.review('result-123', 'doctor-123', reviewWithRecommendations);

      expect(result.interpretation).toContain(reviewWithRecommendations.interpretation);
      expect(result.interpretation).toContain(reviewWithRecommendations.recommendations);
      expect(result.interpretation).toContain('Recommandations:');
    });

    it('should record reviewedBy userId', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        interpretation: reviewDto.interpretation,
        reviewedBy: 'doctor-123',
        reviewedAt: new Date(),
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockResult.prescription,
        status: PrescriptionStatus.COMPLETED,
      });

      const result = await service.review('result-123', 'doctor-123', reviewDto);

      expect(result.reviewedBy).toBe('doctor-123');
    });

    it('should record reviewedAt timestamp', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDoctor);
      const now = new Date();
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        interpretation: reviewDto.interpretation,
        reviewedBy: 'doctor-123',
        reviewedAt: now,
      });
      mockPrismaService.prescription.update.mockResolvedValue({
        ...mockResult.prescription,
        status: PrescriptionStatus.COMPLETED,
      });

      const result = await service.review('result-123', 'doctor-123', reviewDto);

      expect(result.reviewedAt).toEqual(now);
    });
  });

  describe('findOne', () => {
    it('should return result if found', async () => {
      const mockResult = {
        id: 'result-123',
        text: 'Complete Blood Count',
        prescriptionId: 'presc-123',
        prescription: {
          id: 'presc-123',
          status: PrescriptionStatus.RESULTS_AVAILABLE,
          patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
          doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
        },
      };

      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);

      const result = await service.findOne('result-123');

      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if result not found', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(null);

      await expect(service.findOne('result-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('result-123')).rejects.toThrow(
        'Résultat non trouvé',
      );
    });
  });

  describe('update', () => {
    const mockResult = {
      id: 'result-123',
      text: 'Original text',
      prescriptionId: 'presc-123',
      prescription: {
        id: 'presc-123',
        patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
        doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
      },
    };

    it('should update result text', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        text: 'Updated text',
      });

      const result = await service.update('result-123', { text: 'Updated text' });

      expect(result.text).toBe('Updated text');
      expect(prisma.result.update).toHaveBeenCalledWith({
        where: { id: 'result-123' },
        data: { text: 'Updated text' },
        include: expect.any(Object),
      });
    });

    it('should update result data', async () => {
      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      const newData = { wbc: 7.2, rbc: 4.8 };
      mockPrismaService.result.update.mockResolvedValue({
        ...mockResult,
        data: newData,
      });

      const result = await service.update('result-123', { data: newData });

      expect(result.data).toEqual(newData);
    });
  });

  describe('remove', () => {
    it('should delete result', async () => {
      const mockResult = {
        id: 'result-123',
        text: 'Test result',
        prescriptionId: 'presc-123',
        prescription: {
          id: 'presc-123',
          patient: { id: 'patient-123', firstName: 'Jean', lastName: 'Dupont' },
          doctor: { id: 'doctor-123', name: 'Dr. Martin', email: 'doctor@hospital.com' },
        },
      };

      mockPrismaService.result.findUnique.mockResolvedValue(mockResult);
      mockPrismaService.result.delete.mockResolvedValue(mockResult);

      const result = await service.remove('result-123');

      expect(result).toEqual(mockResult);
      expect(prisma.result.delete).toHaveBeenCalledWith({
        where: { id: 'result-123' },
      });
    });
  });

  describe('getPendingReviewForDoctor', () => {
    it('should return pending results to review for doctor notification feed', async () => {
      const mockPending = [
        {
          id: 'result-1',
          prescriptionId: 'presc-1',
          reviewedBy: null,
          prescription: {
            id: 'presc-1',
            doctorId: 'doctor-123',
            status: PrescriptionStatus.RESULTS_AVAILABLE,
            patient: { id: 'patient-1', firstName: 'Jean', lastName: 'Dupont' },
            appointment: { id: 'apt-1', status: 'WAITING_RESULTS' },
          },
        },
      ];
      mockPrismaService.result.findMany.mockResolvedValue(mockPending);

      const result = await service.getPendingReviewForDoctor('doctor-123');

      expect(result).toEqual(mockPending);
      expect(prisma.result.findMany).toHaveBeenCalledWith({
        where: {
          reviewedBy: null,
          prescription: {
            doctorId: 'doctor-123',
            status: PrescriptionStatus.RESULTS_AVAILABLE,
          },
        },
        include: {
          prescription: {
            include: {
              patient: true,
              appointment: {
                select: {
                  id: true,
                  status: true,
                  date: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
