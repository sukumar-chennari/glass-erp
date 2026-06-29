import type { ReactNode } from 'react';
import { useHasPermission } from '@/context/AuthContext';

interface RequirePermissionProps {
  /** Permission string to check, e.g. 'invoices:write'. */
  permission: string;
  /** What to render when the user lacks the permission. Defaults to null. */
  fallback?:  ReactNode;
  children:   ReactNode;
}

/**
 * Permission-based UI gate.
 *
 * Renders children when the current session has the given permission.
 * Renders fallback (default: nothing) otherwise.
 * Does NOT redirect — use RequireRole for route-level guards.
 *
 * Example:
 *   <RequirePermission permission="invoices:write">
 *     <Button onClick={handleCreate}>New Invoice</Button>
 *   </RequirePermission>
 *
 *   <RequirePermission permission="reports:read" fallback={<UpgradeBanner />}>
 *     <ReportsPage />
 *   </RequirePermission>
 */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const can = useHasPermission(permission);
  return can ? <>{children}</> : <>{fallback}</>;
}
