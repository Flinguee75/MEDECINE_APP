import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    const patient = await this.prisma.patient.create({
      data: {
        firstName: createPatientDto.firstName,
        lastName: createPatientDto.lastName,
        birthDate: new Date(createPatientDto.birthDate),
        sex: createPatientDto.sex,
        phone: createPatientDto.phone,
        address: createPatientDto.address,
        emergencyContact: createPatientDto.emergencyContact,
        insurance: createPatientDto.insurance,
        idNumber: createPatientDto.idNumber,
        consentMedicalData: createPatientDto.consentMedicalData,
        consentContact: createPatientDto.consentContact,
        medicalHistory: createPatientDto.medicalHistory as any,
      },
    });

    return patient;
  }

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            result: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${id} introuvable`);
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    // Vérifier que le patient existe
    await this.findOne(id);

    const data: any = { ...updatePatientDto };
    if (updatePatientDto.birthDate) {
      data.birthDate = new Date(updatePatientDto.birthDate);
    }
    if (updatePatientDto.medicalHistory) {
      data.medicalHistory = updatePatientDto.medicalHistory;
    }

    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Vérifier que le patient existe
    await this.findOne(id);

    await this.prisma.patient.delete({
      where: { id },
    });

    return { message: 'Patient supprimé avec succès' };
  }
}
