import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateVitalHistoryDto {
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

  @IsString()
  @IsNotEmpty()
  enteredBy: string;

  @IsString()
  @IsNotEmpty()
  actionType: string; // "CREATED", "UPDATED", "AUTO_SAVED"

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean = true;
}
