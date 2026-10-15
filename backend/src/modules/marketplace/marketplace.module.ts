import { SubscriptionsController } from '../subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { OriginGuard } from '../../common/guards/origin.guard';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
@Module({imports:[DatabaseModule,AuthModule],controllers:[MarketplaceController,SubscriptionsController],providers:[MarketplaceService,SubscriptionsService,OriginGuard]})
export class MarketplaceModule {}
