import { IsNotEmpty, IsOptional, IsNumber, Min, Max, ValidateNested, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class BloodPressureDto {
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  systolic?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(150)
  diastolic?: number;
}

class VitalsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  weight?: number; // kg

  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number; // cm

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number; // °C

  @ValidateNested()
  @Type(() => BloodPressureDto)
  @IsOptional()
  bloodPressure?: BloodPressureDto;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(220)
  heartRate?: number; // bpm

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  respiratoryRate?: number; // breaths/min

  @IsOptional()
  @IsNumber()
  @Min(70)
  @Max(100)
  oxygenSaturation?: number; // %

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painScore?: number; // EVA 0-10

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bloodPressurePosition?: string; // Assis / debout / couché

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bloodPressureArm?: string; // Bras droit/gauche
}

export class EnterVitalsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VitalsDto)
  vitals: VitalsDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  medicalHistoryNotes?: string;
}
