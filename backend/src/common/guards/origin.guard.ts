import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { environment } from '../../config/environment';

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    // Browser writes require a non-simple header; CORS is deliberately disabled.
    // Origin validation additionally rejects cross-origin requests through the proxy.
    if (request.get('x-garage-client') !== 'web' ||
        (request.get('origin') && request.get('origin') !== environment().origin)) {
      throw new ForbiddenException('Request origin is not allowed');
    }
    return true;
  }
}
