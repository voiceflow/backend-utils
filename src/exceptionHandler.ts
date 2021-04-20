'use strict';

import _ from 'lodash';
import VError from '@voiceflow/verror';

import log from '../logger';

/**
 * @class
 */
class ExceptionHandler {
  /**
   * @param {ResponseBuilder} responseBuilder
   */
  constructor(responseBuilder) {
    if (!_.isObject(responseBuilder)) {
      throw new VError('responseBuilder must be an object');
    }
    this.responseBuilder = responseBuilder;
  }

  /**
   * Express middleware for json body parser errors.
   * From here: {@link https://github.com/expressjs/body-parser/issues/122#issuecomment-328190379}
   * @param {Error|VError|object} err unhandled error
   * @param {Request} req express request
   * @param {Response} res express response
   * @param {Function} next
   * @return {Promise<void>}
   */
  async handleJsonParseError(err, req, res, next) {
    if (err.type && err.type === 'entity.parse.failed') {
      await this.responseBuilder.route(new VError('Could not parse JSON input', VError.HTTP_STATUS.BAD_REQUEST, err.body))(req, res);
      return null;
    }

    next(err);
    return null;
  }

  /**
   * Express middleware for catching unhandled errors and returning a 500
   * @param {Error|VError|object} err unhandled error
   * @param {Request} req express request
   * @param {Response} res express response
   * @param {Function} next
   * @return {Promise<void>}
   */
  async handleError(err, req, res, next) {
    // If the error object doesn't exist
    if (!err) return next();

    if (err.stack) {
      log.error(`Unhandled error: ${err.stack}`);
    } else {
      log.error(`Unhandled error without stack: ${JSON.stringify(err)}`);
    }

    await this.responseBuilder.route(new VError('Unhandled error occurred'))(req, res);
    return null;
  }

  /**
   * Express middleware for catching all unhandled requests and returning 404
   * @param {Request} req express request
   * @param {Response} res express response
   * @return {Promise<void>}
   */
  async handleNotFound(req, res) {
    const url = req.originalUrl;
    const { method } = req;

    await this.responseBuilder.route(new VError(`URL: ${url} with method: ${method} is not a valid path`, VError.HTTP_STATUS.NOT_FOUND))(req, res);
  }
}

module.exports = ExceptionHandler;
