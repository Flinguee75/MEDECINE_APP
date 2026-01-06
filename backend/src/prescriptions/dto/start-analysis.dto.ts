import { IsString, IsOptional } from 'class-validator';

export class StartAnalysisDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
