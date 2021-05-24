import type IORedis from 'ioredis';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterStoreAbstract } from 'rate-limiter-flexible';

export type RateLimiter = RateLimiterStoreAbstract;

// public rate limiter - req from creator-app or clients without an authorization
const RATE_LIMITER_PUBLIC_SUFFIX = '-rate-limiter-public';
// private rate limiter - req from clients with authorization (auth_vf token or api key)
const RATE_LIMITER_PRIVATE_SUFFIX = '-rate-limiter-private';

export interface RateLimiterOptions {
  points: number;
  duration: number;
}

export interface RateLimiterConfig {
  public: RateLimiterOptions;
  private: RateLimiterOptions;
}

export const RateLimiterClient = (
  serviceName: string,
  redis: IORedis.Redis | null,
  { public: _public, private: _private }: RateLimiterConfig
): { public: RateLimiter; private: RateLimiter } => {
  if (redis) {
    return {
      public: new RateLimiterRedis({
        points: _public.points,
        duration: _public.duration,
        keyPrefix: `${serviceName}${RATE_LIMITER_PUBLIC_SUFFIX}`,
        storeClient: redis,
      }),
      private: new RateLimiterRedis({
        points: _private.points,
        duration: _private.duration,
        keyPrefix: `${serviceName}${RATE_LIMITER_PRIVATE_SUFFIX}`,
        storeClient: redis,
      }),
    };
  }

  return {
    public: new RateLimiterMemory({
      points: _public.points,
      duration: _public.duration,
      keyPrefix: `${serviceName}${RATE_LIMITER_PUBLIC_SUFFIX}`,
    }),
    private: new RateLimiterMemory({
      points: _private.points,
      duration: _private.duration,
      keyPrefix: `${serviceName}${RATE_LIMITER_PRIVATE_SUFFIX}`,
    }),
  };
};
