import { IsString, IsOptional } from 'class-validator';

export class SendToLabDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
