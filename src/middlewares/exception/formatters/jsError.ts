import { types } from 'util';

import type { ExceptionFormatter } from '../types';

export const isJavascriptError = types.isNativeError;

export const formatJavascriptError: ExceptionFormatter<Error> = (err) => {
  return {
    name: err.name,
    message: err.message,
  };
};
