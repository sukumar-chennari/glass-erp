import { Link } from 'react-router-dom';
import { Users, Building2, Tag, BarChart2, ArrowRight, type LucideIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ROUTES } from '@/constants/routes';
import styles from './AdminSettingsLanding.module.css';

interface EntryCard {
  icon:      LucideIcon;
  title:     string;
  desc:      string;
  href:      string;
  available: boolean;
}

const CARDS: EntryCard[] = [
  {
    icon:      Users,
    title:     'Users',
    desc:      'Manage staff accounts, assign roles and control access.',
    href:      ROUTES.SETTINGS_USERS,
    available: true,
  },
  {
    icon:      Building2,
    title:     'Branches',
    desc:      'Add and manage branch locations and assign managers.',
    href:      ROUTES.SETTINGS_BRANCHES,
    available: true,
  },
  {
    icon:      Tag,
    title:     'Pricing',
    desc:      'Configure glass type pricing and labour rates.',
    href:      '#',
    available: false,
  },
  {
    icon:      BarChart2,
    title:     'Reports',
    desc:      'Business reports, exports, and performance snapshots.',
    href:      ROUTES.REPORTS,
    available: false,
  },
];

export function AdminSettingsLanding() {
  return (
    <PageShell
      heading="Settings"
      description="Manage your WindX workspace — users, branches, pricing and reports."
    >
      <div className={styles.grid}>
        {CARDS.map((card) => {
          const Icon  = card.icon;
          const inner = (
            <div className={`${styles.card} ${!card.available ? styles.disabled : ''}`}>
              <div className={styles.iconBox}>
                <Icon size={22} />
              </div>
              <div className={styles.body}>
                <div className={styles.titleRow}>
                  {card.title}
                  {!card.available && <span className={styles.soon}>Coming soon</span>}
                </div>
                <div className={styles.desc}>{card.desc}</div>
              </div>
              {card.available && <ArrowRight size={16} className={styles.arrow} />}
            </div>
          );

          if (!card.available) {
            return <div key={card.title}>{inner}</div>;
          }
          return (
            <Link key={card.title} to={card.href} className={styles.link}>
              {inner}
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
