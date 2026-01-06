import { IsDateString, IsString, IsUUID, IsOptional } from 'class-validator';

export class UpdateWithAuditDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  reason?: string; // Raison de la modification (pour audit)
}
