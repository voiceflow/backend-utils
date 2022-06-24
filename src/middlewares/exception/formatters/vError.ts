import VError from '@voiceflow/verror';

import type { ExceptionFormatter } from '../types';

export const formatVError: ExceptionFormatter<VError> = (err) => {
  return {
    statusCode: err.code,
    name: err.name,
    message: err.message,
  };
};
