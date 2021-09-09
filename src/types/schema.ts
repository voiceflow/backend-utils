import { Static, TObject, TProperties, TSchema } from '@sinclair/typebox';

export type RouteValidations<> = Partial<{
  PARAMS: TObject<TProperties>;
  BODY: TSchema;
  HEADERS: TObject<TProperties>;
  QUERY: TObject<TProperties>;
  RESPONSE_BODY: { [statusCode: number]: TSchema };
}>;

export type ControllerValidations = Record<string, RouteValidations>;

type GetByKey<T extends RouteValidations, K extends keyof T> = Static<T[K]> extends never ? {} : Static<T[K]>;

export type GetParams<T extends RouteValidations> = GetByKey<T, 'PARAMS'>;

export type GetResponseBody<T extends RouteValidations> = Static<T['RESPONSE_BODY'][keyof T['RESPONSE_BODY']]> extends never
  ? {}
  : Static<T['RESPONSE_BODY'][keyof T['RESPONSE_BODY']]>;

export type GetBody<T extends RouteValidations> = GetByKey<T, 'BODY'>;

export type GetQuery<T extends RouteValidations> = GetByKey<T, 'QUERY'>;

/** If this isn't compiling you probably don't have lowercase headers. */
export type GetHeaders<T extends RouteValidations> =
  // If key is string
  keyof GetByKey<T, 'HEADERS'> extends string
    ? // If key is lowercase
      keyof GetByKey<T, 'HEADERS'> extends Lowercase<keyof GetByKey<T, 'HEADERS'>>
      ? // Return headers as a Partial for express compatibility
        Partial<GetByKey<T, 'HEADERS'>>
      : // Key is not lowercase, throw an error
        never
    : // Key is not a string, throw an error
      never;
