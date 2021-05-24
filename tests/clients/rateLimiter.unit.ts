import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import { RateLimiterClient } from '../../src/clients/rateLimiter';

describe('rateLimiter client unit tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  it('constructor', async () => {
    const redis = 'redis-client';
    const config = {
      public: {
        points: 1000,
        duration: 60,
      },
      private: {
        points: 500,
        duration: 60,
      },
    };

    const limiter = RateLimiterClient('foo-service', redis as any, config as any);

    expect(_.get(limiter.public, '_client')).to.eq(redis);
    expect(_.get(limiter.public, '_points')).to.eq(config.public.points);
    expect(_.get(limiter.public, '_duration')).to.eq(config.public.duration);
    expect(_.get(limiter.public, '_keyPrefix')).to.eq('foo-service-rate-limiter-public');

    expect(_.get(limiter.private, '_client')).to.eq(redis);
    expect(_.get(limiter.private, '_points')).to.eq(config.private.points);
    expect(_.get(limiter.private, '_duration')).to.eq(config.private.duration);
    expect(_.get(limiter.private, '_keyPrefix')).to.eq('foo-service-rate-limiter-private');
  });
});
