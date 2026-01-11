import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateWithAuditDto } from './dto/update-with-audit.dto';
import { AutoSaveNotesDto } from './dto/auto-save-notes.dto';
import { EnterVitalsDto } from './dto/enter-vitals.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CloseAppointmentDto } from './dto/close-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Vérifier que le patient existe
    const patient = await this.prisma.patient.findUnique({
      where: { id: createAppointmentDto.patientId },
    });
    if (!patient) {
      throw new BadRequestException('Patient introuvable');
    }

    // Vérifier que le médecin existe et a le bon rôle
    const doctor = await this.prisma.user.findUnique({
      where: { id: createAppointmentDto.doctorId },
    });
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new BadRequestException('Médecin introuvable ou rôle incorrect');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        date: new Date(createAppointmentDto.date),
        motif: createAppointmentDto.motif,
        patientId: createAppointmentDto.patientId,
        doctorId: createAppointmentDto.doctorId,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return appointment;
  }

  async findAll(
    doctorId?: string,
    patientId?: string,
    status?: AppointmentStatus,
    statuses?: AppointmentStatus[],
  ) {
    const where: any = {};

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    } else if (status) {
      where.status = status;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} introuvable`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    // Vérifier que le rendez-vous existe
    await this.findOne(id);

    // Convertir le DTO en objet compatible avec Prisma
    const data: any = {};
    if (updateAppointmentDto.date !== undefined) {
      data.date = new Date(updateAppointmentDto.date);
    }
    if (updateAppointmentDto.motif !== undefined) {
      data.motif = updateAppointmentDto.motif;
    }
    if (updateAppointmentDto.patientId !== undefined) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: updateAppointmentDto.patientId },
      });
      if (!patient) {
        throw new BadRequestException('Patient introuvable');
      }
      data.patientId = updateAppointmentDto.patientId;
    }
    if (updateAppointmentDto.doctorId !== undefined) {
      const doctor = await this.prisma.user.findUnique({
        where: { id: updateAppointmentDto.doctorId },
      });
      if (!doctor || doctor.role !== 'DOCTOR') {
        throw new BadRequestException('Médecin introuvable ou rôle incorrect');
      }
      data.doctorId = updateAppointmentDto.doctorId;
    }
    if (updateAppointmentDto.status !== undefined) {
      data.status = updateAppointmentDto.status;
    }
    if (updateAppointmentDto.vitals !== undefined) {
      // Convertir VitalsDto en plain object pour Prisma JSON
      data.vitals = updateAppointmentDto.vitals;
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Vérifier que le rendez-vous existe
    await this.findOne(id);

    // Plutôt que supprimer, on change le statut à CANCELLED
    await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    return { message: 'Rendez-vous annulé avec succès' };
  }

  // ==================== WORKFLOW METHODS ====================

  async checkIn(id: string) {
    const appointment = await this.findOne(id);

    // Validation: appointment must be SCHEDULED
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Impossible d\'enregistrer : le rendez-vous doit être au statut SCHEDULED',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async enterVitals(id: string, dto: EnterVitalsDto, userId: string) {
    const appointment = await this.findOne(id);

    // Validation: appointment must be CHECKED_IN
    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Impossible de saisir les constantes : le rendez-vous doit être au statut CHECKED_IN',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        vitals: dto.vitals as any,
        medicalHistoryNotes: dto.medicalHistoryNotes,
        vitalsRequestedAt: null,
        vitalsRequestedBy: null,
        vitalsEnteredBy: userId,
        vitalsEnteredAt: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async requestVitals(id: string, userId: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Impossible de demander les constantes : le rendez-vous doit être au statut CHECKED_IN',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        vitalsRequestedAt: new Date(),
        vitalsRequestedBy: userId,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async completeConsultation(id: string, dto: CompleteConsultationDto, userId: string) {
    const appointment = await this.findOne(id);

    // Validation: appointment must be IN_CONSULTATION or WAITING_RESULTS
    if (
      appointment.status !== AppointmentStatus.IN_CONSULTATION &&
      appointment.status !== AppointmentStatus.WAITING_RESULTS
    ) {
      throw new BadRequestException(
        'Impossible de terminer la consultation : le rendez-vous doit être au statut IN_CONSULTATION ou WAITING_RESULTS',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CONSULTATION_COMPLETED,
        consultationNotes: dto.consultationNotes,
        consultedBy: userId,
        consultedAt: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async closeAppointment(id: string, dto: CloseAppointmentDto, userId: string) {
    const appointment = await this.findOne(id);

    // Validation: appointment must be CONSULTATION_COMPLETED
    if (appointment.status !== AppointmentStatus.CONSULTATION_COMPLETED) {
      throw new BadRequestException(
        'Impossible de clôturer : le rendez-vous doit être au statut CONSULTATION_COMPLETED',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        billingAmount: dto.billingAmount,
        billingStatus: dto.billingStatus,
        closedBy: userId,
        closedAt: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // ==================== TRACEABILITY METHODS ====================

  /**
   * Modifier un rendez-vous avec traçabilité complète (audit log)
   */
  async updateWithAudit(
    id: string,
    dto: UpdateWithAuditDto,
    userId: string,
  ) {
    // 1. Récupérer l'ancien état
    const oldAppointment = await this.findOne(id);

    // 2. Validation: ne pas modifier si consultation en cours ou terminé
    const restrictedStatuses: AppointmentStatus[] = [
      AppointmentStatus.IN_CONSULTATION,
      AppointmentStatus.WAITING_RESULTS,
      AppointmentStatus.CONSULTATION_COMPLETED,
      AppointmentStatus.COMPLETED,
    ];

    if (restrictedStatuses.includes(oldAppointment.status)) {
      throw new BadRequestException(
        'Impossible de modifier un rendez-vous en consultation ou terminé',
      );
    }

    // 3. Construire les changements
    const changes: Record<string, any> = {};
    if (dto.date && dto.date !== oldAppointment.date.toISOString()) {
      changes['date'] = {
        old: oldAppointment.date.toISOString(),
        new: dto.date,
      };
    }
    if (dto.motif && dto.motif !== oldAppointment.motif) {
      changes['motif'] = { old: oldAppointment.motif, new: dto.motif };
    }
    if (dto.doctorId && dto.doctorId !== oldAppointment.doctorId) {
      changes['doctorId'] = {
        old: oldAppointment.doctorId,
        new: dto.doctorId,
      };
    }

    // 4. Si pas de changements, retourner directement
    if (Object.keys(changes).length === 0) {
      return oldAppointment;
    }

    // 5. Valider le nouveau docteur si changement
    if (dto.doctorId) {
      const doctor = await this.prisma.user.findUnique({
        where: { id: dto.doctorId },
      });
      if (!doctor || doctor.role !== 'DOCTOR') {
        throw new BadRequestException(
          'Médecin introuvable ou rôle incorrect',
        );
      }
    }

    // 6. Transaction: Update + Audit Log
    return this.prisma.$transaction(async (tx) => {
      // Mettre à jour le rendez-vous
      const updateData: any = {
        modifiedBy: userId,
        modifiedAt: new Date(),
        modificationCount: {
          increment: 1,
        },
      };

      if (dto.date) updateData.date = new Date(dto.date);
      if (dto.motif) updateData.motif = dto.motif;
      if (dto.doctorId) updateData.doctorId = dto.doctorId;

      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: true,
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Créer l'audit log
      await this.auditService.log({
        entityType: 'APPOINTMENT',
        entityId: id,
        action: 'UPDATED',
        performedBy: userId,
        changes,
        reason: dto.reason,
      });

      return updatedAppointment;
    });
  }

  /**
   * Auto-save des notes de consultation (brouillon)
   */
  async autoSaveConsultationNotes(
    id: string,
    dto: AutoSaveNotesDto,
    userId: string,
  ) {
    const appointment = await this.findOne(id);

    // Validation: doit être IN_CONSULTATION ou WAITING_RESULTS
    if (
      appointment.status !== AppointmentStatus.IN_CONSULTATION &&
      appointment.status !== AppointmentStatus.WAITING_RESULTS
    ) {
      throw new BadRequestException(
        'Impossible de sauvegarder : le rendez-vous doit être en consultation',
      );
    }

    // Vérifier que c'est bien le médecin assigné
    if (appointment.doctorId !== userId) {
      throw new BadRequestException(
        'Seul le médecin assigné peut sauvegarder les notes',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        consultationNotesDraft: dto.consultationNotes,
        lastAutoSaveAt: new Date(),
        isDraftConsultation: true,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les consultations en cours (brouillons) d'un médecin
   */
  async getInProgressConsultations(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        OR: [
          { status: AppointmentStatus.IN_CONSULTATION },
          { status: AppointmentStatus.WAITING_RESULTS },
          { isDraftConsultation: true },
        ],
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastAutoSaveAt: 'desc',
      },
    });
  }

  /**
   * Récupérer l'historique des consultations d'un patient
   */
  async getPatientConsultationHistory(patientId: string) {
    return this.prisma.appointment.findMany({
      where: {
        patientId,
        status: {
          in: [
            AppointmentStatus.CONSULTATION_COMPLETED,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        prescriptions: {
          select: {
            id: true,
            text: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        consultedAt: 'desc',
      },
    });
  }
}
