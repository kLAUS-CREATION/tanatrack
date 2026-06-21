import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Current user's notifications + unread count. */
  @Get()
  findAll(
    @Session() session: UserSession,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notifications.getForUser(
      session.user.id,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Patch('read-all')
  markAllRead(@Session() session: UserSession) {
    return this.notifications.markAllAsRead(session.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Session() session: UserSession) {
    return this.notifications.markAsRead(id, session.user.id);
  }
}
