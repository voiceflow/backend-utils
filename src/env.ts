import { Environment } from '@voiceflow/common';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const normalizeEnvValue = (value: string) => value.trim();

export const getProcessEnv = (name: string): string => process.env[name] ?? '';

export const hasProcessEnv = (name: string): boolean => !!normalizeEnvValue(getProcessEnv(name));

export const getRequiredProcessEnv = (name: string): string => {
  if (hasProcessEnv(name)) {
    return normalizeEnvValue(getProcessEnv(name));
  }

  throw new Error(`env var: ${name} not found`);
};

// null or undefined will return the variable or null
export function getOptionalProcessEnv(name: string, defaultVar?: null | undefined): string | null;
// will return the variable or string of default value
export function getOptionalProcessEnv(name: string, defaultVar: unknown): string;
export function getOptionalProcessEnv(name: string, defaultVar?: unknown): string | null {
  if (hasProcessEnv(name)) {
    return getRequiredProcessEnv(name);
  }

  if (defaultVar === null || defaultVar === undefined) {
    return null;
  }

  return typeof defaultVar === 'object' ? JSON.stringify(defaultVar) : String(defaultVar);
}

/* eslint-disable no-console */
export const setupEnv = (rootDir = process.cwd()): void => {
  const env = getProcessEnv('NODE_ENV');

  if (env && fs.existsSync(path.join(rootDir, `.env.${env}`))) {
    if (env !== 'test') {
      console.log(`Running in ${env} environment`);
    }

    dotenv.config({ path: path.join(rootDir, `.env.${env}`) });
  } else if (fs.existsSync(path.join(rootDir, '.env'))) {
    console.log('No Environment Set/Not Found! Running default .env file');
    dotenv.config();
  }
};
/* eslint-enable no-console */

const validEnvironments: ReadonlySet<unknown> = new Set(Object.values(Environment));
const environmentIsValid = (env: unknown): env is Environment => validEnvironments.has(env);

/** @throws if `process.env[key]` is not a valid {@link Environment}. */
export const getNodeEnv = (envVar = 'NODE_ENV'): Environment => {
  const raw = getRequiredProcessEnv(envVar);

  if (environmentIsValid(raw)) {
    return raw;
  }

  throw new RangeError(`Invalid ${envVar} value: ${raw} - expected one of: ${[...validEnvironments].join(', ')}`);
};
