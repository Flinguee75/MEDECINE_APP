import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;
}
