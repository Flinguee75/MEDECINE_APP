import { IsEnum, IsOptional } from 'class-validator';
import { PrescriptionStatus } from '@prisma/client';

export class UpdatePrescriptionDto {
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;
}
