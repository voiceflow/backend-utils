import Logger from '@voiceflow/logger';

// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
// TODO: REMOVE THIS BEFORE ACTUALLY RELEASING - The object in the else branch should be empty
const options = ['local', 'test'].includes(process.env.NODE_ENV!) ? { level: 'info' as any, pretty: true } : { pretty: true };

const log = new Logger(options);

export default log;
