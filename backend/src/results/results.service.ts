import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ReviewResultDto } from './dto/review-result.dto';
import { PrescriptionStatus, Role } from '@prisma/client';

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

  async create(createResultDto: CreateResultDto) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: createResultDto.prescriptionId },
      include: { result: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription non trouvée');
    }

    if (prescription.result) {
      throw new ForbiddenException('Cette prescription a déjà un résultat');
    }

    if (prescription.status !== PrescriptionStatus.IN_PROGRESS && prescription.status !== PrescriptionStatus.COMPLETED) {
      throw new ForbiddenException('La prescription doit être en cours ou complétée');
    }

    const result = await this.prisma.result.create({
      data: {
        data: createResultDto.data as any,
        text: createResultDto.text,
        prescriptionId: createResultDto.prescriptionId,
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Update prescription status to RESULTS_AVAILABLE instead of COMPLETED
    await this.prisma.prescription.update({
      where: { id: createResultDto.prescriptionId },
      data: { status: PrescriptionStatus.RESULTS_AVAILABLE },
    });

    return result;
  }

  async findAll(filters?: { prescriptionId?: string }) {
    return this.prisma.result.findMany({
      where: {
        ...(filters?.prescriptionId && { prescriptionId: filters.prescriptionId }),
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReviewForDoctor(doctorId: string) {
    return this.prisma.result.findMany({
      where: {
        reviewedBy: null,
        prescription: {
          doctorId,
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
  }

  async findOne(id: string) {
    const result = await this.prisma.result.findUnique({
      where: { id },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Résultat non trouvé');
    }

    return result;
  }

  async update(id: string, updateDto: UpdateResultDto) {
    await this.findOne(id);

    return this.prisma.result.update({
      where: { id },
      data: {
        ...(updateDto.data && { data: updateDto.data as any }),
        ...(updateDto.text && { text: updateDto.text }),
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.result.delete({ where: { id } });
  }

  async review(id: string, userId: string, dto: ReviewResultDto) {
    const result = await this.findOne(id);

    // Verify user is a doctor
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Seuls les médecins peuvent réviser les résultats');
    }

    // Check if prescription status is RESULTS_AVAILABLE
    if (result.prescription.status !== PrescriptionStatus.RESULTS_AVAILABLE) {
      throw new ForbiddenException('Les résultats doivent être disponibles pour être révisés');
    }

    // Combine interpretation and recommendations into the interpretation field
    const interpretationText = dto.recommendations
      ? `${dto.interpretation}\n\nRecommandations: ${dto.recommendations}`
      : dto.interpretation;

    // Update result with review
    const updatedResult = await this.prisma.result.update({
      where: { id },
      data: {
        interpretation: interpretationText,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        prescription: {
          include: {
            patient: true,
            doctor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Update prescription status to COMPLETED
    await this.prisma.prescription.update({
      where: { id: result.prescriptionId },
      data: { status: PrescriptionStatus.COMPLETED },
    });

    return updatedResult;
  }
}
