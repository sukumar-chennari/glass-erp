/**
 * Sidebar navigation configuration.
 * Adding/reordering nav items requires changes here only.
 */
import { ROUTES } from './routes';

export interface NavItem {
  id: string;
  label: string;
  icon: string;       // lucide-react icon name
  path: string;
  badgeKey?: string;  // key into notification/count store
  section: 'main' | 'management';
}

export const NAV_ITEMS: NavItem[] = [
  // ── Main ───────────────────────────────────────────────────────────
  {
    id:      'dashboard',
    label:   'Dashboard',
    icon:    'LayoutDashboard',
    path:    ROUTES.DASHBOARD,
    section: 'main',
  },
  {
    id:       'vendors',
    label:    'Vendors',
    icon:     'Building2',
    path:     ROUTES.VENDORS,
    badgeKey: 'vendors',
    section:  'main',
  },
  {
    id:       'products',
    label:    'Products',
    icon:     'Package',
    path:     ROUTES.PRODUCTS,
    badgeKey: 'products',
    section:  'main',
  },
  {
    id:       'purchaseOrders',
    label:    'Purchase Orders',
    icon:     'ShoppingCart',
    path:     ROUTES.PURCHASE_ORDERS,
    badgeKey: 'purchaseOrders',
    section:  'main',
  },
  {
    id:       'customers',
    label:    'Customers',
    icon:     'Users',
    path:     ROUTES.CUSTOMERS,
    badgeKey: 'customers',
    section:  'main',
  },
  {
    id:       'technicians',
    label:    'Technicians',
    icon:     'HardHat',
    path:     ROUTES.TECHNICIANS,
    badgeKey: 'technicians',
    section:  'main',
  },

  // ── Management ─────────────────────────────────────────────────────
  {
    id:       'jobs',
    label:    'Job Cards',
    icon:     'ClipboardList',
    path:     ROUTES.JOBS,
    badgeKey: 'jobs',
    section:  'management',
  },
  {
    id:       'stock',
    label:    'Stock Management',
    icon:     'Warehouse',
    path:     ROUTES.STOCK,
    section:  'management',
  },
  {
    id:       'invoices',
    label:    'Invoices',
    icon:     'FileText',
    path:     ROUTES.INVOICES,
    badgeKey: 'invoices',
    section:  'management',
  },
  {
    id:       'claims',
    label:    'Insurance Claims',
    icon:     'Shield',
    path:     ROUTES.CLAIMS,
    badgeKey: 'claims',
    section:  'management',
  },
  {
    id:      'enquiry',
    label:   'Enquiry',
    icon:    'MessageCircle',
    path:    ROUTES.ENQUIRY,
    section: 'management',
  },
  {
    id:      'reports',
    label:   'Reports',
    icon:    'BarChart2',
    path:    ROUTES.REPORTS,
    section: 'management',
  },
  {
    id:      'settings',
    label:   'Settings',
    icon:    'Settings',
    path:    ROUTES.SETTINGS,
    section: 'management',
  },
];

