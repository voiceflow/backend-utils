import { createLogger, LogFormat, LogLevel } from '@voiceflow/logger';

const log = createLogger({
  format: LogFormat.INLINE,
  level: (process.env.LOG_LEVEL as LogLevel) ?? LogLevel.INFO,
});

export default log;
