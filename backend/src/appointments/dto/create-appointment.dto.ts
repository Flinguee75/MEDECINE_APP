import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  motif: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;
}
