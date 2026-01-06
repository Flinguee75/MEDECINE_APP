import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HematologyDto {
  @IsOptional()
  rbc?: number;

  @IsOptional()
  wbc?: number;

  @IsOptional()
  platelets?: number;

  @IsOptional()
  hemoglobin?: number;

  @IsOptional()
  hematocrit?: number;
}

class BiochemistryDto {
  @IsOptional()
  glucose?: number;

  @IsOptional()
  creatinine?: number;

  @IsOptional()
  urea?: number;

  @IsOptional()
  uricAcid?: number;
}

class LipidProfileDto {
  @IsOptional()
  totalCholesterol?: number;

  @IsOptional()
  hdl?: number;

  @IsOptional()
  ldl?: number;

  @IsOptional()
  triglycerides?: number;
}

class BiologicalDataDto {
  @ValidateNested()
  @Type(() => HematologyDto)
  @IsOptional()
  hematology?: HematologyDto;

  @ValidateNested()
  @Type(() => BiochemistryDto)
  @IsOptional()
  biochemistry?: BiochemistryDto;

  @ValidateNested()
  @Type(() => LipidProfileDto)
  @IsOptional()
  lipidProfile?: LipidProfileDto;
}

export class UpdateResultDto {
  @ValidateNested()
  @Type(() => BiologicalDataDto)
  @IsOptional()
  data?: BiologicalDataDto;

  @IsString()
  @IsOptional()
  text?: string;
}
