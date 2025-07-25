# Permission System Documentation

This document explains how to use the permission system in the Solar application.

## Overview

The permission system provides role-based access control (RBAC) for your API endpoints. It consists of:

1. **Role-based permissions** - Check if user has specific roles
2. **Action-based permissions** - Check if user can perform specific actions
3. **Resource-based permissions** - Check if user has access to specific resources

## Components

### 1. Role Constants

Located in `src/shared/constants/roles.constants.ts`:

```typescript
export const ROLES = {
  SOLAR: 'Solar',
  USER: 'User',
  NHAXE: 'NhaXe',
  ADMIN: 'Admin',
  DRIVER: 'Driver',
} as const;
```

### 2. Decorators

#### Simple Role Decorator

```typescript
import { RequireRole } from 'src/infrastructure/decorators/require-role.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@RequireRole(ROLES.ADMIN)
async adminOnlyMethod() {
  // Only admins can access this
}
```

#### Advanced Permission Decorators

```typescript
import {
  RequireRoles,
  RequireActions,
  RequireResources,
  RequirePermission
} from 'src/infrastructure/decorators/require-permission.decorator';

// Require specific roles
@RequireRoles(ROLES.ADMIN, ROLES.SOLAR)
async adminOrSolarMethod() {
  // Only admins or Solar users can access this
}

// Require specific actions
@RequireActions('create', 'write')
async createResource() {
  // Only users with create and write actions can access this
}

// Require access to specific resources
@RequireResources('sensitive-data', 'user-data')
async accessSensitiveData() {
  // Only users with access to these resources can access this
}

// Complex permission configuration
@RequirePermission({
  roles: [ROLES.ADMIN, ROLES.SOLAR],
  actions: ['update', 'write'],
  resources: ['user-data']
})
async complexPermissionMethod() {
  // Multiple permission checks
}
```

### 3. Guards

#### RoleGuard

Simple role-based access control:

```typescript
import { RoleGuard } from 'src/infrastructure/guards/role.guard';

@UseGuards(JwtAuthGuard, RoleGuard)
export class MyController {
  @RequireRole(ROLES.ADMIN)
  async adminMethod() {}
}
```

#### PermissionGuard

Advanced permission checking with multiple types:

```typescript
import { PermissionGuard } from 'src/infrastructure/guards/permission.guard';

@UseGuards(JwtAuthGuard, PermissionGuard)
export class MyController {
  @RequireRoles(ROLES.ADMIN, ROLES.SOLAR)
  @RequireActions('create')
  async createMethod() {}
}
```

## Usage Examples

### Basic Role Protection

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from 'src/infrastructure/guards/role.guard';
import { RequireRole } from 'src/infrastructure/decorators/require-role.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UserController {
  @Get('admin-only')
  @RequireRole(ROLES.ADMIN)
  async getAdminData() {
    return { message: 'Admin only data' };
  }

  @Get('solar-or-admin')
  @RequireRole(ROLES.ADMIN, ROLES.SOLAR)
  async getSolarData() {
    return { message: 'Solar or admin data' };
  }
}
```

### Advanced Permission Protection

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/infrastructure/guards/permission.guard';
import {
  RequireRoles,
  RequireActions,
} from 'src/infrastructure/decorators/require-permission.decorator';
import { ROLES } from 'src/shared/constants/roles.constants';

@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ResourceController {
  @Post()
  @RequireRoles(ROLES.ADMIN, ROLES.SOLAR)
  @RequireActions('create', 'write')
  async createResource(@Body() data: any) {
    return { message: 'Resource created', data };
  }

  @Delete(':id')
  @RequireRoles(ROLES.ADMIN)
  @RequireActions('delete')
  async deleteResource(@Param('id') id: string) {
    return { message: 'Resource deleted', id };
  }
}
```

## Role Hierarchy

The system supports the following roles with different permission levels:

1. **Solar** - Highest level access (system owner)
2. **Admin** - Administrative access
3. **NhaXe** - Bus company access
4. **Driver** - Driver access
5. **User** - Basic user access

## Database Schema

The permission system relies on the following database structure:

### Users Table

- `id` - User unique identifier
- `roleId` - Reference to the roles table
- Other user fields...

### Roles Table

- `id` - Role unique identifier
- `name` - Role name (e.g., 'Solar', 'Admin', 'NhaXe', 'Driver', 'User')
- Other role fields...

## Error Handling

When a user doesn't have the required permissions, the system throws a `ForbiddenException` with a descriptive message:

```typescript
// Example error message
"User with role 'User' is not authorized to access this resource. Required roles: Admin, Solar";
```

## Best Practices

1. **Use role constants**: Always use the predefined role constants instead of hardcoded strings
2. **Combine guards**: Use `JwtAuthGuard` with permission guards to ensure authentication
3. **Be specific**: Use the most restrictive permission that still allows legitimate access
4. **Test thoroughly**: Ensure all permission combinations work as expected
5. **Document permissions**: Clearly document what permissions are required for each endpoint

## Extending the System

### Adding New Roles

1. Add the role to `src/shared/constants/roles.constants.ts`
2. Create the role in the database
3. Assign the role to users as needed

### Adding Action-based Permissions

1. Extend the `checkUserActions` method in `PermissionGuard`
2. Implement your action checking logic
3. Use the `@RequireActions` decorator

### Adding Resource-based Permissions

1. Extend the `checkUserResources` method in `PermissionGuard`
2. Implement your resource checking logic
3. Use the `@RequireResources` decorator

## Testing

The permission system includes comprehensive tests. See the test files in the `tests/` directory for examples of how to test permission-based endpoints.
