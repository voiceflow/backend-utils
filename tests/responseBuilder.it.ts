import { expect } from 'chai';
import express from 'express';
import sinon from 'sinon';
import request from 'supertest';

import { ResponseBuilder } from '../src';

const responseBuilder = new ResponseBuilder();

describe('responseBuilder integration tests', () => {
  it('middleware calls next', async () => {
    const app = express();

    const middleware = sinon.stub().callsArg(2);
    const controller = sinon.stub().returns({ done: 'foo' });

    app.get('/', responseBuilder.route(middleware), responseBuilder.route(controller));

    await request(app).get('/').expect('Content-Type', /json/).expect(200, { done: 'foo' });

    expect(middleware.callCount).to.eql(1);
    expect(controller.callCount).to.eql(1);
  });

  it('controller not called if middleware responds', async () => {
    const app = express();

    const middleware = sinon.stub().callsFake((req, res) => {
      res.json({ done: 'early' });
    });
    const controller = sinon.stub().returns({ done: 'foo' });

    app.get('/', responseBuilder.route(middleware), responseBuilder.route(controller));

    await request(app).get('/').expect('Content-Type', /json/).expect(200, { done: 'early' });

    expect(middleware.callCount).to.eql(1);
    expect(controller.callCount).to.eql(0);
  });

  it('responseBuilder not responding if controller does', async () => {
    const app = express();

    const middleware = sinon.stub().callsArg(2);
    const controller = sinon.stub().callsFake((req, res) => {
      res.send('foooo');
    });

    app.get('/', responseBuilder.route(middleware), responseBuilder.route(controller));

    await request(app).get('/').expect('Content-Type', /text/).expect(200, 'foooo');

    expect(middleware.callCount).to.eql(1);
    expect(controller.callCount).to.eql(1);
  });
});
