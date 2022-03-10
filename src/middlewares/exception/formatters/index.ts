import VError from '@voiceflow/verror';

import type { ExceptionFormat } from '../types';
import { formatHttpError, isHttpError } from './httpError';
import { formatJavascriptError, isJavascriptError } from './jsError';
import { formatSyntaxError, isSyntaxError } from './syntaxError';
import { formatVError, isVError } from './vError';

export const formatError = (err: unknown): ExceptionFormat => {
  let exception: ExceptionFormat = {
    statusCode: VError.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    name: 'UnknownError',
    message: 'Unknown error',
  };

  if (isVError(err)) exception = mergeExceptionResult(exception, formatVError(err));
  else if (isHttpError(err)) exception = mergeExceptionResult(exception, formatHttpError(err));
  else if (isSyntaxError(err)) exception = mergeExceptionResult(exception, formatSyntaxError(err));
  else if (isJavascriptError(err)) exception = mergeExceptionResult(exception, formatJavascriptError(err));

  return exception;
};

export const mergeExceptionResult = (baseException: ExceptionFormat, exception: Partial<ExceptionFormat>) => ({
  ...baseException,
  ...exception,
});
