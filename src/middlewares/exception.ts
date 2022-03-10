import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';

import { AbstractMiddleware } from '../types';

interface ExceptionResult {
  requestID: string;
  statusCode: number;
  name: string;
  message: string;
}

type ExceptionHandler<T> = (err: T) => Partial<ExceptionResult>;

export class ExceptionMiddleware extends AbstractMiddleware<never, never> {
  public constructor() {
    super(undefined as never, undefined as never);
  }

  public handleError(err: unknown, req: Request, res: Response, _next: NextFunction) {
    let exception: ExceptionResult = {
      requestID: req.id?.toString() ?? undefined,
      statusCode: 500,
      name: 'UnknownError',
      message: 'Unknown error',
    };

    if (isVError(err)) exception = ExceptionMiddleware.mergeExceptionResult(exception, handleVError(err));
    else if (isSyntaxError(err)) exception = ExceptionMiddleware.mergeExceptionResult(exception, handleSyntaxError(err));
    else if (isJavascriptError(err)) exception = ExceptionMiddleware.mergeExceptionResult(exception, handleJavascriptError(err));

    const { statusCode, ...body } = exception;

    res.status(statusCode).send(body);
  }

  private static mergeExceptionResult(baseException: ExceptionResult, exception: Partial<ExceptionResult>) {
    return {
      ...baseException,
      ...exception,
    };
  }
}

export const isSyntaxError = (err: unknown): err is SyntaxError => err != null && err instanceof SyntaxError;

export const handleSyntaxError: ExceptionHandler<SyntaxError> = (_err) => {
  return {
    statusCode: 400,
    name: 'SyntaxError',
    message: 'Error parsing JSON',
  };
};

export const isVError = (err: unknown): err is VError => err != null && err instanceof VError;

export const handleVError: ExceptionHandler<VError> = (err) => {
  return {
    statusCode: err.code,
    name: err.name,
    message: err.message,
  };
};

export const isJavascriptError = (err: unknown): err is Error => err != null && err instanceof Error;

export const handleJavascriptError: ExceptionHandler<Error> = (err) => {
  return {
    name: err.name,
    message: err.message,
  };
};
