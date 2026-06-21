import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './modules/prisma/prisma.module';

// THIRD PARTY MODULES
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { MailerModule } from '@nestjs-modules/mailer';

import configuration from './config/env.config';
import { envValidationSchema } from './common/validation/env.validation';
import { auth } from './lib/auth';
import { MailModule } from './modules/mail/mail.module';
import { PlanModule } from './modules/plan/plan.module';
import { FeaturesController } from './modules/features/features.controller';
import { FeaturesService } from './modules/features/features.service';
import { FeaturesModule } from './modules/features/features.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { ProductsModule } from './modules/core/products/products.module';
import { ChangeRequestModule } from './modules/core/change-requests/change-request.module';
import { InventoryModule } from './modules/core/inventory/inventory.module';
import { SalesModule } from './modules/core/sales/sales.module';
import { PurchasesModule } from './modules/core/purchases/purchases.module';
import { AllocationsModule } from './modules/core/allocations/allocations.module';
import { ReportsModule } from './modules/core/reports/reports.module';
import { CustomersModule } from './modules/core/customers/customers.module';
import { SuppliersModule } from './modules/core/suppliers/suppliers.module';
import { MembershipController } from './modules/core/membership/membership.controller';
import { MembershipModule } from './modules/core/membership/membership.module';
import { BranchModule } from './modules/core/branch/branch.module';
import { WarehouseModule } from './modules/core/warehouse/warehouse.module';
import { NotificationsModule } from './modules/core/notifications/notifications.module';

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
    EventEmitterModule.forRoot(),

    // Local Modules
    PrismaModule,

    MailModule,
    PlanModule,
    FeaturesModule,
    OrganizationModule,
    ScheduleModule,
    ProductsModule,
    ChangeRequestModule,
    InventoryModule,
    SalesModule,
    PurchasesModule,
    AllocationsModule,
    ReportsModule,
    CustomersModule,
    SuppliersModule,
    MembershipModule,
    BranchModule,
    WarehouseModule,
    NotificationsModule,
  ],

  controllers: [AppController, FeaturesController, MembershipController],
  providers: [AppService, FeaturesService],
})
export class AppModule {}
