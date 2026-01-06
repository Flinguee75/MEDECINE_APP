import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MedicalHistoryDto {
  @IsOptional()
  allergies?: string[];

  @IsOptional()
  chronicDiseases?: string[];

  @IsOptional()
  familyHistory?: string[];

  @IsOptional()
  currentTreatments?: string[];

  @IsOptional()
  notes?: string;
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['F', 'M', 'AUTRE'])
  sex: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @IsString()
  @IsNotEmpty()
  insurance: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsBoolean()
  consentMedicalData: boolean;

  @IsBoolean()
  consentContact: boolean;

  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  @IsOptional()
  medicalHistory?: MedicalHistoryDto;
}
