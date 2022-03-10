import VError from '@voiceflow/verror';

import type { ExceptionFormatter } from '../types';

export const isSyntaxError = (err: unknown): err is SyntaxError => err != null && err instanceof SyntaxError;

export const formatSyntaxError: ExceptionFormatter<SyntaxError> = (err) => {
  return {
    statusCode: VError.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    name: 'SyntaxError',
    message: err.message,
  };
};
