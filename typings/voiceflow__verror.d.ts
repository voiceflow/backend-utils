declare module '@voiceflow/verror' {
  import HttpStatus from 'http-status';

  class VError extends Error {
    constructor(name: string, code?: number, data?: any);

    public static HTTP_STATUS: HttpStatus.HttpStatus;

    public name: string;

    public code: number;

    public data: any;

    public dateTime: Date;
  }

  export { HttpStatus as HTTP_STATUS };

  export default VError;
}
