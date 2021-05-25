import VError from '@voiceflow/verror';
import { Request, Response } from 'express';
import { RateLimiterRes } from 'rate-limiter-flexible';

import type { RateLimitClient } from '../clients/rateLimit';
import { AbstractManager, RateLimitConfig } from '../types';

// eslint-disable-next-line import/prefer-default-export
export class RateLimitManager<C extends RateLimitConfig> extends AbstractManager<{ rateLimitClient: ReturnType<typeof RateLimitClient> }, C> {
  // eslint-disable-next-line class-methods-use-this
  setHeaders(res: Response, rateLimiterRes: RateLimiterRes, maxPoints: number) {
    res.setHeader('X-RateLimit-Limit', maxPoints);
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toString());
  }

  async consume(req: Request, res: Response) {
    const isPublic = !req.headers.authorization;
    const resource = isPublic ? req.params.versionID : req.headers.authorization;
    const maxPoints = isPublic ? this.config.RATE_LIMITER_POINTS_PUBLIC : this.config.RATE_LIMITER_POINTS_PRIVATE;
    const rateLimiterClient = this.services.rateLimitClient[isPublic ? 'public' : 'private'];

    try {
      const rateLimiterRes = await rateLimiterClient.consume(resource!);

      this.setHeaders(res, rateLimiterRes, maxPoints);
    } catch (rateLimiterRes) {
      res.setHeader('Retry-After', Math.floor(rateLimiterRes.msBeforeNext / 1000));

      this.setHeaders(res, rateLimiterRes, maxPoints);

      throw new VError('Too Many Request', VError.HTTP_STATUS.TOO_MANY_REQUESTS);
    }
  }
}
