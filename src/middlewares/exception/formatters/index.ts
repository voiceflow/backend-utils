import VError from '@voiceflow/verror';
import { merge } from 'lodash';

import * as Guards from '../../../guards';
import type { ExceptionFormat } from '../types';
import { formatAxiosError } from './axiosError';
import { formatGaxiosError } from './gaxiosError';
import { formatHttpError } from './httpError';
import { formatJavascriptError } from './jsError';
import { formatVError } from './vError';

export const formatError = (err: unknown): ExceptionFormat => {
  let exception: ExceptionFormat = {
    statusCode: VError.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    name: 'UnknownError',
    message: 'Unknown error',
  };

  if (Guards.isVError(err)) exception = mergeExceptionResult(exception, formatVError(err));
  else if (Guards.isHttpError(err)) exception = mergeExceptionResult(exception, formatHttpError(err));
  else if (Guards.isAxiosError(err)) exception = mergeExceptionResult(exception, formatAxiosError(err));
  else if (Guards.isGaxiosError(err)) exception = mergeExceptionResult(exception, formatGaxiosError(err));
  else if (Guards.isJavascriptError(err)) exception = mergeExceptionResult(exception, formatJavascriptError(err));

  return exception;
};

export const mergeExceptionResult = (baseException: ExceptionFormat, exception: Partial<ExceptionFormat>) => merge(baseException, exception);
