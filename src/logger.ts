import Logger from '@voiceflow/logger';

const options = ['local', 'test'].includes(process.env.NODE_ENV!) ? { level: 'info' as any, pretty: true } : {};

const log = new Logger(options);

export default log;
