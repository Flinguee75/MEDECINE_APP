import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReviewResultDto {
  @IsString()
  @IsNotEmpty()
  interpretation: string;

  @IsString()
  @IsOptional()
  recommendations?: string;
}
