import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto, uploadedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: createDocumentDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    return this.prisma.document.create({
      data: {
        ...createDocumentDto,
        uploadedBy,
      },
      include: {
        patient: true,
      },
    });
  }

  async findAll(filters?: { patientId?: string }) {
    return this.prisma.document.findMany({
      where: {
        ...(filters?.patientId && { patientId: filters.patientId }),
      },
      include: {
        patient: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    return document;
  }

  async update(id: string, updateDto: UpdateDocumentDto) {
    await this.findOne(id);

    return this.prisma.document.update({
      where: { id },
      data: updateDto,
      include: {
        patient: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }
}
