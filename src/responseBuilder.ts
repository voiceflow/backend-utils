import VError from '@voiceflow/verror';
import addFormats from 'ajv-formats';
import Ajv from 'ajv/dist/2019';
import type { AxiosError } from 'axios';
import Promise from 'bluebird';
import { NextFunction, Request, Response } from 'express';
import * as ExpressValidator from 'express-validator';
import { HttpStatus } from 'http-status';
import { DateTime } from 'luxon';
import { OpenAPI } from './OpenAPI';
import log from './logger';
import { RouteValidations } from './types';
import { ErrorResponse, RawRoute, Route } from './types/backend';

class ResponseBuilder {
  ajv = addFormats(
    new Ajv({
      // To change data type, when possible, to match the type(s) in the schema. https://ajv.js.org/coercion.html
      coerceTypes: true,
      // Use the `default` property in fields as a default value (instead of just a comment) https://ajv.js.org/options.html#usedefaults
      useDefaults: true,
      verbose: true,
      keywords: [
        // From Typebox https://github.com/sinclairzx81/typebox#validation
        'kind',
        'modifier',
        // From us
        'error',
        'transform',
      ],
    }),
    [
      'date-time',
      'time',
      'date',
      'email',
      'hostname',
      'ipv4',
      'ipv6',
      'uri',
      'uri-reference',
      'uuid',
      'uri-template',
      'json-pointer',
      'relative-json-pointer',
      'regex',
    ]
  );

  public importSchemas(openAPI: OpenAPI) {
    const schemas = [...openAPI.schemas.values()];

    this.ajv.addSchema(schemas);
  }

  /**
   * Determine http code from error
   * @param error error object or something and inheirits from it
   * @return http code
   * @private
   */
  static getCodeFromError(error: Error): number {
    if (error instanceof VError) {
      return error.code;
    }

    log.warn(`Unexpected error type: '${error.name}' from '${error.stack}'`);

    return VError.HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  /**
   * Handle normal response
   * @param data data to be returned from the endpoint
   * @param codeOverride optionally override the default OK-200 code
   */
  private static okResponse<T>(data: T, codeOverride?: HttpStatus) {
    const dateTime = DateTime.utc();
    const code = codeOverride || VError.HTTP_STATUS.OK;
    const response = {
      code,
      status: VError.HTTP_STATUS[(code as unknown) as keyof typeof VError.HTTP_STATUS],
      dateTime: dateTime.toISO(),
      timestamp: dateTime.valueOf(),
      data: undefined as T | undefined,
    };

    if (data) {
      response.data = data;
    }

    return response;
  }

  /**
   * Return error object with only necessary props according to axios docs https://github.com/axios/axios#handling-errors
   * @param axiosError axios error object
   */
  private static getAxiosError(axiosError: AxiosError) {
    const errorInfo = {
      config: axiosError.config,
    };

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        ...errorInfo,
        data: axiosError.response.data,
        status: axiosError.response.status,
        headers: axiosError.response.headers,
      };
    }
    if (axiosError.request) {
      // The request was made but no response was received
      // `error.request` is an instance of http.ClientRequest in node.js
      return {
        ...errorInfo,
        request: axiosError.request,
      };
    }

