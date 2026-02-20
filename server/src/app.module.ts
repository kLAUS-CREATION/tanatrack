import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';

// THIRD PARTY MODULES
import { AuthModule } from '@thallesp/nestjs-better-auth';

import configuration from './config/env.config';
import { envValidationSchema } from './common/validation/env.validation';
import { auth } from './lib/auth';

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

    // Third Party Modules
    AuthModule.forRoot({ auth }),

    // Local Modules
    PrismaModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
