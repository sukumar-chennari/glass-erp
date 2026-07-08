import { NavLink, Outlet, Navigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Shield, Car, Building2, Users, Tag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { SettingsPage } from './SettingsPage';
import styles from './SettingsLayout.module.css';

// Unified nav item shape for both sections
interface SubNavItem {
  path:  string;
  label: string;
  Icon?: LucideIcon;
}

const MASTER_DATA_NAV: SubNavItem[] = [
  { path: ROUTES.SETTINGS_INSURANCE_RULES, label: 'Insurance Rules', Icon: Shield },
  { path: ROUTES.SETTINGS_VEHICLE_MODELS,  label: 'Vehicle Models',  Icon: Car    },
];

const ADMIN_NAV: SubNavItem[] = [
  { path: ROUTES.SETTINGS_BRANCHES, label: 'Branches', Icon: Building2 },
  { path: ROUTES.SETTINGS_USERS,    label: 'Users',    Icon: Users      },
  { path: ROUTES.SETTINGS_PRICING,  label: 'Pricing',  Icon: Tag        },
];

function NavItems({ items }: { items: SubNavItem[] }) {
  return (
    <>
      {items.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${styles.subnavItem} ${isActive ? styles.subnavItemActive : ''}`
          }
        >
          {Icon && <Icon size={15} />}
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function SettingsLayout() {
  const { session } = useAuth();

  if (session?.role !== 'super_admin') {
    // Non-admin: pass through to the child route via Outlet (no subnav)
    return <Outlet />;
  }

  return (
    <div className={styles.container}>
      <aside className={styles.subnav}>
        <div className={styles.subnavHeader}>Settings</div>
        <nav className={styles.subnavList} aria-label="Master data settings">
          <NavItems items={MASTER_DATA_NAV} />
        </nav>
        <div className={styles.subnavDivider} />
        <div className={styles.subnavSection}>Admin</div>
        <nav aria-label="Admin settings">
          <NavItems items={ADMIN_NAV} />
        </nav>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

// Index route: super_admin → Insurance Rules; others → personal settings page
export function SettingsIndexRedirect() {
  const { session } = useAuth();
  if (session?.role === 'super_admin') {
    return <Navigate to={ROUTES.SETTINGS_INSURANCE_RULES} replace />;
  }
  return <SettingsPage />;
}
