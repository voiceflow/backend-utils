import { NextFunction, Request, Response } from 'express';
import { ValidationChain } from 'express-validator';

export type AsyncMiddleware = (request: Request, response: Response, next: NextFunction) => Promise<void>;
export type Route = {
  (...args: any[]): Route | Route[] | AsyncMiddleware;

  callback?: boolean;
};

export type RawRoute = AsyncMiddleware & {
  callback?: boolean;
  route?: boolean;
  validations?: Record<string, ValidationChain>;
  validationsApplied?: boolean;
};

export interface ErrorResponse<T> {
  data: T | { code: number; status: string; dateTime: string; timestamp: number };
  code: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ServiceManager<M = {}, C = {}> {
  middlewares: M;
  controllers: C;
}

export abstract class AbstractMiddleware<S extends Record<string, any>, C extends Record<string, any>> {
  constructor(public services: S, public config: C) {}
}
