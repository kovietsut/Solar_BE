import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionConfig {
  roles?: string[];
  actions?: string[];
  resources?: string[];
}

export const RequirePermission = (config: PermissionConfig) =>
  SetMetadata(PERMISSIONS_KEY, config);

export const RequireRoles = (...roles: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { roles });

export const RequireActions = (...actions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { actions });

export const RequireResources = (...resources: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { resources });
