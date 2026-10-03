import { AccountService } from './account.service';
import { Body, Controller, Get, Header, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { environment } from '../../config/environment';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SessionGuard, SESSION_COOKIE } from './guards/session.guard';
import type { AuthenticatedRequest } from './guards/session.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { SessionRepository } from './session.repository';

@Controller('auth')
@UseGuards(OriginGuard)
export class AuthController {
  constructor(private readonly account: AccountService, private readonly auth: AuthService, private readonly sessions: SessionRepository) {}
  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: environment().production, sameSite: 'lax', path: '/api' };
  }
  private async setSession(request: Request, response: Response, session: { token: string; expiresAt: Date }) {
    await this.sessions.revoke(request.cookies?.[SESSION_COOKIE]);
    response.cookie(SESSION_COOKIE, session.token, { ...this.cookieOptions(), expires: session.expiresAt });
  }

  @Post('forgot-password') @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgot(@Body() body: unknown) { return this.account.request(body, 'reset'); }
  @Post('reset-password') @Throttle({ default: { limit: 5, ttl: 60000 } })
  reset(@Body() body: unknown) { return this.account.consume(body, 'reset'); }
  @Post('change-email') @UseGuards(SessionGuard) @Throttle({ default: { limit: 3, ttl: 60000 } })
  changeEmail(@Req() req: AuthenticatedRequest, @Body() body: unknown) { return this.account.changeEmail(req.user.id, body); }
  @Post('signup')
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(@Body() data: SignupDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.signup(data);
    await this.setSession(request, response, result.session);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() data: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(data);
    await this.setSession(request, response, result.session);
    return { user: result.user };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthenticatedRequest) { return { user: request.user }; }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.sessions.revoke(request.cookies?.[SESSION_COOKIE]);
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }
}
