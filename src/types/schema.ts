import { TSchema } from '@sinclair/typebox';

export type ValidationKinds = 'PARAMS' | 'BODY' | 'HEADERS' | 'QUERY' | 'RESPONSE_BODY';
export type RouteValidations = Partial<Record<ValidationKinds, TSchema>>;

export type ControllerValidations = Record<PropertyKey, RouteValidations>;
