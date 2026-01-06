import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une entrée d'audit
   */
  async log(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        performedBy: data.performedBy,
        changes: data.changes,
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les logs d'audit d'une entité
   */
  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }

  /**
   * Récupérer tous les logs d'un utilisateur
   */
  async findByUser(userId: string, skip: number = 0, take: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        performedBy: userId,
      },
      skip,
      take,
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }

  /**
   * Récupérer les logs avec filtres
   */
  async findAll(query: QueryAuditLogsDto) {
    const where: any = {};

    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.performedBy) where.performedBy = query.performedBy;

    return this.prisma.auditLog.findMany({
      where,
      skip: query.skip,
      take: query.take,
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }
}
