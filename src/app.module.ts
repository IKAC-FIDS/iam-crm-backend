import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './common/validators/env.validator';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { PeopleModule } from './people/people.module';
import { ActivitiesModule } from './activities/activities.module';
import { CallCardsModule } from './call-cards/call-cards.module';
import { PersonaLibraryModule } from './persona-library/persona-library.module';
import { ReportsModule } from './reports/reports.module';
import { ImportModule } from './import/import.module';
import { CompanyBranchesModule } from './company-branches/company-branches.module';
import { CompanySocialChannelsModule } from './company-social-channels/company-social-channels.module';
import { AdminPermissionsModule } from './admin/admin-permissions.module';
import { PersonContactsModule } from './person-contacts/person-contacts.module';
import { PersonSocialsModule } from './person-socials/person-socials.module';
import { IndustriesModule } from './industries/industries.module';
import { PainPointsModule } from './pain-points/pain-points.module';
import { UseCasesModule } from './use-cases/use-cases.module';
import { LeadSourcesModule } from './lead-sources/lead-sources.module';
import { LookupsModule } from './lookups/lookups.module';
import { PipelineConfigModule } from './admin/pipeline/pipeline-config.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PasskeysModule } from './auth/passkeys/passkeys.module';
import { SsoModule } from './auth/sso/sso.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    SsoModule,
    UsersModule,
    CompaniesModule,
    PeopleModule,
    ActivitiesModule,
    CallCardsModule,
    PersonaLibraryModule,
    ReportsModule,
    ImportModule,
    CompanyBranchesModule,
    CompanySocialChannelsModule,
    AdminPermissionsModule,
    PersonContactsModule,
    PersonSocialsModule,
    IndustriesModule,
    PainPointsModule,
    UseCasesModule,
    LeadSourcesModule,
    LookupsModule,
    PipelineConfigModule,
    AuditLogModule,
    OpportunitiesModule,
    PasskeysModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
