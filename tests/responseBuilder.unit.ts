'use strict';

/* eslint-disable no-unused-expressions */

const { expect } = require('chai');

const HttpStatus = require('http-status');
const sinon = require('sinon');
const VError = require('@voiceflow/verror');
const { ResponseBuilder } = require('../../lib');

describe('responseBuilder unit tests', () => {
  it('returns ok response', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = async () => ({ foo: 'bar' });

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 200,
      data: {
        foo: 'bar',
      },
      status: 'OK',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0]).to.eql(expected.data);
  });

  it('returns ok response with different code', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve) => resolve({ foo: 'bar' }));

    await responseBuilder.route(dataPromise, VError.HTTP_STATUS.NO_CONTENT)({ originalUrl: '/test' }, res);

    const expected = {
      code: 204,
      data: {
        foo: 'bar',
      },
      status: 'No Content',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0]).to.eql(expected.data);
  });

  it('returns ok response with no data', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve) => resolve());

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 200,
      status: 'OK',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0]).to.eql(expected.data);
  });

  it('returns bad response', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new VError('boom')));

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 500,
      status: 'Internal Server Error',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('returns bad response with overridden code', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new VError('boom')));

    await responseBuilder.route(dataPromise, undefined, VError.HTTP_STATUS.BAD_REQUEST)({ originalUrl: '/test' }, res);

    const expected = {
      code: 400,
      status: 'Bad Request',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('returns bad response when error is returned', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };

    await responseBuilder.route(new VError('boom'))({ originalUrl: '/test' }, res);

    const expected = {
      code: 500,
      status: 'Internal Server Error',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('returns bad response with Error', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new Error('boom')));

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 500,
      status: 'Internal Server Error',
      data: 'boom',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].data).to.eql(expected.data);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('returns bad response with code 503', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new VError('boom', HttpStatus.SERVICE_UNAVAILABLE)));

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 503,
      status: 'Service Unavailable',
      data: 'boom',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].data).to.eql(expected.data);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });

  it('returns bad response with data', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new VError('boom', undefined, { foo: 'bar' })));

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 500,
      status: 'Internal Server Error',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0]).to.eql({ foo: 'bar' });
  });

  it('returns bad response with data from message', async () => {
    const responseBuilder = new ResponseBuilder();
    const res = { status: sinon.stub().returns({ json: sinon.stub() }) };
    const dataPromise = new Promise((resolve, reject) => reject(new VError('boom')));

    await responseBuilder.route(dataPromise)({ originalUrl: '/test' }, res);

    const expected = {
      code: 500,
      status: 'Internal Server Error',
      data: 'boom',
    };

    expect(res.status.args[0][0]).to.eql(expected.code);

    expect(res.status().json.args[0][0].code).to.eql(expected.code);
    expect(res.status().json.args[0][0].data).to.eql(expected.data);
    expect(res.status().json.args[0][0].status).to.eql(expected.status);

    expect(res.status().json.args[0][0].dateTime).to.not.be.undefined;
    expect(res.status().json.args[0][0].timestamp).to.not.be.undefined;
  });
});
