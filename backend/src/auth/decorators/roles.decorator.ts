import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Attaches a `roles` metadata entry to a route handler, e.g. @Roles(Role.ADMIN).
// RolesGuard reads this back via Reflector to decide whether to allow the request.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
