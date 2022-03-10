export interface ExceptionFormat {
  statusCode: number;
  name: string;
  message: string;
}

export type ExceptionFormatter<T> = (err: T) => Partial<ExceptionFormat>;
