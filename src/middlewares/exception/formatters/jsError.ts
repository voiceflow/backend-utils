import type { ExceptionFormatter } from '../types';

export const isJavascriptError = (err: unknown): err is Error => err != null && err instanceof Error;

export const formatJavascriptError: ExceptionFormatter<Error> = (err) => {
  return {
    name: err.name,
    message: err.message,
  };
};
