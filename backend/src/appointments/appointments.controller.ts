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
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateWithAuditDto } from './dto/update-with-audit.dto';
import { AutoSaveNotesDto } from './dto/auto-save-notes.dto';
import { EnterVitalsDto } from './dto/enter-vitals.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CloseAppointmentDto } from './dto/close-appointment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, AppointmentStatus } from '@prisma/client';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    const appointment =
      await this.appointmentsService.create(createAppointmentDto);
    return {
      data: appointment,
      message: 'Rendez-vous créé avec succès',
    };
  }

  @Get()
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    const appointments = await this.appointmentsService.findAll(
      doctorId,
      patientId,
      status,
    );
    return {
      data: appointments,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const appointment = await this.appointmentsService.findOne(id);
    return {
      data: appointment,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.update(
      id,
      updateAppointmentDto,
    );
    return {
      data: appointment,
      message: 'Rendez-vous modifié avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  // ==================== WORKFLOW ENDPOINTS ====================

  @Patch(':id/check-in')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async checkIn(@Param('id') id: string) {
    const appointment = await this.appointmentsService.checkIn(id);
    return {
      data: appointment,
      message: 'Patient enregistré avec succès',
    };
  }

  @Patch(':id/vitals')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE, Role.ADMIN)
  async enterVitals(
    @Param('id') id: string,
    @Body() enterVitalsDto: EnterVitalsDto,
    @CurrentUser() userId: string,
  ) {
    const appointment = await this.appointmentsService.enterVitals(
      id,
      enterVitalsDto,
      userId,
    );
    return {
      data: appointment,
      message: 'Constantes vitales enregistrées avec succès',
    };
  }

  @Patch(':id/consultation')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async completeConsultation(
    @Param('id') id: string,
    @Body() completeConsultationDto: CompleteConsultationDto,
    @CurrentUser() userId: string,
  ) {
    const appointment = await this.appointmentsService.completeConsultation(
      id,
      completeConsultationDto,
      userId,
    );
    return {
      data: appointment,
      message: 'Consultation terminée avec succès',
    };
  }

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async closeAppointment(
    @Param('id') id: string,
    @Body() closeAppointmentDto: CloseAppointmentDto,
    @CurrentUser() userId: string,
  ) {
    const appointment = await this.appointmentsService.closeAppointment(
      id,
      closeAppointmentDto,
      userId,
    );
    return {
      data: appointment,
      message: 'Rendez-vous clôturé avec succès',
    };
  }

  // ==================== TRACEABILITY ENDPOINTS ====================

  /**
   * PATCH /api/appointments/:id/update-with-audit
   * Modifier un rendez-vous avec traçabilité
   * Accessible par: SECRETARY, ADMIN
   */
  @Patch(':id/update-with-audit')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.ADMIN)
  async updateWithAudit(
    @Param('id') id: string,
    @Body() updateWithAuditDto: UpdateWithAuditDto,
    @CurrentUser() userId: string,
  ) {
    const appointment = await this.appointmentsService.updateWithAudit(
      id,
      updateWithAuditDto,
      userId,
    );
    return {
      data: appointment,
      message: 'Rendez-vous modifié avec succès',
    };
  }

  /**
   * POST /api/appointments/:id/auto-save-notes
   * Auto-save des notes de consultation
   * Accessible par: DOCTOR
   */
  @Post(':id/auto-save-notes')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async autoSaveNotes(
    @Param('id') id: string,
    @Body() autoSaveNotesDto: AutoSaveNotesDto,
    @CurrentUser() userId: string,
  ) {
    const appointment = await this.appointmentsService.autoSaveConsultationNotes(
      id,
      autoSaveNotesDto,
      userId,
    );
    return {
      data: appointment,
      message: 'Notes sauvegardées automatiquement',
    };
  }

  /**
   * GET /api/appointments/in-progress
   * Récupérer les consultations en cours du médecin connecté
   * Accessible par: DOCTOR
   */
  @Get('in-progress')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async getInProgressConsultations(@CurrentUser() userId: string) {
    const appointments =
      await this.appointmentsService.getInProgressConsultations(userId);
    return {
      data: appointments,
      message: 'Consultations en cours récupérées avec succès',
    };
  }

  /**
   * GET /api/appointments/patient/:patientId/history
   * Récupérer l'historique des consultations d'un patient
   * Accessible par: DOCTOR, NURSE
   */
  @Get('patient/:patientId/history')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.NURSE)
  async getPatientHistory(@Param('patientId') patientId: string) {
    const appointments =
      await this.appointmentsService.getPatientConsultationHistory(patientId);
    return {
      data: appointments,
      message: 'Historique des consultations récupéré avec succès',
    };
  }
}
