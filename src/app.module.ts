import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ServicesModule } from './modules/services/services.module';
import { ProjectTypesModule } from './modules/project-types/project-types.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { CostCodeCategoriesModule } from './modules/cost-code-categories/cost-code-categories.module';
import { CostCodesModule } from './modules/cost-codes/cost-codes.module';
import { CostCodeOptionsModule } from './modules/cost-code-options/cost-code-options.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { EmailLogsModule } from './modules/email-logs/email-logs.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ServiceCostCodesModule } from './modules/service-cost-codes/service-cost-codes.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { ContactUsModule } from './modules/contact-us/contact-us.module';
import { HomePageModule } from './modules/home-page/home-page.module';
import { AboutUsModule } from './modules/about-us/about-us.module';
import { EstimatorPageModule } from './modules/estimator-page/estimator-page.module';
import { PrivacyPolicyModule } from './modules/privacy-policy/privacy-policy.module';
import { TermsOfServiceModule } from './modules/terms-of-service/terms-of-service.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BuildingTypesModule } from './modules/building-types/building-types.module';
import { TipsModule } from './modules/tips/tips.module';
import { PricingService } from './modules/pricing/pricing.service';
import { EmailService } from './modules/notifications/email.service';
import { PdfGeneratorService } from './modules/pdf/pdf-generator.service';
import { InitModule } from './common/init/init.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InitModule,
    AuthModule,
    PrismaModule,
    ServicesModule,
    ProjectTypesModule,
    ServiceCategoriesModule,
    CostCodeCategoriesModule,
    CostCodesModule,
    CostCodeOptionsModule,
    SubmissionsModule,
    EmailLogsModule,
    ActivityLogsModule,
    ServiceCostCodesModule,
    UploadModule,
    UsersModule,
    PortfolioModule,
    SiteSettingsModule,
    ContactUsModule,
    HomePageModule,
    AboutUsModule,
    EstimatorPageModule,
    PrivacyPolicyModule,
    TermsOfServiceModule,
    DashboardModule,
    BuildingTypesModule,
    TipsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PricingService, EmailService, PdfGeneratorService],
})
export class AppModule {}
