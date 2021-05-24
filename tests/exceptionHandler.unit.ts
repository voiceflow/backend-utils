/* eslint-disable no-unused-expressions */

import VError from '@voiceflow/verror';
import { expect } from 'chai';
import { Request } from 'express';
import sinon from 'sinon';

import { ExceptionHandler, ResponseBuilder } from '../src';

describe('exceptionHandler unit tests', () => {
  it('handles 404', async () => {
    const exceptionHandler = new ExceptionHandler(new ResponseBuilder());

    const req = {
      originalUrl: 'http://google.com',
      method: 'POST',
    } as Request;
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };

    await exceptionHandler.handleNotFound(req, res);

    expect(res.status.args[0][0]).to.eql(VError.HTTP_STATUS.NOT_FOUND);
    expect(res.status().json.args[0][0].code).to.eql(VError.HTTP_STATUS.NOT_FOUND);
    expect(res.status().json.args[0][0].data).to.eql('URL: http://google.com with method: POST is not a valid path');
    expect(res.status().json.args[0][0].status).to.eql('Not Found');

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('handles 500', async () => {
    const exceptionHandler = new ExceptionHandler(new ResponseBuilder());

    const error = new VError('boom');
    const req = {} as Request;
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const next = sinon.stub();

    await exceptionHandler.handleError(error, req, res, next);

    expect(res.status.args[0][0]).to.eql(VError.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.status().json.args[0][0].code).to.eql(VError.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.status().json.args[0][0].data).to.eql('Unhandled error occurred');
    expect(res.status().json.args[0][0].status).to.eql('Internal Server Error');

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });
});
