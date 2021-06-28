import { expect } from 'chai';
import sinon from 'sinon';

import { RateLimitMiddleware } from '../../src/middlewares/rateLimit';

describe('rateLimit middleware unit tests', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now()); // fake Date.now
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe('setHeaders', () => {
    it('works', () => {
      const res = { setHeader: sinon.stub() };
      const rateLimiterRes = {
        remainingPoints: 100,
        msBeforeNext: 50000,
      };
      const maxPoints = 1000;

      RateLimitMiddleware.setHeaders(res as any, rateLimiterRes as any, maxPoints);

      expect(res.setHeader.args).to.eql([
        ['X-RateLimit-Limit', maxPoints],
        ['X-RateLimit-Remaining', rateLimiterRes.remainingPoints],
        ['X-RateLimit-Reset', new Date(clock.now + rateLimiterRes.msBeforeNext).toString()],
      ]);
    });
  });

  describe('consume', () => {
    it('private', async () => {
      const config = { RATE_LIMITER_POINTS_PRIVATE: 1000 };
      const rateLimiterRes = { foo: 'bar' };
      const services = { rateLimitClient: { private: { consume: sinon.stub().resolves(rateLimiterRes) } } };
      const service = new RateLimitMiddleware(services as any, config as any);
      const setHeadersStub = sinon.stub(RateLimitMiddleware, 'setHeaders');
      const next = sinon.stub();

      const res = 'response';
      const resource = 'auth-key';

      await service.consume(res as any, next, { isPublic: false, resource });

      expect(services.rateLimitClient.private.consume.args).to.eql([[resource]]);
      expect(setHeadersStub.args).to.eql([[res, rateLimiterRes, config.RATE_LIMITER_POINTS_PRIVATE]]);
      expect(next.callCount).to.eql(1);
    });

    it('public', async () => {
      const config = { RATE_LIMITER_POINTS_PUBLIC: 1000 };
      const rateLimiterRes = { foo: 'bar' };
      const services = { rateLimitClient: { public: { consume: sinon.stub().resolves(rateLimiterRes) } } };
      const service = new RateLimitMiddleware(services as any, config as any);
      const setHeadersStub = sinon.stub(RateLimitMiddleware, 'setHeaders');
      const next = sinon.stub();

      const res = 'response';
      const resource = 'version-id';

      await service.consume(res as any, next, { isPublic: true, resource });

      expect(services.rateLimitClient.public.consume.args).to.eql([[resource]]);
      expect(setHeadersStub.args).to.eql([[res, rateLimiterRes, config.RATE_LIMITER_POINTS_PUBLIC]]);
      expect(next.callCount).to.eql(1);
    });

    it('throws', async () => {
      const config = { RATE_LIMITER_POINTS_PUBLIC: 1000 };
      const rateLimiterRes = { msBeforeNext: 50000 };
      const services = { rateLimitClient: { public: { consume: sinon.stub().throws(rateLimiterRes) } } };
      const service = new RateLimitMiddleware(services as any, config as any);
      const setHeadersStub = sinon.stub(RateLimitMiddleware, 'setHeaders');
      const next = sinon.stub();

      const resource = 'version-id';
      const res = { setHeader: sinon.stub() };

      await expect(service.consume(res as any, next, { isPublic: true, resource })).to.eventually.rejectedWith('Too Many Request');

      expect(services.rateLimitClient.public.consume.args).to.eql([[resource]]);
      expect(res.setHeader.args).to.eql([['Retry-After', Math.floor(rateLimiterRes.msBeforeNext / 1000)]]);
      expect(setHeadersStub.args).to.eql([[res, rateLimiterRes, config.RATE_LIMITER_POINTS_PUBLIC]]);
      expect(next.callCount).to.eql(0);
    });
  });

  describe('versionConsume', () => {
    it('private', async () => {
      const config = { RATE_LIMITER_POINTS_PRIVATE: 1000 };
      const rateLimiterRes = { foo: 'bar' };
      const services = { rateLimitClient: { private: { consume: sinon.stub().resolves(rateLimiterRes) } } };
      const service = new RateLimitMiddleware(services as any, config as any);
      const consumeStub = sinon.stub(service, 'consume');
      const next = sinon.stub();

      const req = { headers: { authorization: 'auth-key' } };
      const res = 'response';

      await service.versionConsume(req as any, res as any, next);

      expect(consumeStub.args).to.eql([[res, next, { isPublic: false, resource: 'auth-key' }]]);
    });

    it('public', async () => {
      const config = { RATE_LIMITER_POINTS_PUBLIC: 1000 };
      const rateLimiterRes = { foo: 'bar' };
      const services = { rateLimitClient: { public: { consume: sinon.stub().resolves(rateLimiterRes) } } };
      const service = new RateLimitMiddleware(services as any, config as any);
      const consumeStub = sinon.stub(service, 'consume');
      const next = sinon.stub();

      const req = { headers: {}, params: { versionID: 'version-id' } };
      const res = 'response';

      await service.versionConsume(req as any, res as any, next);

      expect(consumeStub.args).to.eql([[res, next, { isPublic: true, resource: 'version-id' }]]);
    });
  });
});
