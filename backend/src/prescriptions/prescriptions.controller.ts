import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SendToLabDto } from './dto/send-to-lab.dto';
import { CollectSampleDto } from './dto/collect-sample.dto';
import { StartAnalysisDto } from './dto/start-analysis.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, PrescriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async create(@Body() createDto: CreatePrescriptionDto, @CurrentUser() userId: string) {
    const prescription = await this.prescriptionsService.create(createDto, userId);
    return {
      data: prescription,
      message: 'Prescription créée avec succès',
    };
  }

  @Get()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('status') status?: PrescriptionStatus,
  ) {
    const prescriptions = await this.prescriptionsService.findAll({
      patientId,
      doctorId,
      appointmentId,
      status,
    });
    return { data: prescriptions };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const prescription = await this.prescriptionsService.findOne(id);
    return { data: prescription };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePrescriptionDto,
    @CurrentUser() userId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const prescription = await this.prescriptionsService.update(id, updateDto, userId, user.role);
    return {
      data: prescription,
      message: 'Prescription mise à jour avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.prescriptionsService.remove(id);
    return { message: 'Prescription supprimée avec succès' };
  }

  @Patch(':id/send-to-lab')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.SECRETARY, Role.ADMIN)
  async sendToLab(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: SendToLabDto,
  ) {
    const prescription = await this.prescriptionsService.sendToLab(id, userId, dto);
    return {
      data: prescription,
      message: 'Prescription envoyée au laboratoire avec succès',
    };
  }

  @Patch(':id/collect-sample')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE, Role.ADMIN)
  async collectSample(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: CollectSampleDto,
  ) {
    const prescription = await this.prescriptionsService.collectSample(id, userId, dto);
    return {
      data: prescription,
      message: 'Échantillon collecté avec succès',
    };
  }

  @Patch(':id/start-analysis')
  @UseGuards(RolesGuard)
  @Roles(Role.BIOLOGIST, Role.ADMIN)
  async startAnalysis(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: StartAnalysisDto,
  ) {
    const prescription = await this.prescriptionsService.startAnalysis(id, userId, dto);
    return {
      data: prescription,
      message: 'Analyse démarrée avec succès',
    };
  }
}
