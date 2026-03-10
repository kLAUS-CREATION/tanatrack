import { IsEmail, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { OrganizationRole } from 'generated/prisma/enums';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsEnum(OrganizationRole)
  @IsOptional()
  roleType?: OrganizationRole;
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
  name: string;
  permissionIds?: string[];
}
