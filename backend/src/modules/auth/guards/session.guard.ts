import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '../../users/user.types';
import { SessionRepository } from '../session.repository';

export const SESSION_COOKIE = 'garage_session';
export type AuthenticatedRequest = Request & { user: PublicUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionRepository) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.sessions.findUser(request.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException('Please sign in');
    request.user = user;
    return true;
  }
}
