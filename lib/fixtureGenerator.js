'use strict';

const serviceFake = (req, res) => res.json({ done: 'done' });

const { expect } = require('chai');
const sinon = require('sinon');

const _ = require('lodash');

const createFixture = async (serviceManager) => {
  const { middlewares, controllers } = serviceManager;

  return {
    start: () => {},
    stop: () => {},
    middlewares: _.mapValues(middlewares, (service) =>
      _.mapValues(service, (method) => {
        if (method.callback) {
          const callbackStub = sinon.stub().returns(sinon.stub().callsArg(2));
          callbackStub.callback = true;
          return callbackStub;
        }

        const methodStub = sinon.stub().callsArg(2);
        methodStub.validations = _.mapValues(method.validations, () => sinon.stub().callsArg(2));

        return [...Object.values(methodStub.validations), methodStub];
      })
    ),
    controllers: Object.keys(controllers).reduce((result, key) => {
      const target = controllers[key];

      result[key] = Object.keys(target).reduce((_result, _key) => {
        const validations = _.mapValues(controllers[key][_key].validations, () => sinon.stub().callsArg(2));
        const controllerStub = sinon.stub().callsFake(serviceFake);
        controllerStub.validations = validations;
        _result[_key] = [...Object.values(validations), controllerStub];
        return _result;
      }, {});

      return result;
    }, {}),
    clients: { io: { bindEvents: () => {} }, socketio: { attach: () => {} } },
    services: { socket: null },
  };
};

const checkFixture = (fixture, expected) => {
  const { middlewares, controllers } = fixture;

  const validations = { middlewares: {}, controllers: {} };

  Object.keys(controllers).forEach((controller) => {
    if (!(controller in expected.controllers)) expected.controllers[controller] = {};
    Object.keys(controllers[controller]).forEach((method) => {
      const expressMiddlewares = controllers[controller][method];
      const controllerMethod = expressMiddlewares[expressMiddlewares.length - 1];

      if (controllerMethod.validations) {
        if (!validations.controllers[controller]) validations.controllers[controller] = {};

        validations.controllers[controller][method] = _.mapValues(controllerMethod.validations, (stub) => stub.callCount);
      }

      controllers[controller][method] = controllerMethod.callCount;
      if (!(method in expected.controllers[controller])) expected.controllers[controller][method] = 0;
    });
  });

  Object.keys(middlewares).forEach((service) => {
    if (!(service in expected.middlewares)) expected.middlewares[service] = {};
    Object.keys(middlewares[service]).forEach((method) => {
      const expressMiddlewares = middlewares[service][method];
      // if no length -> callback middleware -> it's not an array
      const middlewareMethod = expressMiddlewares.length ? expressMiddlewares[expressMiddlewares.length - 1] : expressMiddlewares;

      if (middlewareMethod.validations) {
        if (!validations.middlewares[service]) validations.middlewares[service] = {};

        validations.middlewares[service][method] = _.mapValues(middlewareMethod.validations, (stub) => stub.callCount);
      }

      if (middlewareMethod.callback) {
        middlewares[service][method] = middlewareMethod().callCount;
      } else {
        middlewares[service][method] = middlewareMethod.callCount;
      }
      if (!(method in expected.middlewares[service])) expected.middlewares[service][method] = 0;
    });
  });

  // seed the expected object with zeros
  // middlewares or controllers
  Object.keys(validations).forEach((group) => {
    if (!(group in expected.validations)) expected.validations[group] = {};
    // class in a middleware or controller
    Object.keys(validations[group]).forEach((service) => {
      if (!(service in expected.validations[group])) expected.validations[group][service] = {};
      // method in a class
      Object.keys(validations[group][service]).forEach((method) => {
        if (!(method in expected.validations[group][service])) expected.validations[group][service][method] = {};
        // validation in a method
        Object.keys(validations[group][service][method]).forEach((validation) => {
          if (!(validation in expected.validations[group][service][method])) expected.validations[group][service][method][validation] = 0;
        });
      });
    });
  });

  expect(controllers).to.deep.eql(expected.controllers);
  expect(middlewares).to.deep.eql(expected.middlewares);
  expect(validations).to.deep.eql(expected.validations);
};

module.exports = {
  createFixture,
  checkFixture,
};
