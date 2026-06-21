import { MembershipService } from './membership.service';
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  InviteMemberDto,
  UpdateRoleDto,
  CreateRoleDto,
  SetMemberRoleDto,
  AssignLocationRoleDto,
} from './dto/membership.dto';

@Controller('membership')
export class MembershipController {
  constructor(private readonly orgService: MembershipService) {}

  // --- PERMISSIONS ---
  @Get('permissions/definitions')
  async getDefinitions() {
    return this.orgService.getPermissionDefinitions();
  }

  // --- INVITES ---
  @Get('my-invites')
  async listInvites(@Session() session: UserSession) {
    return this.orgService.getMyInvites(session.user.email);
  }

  @Post('invites/accept/:token')
  async accept(@Param('token') token: string, @Session() session: UserSession) {
    return this.orgService.acceptInvite(session.user.id, token);
  }

  @Post(':id/invite')
  async invite(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgService.inviteUser(id, session.user.id, dto);
  }

  // --- MEMBERS ---
  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.getMembers(id, session.user.id);
  }

  // Read-only employee directory — visible to any member of the organization.
  @Get(':id/directory')
  async getDirectory(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.getDirectory(id, session.user.id);
  }

  // The current user's role type + granted permission slugs for this org.
  @Get(':id/me')
  async getMyAccess(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.getMyAccess(id, session.user.id);
  }

  // Branches & warehouses an admin can attach to a location-scoped invite.
  @Get(':id/locations')
  async getAssignableLocations(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.orgService.getAssignableLocations(id, session.user.id);
  }

  @Put(':id/members/:membershipId/role')
  async setMemberRole(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Session() session: UserSession,
    @Body() dto: SetMemberRoleDto,
  ) {
    return this.orgService.setMemberRole(
      id,
      session.user.id,
      membershipId,
      dto,
    );
  }

  // --- LOCATION (SCOPED) ROLE ASSIGNMENT ---
  @Put(':id/members/:membershipId/branches/:branchId')
  async assignBranchRole(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Param('branchId') branchId: string,
    @Session() session: UserSession,
    @Body() dto: AssignLocationRoleDto,
  ) {
    return this.orgService.assignBranchRole(
      id,
      session.user.id,
      membershipId,
      branchId,
      dto,
    );
  }

  @Delete(':id/members/:membershipId/branches/:branchId')
  async removeBranchRole(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Param('branchId') branchId: string,
    @Session() session: UserSession,
  ) {
    return this.orgService.removeBranchRole(
      id,
      session.user.id,
      membershipId,
      branchId,
    );
  }

  @Put(':id/members/:membershipId/warehouses/:warehouseId')
  async assignWarehouseRole(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Param('warehouseId') warehouseId: string,
    @Session() session: UserSession,
    @Body() dto: AssignLocationRoleDto,
  ) {
    return this.orgService.assignWarehouseRole(
      id,
      session.user.id,
      membershipId,
      warehouseId,
      dto,
    );
  }

  @Delete(':id/members/:membershipId/warehouses/:warehouseId')
  async removeWarehouseRole(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Param('warehouseId') warehouseId: string,
    @Session() session: UserSession,
  ) {
    return this.orgService.removeWarehouseRole(
      id,
      session.user.id,
      membershipId,
      warehouseId,
    );
  }

  // --- ROLES ---
  @Get(':id/roles')
  async getRoles(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.getOrgRoles(id, session.user.id);
  }

  @Get(':id/roles/:roleId')
  async getRoleDetails(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Session() session: UserSession,
  ) {
    return this.orgService.getRoleWithPermissions(id, session.user.id, roleId);
  }

  @Post(':id/roles')
  async createRole(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateRoleDto,
  ) {
    return this.orgService.createRole(id, session.user.id, dto);
  }

  @Put(':id/roles/:roleId')
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.orgService.updateRole(id, session.user.id, roleId, dto);
  }

  @Delete(':id/leave')
  async leave(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.leaveOrganization(session.user.id, id);
  }
}
