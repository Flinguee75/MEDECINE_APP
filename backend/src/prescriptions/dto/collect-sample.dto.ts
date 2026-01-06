import { IsString, IsOptional } from 'class-validator';

export class CollectSampleDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
