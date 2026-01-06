import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VitalHistoryService } from './vital-history.service';
import { AutoSaveVitalsDto } from './dto/auto-save-vitals.dto';
import { FinalizeVitalHistoryDto } from './dto/finalize-vital-history.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('vital-history')
@UseGuards(AuthGuard)
export class VitalHistoryController {
  constructor(private readonly vitalHistoryService: VitalHistoryService) {}

  /**
   * POST /api/vital-history/auto-save
   * Auto-save des constantes vitales
   * Accessible par: NURSE uniquement
   */
  @Post('auto-save')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE)
  @HttpCode(HttpStatus.OK)
  async autoSave(
    @Body() autoSaveVitalsDto: AutoSaveVitalsDto,
    @CurrentUser() userId: string,
  ) {
    const data = await this.vitalHistoryService.autoSave(
      autoSaveVitalsDto,
      userId,
    );
    return {
      data,
      message: 'Constantes vitales sauvegardées automatiquement',
    };
  }

  /**
   * POST /api/vital-history/:id/finalize
   * Finaliser les constantes vitales
   * Accessible par: NURSE uniquement
   */
  @Post(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE)
  @HttpCode(HttpStatus.OK)
  async finalize(
    @Param('id') id: string,
    @Body() finalizeDto: FinalizeVitalHistoryDto,
    @CurrentUser() userId: string,
  ) {
    const data = await this.vitalHistoryService.finalize(id, userId);
    return {
      data,
      message: 'Constantes vitales finalisées avec succès',
    };
  }

  /**
   * GET /api/vital-history/patient/:patientId
   * Récupérer l'historique des constantes d'un patient
   * Accessible par: NURSE, DOCTOR
   */
  @Get('patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE, Role.DOCTOR)
  async getPatientHistory(@Param('patientId') patientId: string) {
    const data = await this.vitalHistoryService.findByPatient(patientId);
    return {
      data,
      message: 'Historique des constantes récupéré avec succès',
    };
  }

  /**
   * GET /api/vital-history/appointment/:appointmentId
   * Récupérer l'historique complet pour un appointment
   * Accessible par: NURSE, DOCTOR, ADMIN
   */
  @Get('appointment/:appointmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE, Role.DOCTOR, Role.ADMIN)
  async getAppointmentHistory(@Param('appointmentId') appointmentId: string) {
    const data =
      await this.vitalHistoryService.findByAppointment(appointmentId);
    return {
      data,
      message: 'Historique complet récupéré avec succès',
    };
  }

  /**
   * GET /api/vital-history/draft/:appointmentId
   * Récupérer le brouillon en cours pour un appointment
   * Accessible par: NURSE
   */
  @Get('draft/:appointmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.NURSE)
  async getDraft(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() userId: string,
  ) {
    const data = await this.vitalHistoryService.findDraft(appointmentId, userId);
    return {
      data,
      message: data
        ? 'Brouillon récupéré avec succès'
        : 'Aucun brouillon trouvé',
    };
  }
}
