import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVitalHistoryDto } from './dto/create-vital-history.dto';
import { AutoSaveVitalsDto } from './dto/auto-save-vitals.dto';

@Injectable()
export class VitalHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Auto-save des constantes vitales (crée ou met à jour le brouillon)
   */
  async autoSave(dto: AutoSaveVitalsDto, userId: string) {
    // Vérifier que l'appointment existe
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }

    // Chercher un brouillon existant pour cet appointment
    const existingDraft = await this.prisma.vitalHistory.findFirst({
      where: {
        appointmentId: dto.appointmentId,
        isDraft: true,
        enteredBy: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingDraft) {
      // Mettre à jour le brouillon existant
      return this.prisma.vitalHistory.update({
        where: { id: existingDraft.id },
        data: {
          vitals: dto.vitals,
          medicalHistoryNotes: dto.medicalHistoryNotes,
          actionType: 'AUTO_SAVED',
          enteredAt: new Date(),
        },
      });
    } else {
      // Créer un nouveau brouillon
      return this.prisma.vitalHistory.create({
        data: {
          appointmentId: dto.appointmentId,
          patientId: dto.patientId,
          vitals: dto.vitals,
          medicalHistoryNotes: dto.medicalHistoryNotes,
          enteredBy: userId,
          actionType: 'AUTO_SAVED',
          isDraft: true,
        },
      });
    }
  }

  /**
   * Finaliser les constantes vitales (marquer comme non-brouillon)
   */
  async finalize(id: string, userId: string) {
    const vitalHistory = await this.prisma.vitalHistory.findUnique({
      where: { id },
    });

    if (!vitalHistory) {
      throw new NotFoundException('Historique de constantes introuvable');
    }

    if (vitalHistory.enteredBy !== userId) {
      throw new BadRequestException(
        'Vous ne pouvez finaliser que vos propres saisies',
      );
    }

    if (!vitalHistory.isDraft) {
      throw new BadRequestException('Ces constantes sont déjà finalisées');
    }

    return this.prisma.vitalHistory.update({
      where: { id },
      data: {
        isDraft: false,
        finalizedAt: new Date(),
        actionType: 'CREATED',
      },
    });
  }

  /**
   * Récupérer l'historique des constantes vitales d'un patient
   */
  async findByPatient(patientId: string) {
    return this.prisma.vitalHistory.findMany({
      where: {
        patientId,
        isDraft: false, // Ne retourner que les entrées finalisées
      },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            motif: true,
            status: true,
          },
        },
      },
      orderBy: {
        enteredAt: 'desc',
      },
    });
  }

  /**
   * Récupérer l'historique complet (incluant brouillons) pour un appointment
   */
  async findByAppointment(appointmentId: string) {
    return this.prisma.vitalHistory.findMany({
      where: {
        appointmentId,
      },
      orderBy: {
        enteredAt: 'desc',
      },
    });
  }

  /**
   * Récupérer le brouillon en cours pour un utilisateur et un appointment
   */
  async findDraft(appointmentId: string, userId: string) {
    return this.prisma.vitalHistory.findFirst({
      where: {
        appointmentId,
        enteredBy: userId,
        isDraft: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Créer une entrée d'historique de constantes vitales
   */
  async create(dto: CreateVitalHistoryDto) {
    // Vérifier que l'appointment existe
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }

    return this.prisma.vitalHistory.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        vitals: dto.vitals,
        medicalHistoryNotes: dto.medicalHistoryNotes,
        enteredBy: dto.enteredBy,
        actionType: dto.actionType,
        isDraft: dto.isDraft ?? true,
      },
    });
  }
}
