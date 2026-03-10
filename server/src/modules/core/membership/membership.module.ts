import { Global, Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MailService } from '../../mail/mail.service';

@Global()
@Module({
    providers: [MembershipService],
    exports: [MembershipService],
})
export class MembershipModule {}
