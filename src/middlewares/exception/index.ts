import { ErrorRequestHandler } from 'express';

import { AbstractMiddleware } from '../../types';
import { formatError } from './formatters';

export class ExceptionMiddleware extends AbstractMiddleware<never, never> {
  public constructor() {
    super(undefined as never, undefined as never);
  }

  public handleError: ErrorRequestHandler = function (err, req, res, _next): void {
    const { statusCode, ...body } = formatError(err);

    res.status(statusCode).send({
      ...body,
      requestID: req.id.toString(),
    });
  };
}
