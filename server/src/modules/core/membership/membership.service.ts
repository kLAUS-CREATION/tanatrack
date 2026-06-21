import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrganizationRole,
  InviteStatus,
  NotificationType,
  PermissionScope,
  RoleKind,
} from '@prisma/client';
import {
  InviteMemberDto,
  UpdateRoleDto,
  CreateRoleDto,
  SetMemberRoleDto,
  AssignLocationRoleDto,
} from './dto/membership.dto';
import { MailService } from 'src/modules/mail/mail.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';

/**
 * Location context for a permission check.
 * Pass branchId for branch-scoped actions, warehouseId for warehouse-scoped actions.
 */
export interface AccessContext {
  branchId?: string;
  warehouseId?: string;
}

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private events: EventEmitter2,
  ) {}

  /**
   * Authorize a user to perform an action in an organization.
   *
   * Rules:
   *  - OWNER bypasses every check.
   *  - No actionSlug → just verifies org membership.
   *  - GLOBAL permission → granted only by the member's org-wide role.
   *  - LOCAL permission → granted if EITHER the org-wide role grants it (cascades to
   *    every location) OR the member's scoped role at the given branch/warehouse grants it.
   *
   * A role "grants" a permission when it has a RolePermission row with allowed = true.
   */
  async verifyAccess(
    userId: string,
    orgId: string,
    actionSlug?: string,
    context: AccessContext = {},
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: {
        role: {
          include: {
            permissions: { include: { permissionDefinition: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // OWNER is an unconditional super-user.
    if (membership.roleType === OrganizationRole.OWNER) return true;

    // Membership-only check (no specific action requested).
    if (!actionSlug) return true;

    // What scope does this permission carry?
    const definition = await this.prisma.permissionDefinition.findUnique({
      where: { slug: actionSlug },
    });
    if (!definition) {
      throw new ForbiddenException(`Unknown permission: ${actionSlug}`);
    }

    // 1. The org-wide role. For GLOBAL perms this is the only source; for LOCAL perms
    //    it cascades — granting here means "allowed at every location".
    const grantedGlobally = this.roleGrants(membership.role, actionSlug);
    if (grantedGlobally) return true;

    // 2. GLOBAL permissions have no location fallback.
    if (definition.scope === PermissionScope.GLOBAL) {
      throw new ForbiddenException(
        `Missing required permission: ${actionSlug}`,
      );
    }

    // 3. LOCAL permission — check the scoped role at the targeted location.
    if (await this.locationRoleGrants(membership.id, actionSlug, context)) {
      return true;
    }

    throw new ForbiddenException(
      `Missing required permission: ${actionSlug} at the requested location`,
    );
  }

  /**
   * Non-throwing variant of verifyAccess. Returns true when the user is allowed,
   * false on a permission/membership denial. Any other error is re-thrown.
   * Use for branching logic (e.g. "is this actor an approver?").
   */
  async hasPermission(
    userId: string,
    orgId: string,
    actionSlug?: string,
    context: AccessContext = {},
  ): Promise<boolean> {
    try {
      return await this.verifyAccess(userId, orgId, actionSlug, context);
    } catch (e) {
      if (e instanceof ForbiddenException) return false;
      throw e;
    }
  }

  /** True if a role (with included permissions) grants the slug. */
  private roleGrants(
    role: {
      permissions: {
        allowed: boolean;
        permissionDefinition: { slug: string };
      }[];
    } | null,
    slug: string,
  ): boolean {
    return !!role?.permissions.some(
      (p) => p.permissionDefinition.slug === slug && p.allowed,
    );
  }

  /** True if the member's scoped role at the given branch/warehouse grants the slug. */
  private async locationRoleGrants(
    membershipId: string,
    slug: string,
    context: AccessContext,
  ): Promise<boolean> {
    const { branchId, warehouseId } = context;
    if (!branchId && !warehouseId) return false;

    const include = {
      role: {
        include: { permissions: { include: { permissionDefinition: true } } },
      },
    };

    if (branchId) {
      const bm = await this.prisma.branchMember.findUnique({
        where: { membershipId_branchId: { membershipId, branchId } },
        include,
      });
      if (this.roleGrants(bm?.role ?? null, slug)) return true;
    }

    if (warehouseId) {
      const wm = await this.prisma.warehouseMember.findUnique({
        where: { membershipId_warehouseId: { membershipId, warehouseId } },
        include,
      });
      if (this.roleGrants(wm?.role ?? null, slug)) return true;
    }

    return false;
  }

  // --- PERMISSION DEFINITIONS ---

  /**
   * The current user's access for an org: their org-wide role type plus the set
   * of permission slugs their org-wide role grants. Drives client-side gating
   * (e.g. whether to show the Administration area). OWNER implicitly has all.
   */
  async getMyAccess(orgId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: {
        role: {
          include: { permissions: { include: { permissionDefinition: true } } },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const permissions =
      membership.role?.permissions
        .filter((p) => p.allowed)
        .map((p) => p.permissionDefinition.slug) ?? [];

    return {
      membershipId: membership.id,
      roleType: membership.roleType,
      roleId: membership.roleId,
      permissions,
    };
  }

  /**
   * Returns permission definitions grouped by category, each entry carrying its
   * scope so the UI can label GLOBAL vs LOCAL and filter location-role editors.
   */
  async getPermissionDefinitions() {
    const defs = await this.prisma.permissionDefinition.findMany({
      orderBy: [{ category: 'asc' }, { scope: 'asc' }, { name: 'asc' }],
    });

    const groups = new Map<string, typeof defs>();
    for (const def of defs) {
      const list = groups.get(def.category) ?? [];
      list.push(def);
      groups.set(def.category, list);
    }

    return Array.from(groups.entries()).map(([category, permissions]) => ({
      category,
      permissions,
    }));
  }

  // --- ROLE MANAGEMENT ---

  async getOrgRoles(orgId: string, userId: string) {
    await this.verifyAccess(userId, orgId);
    return this.prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { memberships: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(orgId: string, adminId: string, dto: CreateRoleDto) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');

    const existing = await this.prisma.role.findFirst({
      where: { organizationId: orgId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('A role with this name already exists');
    }

    // A GLOBAL role may only hold GLOBAL permissions; a LOCAL role only LOCAL ones.
    await this.assertPermissionsMatchKind(dto.kind, dto.permissionIds);

    return this.prisma.role.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        kind: dto.kind,
        permissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((permissionDefinitionId) => ({
                permissionDefinitionId,
                allowed: true,
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * Guard that every permission in `permissionIds` carries the scope that
   * matches the role's kind (GLOBAL role → GLOBAL perms, LOCAL role → LOCAL perms).
   * Throws BadRequestException on any mismatch or unknown id.
   */
  private async assertPermissionsMatchKind(
    kind: RoleKind,
    permissionIds?: string[],
  ) {
    if (!permissionIds?.length) return;

    const requiredScope =
      kind === RoleKind.LOCAL ? PermissionScope.LOCAL : PermissionScope.GLOBAL;

    const defs = await this.prisma.permissionDefinition.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true, scope: true, name: true },
    });

    if (defs.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }

    const mismatched = defs.filter((d) => d.scope !== requiredScope);
    if (mismatched.length) {
      throw new BadRequestException(
        `A ${kind} role can only contain ${requiredScope} permissions. ` +
          `Invalid: ${mismatched.map((d) => d.name).join(', ')}`,
      );
    }
  }

  async getRoleWithPermissions(orgId: string, userId: string, roleId: string) {
    await this.verifyAccess(userId, orgId);

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
      include: {
        permissions: {
          select: {
            permissionDefinitionId: true,
            allowed: true,
          },
        },
      },
    });

    if (!role)
      throw new NotFoundException('Role not found in this organization');
    return role;
  }

  async updateRole(
    orgId: string,
    adminId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
    });
    if (!role)
      throw new NotFoundException('Role not found in this organization');

    // New permission set must still respect the role's immutable kind.
    if (dto.permissionIds) {
      await this.assertPermissionsMatchKind(role.kind, dto.permissionIds);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Name if provided
      if (dto.name) {
        await tx.role.update({
          where: { id: roleId },
          data: { name: dto.name },
        });
      }

      // 2. Sync Permissions (Delete existing and replace with new set)
      if (dto.permissionIds) {
        // Clear old relations
        await tx.rolePermission.deleteMany({ where: { roleId } });

        // Create new relations if any are selected
        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((pDefId) => ({
              roleId,
              permissionDefinitionId: pDefId,
              allowed: true,
            })),
          });
        }
      }

      return { success: true };
    });
  }

  // --- MEMBER MANAGEMENT ---

  /**
   * List org members with their global role plus every branch/warehouse
   * scoped-role assignment, so the UI can render the full access picture.
   */
  async getMembers(orgId: string, userId: string) {
    await this.verifyAccess(userId, orgId, 'ADMINISTRATION_ACCESS');
    return this.listMembers(orgId);
  }

  // Read-only employee directory: any member of the org may view who works here
  // and where. No management actions are exposed through this path.
  async getDirectory(orgId: string, userId: string) {
    await this.verifyAccess(userId, orgId);
    return this.listMembers(orgId);
  }

  private async listMembers(orgId: string) {
    const members = await this.prisma.membership.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        role: { select: { id: true, name: true } },
        branches: {
          include: {
            branch: { select: { id: true, name: true } },
            role: { select: { id: true, name: true } },
          },
        },
        warehouses: {
          include: {
            warehouse: { select: { id: true, name: true } },
            role: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      roleType: m.roleType,
      roleId: m.roleId,
      roleName: m.role?.name ?? null,
      user: m.user,
      branches: m.branches.map((b) => ({
        branchMemberId: b.id,
        branchId: b.branchId,
        branchName: b.branch.name,
        roleId: b.roleId,
        roleName: b.role?.name ?? null,
      })),
      warehouses: m.warehouses.map((w) => ({
        warehouseMemberId: w.id,
        warehouseId: w.warehouseId,
        warehouseName: w.warehouse.name,
        roleId: w.roleId,
        roleName: w.role?.name ?? null,
      })),
    }));
  }

  /** Assign / clear a member's organization-wide custom role. */
  async setMemberRole(
    orgId: string,
    adminId: string,
    membershipId: string,
    dto: SetMemberRoleDto,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');
    const membership = await this.getOrgMembership(orgId, membershipId);

    if (membership.roleType === OrganizationRole.OWNER) {
      throw new BadRequestException("The owner's role cannot be changed");
    }

    await this.assertRoleInOrg(orgId, dto.roleId);

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { roleId: dto.roleId ?? null },
    });

    this.notifyRoleChanged(orgId, adminId, membership.userId);
    return updated;
  }

  /** Grant a member a scoped role at a branch (upsert), or remove their assignment. */
  async assignBranchRole(
    orgId: string,
    adminId: string,
    membershipId: string,
    branchId: string,
    dto: AssignLocationRoleDto,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');
    const membership = await this.getOrgMembership(orgId, membershipId);

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId: orgId },
    });
    if (!branch)
      throw new NotFoundException('Branch not found in this organization');

    await this.assertRoleInOrg(orgId, dto.roleId);

    const result = await this.prisma.branchMember.upsert({
      where: { membershipId_branchId: { membershipId, branchId } },
      create: { membershipId, branchId, roleId: dto.roleId ?? null },
      update: { roleId: dto.roleId ?? null },
    });

    this.notifyRoleChanged(orgId, adminId, membership.userId, branch.name);
    return result;
  }

  async removeBranchRole(
    orgId: string,
    adminId: string,
    membershipId: string,
    branchId: string,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');
    await this.getOrgMembership(orgId, membershipId);

    await this.prisma.branchMember.deleteMany({
      where: { membershipId, branchId },
    });
    return { success: true };
  }

  /** Grant a member a scoped role at a warehouse (upsert), or remove their assignment. */
  async assignWarehouseRole(
    orgId: string,
    adminId: string,
    membershipId: string,
    warehouseId: string,
    dto: AssignLocationRoleDto,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');
    const membership = await this.getOrgMembership(orgId, membershipId);

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId: orgId },
    });
    if (!warehouse)
      throw new NotFoundException('Warehouse not found in this organization');

    await this.assertRoleInOrg(orgId, dto.roleId);

    const result = await this.prisma.warehouseMember.upsert({
      where: { membershipId_warehouseId: { membershipId, warehouseId } },
      create: { membershipId, warehouseId, roleId: dto.roleId ?? null },
      update: { roleId: dto.roleId ?? null },
    });

    this.notifyRoleChanged(orgId, adminId, membership.userId, warehouse.name);
    return result;
  }

  async removeWarehouseRole(
    orgId: string,
    adminId: string,
    membershipId: string,
    warehouseId: string,
  ) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');
    await this.getOrgMembership(orgId, membershipId);

    await this.prisma.warehouseMember.deleteMany({
      where: { membershipId, warehouseId },
    });
    return { success: true };
  }

  /** Fetch a membership and confirm it belongs to the org. */
  private async getOrgMembership(orgId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId: orgId },
    });
    if (!membership)
      throw new NotFoundException('Member not found in this organization');
    return membership;
  }

  /** Validate that a roleId (if provided) belongs to the org. */
  private async assertRoleInOrg(orgId: string, roleId?: string | null) {
    if (!roleId) return;
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
    });
    if (!role)
      throw new BadRequestException(
        'Role does not belong to this organization',
      );
  }

  // --- INVITATION LOGIC ---
  async inviteUser(orgId: string, adminId: string, dto: InviteMemberDto) {
    await this.verifyAccess(adminId, orgId, 'ADMINISTRATION_ACCESS');

    // 1. Validate Plan Limits
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                planFeatures: { include: { feature: true } },
              },
            },
          },
        },
        _count: { select: { memberships: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');

    const limitFeature = org.subscription?.plan.planFeatures.find(
      (f) => f.feature.key === 'max_users',
    );

    if (!limitFeature) {
      throw new BadRequestException(
        'User limit configuration missing for this plan',
      );
    }

    const currentMemberCount = org._count.memberships;
    const allowedMemberCount = parseInt(limitFeature.value);

    if (currentMemberCount >= allowedMemberCount) {
      throw new BadRequestException(
        `Plan limit reached. Maximum allowed users: ${allowedMemberCount}`,
      );
    }

    const existingMember = await this.prisma.membership.findFirst({
      where: {
        organizationId: orgId,
        user: { email: dto.email },
      },
    });

    if (existingMember) {
      throw new BadRequestException(
        'User already belongs to this organization',
      );
    }

    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        email: dto.email,
        organizationId: orgId,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      throw new BadRequestException('User already has a pending invite');
    }

    // Resolve the selected role's kind. A LOCAL role must be attached to at least one
    // branch/warehouse at invite time; a GLOBAL role (or none) ignores any locations.
    let locationCreate: { branchId?: string; warehouseId?: string }[] = [];
    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, organizationId: orgId },
      });
      if (!role) {
        throw new BadRequestException(
          'Role does not belong to this organization',
        );
      }
      if (role.kind === RoleKind.LOCAL) {
        locationCreate = await this.validateInviteLocations(
          orgId,
          dto.locations,
        );
      }
    }

    // 2. Generate Invite
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.prisma.invite.create({
      data: {
        email: dto.email,
        organizationId: orgId,
        roleId: dto.roleId,
        roleType: dto.roleType || OrganizationRole.ADMIN,
        token,
        expiresAt,
        status: InviteStatus.PENDING,
        locations: locationCreate.length
          ? { create: locationCreate }
          : undefined,
      },
      include: { organization: true },
    });

    // 3. Dispatch Email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invites/accept?token=${token}`;

    try {
      await this.mailService.sendEmail(
        dto.email,
        `Join ${invite.organization.name} on our platform`,
        `<h1>Invitation</h1><p>You have been invited to join <strong>${invite.organization.name}</strong>.</p><p><a href="${inviteUrl}">Click here to accept the invitation</a></p>`,
      );
    } catch (e) {
      // In production, you might want to log this but not fail the transaction
      console.error('Email failed to send:', e);
    }

    return { message: 'Invitation sent successfully' };
  }

  /**
   * Validate the branch/warehouse locations attached to a LOCAL-role invite.
   * Requires at least one, each carrying exactly one of branchId/warehouseId that
   * belongs to the org. Returns the rows to nest-create on the invite.
   */
  private async validateInviteLocations(
    orgId: string,
    locations?: { branchId?: string; warehouseId?: string }[],
  ): Promise<{ branchId?: string; warehouseId?: string }[]> {
    if (!locations?.length) {
      throw new BadRequestException(
        'Select at least one branch or warehouse for a location-based role',
      );
    }

    const result: { branchId?: string; warehouseId?: string }[] = [];
    for (const loc of locations) {
      const hasBranch = !!loc.branchId;
      const hasWarehouse = !!loc.warehouseId;
      if (hasBranch === hasWarehouse) {
        throw new BadRequestException(
          'Each location must specify exactly one of branchId or warehouseId',
        );
      }

      if (hasBranch) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: loc.branchId, organizationId: orgId },
        });
        if (!branch) {
          throw new NotFoundException('Branch not found in this organization');
        }
        result.push({ branchId: loc.branchId });
      } else {
        const warehouse = await this.prisma.warehouse.findFirst({
          where: { id: loc.warehouseId, organizationId: orgId },
        });
        if (!warehouse) {
          throw new NotFoundException(
            'Warehouse not found in this organization',
          );
        }
        result.push({ warehouseId: loc.warehouseId });
      }
    }
    return result;
  }

  /**
   * Branches and warehouses an admin can attach to a location-scoped invite.
   * Gated by ADMINISTRATION_ACCESS (the umbrella admin permission).
   */
  async getAssignableLocations(orgId: string, userId: string) {
    await this.verifyAccess(userId, orgId, 'ADMINISTRATION_ACCESS');

    const [branches, warehouses] = await Promise.all([
      this.prisma.branch.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.warehouse.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { branches, warehouses };
  }

  async acceptInvite(userId: string, token: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { token, status: InviteStatus.PENDING },
      include: { locations: true },
    });

    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation is invalid or has expired');
    }

    // A LOCAL role isn't an org-wide role: it's applied per location instead of
    // on the membership itself.
    const role = invite.roleId
      ? await this.prisma.role.findUnique({ where: { id: invite.roleId } })
      : null;
    const isLocalRole = role?.kind === RoleKind.LOCAL;

    const membership = await this.prisma.$transaction(async (tx) => {
      // Create the membership. Local roles leave the org-wide role empty.
      const created = await tx.membership.create({
        data: {
          userId,
          organizationId: invite.organizationId,
          roleId: isLocalRole ? null : invite.roleId,
          roleType: invite.roleType,
        },
      });

      // Apply a LOCAL role to each attached branch/warehouse.
      if (isLocalRole) {
        for (const loc of invite.locations) {
          if (loc.branchId) {
            await tx.branchMember.create({
              data: {
                membershipId: created.id,
                branchId: loc.branchId,
                roleId: invite.roleId,
              },
            });
          } else if (loc.warehouseId) {
            await tx.warehouseMember.create({
              data: {
                membershipId: created.id,
                warehouseId: loc.warehouseId,
                roleId: invite.roleId,
              },
            });
          }
        }
      }

      // Mark invite as used
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return created;
    });

    // Let the org's admins know a new member has joined.
    this.events.emit('notification.create', {
      organizationId: invite.organizationId,
      type: NotificationType.MEMBER_JOINED,
      actorId: userId,
      audience: { permission: PERMISSIONS.ADMINISTRATION_ACCESS },
      title: 'New member joined',
      body: 'A new member accepted their invitation and joined the organization.',
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      actionUrl: `/organizations/${invite.organizationId}/employees`,
    });

    return membership;
  }

  /** Notify a member their org-wide or location role changed. */
  private notifyRoleChanged(
    orgId: string,
    adminId: string,
    memberUserId: string,
    locationName?: string,
  ) {
    this.events.emit('notification.create', {
      organizationId: orgId,
      type: NotificationType.ROLE_CHANGED,
      actorId: adminId,
      recipientIds: [memberUserId],
      title: 'Your role was updated',
      body: locationName
        ? `Your role at ${locationName} was updated by an administrator.`
        : 'Your organization role was updated by an administrator.',
      entityType: 'MEMBERSHIP',
      actionUrl: `/organizations/${orgId}`,
    });
  }

  async getMyInvites(email: string) {
    return this.prisma.invite.findMany({
      where: {
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });
  }

  // --- MEMBERSHIP DESTRUCTION ---

  async leaveOrganization(userId: string, orgId: string) {
    const member = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!member) throw new NotFoundException('Membership records not found');

    if (member.roleType === OrganizationRole.OWNER) {
      throw new BadRequestException(
        'Cannot leave an organization with no owners',
      );
    }

    return this.prisma.membership.delete({
      where: { id: member.id },
    });
  }
}
