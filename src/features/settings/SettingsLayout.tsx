import { NavLink, Outlet, useMatch } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Shield, Tag, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { SettingsPage } from './SettingsPage';
import { AdminSettingsLanding } from './components/AdminSettingsLanding';
import styles from './SettingsLayout.module.css';

interface SubNavItem {
  path:  string;
  labelKey: string;
  Icon?: LucideIcon;
}

const MASTER_DATA_NAV: SubNavItem[] = [
  { path: ROUTES.SETTINGS_INSURANCE_RULES, labelKey: 'insuranceRules', Icon: Shield },
  { path: ROUTES.SETTINGS_CAR_BRANDS,      labelKey: 'carBrands',      Icon: Tag    },
  { path: ROUTES.SETTINGS_CAR_MODELS,      labelKey: 'carModels',      Icon: Layers },
];

function NavItems({ items, t }: { items: SubNavItem[]; t: (key: string) => string }) {
  return (
    <>
      {items.map(({ path, labelKey, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${styles.subnavItem} ${isActive ? styles.subnavItemActive : ''}`
          }
        >
          {Icon && <Icon size={15} />}
          {t(`subnav.${labelKey}`)}
        </NavLink>
      ))}
    </>
  );
}

export function SettingsLayout() {
  const { t }             = useTranslation('settings');
  const { session }       = useAuth();
  const onInsuranceRules  = useMatch(ROUTES.SETTINGS_INSURANCE_RULES);
  const onCarBrands       = useMatch(ROUTES.SETTINGS_CAR_BRANDS);
  const onCarModels       = useMatch(ROUTES.SETTINGS_CAR_MODELS);

  // Subnav only for master-data sub-pages; landing + direct sidebar items render full-width
  const showSubnav = !!(onInsuranceRules || onCarBrands || onCarModels);

  if (session?.role !== 'super_admin' || !showSubnav) {
    return <Outlet />;
  }

  return (
    <div className={styles.container}>
      <aside className={styles.subnav}>
        <div className={styles.subnavHeader}>{t('subnav.header')}</div>
        <div className={styles.subnavSection}>{t('subnav.masterData')}</div>
        <nav className={styles.subnavList} aria-label={t('subnav.aria')}>
          <NavItems items={MASTER_DATA_NAV} t={t} />
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
