import { IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { BillingStatus } from '@prisma/client';

export class CloseAppointmentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  billingAmount: number;

  @IsNotEmpty()
  @IsEnum(BillingStatus)
  billingStatus: BillingStatus;
}
