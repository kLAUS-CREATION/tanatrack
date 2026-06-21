import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import type { NotificationEvent } from './notification.event';

/**
 * Bridges the in-process event bus to the notification engine. Domain services
 * stay decoupled — they emit `'notification.create'` and never block on (or fail
 * because of) notification delivery.
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('notification.create', { async: true })
  async handle(event: NotificationEvent) {
    try {
      await this.notifications.process(event);
    } catch (err) {
      // Best-effort: a notification failure must never surface to the caller.
      this.logger.error(
        `Failed to process notification (${event.type})`,
        err as Error,
      );
    }
  }
}
