'use strict';

/* eslint-disable no-unused-expressions */

const { expect } = require('chai');

const { FixtureGenerator } = require('../../lib');

describe('createFixture', () => {
  it('returns correct fixtures', async () => {
    // middleware factory
    const method2 = () => () => {};
    method2.callback = true;
    // middleware validations
    const method3 = () => {};
    method3.validations = {
      validation1: () => {},
      validation2: () => {},
    };

    const controllerMethod2 = () => {};
    controllerMethod2.validations = {
      validation1: () => {},
    };

    const serviceManager = {
      middlewares: {
        middleware1: {
          method1: () => {},
          method2,
          method3,
        },
      },
      controllers: {
        controller1: {
          method1: () => {},
          method2: controllerMethod2,
        },
      },
    };
    const generatedFixtures = await FixtureGenerator.createFixture(serviceManager);
    // console.log(generatedFixtures);
    expect(typeof generatedFixtures.start).to.eql('function');
    expect(typeof generatedFixtures.stop).to.eql('function');
    expect(generatedFixtures.services).to.eql({ socket: null });
    expect(typeof generatedFixtures.clients.io.bindEvents).to.eql('function');
    expect(typeof generatedFixtures.clients.socketio.attach).to.eql('function');
    // middlewares
    expect(Object.keys(generatedFixtures.middlewares.middleware1)).to.eql(['method1', 'method2', 'method3']);
    expect(generatedFixtures.middlewares.middleware1.method1[0].callCount).to.eql(0); // check that stub is generated
    expect(generatedFixtures.middlewares.middleware1.method2().callCount).to.eql(0); // check that stub factory is generated
    expect(generatedFixtures.middlewares.middleware1.method3.length).to.eql(3); // validations are added (2 validations + 1 middleware)
    const middlewareStub3 = generatedFixtures.middlewares.middleware1.method3[2];
    expect(middlewareStub3.validations.validation1.callCount).to.eql(0); // check that validation stub is generated
    expect(middlewareStub3.validations.validation2.callCount).to.eql(0); // check that validation stub is generated
    // controllers
    expect(Object.keys(generatedFixtures.controllers.controller1)).to.eql(['method1', 'method2']);
    expect(generatedFixtures.controllers.controller1.method1[0].callCount).to.eql(0); // check that stub is generated
    expect(generatedFixtures.controllers.controller1.method2[0].callCount).to.eql(0); // check that stub is generated
    expect(generatedFixtures.controllers.controller1.method2.length).to.eql(2); // validations are added (1 validations + 1 controller)
    // check that validation stub is generated
    expect(generatedFixtures.controllers.controller1.method2[1].validations.validation1.callCount).to.eql(0);
  });
});

describe('checkFixtures', () => {
  it('asserts correctly', async () => {
    // middleware factory
    const method2 = () => () => {};
    method2.callback = true;
    // middleware validations
    const method3 = () => {};
    method3.validations = {
      validation1: () => {},
      validation2: () => {},
    };

    const controllerMethod2 = () => {};
    controllerMethod2.validations = {
      validation1: () => {},
    };

    const serviceManager = {
      middlewares: {
        middleware1: {
          method1: () => {},
          method2,
          method3,
        },
      },
      controllers: {
        controller1: {
          method1: () => {},
          method2: controllerMethod2,
        },
      },
    };
    const generatedFixtures = await FixtureGenerator.createFixture(serviceManager);
    await generatedFixtures.middlewares.middleware1.method1[0](null, null, () => {}); // call middleware1.method1
    await generatedFixtures.middlewares.middleware1.method2()(null, null, () => {}); // call middleware1.method2
    await generatedFixtures.middlewares.middleware1.method3[0](null, null, () => {}); // call validation1 on middleware1.method3
    await generatedFixtures.controllers.controller1.method2[1](null, { json: (body) => body }, () => {}); // call controller1.method2
    await generatedFixtures.controllers.controller1.method2[0](null, null, () => {}); // call validation1 on controller1.method2

    // console.log('generatedFixtures', generatedFixtures.middlewares.middleware1.method1[0]);
    const expected = {
      middlewares: {
        middleware1: {
          method1: 1,
          method2: 1,
        },
      },
      controllers: {
        controller1: {
          method2: 1,
        },
      },
      validations: {
        middlewares: {
          middleware1: {
            method3: {
              validation1: 1,
            },
          },
        },
        controllers: {
          controller1: {
            method2: {
              validation1: 1,
            },
          },
        },
      },
    };

    await FixtureGenerator.checkFixture(generatedFixtures, expected);
  });
});
