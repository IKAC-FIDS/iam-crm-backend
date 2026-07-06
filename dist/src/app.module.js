"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const env_validator_1 = require("./common/validators/env.validator");
const custom_throttler_guard_1 = require("./common/guards/custom-throttler.guard");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const companies_module_1 = require("./companies/companies.module");
const people_module_1 = require("./people/people.module");
const activities_module_1 = require("./activities/activities.module");
const call_cards_module_1 = require("./call-cards/call-cards.module");
const persona_library_module_1 = require("./persona-library/persona-library.module");
const reports_module_1 = require("./reports/reports.module");
const import_module_1 = require("./import/import.module");
const company_branches_module_1 = require("./company-branches/company-branches.module");
const company_social_channels_module_1 = require("./company-social-channels/company-social-channels.module");
const admin_permissions_module_1 = require("./admin/admin-permissions.module");
const person_contacts_module_1 = require("./person-contacts/person-contacts.module");
const person_socials_module_1 = require("./person-socials/person-socials.module");
const industries_module_1 = require("./industries/industries.module");
const pain_points_module_1 = require("./pain-points/pain-points.module");
const use_cases_module_1 = require("./use-cases/use-cases.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validator_1.envValidationSchema,
                validationOptions: { abortEarly: true },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: config.get('THROTTLE_TTL', 60000),
                            limit: config.get('THROTTLE_LIMIT', 100),
                        },
                    ],
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            companies_module_1.CompaniesModule,
            people_module_1.PeopleModule,
            activities_module_1.ActivitiesModule,
            call_cards_module_1.CallCardsModule,
            persona_library_module_1.PersonaLibraryModule,
            reports_module_1.ReportsModule,
            import_module_1.ImportModule,
            company_branches_module_1.CompanyBranchesModule,
            company_social_channels_module_1.CompanySocialChannelsModule,
            admin_permissions_module_1.AdminPermissionsModule,
            person_contacts_module_1.PersonContactsModule,
            person_socials_module_1.PersonSocialsModule,
            industries_module_1.IndustriesModule,
            pain_points_module_1.PainPointsModule,
            use_cases_module_1.UseCasesModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: custom_throttler_guard_1.CustomThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map