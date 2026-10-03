import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { PostgresRateLimitStorage } from './database/rate-limit.storage';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ThrottlerModule.forRootAsync({ imports:[DatabaseModule], inject:[DatabaseService], useFactory:(db:DatabaseService)=>({throttlers:[{ttl:60000,limit:120}],storage:new PostgresRateLimitStorage(db)}) }), AuthModule, MarketplaceModule],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
