import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationListener } from './notification.listener';

/**
 * Notification engine. Domain services emit `'notification.create'` on the global
 * EventEmitter2 bus; the listener here persists + pushes. No exports needed —
 * the bus is the integration surface.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, NotificationListener],
})
export class NotificationsModule {}
