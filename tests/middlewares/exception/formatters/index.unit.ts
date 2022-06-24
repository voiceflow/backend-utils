import VError from '@voiceflow/verror';
import { expect } from 'chai';
import { GaxiosError, GaxiosOptions, GaxiosResponse } from 'gaxios';
import { BadGateway } from 'http-errors';

import { formatError } from '../../../../src/middlewares/exception/formatters';

describe('ExceptionMiddleware', () => {
  describe('formatError', () => {
    it('formats VError', () => {
      expect(formatError(new VError('Some error', 400))).to.eql({
        statusCode: 400,
        message: 'Some error',
        name: 'verror',
      });
    });

    it('formats GaxiosError', () => {
      const config: GaxiosOptions = {};
      const response: GaxiosResponse = {
        status: 404,
        statusText: 'Not Found',
        data: {},
        headers: {},
        request: {} as any,
        config,
      };
      const err = new GaxiosError('Some error', config, response);

      const result = formatError(err);

      expect(result).to.eql({
        statusCode: 404,
        message: 'Some error',
        name: 'GaxiosError',
        details: {
          code: '404',
          statusText: 'Not Found',
        },
      });
    });

    it('formats SyntaxError', () => {
      const err: unknown = (() => {
        try {
          JSON.parse('{bad');
          return undefined;
        } catch (err) {
          return err;
        }
      })();

      expect(formatError(err)).to.eql({
        statusCode: 500,
        message: 'Unexpected token b in JSON at position 1',
        name: 'SyntaxError',
      });
    });

    it('formats HttpError', () => {
      expect(formatError(new BadGateway('Not great'))).to.eql({
        statusCode: 502,
        message: 'Not great',
        name: 'BadGatewayError',
      });
    });

    it('formats Error', () => {
      expect(formatError(new Error('Some message'))).to.eql({
        statusCode: 500,
        message: 'Some message',
        name: 'Error',
      });
    });

    it('formats unknown', () => {
      expect(formatError('what')).to.eql({
        statusCode: 500,
        message: 'Unknown error',
        name: 'UnknownError',
      });
    });
  });
});
