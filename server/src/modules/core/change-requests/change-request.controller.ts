import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ChangeStatus } from '@prisma/client';
import { ChangeRequestService } from './change-request.service';
import { RejectChangeDto } from './dto/change-request.dto';

/**
 * Org-wide approval queue + audit log for maker-checker changes (products,
 * categories, suppliers, …). Listing/approving/rejecting requires
 * ADMINISTRATION_ACCESS (Owner bypasses); `mine` is for the member who
 * submitted the requests.
 */
@Controller('org/:id/change-requests')
export class ChangeRequestController {
  constructor(private readonly changeRequests: ChangeRequestService) {}

  @Get()
  list(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Query('status') status?: ChangeStatus,
  ) {
    return this.changeRequests.list(id, session.user.id, status);
  }

  @Get('mine')
  listMine(@Param('id') id: string, @Session() session: UserSession) {
    return this.changeRequests.listMine(id, session.user.id);
  }

  @Post(':requestId/approve')
  approve(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Session() session: UserSession,
  ) {
    return this.changeRequests.approve(id, session.user.id, requestId);
  }

  @Post(':requestId/reject')
  reject(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Session() session: UserSession,
    @Body() dto: RejectChangeDto,
  ) {
    return this.changeRequests.reject(id, session.user.id, requestId, dto.reason);
  }
}
