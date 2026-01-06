import {
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsDateString,
  IsString,
  IsUUID,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

class BloodPressureDto {
  @IsNumber()
  @IsOptional()
  systolic?: number; // Pression systolique

  @IsNumber()
  @IsOptional()
  diastolic?: number; // Pression diastolique
}

class VitalsDto {
  @IsNumber()
  @IsOptional()
  weight?: number; // Poids (kg)

  @IsNumber()
  @IsOptional()
  height?: number; // Taille (cm)

  @ValidateNested()
  @Type(() => BloodPressureDto)
  @IsOptional()
  bloodPressure?: BloodPressureDto;

  @IsNumber()
  @IsOptional()
  temperature?: number; // Température (°C)

  @IsNumber()
  @IsOptional()
  heartRate?: number; // Fréquence cardiaque (bpm)

  @IsOptional()
  notes?: string; // Observations
}

export class UpdateAppointmentDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  motif?: string;

  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ValidateNested()
  @Type(() => VitalsDto)
  @IsOptional()
  vitals?: VitalsDto;
}
