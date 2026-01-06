import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  performedBy: string;

  @IsObject()
  @IsNotEmpty()
  changes: Record<string, any>;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
