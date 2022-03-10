import VError from '@voiceflow/verror';

import type { ExceptionFormatter } from '../types';

export const isVError = (err: unknown): err is VError => err != null && err instanceof VError;

export const formatVError: ExceptionFormatter<VError> = (err) => {
  return {
    statusCode: err.code,
    name: err.name,
    message: err.message,
  };
};
