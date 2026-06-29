/**
 * Sidebar navigation configuration.
 *
 * Each item declares which roles can see it via `roles`.
 * Omit `roles` to show the item to all roles (use sparingly — prefer explicit).
 *
 * Role matrix:
 *   super_admin    → system config: dashboard, reports, settings
 *   branch_manager → full branch access: all items
 *   operator       → day-to-day: jobs, customers, stock, invoices, claims, enquiry
 *   technician     → field work: jobs, customers only
 *
 * Keep in sync with src/utils/roleRouting.ts canRoleAccessPath.
 */
import type { UserRole } from '@/services/auth';
import { ROUTES } from './routes';

export interface NavItem {
  id:        string;
  label:     string;
  icon:      string;       // lucide-react icon name
  path:      string;
  badgeKey?: string;       // key into notification/count store
  section:   'main' | 'management';
  /**
   * Roles that can see and navigate to this item.
   * Undefined = visible to all roles. Prefer explicit role lists.
   */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [

  // ── Main ───────────────────────────────────────────────────────────────────
  {
    id:      'dashboard',
    label:   'Dashboard',
    icon:    'LayoutDashboard',
    path:    ROUTES.DASHBOARD,
    section: 'main',
    roles:   ['super_admin', 'branch_manager', 'operator'],
    // Technicians land directly on Jobs — Dashboard has no relevant data for them.
  },
  {
    id:       'vendors',
    label:    'Vendors',
    icon:     'Building2',
    path:     ROUTES.VENDORS,
    badgeKey: 'vendors',
    section:  'main',
    roles:    ['branch_manager'],
  },
  {
    id:       'products',
    label:    'Products',
    icon:     'Package',
    path:     ROUTES.PRODUCTS,
    badgeKey: 'products',
    section:  'main',
    roles:    ['branch_manager'],
  },
  {
    id:       'purchaseOrders',
    label:    'Purchase Orders',
    icon:     'ShoppingCart',
    path:     ROUTES.PURCHASE_ORDERS,
    badgeKey: 'purchaseOrders',
    section:  'main',
    roles:    ['branch_manager'],
  },
  {
    id:       'customers',
    label:    'Customers',
    icon:     'Users',
    path:     ROUTES.CUSTOMERS,
    badgeKey: 'customers',
    section:  'main',
    roles:    ['branch_manager', 'operator', 'technician'],
  },
  {
    id:       'technicians',
    label:    'Technicians',
    icon:     'HardHat',
    path:     ROUTES.TECHNICIANS,
    badgeKey: 'technicians',
    section:  'main',
    roles:    ['branch_manager'],
  },

  // ── Management ─────────────────────────────────────────────────────────────
  {
    id:       'jobs',
    label:    'Job Cards',
    icon:     'ClipboardList',
    path:     ROUTES.JOBS,
    badgeKey: 'jobs',
    section:  'management',
    roles:    ['branch_manager', 'operator', 'technician'],
    // TODO: technician should see only their assigned jobs — requires backend
    // filtering by assignee. Until then, all jobs are visible for technician too.
  },
  {
    id:      'stock',
    label:   'Stock Management',
    icon:    'Warehouse',
    path:    ROUTES.STOCK,
    section: 'management',
    roles:   ['branch_manager', 'operator'],
  },
  {
    id:       'invoices',
    label:    'Invoices',
    icon:     'FileText',
    path:     ROUTES.INVOICES,
    badgeKey: 'invoices',
    section:  'management',
    roles:    ['branch_manager', 'operator'],
  },
  {
    id:       'claims',
    label:    'Insurance Claims',
    icon:     'Shield',
    path:     ROUTES.CLAIMS,
    badgeKey: 'claims',
    section:  'management',
    roles:    ['branch_manager', 'operator'],
  },
  {
    id:      'enquiry',
    label:   'Enquiry',
    icon:    'MessageCircle',
    path:    ROUTES.ENQUIRY,
    section: 'management',
    roles:   ['branch_manager', 'operator'],
  },
  {
    id:      'reports',
    label:   'Reports',
    icon:    'BarChart2',
    path:    ROUTES.REPORTS,
    section: 'management',
    roles:   ['super_admin', 'branch_manager'],
  },
  {
    id:      'settings',
    label:   'Settings',
    icon:    'Settings',
    path:    ROUTES.SETTINGS,
    section: 'management',
    roles:   ['super_admin', 'branch_manager'],
    // TODO (super_admin): settings page needs a Users sub-section for account
    // management (create/deactivate staff). Branch-level settings for branch_manager.
  },
];
