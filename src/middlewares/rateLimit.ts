import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';

import type { RateLimitManager } from '../services/rateLimit';
import { AbstractMiddleware, RateLimitConfig } from '../types';

// eslint-disable-next-line import/prefer-default-export
export class RateLimitMiddleware<C extends RateLimitConfig> extends AbstractMiddleware<{ rateLimit: RateLimitManager<C> }, C> {
  static throwAuthError(): never {
    throw new VError('Auth Key Required', VError.HTTP_STATUS.UNAUTHORIZED);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types, class-methods-use-this
  async verify(req: Request<{}>, _res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      RateLimitMiddleware.throwAuthError();
    }

    next();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async consume(req: Request<{}>, res: Response, next: NextFunction) {
    await this.services.rateLimit.consume(req, res);

    return next();
  }
}
