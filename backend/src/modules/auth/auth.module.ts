import { AccountService } from './account.service';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionRepository } from './session.repository';
import { SessionGuard } from './guards/session.guard';
import { OriginGuard } from '../../common/guards/origin.guard';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [AccountService, AuthService, SessionRepository, SessionGuard, OriginGuard],
  exports: [SessionGuard, SessionRepository],
})
export class AuthModule {}
