import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PermissionConfig,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionConfig = this.reflector.getAllAndOverride<PermissionConfig>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionConfig) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!user.role) {
      throw new ForbiddenException('User has no role assigned');
    }

    // Check role-based permissions
    if (permissionConfig.roles && permissionConfig.roles.length > 0) {
      const hasRequiredRole = permissionConfig.roles.includes(user.role.name);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `User with role '${user.role.name}' is not authorized to access this resource. Required roles: ${permissionConfig.roles.join(', ')}`,
        );
      }
    }

    // Check action-based permissions (if implemented)
    if (permissionConfig.actions && permissionConfig.actions.length > 0) {
      const hasRequiredAction = this.checkUserActions(
        user,
        permissionConfig.actions,
      );
      if (!hasRequiredAction) {
        throw new ForbiddenException(
          `User does not have required actions. Required actions: ${permissionConfig.actions.join(', ')}`,
        );
      }
    }

    // Check resource-based permissions (if implemented)
    if (permissionConfig.resources && permissionConfig.resources.length > 0) {
      const hasRequiredResource = this.checkUserResources(
        user,
        permissionConfig.resources,
      );
      if (!hasRequiredResource) {
        throw new ForbiddenException(
          `User does not have access to required resources. Required resources: ${permissionConfig.resources.join(', ')}`,
        );
      }
    }

    return true;
  }

  private checkUserActions(user: any, requiredActions: string[]): boolean {
    // This is a placeholder for action-based permission checking
    // You can implement this based on your permission system
    // For now, we'll assume all actions are allowed for admin and SOLAR roles
    if (user.role.name === 'Admin' || user.role.name === 'Solar') {
      return true;
    }

    // Add your action-based permission logic here
    // Example: check if user has specific permissions in their role
    // For demonstration, we'll check if the required actions array is not empty
    console.log(`Checking actions: ${requiredActions.join(', ')}`);
    return false;
  }

  private checkUserResources(user: any, requiredResources: string[]): boolean {
    // This is a placeholder for resource-based permission checking
    // You can implement this based on your permission system
    // For now, we'll assume all resources are accessible for admin and SOLAR roles
    if (user.role.name === 'Admin' || user.role.name === 'Solar') {
      return true;
    }

    // Add your resource-based permission logic here
    // Example: check if user has access to specific resources
    // For demonstration, we'll check if the required resources array is not empty
    console.log(`Checking resources: ${requiredResources.join(', ')}`);
    return false;
  }
}
