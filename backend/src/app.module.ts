import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ResultsModule } from './results/results.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { VitalHistoryModule } from './vital-history/vital-history.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    ResultsModule,
    DocumentsModule,
    AuditModule,
    VitalHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
