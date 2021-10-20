import { Environment } from '@voiceflow/common';
import { expect } from 'chai';

import { getNodeEnv, getOptionalProcessEnv, getRequiredProcessEnv } from '../src';

const TEST_ENV_VAR = 'TEST_ENV_VAR';

describe('getRequiredProcessEnv', () => {
  beforeEach(() => {
    delete process.env[TEST_ENV_VAR];
  });

  it('throws if process env is not found', () => {
    expect(() => getRequiredProcessEnv(TEST_ENV_VAR)).to.throw(`env var: ${TEST_ENV_VAR} not found`);
    process.env[TEST_ENV_VAR] = 'something';
    expect(getRequiredProcessEnv(TEST_ENV_VAR)).to.eql('something');
  });

  it('handles empty string values', () => {
    expect(() => getRequiredProcessEnv(TEST_ENV_VAR)).to.throw(`env var: ${TEST_ENV_VAR} not found`);
    process.env[TEST_ENV_VAR] = '   '; // whitespace
    expect(() => getRequiredProcessEnv(TEST_ENV_VAR)).to.throw(`env var: ${TEST_ENV_VAR} not found`);
  });
});

describe('getOptionalProcessEnv', () => {
  beforeEach(() => {
    delete process.env[TEST_ENV_VAR];
  });

  it('works with no default value', () => {
    expect(getOptionalProcessEnv(TEST_ENV_VAR)).to.eql(null);
    expect(getOptionalProcessEnv(TEST_ENV_VAR, undefined)).to.eql(null);
  });

  it('works with a default value', () => {
    expect(getOptionalProcessEnv(TEST_ENV_VAR, null)).to.eql(null);
    expect(getOptionalProcessEnv(TEST_ENV_VAR, 123)).to.eql('123');
    expect(getOptionalProcessEnv(TEST_ENV_VAR, { a: 1, b: 2 })).to.eql(JSON.stringify({ a: 1, b: 2 }));

    // falsy values
    expect(getOptionalProcessEnv(TEST_ENV_VAR, 0)).to.eql('0');
    expect(getOptionalProcessEnv(TEST_ENV_VAR, false)).to.eql('false');
    expect(getOptionalProcessEnv(TEST_ENV_VAR, '')).to.eql('');
  });

  it('gets the environment variable', () => {
    process.env[TEST_ENV_VAR] = '   '; // whitespace
    expect(getOptionalProcessEnv(TEST_ENV_VAR)).to.eql(null);

    process.env[TEST_ENV_VAR] = 'hello';
    expect(getOptionalProcessEnv(TEST_ENV_VAR)).to.eql('hello');
  });
});

describe('getNodeEnv', () => {
  beforeEach(() => {
    delete process.env[TEST_ENV_VAR];
  });

  it('gets the environment variable', () => {
    process.env[TEST_ENV_VAR] = Environment.PRODUCTION;
    expect(getNodeEnv(TEST_ENV_VAR)).to.eql(Environment.PRODUCTION);
  });

  it('throws if environment variable is missing', () => {
    expect(() => getNodeEnv(TEST_ENV_VAR)).to.throw(`env var: ${TEST_ENV_VAR} not found`);
  });

  it('throws if environment variable is invalid', () => {
    process.env[TEST_ENV_VAR] = 'not a real env';
    expect(() => getNodeEnv(TEST_ENV_VAR)).to.throw(`Invalid ${TEST_ENV_VAR} value: not a real env`);
  });
});
