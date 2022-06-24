export interface ExceptionFormat {
  statusCode: number;
  name: string;
  message: string;
  details?: Record<string, any>;
}

export type ExceptionFormatter<T> = (err: T) => Partial<ExceptionFormat>;
