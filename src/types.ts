/* eslint-disable @typescript-eslint/ban-types, max-classes-per-file */
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

export interface ServiceManager<M = {}, C = {}> {
  middlewares: M;
  controllers: C;
}

export abstract class AbstractMiddleware<S extends Record<string, any>, C extends Record<string, any>> {
  constructor(public services: S, public config: C) {}
}

export abstract class AbstractManager<S extends Record<string, any>, C extends Record<string, any>> {
  constructor(public services: S, public config: C) {}
}

export interface RateLimitConfig {
  RATE_LIMITER_POINTS_PUBLIC: number;
  RATE_LIMITER_DURATION_PUBLIC: number;
  RATE_LIMITER_POINTS_PRIVATE: number;
  RATE_LIMITER_DURATION_PRIVATE: number;
}
