import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { OrganizationRole, InviteStatus } from 'generated/prisma/enums';
import { CreateRoleDto, InviteMemberDto, UpdateRoleDto } from './dto/membership.dto';
import { MailService } from 'src/modules/mail/mail.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) {}


  async verifyAccess(userId: string, orgId: string, actionSlug?: string): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: {
        role: {
          include: {
            permissions: {
              include: { permissionDefinition: true }
            }
          }
        }
      }
    });

    if (!membership) throw new ForbiddenException('You are not a member of this organization');

    // BYPASS: If roleType is OWNER, allow all actions
    if (membership.roleType === OrganizationRole.OWNER) return true;

    // CHECK: Granular permission check for ADMINs/Custom Roles
    if (actionSlug) {
      const hasPerm = membership.role?.permissions.some(
        (p) => p.permissionDefinition.slug === actionSlug && p.allowed
      );
      if (!hasPerm) throw new ForbiddenException(`Missing required permission: ${actionSlug}`);
    }

    return true;
  }

  // --- PERMISSION DEFINITIONS ---

 async getPermissionDefinitions() {
  const permissions = await this.prisma.permissionDefinition.findMany({
    orderBy: { category: 'asc' }
  });

  const groupedMap: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!groupedMap[perm.category]) groupedMap[perm.category] = [];
    groupedMap[perm.category].push(perm);
  }

  const groupedArray = Object.entries(groupedMap).map(([category, perms]) => ({
    category,
    permissions: perms
  }));

  return groupedArray;
}


  async getOrgRoles(orgId: string, userId: string) {
    await this.verifyAccess(userId, orgId);
    return this.prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { memberships: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getRoleWithPermissions(orgId: string, userId: string, roleId: string) {
    await this.verifyAccess(userId, orgId);

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
      include: {
        permissions: {
          select: {
            permissionDefinitionId: true,
            allowed: true
          }
        }
      }
    });

    if (!role) throw new NotFoundException('Role not found in this organization');
    return role;
  }

    async createRole(orgId: string, userId: string, dto: CreateRoleDto) {
        await this.verifyAccess(userId, orgId, 'USERS_ROLE_MANAGE');

        return this.prisma.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: {
                name: dto.name,
                organizationId: orgId
            }
            });

            if (dto.permissionIds && dto.permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: dto.permissionIds.map((permId) => ({
                    roleId: role.id,
                    permissionDefinitionId: permId,
                    allowed: true
                }))
            });
            }

            return role;
        });
    }

  async updateRole(orgId: string, adminId: string, roleId: string, dto: UpdateRoleDto) {
    await this.verifyAccess(adminId, orgId, 'USERS_ROLE_MANAGE');

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Name if provided
      if (dto.name) {
        await tx.role.update({
          where: { id: roleId },
          data: { name: dto.name }
        });
      }

      // 2. Sync Permissions (Delete existing and replace with new set)
      if (dto.permissionIds) {
        // Clear old relations
        await tx.rolePermission.deleteMany({ where: { roleId } });

        // Create new relations if any are selected
        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map(pDefId => ({
              roleId,
              permissionDefinitionId: pDefId,
              allowed: true
            }))
          });
        }
      }

      return { success: true };
    });
  }

  // --- INVITATION LOGIC ---
  async inviteUser(orgId: string, adminId: string, dto: InviteMemberDto) {
    await this.verifyAccess(adminId, orgId, 'USERS_INVITE');

    // 1. Validate Plan Limits
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                planFeatures: { include: { feature: true } }
              }
            }
          }
        },
        _count: { select: { memberships: true } }
      }
    });

    if (!org) throw new NotFoundException('Organization not found');

    const limitFeature = org.subscription?.plan.planFeatures.find(
      f => f.feature.key === 'max_users'
    );

    if (!limitFeature) {
      throw new BadRequestException('User limit configuration missing for this plan');
    }

    const currentMemberCount = org._count.memberships;
    const allowedMemberCount = parseInt(limitFeature.value);

    if (currentMemberCount >= allowedMemberCount) {
      throw new BadRequestException(`Plan limit reached. Maximum allowed users: ${allowedMemberCount}`);
    }

    const existingMember = await this.prisma.membership.findFirst({
        where: {
            organizationId: orgId,
            user: { email: dto.email }
        }
    });

    if (existingMember) {
        throw new BadRequestException('User already belongs to this organization');
    }

    const existingInvite = await this.prisma.invite.findFirst({
        where: {
            email: dto.email,
            organizationId: orgId,
            status: InviteStatus.PENDING
        }
    });

    if (existingInvite) {
        throw new BadRequestException('User already has a pending invite');
    }

    // 2. Generate Invite
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
        status: InviteStatus.PENDING
      },
      include: { organization: true }
    });

    // 3. Dispatch Email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invites/accept?token=${token}`;

    try {
      await this.mailService.sendEmail(
        dto.email,
        `Join ${invite.organization.name} on our platform`,
        `<h1>Invitation</h1><p>You have been invited to join <strong>${invite.organization.name}</strong>.</p><p><a href="${inviteUrl}">Click here to accept the invitation</a></p>`
      );
    } catch (e) {
      // In production, you might want to log this but not fail the transaction
      console.error('Email failed to send:', e);
    }

    return { message: 'Invitation sent successfully' };
  }

  async acceptInvite(userId: string, token: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { token, status: InviteStatus.PENDING },
    });



    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation is invalid or has expired');
    }

    return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.membership.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: invite.organizationId
                }
            }
        });

        if (existing) {
            throw new BadRequestException('Already a member');
        }

      // Create the membership
      const membership = await tx.membership.create({
        data: {
          userId,
          organizationId: invite.organizationId,
          roleId: invite.roleId,
          roleType: invite.roleType,
        },
      });

      // Mark invite as used
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return membership;
    });
  }

  async getMyInvites(email: string) {
    return this.prisma.invite.findMany({
      where: {
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        organization: {
          select: { id: true, name: true, logoUrl: true }
        }
      }
    });
  }

  // --- MEMBERSHIP DESTRUCTION ---

  async leaveOrganization(userId: string, orgId: string) {
    const member = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } }
    });

    if (!member) throw new NotFoundException('Membership records not found');

    if (member.roleType === OrganizationRole.OWNER) {
      throw new BadRequestException('Cannot leave an organization with no owners');
    }

    return this.prisma.membership.delete({
      where: { id: member.id }
    });
  }
}
