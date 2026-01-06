import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsUUID()
  @IsNotEmpty()
  patientId: string;
}
