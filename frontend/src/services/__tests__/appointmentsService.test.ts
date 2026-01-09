import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../api';
import { appointmentsService } from '../appointmentsService';
import { AppointmentStatus, BillingStatus } from '../../types/Appointment';

vi.mock('../api', () => ({
  default: {
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  patch: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

describe('appointmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should call PATCH /appointments/:id/check-in', async () => {
      const appointmentId = 'apt-123';
      const mockResponse = {
        data: {
          data: {
            id: appointmentId,
            status: AppointmentStatus.CHECKED_IN,
            checkedInAt: '2026-01-10T13:45:00Z',
          },
        },
      };

      mockedApi.patch.mockResolvedValue(mockResponse);

      const result = await appointmentsService.checkIn(appointmentId);

      expect(mockedApi.patch).toHaveBeenCalledWith(`/appointments/${appointmentId}/check-in`);
      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
      expect(result.checkedInAt).toBeDefined();
    });

    it('should handle success response', async () => {
      mockedApi.patch.mockResolvedValue({
        data: {
          data: {
            id: 'apt-123',
            status: AppointmentStatus.CHECKED_IN,
            checkedInAt: '2026-01-10T13:45:00Z',
          },
        },
      });

      const result = await appointmentsService.checkIn('apt-123');

      expect(result).toBeDefined();
      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
    });

    it('should handle error response', async () => {
      const errorMessage = 'Cannot check in: appointment status must be SCHEDULED';
      mockedApi.patch.mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      await expect(appointmentsService.checkIn('apt-123')).rejects.toThrow();
    });
  });

  describe('enterVitals', () => {
    const validVitals = {
      vitals: {
        weight: 75.5,
        height: 175,
        temperature: 37.2,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
        },
        heartRate: 72,
      },
      medicalHistoryNotes: 'Patient reports pollen allergies',
    };

    it('should call PATCH /appointments/:id/vitals', async () => {
      const appointmentId = 'apt-123';
      const mockResponse = {
        data: {
          data: {
            id: appointmentId,
            status: AppointmentStatus.IN_CONSULTATION,
            vitals: validVitals.vitals,
            vitalsEnteredAt: '2026-01-10T13:50:00Z',
          },
        },
      };

      mockedApi.patch.mockResolvedValue(mockResponse);

      const result = await appointmentsService.enterVitals(appointmentId, validVitals);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/vitals`,
        validVitals,
      );
      expect(result.status).toBe(AppointmentStatus.IN_CONSULTATION);
    });

    it('should send vitals data in correct format', async () => {
      mockedApi.patch.mockResolvedValue({
        data: {
          data: {
            id: 'apt-123',
            status: AppointmentStatus.IN_CONSULTATION,
          },
        },
      });

      await appointmentsService.enterVitals('apt-123', validVitals);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        '/appointments/apt-123/vitals',
        expect.objectContaining({
          vitals: expect.objectContaining({
            weight: 75.5,
            height: 175,
            bloodPressure: expect.objectContaining({
              systolic: 120,
              diastolic: 80,
            }),
          }),
        }),
      );
    });
  });

  describe('completeConsultation', () => {
    const consultationDto = {
      consultationNotes: 'Patient in good health. Recommend routine blood work.',
    };

    it('should call PATCH /appointments/:id/consultation', async () => {
      const appointmentId = 'apt-123';
      const mockResponse = {
        data: {
          data: {
            id: appointmentId,
            status: AppointmentStatus.CONSULTATION_COMPLETED,
            consultationNotes: consultationDto.consultationNotes,
          },
        },
      };

      mockedApi.patch.mockResolvedValue(mockResponse);

      const result = await appointmentsService.completeConsultation(
        appointmentId,
        consultationDto.consultationNotes,
      );

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/consultation`,
        consultationDto,
      );
      expect(result.status).toBe(AppointmentStatus.CONSULTATION_COMPLETED);
    });
  });

  describe('closeAppointment', () => {
    const closeDto = {
      billingAmount: 150.0,
      billingStatus: BillingStatus.PAID,
    };

    it('should call PATCH /appointments/:id/close', async () => {
      const appointmentId = 'apt-123';
      const mockResponse = {
        data: {
          data: {
            id: appointmentId,
            status: AppointmentStatus.COMPLETED,
            billingAmount: closeDto.billingAmount,
            billingStatus: closeDto.billingStatus,
          },
        },
      };

      mockedApi.patch.mockResolvedValue(mockResponse);

      const result = await appointmentsService.close(
        appointmentId,
        closeDto.billingAmount,
        closeDto.billingStatus,
      );

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/appointments/${appointmentId}/close`,
        closeDto,
      );
      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });
  });

  describe('getAll', () => {
    it('should call GET /appointments with filters', async () => {
      const filters = {
        doctorId: 'doctor-123',
        status: AppointmentStatus.SCHEDULED,
      };

      mockedApi.get.mockResolvedValue({
        data: {
          data: [],
        },
      });

      await appointmentsService.getAll(filters.doctorId, undefined, filters.status);

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments', {
        params: {
          doctorId: 'doctor-123',
          status: AppointmentStatus.SCHEDULED,
        },
      });
    });

    it('should return empty array when no appointments', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: [],
        },
      });

      const result = await appointmentsService.getAll();

      expect(result).toEqual([]);
    });
  });
});
