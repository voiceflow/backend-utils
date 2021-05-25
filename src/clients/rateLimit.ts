import type IORedis from 'ioredis';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterStoreAbstract } from 'rate-limiter-flexible';

import { RateLimitConfig } from '../types';

export type RateLimiter = RateLimiterStoreAbstract;

// public rate limiter - req from creator-app or clients without an authorization
const RATE_LIMITER_PUBLIC_SUFFIX = '-rate-limiter-public';
// private rate limiter - req from clients with authorization (auth_vf token or api key)
const RATE_LIMITER_PRIVATE_SUFFIX = '-rate-limiter-private';

export const RateLimitClient = <C extends RateLimitConfig>(
  serviceName: string,
  redis: IORedis.Redis | null,
  config: C
): { public: RateLimiter; private: RateLimiter } => {
  if (redis) {
    return {
      public: new RateLimiterRedis({
        points: config.RATE_LIMITER_POINTS_PUBLIC,
        duration: config.RATE_LIMITER_DURATION_PUBLIC,
        keyPrefix: `${serviceName}${RATE_LIMITER_PUBLIC_SUFFIX}`,
        storeClient: redis,
      }),
      private: new RateLimiterRedis({
        points: config.RATE_LIMITER_POINTS_PRIVATE,
        duration: config.RATE_LIMITER_DURATION_PRIVATE,
        keyPrefix: `${serviceName}${RATE_LIMITER_PRIVATE_SUFFIX}`,
        storeClient: redis,
      }),
    };
  }

  return {
    public: new RateLimiterMemory({
      points: config.RATE_LIMITER_POINTS_PUBLIC,
      duration: config.RATE_LIMITER_DURATION_PUBLIC,
      keyPrefix: `${serviceName}${RATE_LIMITER_PUBLIC_SUFFIX}`,
    }),
    private: new RateLimiterMemory({
      points: config.RATE_LIMITER_POINTS_PRIVATE,
      duration: config.RATE_LIMITER_DURATION_PRIVATE,
      keyPrefix: `${serviceName}${RATE_LIMITER_PRIVATE_SUFFIX}`,
    }),
  };
};
