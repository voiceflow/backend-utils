import VError from '@voiceflow/verror';
import type { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import * as ExpressValidator from 'express-validator';
import { HttpStatus } from 'http-status';
import { DateTime } from 'luxon';

import log from './logger';
import { ErrorResponse, RawRoute, Route } from './types';

class ResponseBuilder {
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
  private static errorResponse<T>(
    error: (Error & { data?: T }) | string,
    codeOverride?: HttpStatus,
    req?: Request & { user?: { id: number } }
  ): ErrorResponse<T> {
    if (error && (error as any).isAxiosError) {
      log.error(`@backend-utils:errorResponse - error:axios %o`, ResponseBuilder.getAxiosError(error as AxiosError));
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
        // eslint-disable-next-line sonarjs/no-nested-template-literals
        `500+ error: ${req?.originalUrl} ${req?.user ? ` User ID: ${req?.user.id}` : ''} ${error.stack} %o`,
        error.data
      );
    }

    return response;
  }

  validationResult = (req: Request, __: Response, next: NextFunction): void => {
    const errors = ExpressValidator.validationResult(req).array({ onlyFirstError: true });

    if (errors.length) {
      const errorMap = errors.reduce((errs, err) => Object.assign(errs, { [err.param]: { message: err.msg } }), {});
      throw new VError('validation', VError.HTTP_STATUS.BAD_REQUEST, { errors: errorMap });
    }

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
    if (dataPromise.validations && !dataPromise.validationsApplied) {
      dataPromise.validationsApplied = true;
      const expressMiddlewares: { validations?: any } & any[] = [
        ...(this.route(Object.values(dataPromise.validations) as any) as any),
        this.route(this.validationResult as any),
        this.route(dataPromise),
      ];
      expressMiddlewares.validations = dataPromise.validations;
      return expressMiddlewares as any;
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

      let output: ErrorResponse<unknown> | ReturnType<typeof ResponseBuilder['okResponse']>;

      try {
        const data = await (typeof dataPromise === 'function' ? (dataPromise as any)(req, res, nextCheck) : dataPromise);

        output =
          data instanceof Error
            ? ResponseBuilder.errorResponse(data, failureCodeOverride, req)
            : ResponseBuilder.okResponse(data, successCodeOverride);
      } catch (err) {
        output = ResponseBuilder.errorResponse(err, failureCodeOverride, req);
      }

      if (!res.headersSent) {
        if (nextCalled) {
          // TypeScript doesn't know that calling nextCheck will define nextCalled as a function
          (nextCalled as () => void)();
        } else {
          res.status(output.code as number).json(output.data);
        }
      }
    }) as any;
  }
  /* eslint-enable no-param-reassign */
}

export default ResponseBuilder;
