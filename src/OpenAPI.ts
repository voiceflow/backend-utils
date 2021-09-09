import { TSchema } from '@sinclair/typebox';
import { OpenAPIV3, SchemaObject } from 'openapi-types';
import { RouteValidations } from '.';

declare module 'openapi-types' {
  interface SchemaObject {
    // TypeBox compatibility
    [key: string]: TSchema;
  }
}

const hasRef = <T extends object>(obj: T): obj is T & { $ref: string } => '$ref' in obj;
const hasID = <T extends object>(obj: T): obj is T & { $id: string } => '$id' in obj;

const SCHEMA_ID_PREFIX = '#/components/schemas/';

/**
 * Helper class to gradually add on to an OpenAPI v3 spec.
 * Aims to abstract away the annoying overhead of working with schemas.
 */
export class OpenAPI {
  public schemas: Map<string, SchemaObject> = new Map();

  /**
   * @param spec The OpenAPI specification to initialize this instance with
   */
  constructor(public spec: OpenAPIV3.Document) {}

  // Convenience property
  Methods = OpenAPIV3.HttpMethods;

  /**
   * Traverse `this.spec` and add `SCHEMA_ID_PREFIX` to the `$ref`s as needed, mutating `this.spec`.
   * This will allow them to actually be resolved as JSON pointers in the document.
   */
  prefixRefs() {
    // Avoid infinite looping while being nice to the garbage collector
    const seen = new WeakSet();

    const queue: object[] = [this.spec];

    for (const object of queue) {
      if (seen.has(object)) {
        return;
      }

      seen.add(object);

      if (hasRef(object) && this.schemas.has(object.$ref)) {
        // This is a reference and matches a schema we know about
        // This also excludes already prefixed schemas since we store their original IDs, not the prefixed ones

        // TODO: This mutates the original schema objects - a very slow but easy solution to this is to deepcopy `this.spec` when the queue is created
        object.$ref = `${SCHEMA_ID_PREFIX}${object.$ref}`;
      }

      const nextObjects = Object.values(object).filter((next): next is object => next && typeof next === 'object' && !seen.has(next));

      queue.push(...nextObjects);
    }

    // TODO: Delete this once the other method works
    // Very lazy way to do this, nested $refs will almost certainly break
    // Object.values(this.spec.paths).forEach((path) => {
    //   if (path?.$ref && !path.$ref.startsWith(prefix)) {
    //     path.$ref = `${prefix}${path.$ref}`;
    //   }
    // });
  }

  // TODO: this shouldn't return `any` - i do not know decorators very well
  addSchema(schema: SchemaObject): any {
    if (!hasID(schema)) {
      throw new RangeError('Schema must have an $id');
    }

    let { $id, ...rest } = schema;

    if (this.schemas.has($id)) {
      throw new RangeError(`Duplicate schema ID: ${$id}`);
    }

    this.schemas.set($id, schema);

    this.spec.components ??= {};
    this.spec.components.schemas ??= {};
    this.spec.components.schemas[$id] = rest;
  }

  // TODO: this shouldn't return `any` - i do not know decorators very well
  addPath(method: OpenAPIV3.HttpMethods, path: string, definition: OpenAPIV3.OperationObject): any {
    this.spec.paths[path] ??= {};

    if (method in this.spec.paths[path]!) {
      throw new RangeError(`Duplicate method: ${method} ${path}`);
    }

    this.spec.paths[path]![method] = definition;
  }

  pathParams(validation: Required<Pick<RouteValidations, 'PARAMS'>>): OpenAPIV3.ParameterObject[] {
    return Object.entries(validation.PARAMS.properties).map(([name, schema]) => ({
      in: 'path',
      name,
      schema: schema as any,
      examples: schema.examples,
      description: schema.description,
      required: true,
    }));
  }

  queryParams(validation: Required<Pick<RouteValidations, 'QUERY'>>): OpenAPIV3.ParameterObject[] {
    const isRequired = (name: string) => validation.QUERY.required?.includes(name) ?? false;

    return Object.entries(validation.QUERY.properties).map(([name, schema]) => ({
      in: 'query',
      name,
      schema: schema as any,
      examples: schema.examples,
      description: schema.description,
      required: isRequired(name),
    }));
  }

  headers(validation: Required<Pick<RouteValidations, 'HEADERS'>>): OpenAPIV3.ParameterObject[] {
    const isRequired = (name: string) => validation.HEADERS.required?.includes(name) ?? false;

    return Object.entries(validation.HEADERS.properties).map(([name, schema]) => ({
      in: 'header',
      name,
      schema: schema as any,
      examples: schema.examples,
      description: schema.description,
      required: isRequired(name),
    }));
  }

  body(validation: Required<Pick<RouteValidations, 'BODY'>>): OpenAPIV3.RequestBodyObject {
    const schema = validation.BODY;

    return {
      description: schema.description,
      required: schema.required,
      content: {
        'application/json': {
          schema: schema as any,
          examples: schema.examples,
        },
      },
    };
  }
}
