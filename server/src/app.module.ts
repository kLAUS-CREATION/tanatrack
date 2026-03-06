import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';

// THIRD PARTY MODULES
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { MailerModule } from '@nestjs-modules/mailer';

import configuration from './config/env.config';
import { envValidationSchema } from './common/validation/env.validation';
import { auth } from './lib/auth';
import { MailService } from './modules/mail/mail.service';
import { MailModule } from './modules/mail/mail.module';
import { PlanModule } from './modules/plan/plan.module';
import { FeaturesController } from './modules/features/features.controller';
import { FeaturesService } from './modules/features/features.service';
import { FeaturesModule } from './modules/features/features.module';
import { OrganizationModule } from './modules/organization/organization.module';

@Module({
  imports: [
    // Configuration Modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
      expandVariables: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),

    // Third Party Modules
    AuthModule.forRoot({ auth }),

    // Local Modules
    PrismaModule,

    MailModule,
    PlanModule,
    FeaturesModule,
    OrganizationModule,
  ],

  controllers: [AppController, FeaturesController],
  providers: [AppService, MailService, FeaturesService],
})
export class AppModule { }
