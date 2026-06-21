import { NotificationType } from '@prisma/client';

export { NotificationType };

/** Resolve recipients by capability instead of listing user ids by hand. */
export interface NotificationAudience {
  /** A permission slug from PERMISSIONS — every member who holds it is notified. */
  permission: string;
  /** Optionally narrow a LOCAL permission to one branch's scoped members. */
  branchId?: string;
}

/**
 * The payload domain services emit on `'notification.create'`. Recipients come
 * from `recipientIds` (explicit) and/or `audience` (resolved by permission);
 * the two are unioned, the actor is removed, and the rest are deduped.
 */
export interface NotificationEvent {
  organizationId: string;
  type: NotificationType;

  /** Who triggered it (excluded from their own notifications). */
  actorId?: string;

  /** Explicit recipients. */
  recipientIds?: string[];
  /** Capability-based recipients. */
  audience?: NotificationAudience;

  title: string;
  body?: string;

  /** What the notification points at, for the click-through. */
  entityType?: string;
  entityId?: string;
  actionUrl?: string;

  metadata?: Record<string, unknown>;
}
