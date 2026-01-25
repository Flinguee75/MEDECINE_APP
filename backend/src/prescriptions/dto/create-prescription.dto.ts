import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  category?: string; // "BIOLOGIE" ou "IMAGERIE"

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;
}
