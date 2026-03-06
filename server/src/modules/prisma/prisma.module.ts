import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';

@Global() // Highly recommended so you don't have to import PrismaModule in every feature module
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.uri');

        if (!databaseUrl) {
          throw new Error('Database URL is not defined in ConfigService');
        }

        const pool = new Pool({
          connectionString: databaseUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        return new PrismaService(pool);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
