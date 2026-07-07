import { NavLink, Outlet, Navigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Shield, Car } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { SettingsPage } from './SettingsPage';
import styles from './SettingsLayout.module.css';

interface SubNavItem {
  path:  string;
  label: string;
  Icon:  LucideIcon;
}

const SUBNAV_ITEMS: SubNavItem[] = [
  { path: ROUTES.SETTINGS_INSURANCE_RULES, label: 'Insurance Rules', Icon: Shield },
  { path: ROUTES.SETTINGS_VEHICLE_MODELS,  label: 'Vehicle Models',  Icon: Car    },
];

/**
 * Two-panel settings shell for super_admin.
 * Non-super_admin roles are passed through to the existing personal SettingsPage.
 */
export function SettingsLayout() {
  const { session } = useAuth();

  if (session?.role !== 'super_admin') {
    return <SettingsPage />;
  }

  return (
    <div className={styles.container}>
      {/* ── Left sub-navigation ──────────────────────────────────────── */}
      <aside className={styles.subnav}>
        <div className={styles.subnavHeader}>Settings</div>
        <nav className={styles.subnavList} aria-label="Settings navigation">
          {SUBNAV_ITEMS.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `${styles.subnavItem} ${isActive ? styles.subnavItemActive : ''}`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Future sections hint ────────────────────────────────────── */}
        <div className={styles.subnavDivider} />
        <div className={styles.subnavSection}>Admin</div>
        {[
          { label: 'Branches', path: ROUTES.SETTINGS_BRANCHES },
          { label: 'Users',    path: ROUTES.SETTINGS_USERS    },
          { label: 'Pricing',  path: ROUTES.SETTINGS_PRICING  },
        ].map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `${styles.subnavItem} ${isActive ? styles.subnavItemActive : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </aside>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

/** Index redirect — super_admin goes directly to Insurance Rules. */
export function SettingsIndexRedirect() {
  const { session } = useAuth();
  if (session?.role === 'super_admin') {
    return <Navigate to={ROUTES.SETTINGS_INSURANCE_RULES} replace />;
  }
  return null; // SettingsLayout already rendered SettingsPage for non-admins
}
