export const ROLES = {
  SOLAR: 'Solar',
  USER: 'User',
  NHAXE: 'NhaXe',
  ADMIN: 'Admin',
  DRIVER: 'Driver',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
