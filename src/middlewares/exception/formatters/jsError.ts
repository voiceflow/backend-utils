import { Utils } from '@voiceflow/common';

import type { ExceptionFormatter } from '../types';

const hasPropertyAsNumber = <T, K extends keyof T | string>(obj: T, key: K): obj is T & Record<K, number> =>
  Utils.object.hasProperty(obj, key) && typeof obj[key] === 'number';

const buildStatusGuard = <K extends string>(prop: K) => <T extends Error>(err: T): err is T & Record<K, number> =>
  hasPropertyAsNumber(err, prop) && err[prop] >= 100 && err[prop] <= 599;

const hasStatusCode = buildStatusGuard('statusCode');

const hasStatus = buildStatusGuard('status');

export const extractStatusCodeFromError = (err: Error): number | undefined => {
  if (hasStatusCode(err)) return err.statusCode;
  if (hasStatus(err)) return err.status;
  return undefined;
};

export const formatJavascriptError: ExceptionFormatter<Error> = (err) => {
  return {
    statusCode: extractStatusCodeFromError(err),
    name: err.name,
    message: err.message,
  };
};
