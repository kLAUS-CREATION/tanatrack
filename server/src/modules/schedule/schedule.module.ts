import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { OrganizationService } from '../organization/organization.service';
import { SubscriptionTasks } from '../organization/organization.task';

@Module({
  imports: [NestScheduleModule.forRoot()],
  providers: [OrganizationService, SubscriptionTasks],
})
export class ScheduleModule {}
