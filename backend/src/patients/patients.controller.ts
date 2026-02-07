import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('patients')
@UseGuards(AuthGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.ADMIN)
  async create(@Body() createPatientDto: CreatePatientDto) {
    const patient = await this.patientsService.create(createPatientDto);
    return {
      data: patient,
      message: 'Patient créé avec succès',
    };
  }

  @Get()
  async findAll(
    @CurrentUser() userId: string,
    @Query('search') search?: string,
  ) {
    const patients = await this.patientsService.findAll(search);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === Role.SECRETARY) {
      return {
        data: patients.map((patient) => ({
          ...patient,
          medicalHistory: null,
        })),
      };
    }

    return {
      data: patients,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.BIOLOGIST, Role.NURSE, Role.ADMIN)
  async findOne(@Param('id') id: string) {
    const patient = await this.patientsService.findOne(id);
    return {
      data: patient,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() userId: string,
  ) {
    if (updatePatientDto.medicalHistory) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new ForbiddenException('Accès refusé');
      }

      if (user.role === Role.SECRETARY) {
        throw new ForbiddenException(
          'Les secrétaires ne peuvent pas modifier le dossier médical',
        );
      }
    }

    const patient = await this.patientsService.update(id, updatePatientDto);
    return {
      data: patient,
      message: 'Patient modifié avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
