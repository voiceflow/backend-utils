/* eslint-disable no-param-reassign,@typescript-eslint/no-empty-function */
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'chai';
import { Request, Response } from 'express';
import _ from 'lodash';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon from 'sinon';

import { ServiceManager } from './types';

// eslint-disable-next-line @typescript-eslint/ban-types
export interface FixtureExpect<C extends {}, M extends {}> {
  controllers: { [key in keyof C]?: { [methodKey in keyof C[key]]?: number } };
  middlewares: { [key in keyof M]?: { [methodKey in keyof M[key]]?: number } };
  validations: {
    controllers: { [key in keyof C]?: { [methodKey in keyof C[key]]?: Record<string, number> } };
    middlewares: { [key in keyof M]?: { [methodKey in keyof M[key]]?: Record<string, number> } };
  };
}

const serviceFake = (_req: Request, res: Response) => res.json({ done: 'done' });

const createFixture = <T extends ServiceManager<any, any>>(serviceManager: T): T => {
  const { middlewares, controllers } = serviceManager;

  return ({
    start: () => {},
    stop: () => {},
    middlewares: _.mapValues(middlewares, (service) =>
      _.mapValues(service, (method) => {
        if (method.callback) {
          const callbackStub: sinon.SinonStubStatic & { callback?: boolean } = sinon.stub().returns(sinon.stub().callsArg(2));
          callbackStub.callback = true;
          return callbackStub;
        }

        const methodStub: sinon.SinonStubStatic & { validations?: Record<string, sinon.SinonStubStatic> } = sinon.stub().callsArg(2);
        methodStub.validations = _.mapValues(method.validations, () => sinon.stub().callsArg(2));

        return [...Object.values(methodStub.validations), methodStub];
      })
    ),
    controllers: Object.keys(controllers).reduce((result, key) => {
      const target = controllers[key];

      result[key] = Object.keys(target).reduce((_result, _key) => {
        const validations = _.mapValues(controllers[key][_key].validations, () => sinon.stub().callsArg(2));
        const controllerStub: any = sinon.stub().callsFake(serviceFake);
        controllerStub.validations = validations;
        _result[_key] = [...Object.values(validations), controllerStub];
        return _result;
      }, {} as Record<string, any>);

      return result;
    }, {} as Record<string, any>),
    clients: { io: { bindEvents: () => {} }, socketio: { attach: () => {} } },
    services: { socket: null },
  } as unknown) as T;
};

const checkFixture = <T extends ServiceManager<any, any>>(fixture: T, expected: FixtureExpect<T['controllers'], T['middlewares']>): void => {
  const { middlewares, controllers } = fixture;

  const validations = {
    middlewares: {} as Record<keyof T['middlewares'], any>,
    controllers: {} as Record<keyof T['controllers'], any>,
  };

  Object.keys(controllers).forEach((controller: keyof T['controllers']) => {
    if (!(controller in expected.controllers)) {
      expected.controllers[controller] = {};
    }

    Object.keys(controllers[controller]).forEach((method) => {
      const expressMiddlewares = controllers[controller][method];
      const controllerMethod = expressMiddlewares[expressMiddlewares.length - 1];

      if (controllerMethod.validations) {
        if (!validations.controllers[controller]) {
          validations.controllers[controller] = {};
        }

        validations.controllers[controller][method] = _.mapValues(controllerMethod.validations, (stub) => stub.callCount);
      }

      controllers[controller][method] = controllerMethod.callCount;

      if (!(method in expected.controllers[controller])) {
        (expected.controllers as any)[controller][method] = 0;
      }
    });
  });

  Object.keys(middlewares).forEach((service: keyof T['middlewares']) => {
    if (!(service in expected.middlewares)) {
      expected.middlewares[service] = {};
    }

    Object.keys(middlewares[service]).forEach((method) => {
      const expressMiddlewares = middlewares[service][method];
      // if no length -> callback middleware -> it's not an array
      const middlewareMethod = expressMiddlewares.length ? expressMiddlewares[expressMiddlewares.length - 1] : expressMiddlewares;

      if (middlewareMethod.validations) {
        if (!validations.middlewares[service]) {
          validations.middlewares[service] = {};
        }

        validations.middlewares[service][method] = _.mapValues(middlewareMethod.validations, (stub) => stub.callCount);
      }

      if (middlewareMethod.callback) {
        middlewares[service][method] = middlewareMethod().callCount;
      } else {
        middlewares[service][method] = middlewareMethod.callCount;
      }

      if (!(method in expected.middlewares[service])) {
        (expected.middlewares as any)[service][method] = 0;
      }
    });
  });

  // seed the expected object with zeros
  // middlewares or controllers
  (Object.keys(validations) as Array<'middlewares' | 'controllers'>).forEach((group) => {
    if (!(group in expected.validations)) {
      expected.validations[group] = {};
    }

    // class in a middleware or controller
    Object.keys(validations[group]).forEach((service) => {
      if (!(service in expected.validations[group])) {
        (expected.validations as any)[group][service] = {};
      }

      // method in a class
      Object.keys(validations[group][service]).forEach((method) => {
        if (!(method in (expected.validations as any)[group][service])) {
          (expected.validations as any)[group][service][method] = {};
        }

        // validation in a method
        Object.keys(validations[group][service][method]).forEach((validation) => {
          if (!(validation in (expected.validations as any)[group][service][method])) {
            (expected.validations as any)[group][service][method][validation] = 0;
          }
        });
      });
    });
  });

  expect(controllers).to.eql(expected.controllers);
  expect(middlewares).to.eql(expected.middlewares);
  expect(validations).to.eql(expected.validations);
};

export default {
  createFixture,
  checkFixture,
};
