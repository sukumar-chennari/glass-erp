import { NavLink, Outlet, useMatch } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Shield, Car, Tag, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { SettingsPage } from './SettingsPage';
import { AdminSettingsLanding } from './components/AdminSettingsLanding';
import styles from './SettingsLayout.module.css';

interface SubNavItem {
  path:  string;
  label: string;
  Icon?: LucideIcon;
}

const MASTER_DATA_NAV: SubNavItem[] = [
  { path: ROUTES.SETTINGS_INSURANCE_RULES, label: 'Insurance Rules', Icon: Shield },
  { path: ROUTES.SETTINGS_VEHICLE_MODELS,  label: 'Vehicle Models',  Icon: Car    },
  { path: ROUTES.SETTINGS_CAR_BRANDS,      label: 'Car Brands',      Icon: Tag    },
  { path: ROUTES.SETTINGS_CAR_MODELS,      label: 'Car Models',      Icon: Layers },
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
  const { session }       = useAuth();
  const onInsuranceRules  = useMatch(ROUTES.SETTINGS_INSURANCE_RULES);
  const onVehicleModels   = useMatch(ROUTES.SETTINGS_VEHICLE_MODELS);
  const onCarBrands       = useMatch(ROUTES.SETTINGS_CAR_BRANDS);
  const onCarModels       = useMatch(ROUTES.SETTINGS_CAR_MODELS);

  // Subnav only for master-data sub-pages; landing + direct sidebar items render full-width
  const showSubnav = !!(onInsuranceRules || onVehicleModels || onCarBrands || onCarModels);

  if (session?.role !== 'super_admin' || !showSubnav) {
    return <Outlet />;
  }

  return (
    <div className={styles.container}>
      <aside className={styles.subnav}>
        <div className={styles.subnavHeader}>Settings</div>
        <div className={styles.subnavSection}>Master Data</div>
        <nav className={styles.subnavList} aria-label="Master data settings">
          <NavItems items={MASTER_DATA_NAV} />
        </nav>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

// Index route: super_admin → Settings landing; others → personal settings page
export function SettingsIndexRedirect() {
  const { session } = useAuth();
  if (session?.role === 'super_admin') {
    return <AdminSettingsLanding />;
  }
  return <SettingsPage />;
}
