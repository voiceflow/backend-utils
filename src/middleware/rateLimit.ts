import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';

import { AbstractMiddleware } from '../types';

const LOCAL_DEVELOPEMENT = 'https://creator-local.development.voiceflow.com:3002';

class RateLimitMiddleware<S extends Record<string, any>, C extends Record<string, any>> extends AbstractMiddleware<S, C> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  async verify(req: Request<{}>, _res: Response, next: NextFunction) {
    if (
      !this.config.PROJECT_SOURCE &&
      !this.config.DISABLE_ORIGIN_CHECK &&
      ![this.config.CREATOR_APP_ORIGIN, LOCAL_DEVELOPEMENT].includes(req.headers.origin || 'no-origin') &&
      !req.headers.authorization
    ) {
      throw new VError('Auth Key Required', VError.HTTP_STATUS.UNAUTHORIZED);
    }

    next();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async consume(req: Request<{}>, res: Response, next: NextFunction) {
    await this.services.rateLimit.consume(req, res);

    return next();
  }
}

export default RateLimitMiddleware;
