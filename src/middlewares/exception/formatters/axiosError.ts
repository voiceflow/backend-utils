import { AxiosError } from 'axios';

import type { ExceptionFormatter } from '../types';

export const formatAxiosError: ExceptionFormatter<AxiosError> = (err) => {
  return {
    statusCode: err.response?.status,
    name: 'AxiosError',
    message: err.message,
    details: {
      code: err.code,
      statusText: err.response?.statusText,
    },
  };
};
