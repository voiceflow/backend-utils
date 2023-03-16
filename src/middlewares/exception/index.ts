import type { NextFunction, Request, Response } from 'express';

import log from '../../logger';
import { AbstractMiddleware } from '../../types';
import { formatError } from './formatters';

export class ExceptionMiddleware extends AbstractMiddleware<never, never> {
  public constructor() {
    super(undefined as never, undefined as never);
  }

  public handleError(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    try {
      log.error(`Exception formatter (pre) ${JSON.stringify(err)}`);

      const { statusCode, ...body } = formatError(err);

      const error = {
        ...body,
        requestID: req.id?.toString(),
      };

      log.error(`Exception formatter (post) ${JSON.stringify(error)}`);

      res.status(statusCode).send(error);
    } catch {
      res.status(500).send({
        error: err,
      });
    }
  }
}