    // Something happened in setting up the request that triggered an Error
    return {
      ...errorInfo,
      message: axiosError.message,
    };
  }

  /**
   * Handle error response
   * @param error error object or something and inheirits from it
   * @param codeOverride optionally override the code specified in the error
   * @param req request object
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private static errorResponse<T>(
    error: (Error & { data?: T }) | string,
    codeOverride?: HttpStatus,
    req?: Request & { user?: { id: number } }
  ): ErrorResponse<T> {
    if (error && (error as any).isAxiosError) {
      log.error(`@backend-utils:errorResponse - error:axios:${JSON.stringify(ResponseBuilder.getAxiosError(error as AxiosError))}`);
    }

    if (!(error instanceof Error)) {
      // TODO: why are we checking `instanceof String` here?
      if (typeof error === 'string' || (error as any) instanceof String) {
        return ResponseBuilder.errorResponse(new VError(error), codeOverride);
      }

      return ResponseBuilder.errorResponse(new VError('Unexpected error'), codeOverride);
    }

    const dateTime = DateTime.utc();
    const code = (codeOverride == null ? null : Number(codeOverride)) ?? ResponseBuilder.getCodeFromError(error);

    const response: ErrorResponse<T> = {
      data: error.data || {
        code,
        status: VError.HTTP_STATUS[(code as unknown) as keyof typeof VError.HTTP_STATUS] as string,
        dateTime: dateTime.toISO(),
        timestamp: dateTime.valueOf(),
      },
      code,
    };

    if (error.message && !error.data) {
      (response.data as any).data = error.message;
    }

    if (response.code >= 500) {
      log.error(
        `500+ error: ${req?.originalUrl} ${req?.user ? ` User ID: ${req?.user.id}` : ''} ${error.stack} ${
          error.data ? JSON.stringify(error.data) : ''
        }`
      );
    }

    return response;
  }

  /** @deprecated You should migrate to the new JSON schema & OpenAPI validation system.  */
  legacyValidation = (req: Request, __: Response, next: NextFunction): void => {
    const errors = ExpressValidator.validationResult(req).array({ onlyFirstError: true });

    if (errors.length) {
      const errorMap = errors.reduce((errs, err) => Object.assign(errs, { [err.param]: { message: err.msg } }), {});
      throw new VError('validation', VError.HTTP_STATUS.BAD_REQUEST, { errors: errorMap });
    }

    return next();
  };

  validation = (validations: RouteValidations) => (req: Request, __: Response, next: NextFunction): void => {
    Object.entries(validations).forEach(([_kind, schema]) => {
      const kind = _kind as keyof typeof validations;

      let data: unknown;
      let dataVar: string;

      switch (kind) {
        case 'RESPONSE_BODY':
          return next();
        case 'BODY':
          data = req.body;
          dataVar = 'body';
          break;
        case 'QUERY':
          data = req.query;
          dataVar = 'query';
          break;
        case 'HEADERS':
          data = req.headers;
          dataVar = 'headers';
          break;
        case 'PARAMS':
          data = req.params;
          dataVar = 'params';
          break;
        default:
          throw new RangeError(`Unknown kind: ${kind}`);
      }

      if ('transform' in schema) {
        try {
          schema.transform(data);
        } catch {
          // Ignore errors during transform
          // Usually if the transform function is erroring it's because someone is sending very invalid data
        }
      }

      const valid = this.ajv.validate(schema!, data);

      if (!valid) {
        throw new VError('validation', VError.HTTP_STATUS.BAD_REQUEST, { errors: this.ajv.errorsText(undefined, { dataVar: dataVar! }) });
      }
    });

    return next();
  };

  /**
   * Use express response object to respond with data or error
   * @param dataPromise promise that will resolve into a respnse or reject with an error
   */
  /* eslint-disable no-param-reassign */
  // TODO: split this into multiple functions, it has a very confusing pattern right now
  // eslint-disable-next-line sonarjs/cognitive-complexity
  route(dataPromise: RawRoute, successCodeOverride?: HttpStatus, failureCodeOverride?: HttpStatus): Route {
    if (!dataPromise.validationsApplied) {
      if (dataPromise.validations) {
        // New validation system

        dataPromise.validationsApplied = true;

        const expressMiddlewares: Array<(...params: any[]) => any> = [
          this.route(this.validation(dataPromise.validations) as any),
          this.route(dataPromise),
        ];

        return expressMiddlewares as any;
      }

      if (dataPromise.expressValidatorValidations) {
        // Legacy validation system

        dataPromise.validationsApplied = true;

        const expressMiddlewares: { validations?: any } & any[] = [
          ...(this.route(Object.values(dataPromise.expressValidatorValidations) as any) as any),
          this.route(this.legacyValidation as any),
          this.route(dataPromise),
        ];

        expressMiddlewares.validations = dataPromise.expressValidatorValidations;

        return expressMiddlewares as any;
      }
    }

    if (dataPromise.callback) {
      const callbackFunction: Route = (...args: any[]) => this.route((dataPromise as any)(...args));
      callbackFunction.callback = true;
      return callbackFunction;
    }

    if (Array.isArray(dataPromise)) {
      return dataPromise.map((route) => this.route(route, successCodeOverride, failureCodeOverride)) as any;
    }

    dataPromise.route = true;

    return (async (req: Request, res: Response, next: NextFunction) => {
      if (successCodeOverride && !Object.values(VError.HTTP_STATUS).includes(successCodeOverride)) {
        log.error('successCodeOverride must be a valid HTTP code, ignoring');
        successCodeOverride = undefined;
      }

      if (failureCodeOverride && !Object.values(VError.HTTP_STATUS).includes(failureCodeOverride)) {
        log.error('failureCodeOverride must be a valid HTTP code, ignoring');
        failureCodeOverride = undefined;
      }

      let nextCalled: (() => void) | null = null;
      const nextCheck: NextFunction = (route: any) => {
        nextCalled = () => next(route);
      };

      await Promise.try(() => (typeof dataPromise === 'function' ? (dataPromise as any)(req, res, nextCheck) : dataPromise))
        .then((data) => {
          if (data instanceof Error) {
            return ResponseBuilder.errorResponse(data, failureCodeOverride, req);
          }

          return ResponseBuilder.okResponse(data, successCodeOverride);
        })
        .catch((err) => ResponseBuilder.errorResponse(err, failureCodeOverride, req))
        .then((output) => {
          if (res.headersSent) {
            return;
          }

          // eslint-disable-next-line promise/always-return
          if (nextCalled) {
            nextCalled();
            return;
          }
          res.status(output.code as number).json(output.data);
        });
    }) as any;
  }
  /* eslint-enable no-param-reassign */
}

export default ResponseBuilder;
