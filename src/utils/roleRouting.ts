/**
 * Role-based routing utilities.
 *
 * Single source of truth for:
 *   - Where each role lands after login
 *   - Which nav items each role can see
 *   - Whether a role is allowed to access a given path
 *
 * Keep in sync with nav.ts roles field.
 * Frontend guard only — backend must enforce permissions independently.
 */

import type { UserRole } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import { NAV_ITEMS } from '@/constants/nav';

/**
 * Default landing route after successful login/OTP for each role.
 *
 * Super Admin lands on /dashboard (head-office cross-branch view).
 * TODO (UX): Technician "My Jobs" filtered view (own assignments only)
 * once job filtering by assignee is available.
 */
export function getRoleDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':    return ROUTES.DASHBOARD;
    case 'branch_manager': return ROUTES.DASHBOARD;
    case 'operator':       return ROUTES.JOBS;
    case 'technician':     return ROUTES.JOBS;
  }
}

/**
 * Nav items the given role is allowed to see.
 * Items without a `roles` field are visible to all roles.
 */
export function getRoleNavItems(role: UserRole | undefined) {
  if (!role) return [];
  return NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

/**
 * True when the role has at least one nav item whose path `pathname` starts with.
 *
 * Used to redirect unauthorised direct-URL navigation back to the role's
 * default landing (e.g. a technician typing /vendors manually).
 *
 * NOTE: This is a convenience frontend guard. The backend API enforces
 * permissions independently and is the authoritative control.
 */
export function canRoleAccessPath(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  return getRoleNavItems(role).some((item) => pathname.startsWith(item.path));
}
