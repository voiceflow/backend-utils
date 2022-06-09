import { GaxiosError } from 'gaxios';

import type { ExceptionFormatter } from '../types';

export const isGaxiosError = (err: unknown): err is GaxiosError => err instanceof GaxiosError;

export const formatGaxiosError: ExceptionFormatter<GaxiosError> = (err) => {
  return {
    statusCode: err.response?.status,
    name: 'GaxiosError',
    message: err.message,
    details: {
      code: err.code,
      statusText: err.response?.statusText,
    },
  };
};
