import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CompleteConsultationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  consultationNotes: string;
}
