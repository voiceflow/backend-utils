import { expect } from 'chai';
import sinon from 'sinon';

import { RateLimitMiddleware } from '../../src/middlewares/rateLimit';

describe('rateLimit middleware unit tests', () => {
  describe('verify', () => {
    describe('next called', async () => {
      it('has auth', async () => {
        const middleware = new RateLimitMiddleware({} as any, {} as any);
        const req = { headers: { authorization: 'auth-key' } };
        const next = sinon.stub();

        await middleware.verify(req as any, null as any, next);

        expect(next.callCount).to.eql(1);
      });
    });

    describe('throws', () => {
      it('no origin set and no auth', async () => {
        const middleware = new RateLimitMiddleware({} as any, {} as any);
        const req = { headers: {} };

        await expect(middleware.verify(req as any, null as any, null as any)).to.eventually.rejectedWith('Auth Key Required');
      });
    });
  });

  describe('consume', () => {
    it('next called', async () => {
      const rateLimit = { consume: sinon.stub() };
      const middleware = new RateLimitMiddleware({ rateLimit } as any, {} as any);

      const req = 'req';
      const res = 'res';
      const next = sinon.stub();

      await middleware.consume(req as any, res as any, next);

      expect(rateLimit.consume.args).to.eql([[req, res]]);
      expect(next.callCount).to.eql(1);
    });

    it('throws', async () => {
      const rateLimit = { consume: sinon.stub().throws(new Error('custom err')) };
      const middleware = new RateLimitMiddleware({ rateLimit } as any, {} as any);

      const req = 'req';
      const res = 'res';

      await expect(middleware.consume(req as any, res as any, null as any)).to.eventually.rejectedWith('custom err');

      expect(rateLimit.consume.args).to.eql([[req, res]]);
    });
  });
});
