import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';
import { RateLimiterRes } from 'rate-limiter-flexible';

import { AbstractMiddleware, RateLimitConfig } from '../types';

// eslint-disable-next-line import/prefer-default-export
export class RateLimitMiddleware<S extends Record<string, any>, C extends RateLimitConfig> extends AbstractMiddleware<S, C> {
  static throwAuthError(): never {
    throw new VError('Auth Key Required', VError.HTTP_STATUS.UNAUTHORIZED);
  }

  static setHeaders(res: Response, rateLimiterRes: RateLimiterRes, maxPoints: number) {
    res.setHeader('X-RateLimit-Limit', maxPoints);
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
  }

  static isUnauthorizedRequest(req: Request) {
    return !req.headers.authorization;
  }

  async consume(res: Response, next: NextFunction, { resource, isPublic }: { resource: string; isPublic?: boolean }) {
    const maxPoints = isPublic ? this.config.RATE_LIMITER_POINTS_PUBLIC : this.config.RATE_LIMITER_POINTS_PRIVATE;
    const rateLimiterClient = this.services.rateLimitClient[isPublic ? 'public' : 'private'];

    try {
      const rateLimiterRes = await rateLimiterClient.consume(resource!);

      RateLimitMiddleware.setHeaders(res, rateLimiterRes, maxPoints);
    } catch (rateLimiterRes) {
      res.setHeader('Retry-After', Math.floor(rateLimiterRes.msBeforeNext / 1000));

      RateLimitMiddleware.setHeaders(res, rateLimiterRes, maxPoints);

      throw new VError('Too Many Request', VError.HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    return next();
  }

  async versionConsume(req: Request, res: Response, next: NextFunction) {
    const isPublic = RateLimitMiddleware.isUnauthorizedRequest(req);

    return this.consume(res, next, {
      isPublic,
      resource: isPublic ? req.params.versionID : req.headers.authorization!,
    });
  }
}
