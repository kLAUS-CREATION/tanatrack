import { MembershipService } from './membership.service';
import {
  Controller, Post, Get, Put, Body, Param, Delete,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { InviteMemberDto, UpdateRoleDto, CreateRoleDto } from './dto/membership.dto';

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

  // --- ROLES & MEMBERSHIP ---
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
