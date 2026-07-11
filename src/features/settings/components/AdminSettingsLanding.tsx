import { Link } from 'react-router-dom';
import { Shield, Car, Layers, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import styles from './AdminSettingsLanding.module.css';

interface EntryCard {
  icon:  LucideIcon;
  title: string;
  desc:  string;
  href:  string;
}

const MASTER_DATA: EntryCard[] = [
  {
    icon:  Shield,
    title: 'Insurance Rules',
    desc:  'Define claim eligibility, required documents, and approval workflows for insurance jobs.',
    href:  ROUTES.SETTINGS_INSURANCE_RULES,
  },
  {
    icon:  Car,
    title: 'Vehicle Models',
    desc:  'Manage the vehicle brands and models supported across job cards and insurance claims.',
    href:  ROUTES.SETTINGS_VEHICLE_MODELS,
  },
  {
    icon:  Layers,
    title: 'Car Brands',
    desc:  'Onboard car brands and their models with status management for use across all workflows.',
    href:  ROUTES.SETTINGS_CAR_BRANDS,
  },
];

function Card({ icon: Icon, title, desc, href }: EntryCard) {
  return (
    <Link to={href} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.iconBox}>
          <Icon size={22} strokeWidth={1.6} />
        </div>
        <div className={styles.cardTitle}>{title}</div>
        <p className={styles.cardDesc}>{desc}</p>
      </div>
    </Link>
  );
}

export function AdminSettingsLanding() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>
          Core configuration shared across all branches and operations.
        </p>
      </header>

      <div className={styles.grid}>
        {MASTER_DATA.map((card) => (
          <Card key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}
