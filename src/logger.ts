import { createLogger, LogFormat, Logger, LoggerOptions, LogLevel } from '@voiceflow/logger';

const options: LoggerOptions = ['local', 'test'].includes(process.env.NODE_ENV!)
  ? {
      level: LogLevel.INFO,
      format: LogFormat.INLINE,
    }
  : {
      level: LogLevel.WARN,
      format: LogFormat.JSON,
    };

const log: Logger = createLogger(options);

export default log;
