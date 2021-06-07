import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';

import { AbstractMiddleware, RateLimitConfig } from '../types';

// eslint-disable-next-line import/prefer-default-export
export abstract class RateLimitMiddleware<S extends Record<string, any>, C extends RateLimitConfig> extends AbstractMiddleware<S, C> {
  static throwAuthError(): never {
    throw new VError('Auth Key Required', VError.HTTP_STATUS.UNAUTHORIZED);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  abstract verify(req: Request<{}>, _res: Response, next: NextFunction): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  abstract consume(req: Request<{}>, res: Response, next: NextFunction): Promise<void>;
}
