import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, Diamond, LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, closeMobileSidebar } from '@/store/slices/uiSlice';
import type { NavItem } from '@/constants/nav';
import { useAuth } from '@/context/AuthContext';
import { getRoleNavItems } from '@/utils/roleRouting';
import { ROUTES } from '@/constants/routes';
import styles from './Sidebar.module.css';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase();
}

export function Sidebar() {
  const { t }      = useTranslation('nav');
  const dispatch   = useAppDispatch();
  const collapsed  = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.sidebarMobileOpen);
  const { session, logout } = useAuth();
  const navigate   = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  // Only show nav items the current role is allowed to access
  const roleItems  = getRoleNavItems(session?.role);
  const sections: NavItem['section'][] = ['main', 'management'];

  async function handleConfirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return (
    <>
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoBox}>
          <Diamond size={20} />
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <div className={styles.brandName}>{t('sidebar.brand.name')}</div>
            <div className={styles.brandTagline}>{t('sidebar.brand.tagline')}</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label={collapsed ? t('sidebar.aria.expand') : t('sidebar.aria.collapse')}
      >
        <ChevronLeft size={12} />
      </button>

      {/* Navigation */}
      <nav className={styles.navContent} aria-label={t('sidebar.aria.nav')}>
        {sections.map((section) => {
          const items = roleItems.filter((n) => n.section === section);
          // Hide the section entirely if the role has no items in it
          if (items.length === 0) return null;

          return (
            <div key={section}>
              {!collapsed && (
                <div className={styles.sectionLabel}>
                  {t(`sections.${section}`)}
                </div>
              )}
              <ul className={styles.navList}>
                {items.map((item) => {
                  const Icon = (
                    LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>
                  )[item.icon];

                  return (
                    <li key={item.id} className={styles.navItem}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          `${styles.navLink} ${isActive ? styles.active : ''}`
                        }
                        title={collapsed ? t(item.id, item.label) : undefined}
                        onClick={() => dispatch(closeMobileSidebar())}
                      >
                        <span className={styles.navIcon}>
                          {Icon ? <Icon size={18} /> : null}
                        </span>

                        {!collapsed && (
                          <>
                            <span className={styles.navLabel}>
                              {t(item.id, item.label)}
                            </span>
                            {item.badgeKey && (
                              <NavBadge badgeKey={item.badgeKey} />
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {session ? getInitials(session.user.name) : '?'}
          </div>

          {!collapsed && session && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{session.user.name}</div>
              <div className={styles.userRole}>
                {t(`sidebar.user.roles.${session.role}`, { defaultValue: session.role })}
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              className={styles.logoutBtn}
              onClick={() => setShowConfirm(true)}
              disabled={loggingOut}
              aria-label={t('sidebar.user.logout')}
              title={t('sidebar.user.logout')}
            >
              {loggingOut ? <Spinner size="sm" /> : <LogOut size={15} />}
            </button>
          )}
        </div>
      </div>
    </aside>
    <ConfirmDialog
      isOpen={showConfirm}
      title={t('sidebar.user.logoutConfirm.title')}
      message={t('sidebar.user.logoutConfirm.message')}
      confirmLabel={loggingOut ? t('sidebar.user.logoutConfirm.confirming') : t('sidebar.user.logoutConfirm.confirm')}
      isLoading={loggingOut}
      onConfirm={handleConfirmLogout}
      onCancel={() => setShowConfirm(false)}
    />
    </>
  );
}

// Placeholder — will read from notification store in later phases
function NavBadge({ badgeKey }: { badgeKey: string }) {
  const counts: Record<string, number> = {
    vendors:        4,
    products:       24,
    purchaseOrders: 5,
    customers:      48,
    technicians:    6,
    jobs:           12,
    invoices:       28,
    claims:         3,
  };
  const count = counts[badgeKey];
  if (!count) return null;
  return <span className={styles.navBadge}>{count}</span>;
}
