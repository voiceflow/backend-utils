import VError from '@voiceflow/verror';
import { GaxiosError } from 'gaxios';
import { isHttpError } from 'http-errors';
import { types } from 'util';

export const isJavascriptError = types.isNativeError;

export const isGaxiosError = (err: unknown): err is GaxiosError => err instanceof GaxiosError;

export const isVError = (err: unknown): err is VError => err != null && err instanceof VError;

export { isHttpError };
