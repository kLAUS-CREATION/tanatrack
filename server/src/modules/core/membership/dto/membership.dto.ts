import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizationRole, RoleKind } from '@prisma/client';

/** A single branch or warehouse a LOCAL-role invite should grant on accept. */
export class InviteLocationInputDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsEnum(OrganizationRole)
  @IsOptional()
  roleType?: OrganizationRole;

  // Required (>= 1) when roleId points at a LOCAL role; ignored otherwise.
  // Validated in MembershipService.inviteUser.
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InviteLocationInputDto)
  locations?: InviteLocationInputDto[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(RoleKind)
  kind: RoleKind;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}

/** Assign or clear (null/omitted) a member's organization-wide role. */
export class SetMemberRoleDto {
  @IsString()
  @IsOptional()
  roleId?: string;
}

/** Assign or clear a member's scoped role at a branch/warehouse. */
export class AssignLocationRoleDto {
  @IsString()
  @IsOptional()
  roleId?: string;
}
