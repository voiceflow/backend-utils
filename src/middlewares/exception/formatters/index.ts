import VError from '@voiceflow/verror';

import type { ExceptionFormat } from '../types';
import { formatGaxiosError, isGaxiosError } from './gaxiosError';
import { formatHttpError, isHttpError } from './httpError';
import { formatJavascriptError, isJavascriptError } from './jsError';
import { formatVError, isVError } from './vError';

export const formatError = (err: unknown): ExceptionFormat => {
  let exception: ExceptionFormat = {
    statusCode: VError.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    name: 'UnknownError',
    message: 'Unknown error',
  };

  if (isVError(err)) exception = mergeExceptionResult(exception, formatVError(err));
  else if (isHttpError(err)) exception = mergeExceptionResult(exception, formatHttpError(err));
  else if (isGaxiosError(err)) exception = mergeExceptionResult(exception, formatGaxiosError(err));
  else if (isJavascriptError(err)) exception = mergeExceptionResult(exception, formatJavascriptError(err));

  return exception;
};

export const mergeExceptionResult = (baseException: ExceptionFormat, exception: Partial<ExceptionFormat>) => ({
  ...baseException,
  ...exception,
});
