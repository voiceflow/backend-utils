import type { NextFunction, Request, Response } from 'express';

import { AbstractMiddleware } from '../../types';
import { formatError } from './formatters';

export class ExceptionMiddleware extends AbstractMiddleware<never, never> {
  public constructor() {
    super(undefined as never, undefined as never);
  }

  public handleError(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    const { statusCode, ...body } = formatError(err);

    res.status(statusCode).send({
      ...body,
      requestID: req.id.toString(),
    });
  }
}
