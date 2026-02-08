import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SendToLabDto } from './dto/send-to-lab.dto';
import { CollectSampleDto } from './dto/collect-sample.dto';
import { StartAnalysisDto } from './dto/start-analysis.dto';
import { PrescriptionStatus, Role } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPrescriptionDto: CreatePrescriptionDto, doctorId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: createPrescriptionDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    if (createPrescriptionDto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: createPrescriptionDto.appointmentId },
      });
      if (!appointment) {
        throw new NotFoundException('Rendez-vous non trouvé');
      }
      if (appointment.patientId !== createPrescriptionDto.patientId) {
        throw new NotFoundException('Le rendez-vous ne correspond pas au patient');
      }
      if (appointment.doctorId !== doctorId) {
        throw new NotFoundException('Le rendez-vous ne correspond pas au médecin');
      }
    }

    return this.prisma.prescription.create({
      data: {
        text: createPrescriptionDto.text,
        category: createPrescriptionDto.category || 'BIOLOGIE',
        patientId: createPrescriptionDto.patientId,
        appointmentId: createPrescriptionDto.appointmentId,
        doctorId,
        status: PrescriptionStatus.CREATED,
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(filters?: { patientId?: string; doctorId?: string; status?: PrescriptionStatus; appointmentId?: string }) {
    return this.prisma.prescription.findMany({
      where: {
        ...(filters?.patientId && { patientId: filters.patientId }),
        ...(filters?.doctorId && { doctorId: filters.doctorId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.appointmentId && { appointmentId: filters.appointmentId }),
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        appointment: {
          select: { id: true, status: true },
        },
        result: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        appointment: {
          select: { id: true, status: true },
        },
        result: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription non trouvée');
    }

    return prescription;
  }

  async update(id: string, updateDto: UpdatePrescriptionDto, userId: string, userRole: Role) {
    const prescription = await this.findOne(id);

    if (updateDto.status) {
      this.validateStatusTransition(prescription.status, updateDto.status, userRole, prescription.doctorId, userId);
    }

    return this.prisma.prescription.update({
      where: { id },
      data: updateDto,
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        result: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.prescription.delete({ where: { id } });
  }

  async sendToLab(id: string, userId: string, dto: SendToLabDto) {
    const prescription = await this.findOne(id);

    if (prescription.status !== PrescriptionStatus.CREATED) {
      throw new ForbiddenException('La prescription doit être au statut CREATED');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Only DOCTOR or SECRETARY can send to lab
    if (user.role !== Role.DOCTOR && user.role !== Role.SECRETARY && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Seuls les médecins et secrétaires peuvent envoyer au laboratoire');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.SENT_TO_LAB,
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        result: true,
      },
    });
  }

  async collectSample(id: string, userId: string, dto: CollectSampleDto) {
    const prescription = await this.findOne(id);

    if (prescription.status !== PrescriptionStatus.SENT_TO_LAB) {
      throw new ForbiddenException('La prescription doit être au statut SENT_TO_LAB');
    }

    // Only BIOLOGIE prescriptions require sample collection
    if (prescription.category !== 'BIOLOGIE') {
      throw new ForbiddenException('Seules les prescriptions de biologie nécessitent une collecte d\'échantillon');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Only NURSE can collect samples
    if (user.role !== Role.NURSE && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Seules les infirmières peuvent collecter les échantillons');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        sampleCollectedAt: new Date(),
        nurseId: userId,
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        result: true,
      },
    });
  }

  async startAnalysis(id: string, userId: string, dto: StartAnalysisDto) {
    const prescription = await this.findOne(id);

    if (prescription.status !== PrescriptionStatus.SENT_TO_LAB) {
      throw new ForbiddenException('La prescription doit être au statut SENT_TO_LAB');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Biologie workflow: biologiste + prélèvement requis
    if (prescription.category === 'BIOLOGIE') {
      if (!prescription.sampleCollectedAt) {
        throw new ForbiddenException('L\'échantillon doit être collecté avant de commencer l\'analyse');
      }

      if (user.role !== Role.BIOLOGIST && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Seuls les biologistes peuvent démarrer l\'analyse');
      }
    } else if (prescription.category === 'IMAGERIE') {
      // Imagerie workflow: radiologue (pas de prélèvement)
      if (user.role !== Role.RADIOLOGIST && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Seuls les radiologues peuvent démarrer l\'analyse d\'imagerie');
      }
    } else {
      throw new ForbiddenException('Catégorie de prescription non prise en charge');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.IN_PROGRESS,
        analysisStartedAt: new Date(),
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, name: true, email: true },
        },
        result: true,
      },
    });
  }

  private validateStatusTransition(
    currentStatus: PrescriptionStatus,
    newStatus: PrescriptionStatus,
    userRole: Role,
    prescriptionDoctorId: string,
    userId: string,
  ) {
    if (userRole === Role.ADMIN) return;

    const transitions: Record<PrescriptionStatus, PrescriptionStatus[]> = {
      [PrescriptionStatus.CREATED]: [PrescriptionStatus.SENT_TO_LAB],
      [PrescriptionStatus.SENT_TO_LAB]: [PrescriptionStatus.IN_PROGRESS],
      [PrescriptionStatus.SAMPLE_COLLECTED]: [PrescriptionStatus.IN_PROGRESS],
      [PrescriptionStatus.IN_PROGRESS]: [PrescriptionStatus.RESULTS_AVAILABLE],
      [PrescriptionStatus.RESULTS_AVAILABLE]: [PrescriptionStatus.COMPLETED],
      [PrescriptionStatus.COMPLETED]: [],
    };

    if (!transitions[currentStatus]?.includes(newStatus)) {
      throw new ForbiddenException(`Transition ${currentStatus} → ${newStatus} non autorisée`);
    }

    if (userRole === Role.DOCTOR) {
      if (prescriptionDoctorId !== userId) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres prescriptions');
      }
      if (newStatus !== PrescriptionStatus.SENT_TO_LAB) {
        throw new ForbiddenException('Les médecins peuvent uniquement envoyer au laboratoire');
      }
    }

    if (userRole === Role.BIOLOGIST) {
      const allowedStatuses: PrescriptionStatus[] = [PrescriptionStatus.IN_PROGRESS, PrescriptionStatus.COMPLETED];
      if (!allowedStatuses.includes(newStatus)) {
        throw new ForbiddenException('Les biologistes peuvent uniquement mettre à jour le statut de traitement');
      }
    }
  }
}
