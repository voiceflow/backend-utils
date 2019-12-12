'use strict';

const Logger = require('@voiceflow/logger');

// eslint-disable-next-line no-process-env
const options = ['local', 'test'].includes(process.env.NODE_ENV) ? { level: 'info', stackTrace: true, pretty: true } : {};

const log = new Logger(options);

module.exports = log;
