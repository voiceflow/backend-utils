import { HttpError } from 'http-errors';

import type { ExceptionFormatter } from '../types';

export const formatHttpError: ExceptionFormatter<HttpError> = (err) => {
  return {
    statusCode: err.statusCode,
    name: err.name,
    message: err.message,
  };
};
