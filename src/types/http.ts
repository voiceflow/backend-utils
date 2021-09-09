import { GetBody, GetHeaders, GetParams, GetQuery, GetResponseBody, RouteValidations } from './schema';
import express from 'express';

export type Request<T extends RouteValidations = {}> = express.Request<GetParams<T>, GetResponseBody<T>, GetBody<T>, GetQuery<T>> & {
  headers: GetHeaders<T>;
};

export type Response<T extends RouteValidations = {}> = express.Response<GetResponseBody<T>>;

export type ReturnValue<T extends RouteValidations = {}> = Promise<GetResponseBody<T>>;

export type Next = express.NextFunction;

export type Middleware<T extends RouteValidations = {}> = (req: Request<T>, res: Response<T>, next: Next) => Promise<void>;
