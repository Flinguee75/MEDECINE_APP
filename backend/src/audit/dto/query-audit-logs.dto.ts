import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogsDto {
  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  skip?: number = 0;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  take?: number = 50;
}
