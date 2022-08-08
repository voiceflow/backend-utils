import { Utils } from '@voiceflow/common';
import VError from '@voiceflow/verror';
import { AxiosError } from 'axios';
import { GaxiosError } from 'gaxios';
import { isHttpError } from 'http-errors';
import { types } from 'util';

export const isJavascriptError = types.isNativeError;

export const isGaxiosError = (err: unknown): err is GaxiosError => err instanceof GaxiosError;

export const isAxiosError = (err: unknown): err is AxiosError => err != null && Utils.object.hasProperty(err, 'isAxiosError') && err.isAxiosError === true;

export const isVError = (err: unknown): err is VError => err != null && err instanceof VError;

export { isHttpError };
