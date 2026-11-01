import { RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { OpenAPIObject } from '@nestjs/swagger';
import { ROLES_KEY } from '../modules/auth/roles.decorator';

const requestMethods: Record<number, string> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.OPTIONS]: 'options',
  [RequestMethod.HEAD]: 'head',
};

/** Adds role decorator metadata to OpenAPI descriptions without changing runtime authorization. */
export function addRoleAccessDescriptions(
  document: OpenAPIObject,
  controllerTypes: Type<unknown>[],
) {
  let documentedOperations = 0;
  for (const controllerType of controllerTypes) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerType) as string | undefined;
    if (!controllerPath) continue;
    const prototype = controllerType.prototype as Record<string, unknown>;
    const classRoles = Reflect.getMetadata(ROLES_KEY, controllerType) as string[] | undefined;
    for (const name of Object.getOwnPropertyNames(prototype)) {
      const handler = prototype[name];
      if (typeof handler !== 'function') continue;
      const routePath = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;
      const method = requestMethod === undefined ? undefined : requestMethods[requestMethod];
      if (routePath === undefined || !method) continue;
      const path = `/api/${[controllerPath, routePath]
        .flatMap((part) => part.split('/'))
        .filter(Boolean)
        .join('/')}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const pathItem = document.paths[path];
      if (!pathItem) continue;
      const operation = Reflect.get(pathItem, method) as { description?: string } | undefined;
      if (!operation) continue;
      const roles = (Reflect.getMetadata(ROLES_KEY, handler) as string[] | undefined) ?? classRoles;
      if (!roles?.length) continue;
      const access = `Access: authenticated Bearer token; allowed role${roles.length === 1 ? '' : 's'}: ${roles.join(', ')}.`;
      if (!operation.description?.includes(access)) {
        operation.description = [operation.description, access].filter(Boolean).join('\n\n');
      }
      documentedOperations += 1;
    }
  }
  return documentedOperations;
}
