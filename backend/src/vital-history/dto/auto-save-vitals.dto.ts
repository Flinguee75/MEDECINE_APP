import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class AutoSaveVitalsDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsObject()
  @IsNotEmpty()
  vitals: Record<string, any>;

  @IsString()
  @IsOptional()
  medicalHistoryNotes?: string;
}
