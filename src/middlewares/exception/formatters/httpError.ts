import { HttpError, isHttpError } from 'http-errors';

import type { ExceptionFormatter } from '../types';

export { isHttpError };

export const formatHttpError: ExceptionFormatter<HttpError> = (err) => {
  return {
    statusCode: err.statusCode,
    name: err.name,
    message: err.message,
  };
};
