import type { ExceptionFormatter } from '../types';

export const formatJavascriptError: ExceptionFormatter<Error> = (err) => {
  return {
    name: err.name,
    message: err.message,
  };
};
