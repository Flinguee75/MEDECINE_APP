import { IsString, IsNotEmpty } from 'class-validator';

export class AutoSaveNotesDto {
  @IsString()
  @IsNotEmpty()
  consultationNotes: string;
}
