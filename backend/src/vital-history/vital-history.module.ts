import { Module } from '@nestjs/common';
import { VitalHistoryService } from './vital-history.service';
import { VitalHistoryController } from './vital-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VitalHistoryController],
  providers: [VitalHistoryService],
  exports: [VitalHistoryService], // Export pour utilisation dans d'autres modules
})
export class VitalHistoryModule {}
