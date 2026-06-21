import { Injectable } from '@nestjs/common';
import {
  NotificationPreference,
  NotificationType,
  OrganizationRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import {
  NotificationAudience,
  NotificationEvent,
} from './notification.event';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  // ============================================================
  //  DELIVERY
  // ============================================================

  /**
   * Fan a single event out to its recipients: persist one row each, then push
   * the live payload to anyone whose preferences allow it (and who's connected).
   */
  async process(event: NotificationEvent) {
    const recipients = await this.resolveRecipients(event);
    if (recipients.length === 0) return;

    // Load actor + recipient preferences once for the whole fan-out.
    const [actor, prefs] = await Promise.all([
      event.actorId
        ? this.prisma.user.findUnique({
            where: { id: event.actorId },
            select: { id: true, name: true, image: true },
          })
        : Promise.resolve(null),
      this.prisma.notificationPreference.findMany({
        where: { userId: { in: recipients } },
      }),
    ]);
    const prefById = new Map(prefs.map((p) => [p.userId, p]));

    for (const userId of recipients) {
      const saved = await this.prisma.notification.create({
        data: {
          organizationId: event.organizationId,
          userId,
          actorId: event.actorId,
          type: event.type,
          title: event.title,
          body: event.body,
          entityType: event.entityType,
          entityId: event.entityId,
          actionUrl: event.actionUrl,
          metadata: (event.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });

      if (this.checkPreference(prefById.get(userId), event.type)) {
        this.gateway.sendToUser(userId, { ...saved, actor });
      }
    }
  }

  /** Union explicit + audience recipients, drop the actor, dedupe. */
  private async resolveRecipients(event: NotificationEvent): Promise<string[]> {
    const ids = new Set(event.recipientIds ?? []);
    if (event.audience) {
      const resolved = await this.resolveAudience(
        event.organizationId,
        event.audience,
      );
      resolved.forEach((id) => ids.add(id));
    }
    if (event.actorId) ids.delete(event.actorId);
    return [...ids];
  }

  /**
   * Every user in the org who holds `permission`: owners (who bypass all checks),
   * members whose org-wide role grants it (cascades to every location), and —
   * when a branch is given — members whose branch-scoped role grants it.
   */
  async resolveAudience(
    orgId: string,
    { permission, branchId }: NotificationAudience,
  ): Promise<string[]> {
    const grantsPermission = {
      permissions: {
        some: { allowed: true, permissionDefinition: { slug: permission } },
      },
    } satisfies Prisma.RoleWhereInput;

    const memberships = await this.prisma.membership.findMany({
      where: {
        organizationId: orgId,
        OR: [{ roleType: OrganizationRole.OWNER }, { role: grantsPermission }],
      },
      select: { userId: true },
    });
    const ids = new Set(memberships.map((m) => m.userId));

    if (branchId) {
      const branchMembers = await this.prisma.branchMember.findMany({
        where: {
          branchId,
          role: grantsPermission,
          membership: { organizationId: orgId },
        },
        select: { membership: { select: { userId: true } } },
      });
      branchMembers.forEach((bm) => ids.add(bm.membership.userId));
    }

    return [...ids];
  }

  /** Map each notification type onto its per-user push toggle (default on). */
  private checkPreference(
    prefs: NotificationPreference | undefined,
    type: NotificationType,
  ): boolean {
    if (!prefs) return true;
    switch (type) {
      case NotificationType.APPROVAL_REQUESTED:
      case NotificationType.APPROVAL_APPROVED:
      case NotificationType.APPROVAL_REJECTED:
        return prefs.pushOnApproval;
      case NotificationType.LOW_STOCK:
        return prefs.pushOnLowStock;
      case NotificationType.SALE_RECORDED:
        return prefs.pushOnSale;
      case NotificationType.MEMBER_JOINED:
      case NotificationType.ROLE_CHANGED:
        return prefs.pushOnMembership;
      default:
        return true;
    }
  }

  // ============================================================
  //  READ API (controller)
  // ============================================================

  async getForUser(userId: string, limit = 20, offset = 0) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    const items2 = await this.attachActors(items);
    return { items: items2, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  /** Attach actor display info (raw actorId, no FK — resolved here). */
  private async attachActors<T extends { actorId: string | null }>(rows: T[]) {
    const ids = [
      ...new Set(rows.map((r) => r.actorId).filter((id): id is string => !!id)),
    ];
    if (ids.length === 0) return rows.map((r) => ({ ...r, actor: null }));

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, image: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return rows.map((r) => ({
      ...r,
      actor: r.actorId ? (byId.get(r.actorId) ?? null) : null,
    }));
  }
}
