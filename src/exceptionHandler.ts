import VError from '@voiceflow/verror';
import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

import log from './logger';
import ResponseBuilder from './responseBuilder';

/**
 * @class
 */
class ExceptionHandler {
  /**
   * @param {ResponseBuilder} responseBuilder
   */
  constructor(public responseBuilder: ResponseBuilder) {
    if (!_.isObject(responseBuilder)) {
      throw new VError('responseBuilder must be an object');
    }
  }

  /**
   * Express middleware for json body parser errors.
   * From here: {@link https://github.com/expressjs/body-parser/issues/122#issuecomment-328190379}
   * @param err unhandled error
   * @param req express request
   * @param res express response
   * @param next
   */
  async handleJsonParseError(err: (Error | VError) & { type?: string; body?: any }, req: Request, res: Response, next: NextFunction): Promise<null> {
    if (err.type && err.type === 'entity.parse.failed') {
      await this.responseBuilder.route(new VError('Could not parse JSON input', VError.HTTP_STATUS.BAD_REQUEST, err.body) as any)(req, res);
      return null;
    }

    next(err);
    return null;
  }

  /**
   * Express middleware for catching unhandled errors and returning a 500
   * @param err unhandled error
   * @param req express request
   * @param res express response
   * @param next
   */
  async handleError(err: Error | VError, req: Request, res: Response, next: NextFunction): Promise<null | void> {
    // If the error object doesn't exist
    if (!err) return next();

    if (err.stack) {
      log.error(`Unhandled error: ${err.stack}`);
    } else {
      log.error(`Unhandled error without stack: ${JSON.stringify(err)}`);
    }

    await this.responseBuilder.route(new VError('Unhandled error occurred') as any)(req, res);
    return null;
  }

  /**
   * Express middleware for catching all unhandled requests and returning 404
   * @param req express request
   * @param res express response
   */
  async handleNotFound(req: Request, res: Response): Promise<void> {
    const url = req.originalUrl;
    const { method } = req;

    await this.responseBuilder.route(new VError(`URL: ${url} with method: ${method} is not a valid path`, VError.HTTP_STATUS.NOT_FOUND) as any)(
      req,
      res
    );
  }
}

export default ExceptionHandler;
