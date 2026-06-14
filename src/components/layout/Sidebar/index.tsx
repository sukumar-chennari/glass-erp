import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, Diamond } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, closeMobileSidebar } from '@/store/slices/uiSlice';
import { NAV_ITEMS, NAV_SECTION_LABELS, type NavItem } from '@/constants/nav';
import { LABELS } from '@/constants/labels';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const dispatch    = useAppDispatch();
  const collapsed   = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen  = useAppSelector((s) => s.ui.sidebarMobileOpen);

  const sections: NavItem['section'][] = ['main', 'management'];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoBox}>
          <Diamond size={20} />
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <div className={styles.brandName}>{LABELS.app.name}</div>
            <div className={styles.brandTagline}>{LABELS.app.tagline}</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft size={12} />
      </button>

      {/* Navigation */}
      <nav className={styles.navContent} aria-label="Main navigation">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((n) => n.section === section);
          return (
            <div key={section}>
              {!collapsed && (
                <div className={styles.sectionLabel}>{NAV_SECTION_LABELS[section]}</div>
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
                        className={({ isActive }) =>
                          `${styles.navLink} ${isActive ? styles.active : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                        onClick={() => dispatch(closeMobileSidebar())}
                      >
                        <span className={styles.navIcon}>
                          {Icon ? <Icon size={18} /> : null}
                        </span>

                        {!collapsed && (
                          <>
                            <span className={styles.navLabel}>{item.label}</span>
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

      {/* User card */}
      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>JS</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>John Smith</div>
              <div className={styles.userRole}>Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
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
