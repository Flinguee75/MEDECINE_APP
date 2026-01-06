import { IsString, IsNotEmpty, IsUUID, IsOptional, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class HematologyDto {
  @IsNumber()
  @IsOptional()
  rbc?: number; // Globules rouges (M/µL)

  @IsNumber()
  @IsOptional()
  wbc?: number; // Globules blancs (K/µL)

  @IsNumber()
  @IsOptional()
  platelets?: number; // Plaquettes (K/µL)

  @IsNumber()
  @IsOptional()
  hemoglobin?: number; // Hémoglobine (g/dL)

  @IsNumber()
  @IsOptional()
  hematocrit?: number; // Hématocrite (%)
}

class BiochemistryDto {
  @IsNumber()
  @IsOptional()
  glucose?: number; // Glycémie (g/L)

  @IsNumber()
  @IsOptional()
  creatinine?: number; // Créatinine (mg/L)

  @IsNumber()
  @IsOptional()
  urea?: number; // Urée (g/L)

  @IsNumber()
  @IsOptional()
  uricAcid?: number; // Acide urique (mg/L)
}

class LipidProfileDto {
  @IsNumber()
  @IsOptional()
  totalCholesterol?: number; // Cholestérol total (g/L)

  @IsNumber()
  @IsOptional()
  hdl?: number; // HDL (g/L)

  @IsNumber()
  @IsOptional()
  ldl?: number; // LDL (g/L)

  @IsNumber()
  @IsOptional()
  triglycerides?: number; // Triglycérides (g/L)
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

export class CreateResultDto {
  @ValidateNested()
  @Type(() => BiologicalDataDto)
  @IsOptional()
  data?: BiologicalDataDto;

  @IsString()
  @IsNotEmpty()
  text: string; // Commentaires et conclusion

  @IsUUID()
  @IsNotEmpty()
  prescriptionId: string;
}
