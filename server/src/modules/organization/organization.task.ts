import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrganizationService } from './organization.service';

@Injectable()
export class SubscriptionTasks {
  constructor(private readonly orgService: OrganizationService) {}

  // Run every hour
  @Cron('0 * * * *')
  async handleTrialExpirationCron() {
    await this.orgService.handleTrialExpiration();
  }

  @Cron('0 * * * *')
  async handleSubscriptionExpirationCron() {
    await this.orgService.handleSubscriptionExpiration();
  }
}
