import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /api/audit/entity/:entityType/:entityId
   * Récupérer l'historique d'audit d'une entité
   * Accessible par: ADMIN, DOCTOR, SECRETARY
   */
  @Get('entity/:entityType/:entityId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DOCTOR, Role.SECRETARY)
  async getEntityAuditLogs(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.auditService.findByEntity(entityType, entityId);
    return {
      data,
      message: `Historique d'audit récupéré avec succès`,
    };
  }

  /**
   * GET /api/audit/user/:userId
   * Récupérer les actions d'un utilisateur
   * Accessible par: ADMIN uniquement
   */
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 50;

    const data = await this.auditService.findByUser(userId, skipNum, takeNum);
    return {
      data,
      message: `Actions de l'utilisateur récupérées avec succès`,
    };
  }

  /**
   * GET /api/audit
   * Récupérer tous les logs avec filtres
   * Accessible par: ADMIN uniquement
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllAuditLogs(@Query() query: QueryAuditLogsDto) {
    const data = await this.auditService.findAll(query);
    return {
      data,
      message: 'Logs d\'audit récupérés avec succès',
    };
  }

  /**
   * POST /api/audit
   * Créer une entrée d'audit (utilisé en interne par d'autres services)
   * Accessible par: tous les utilisateurs authentifiés
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto) {
    const data = await this.auditService.log(createAuditLogDto);
    return {
      data,
      message: 'Entrée d\'audit créée avec succès',
    };
  }
}
