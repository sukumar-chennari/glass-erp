import { Link } from 'react-router-dom';
import { Shield, Tag, Layers, UploadCloud, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import styles from './AdminSettingsLanding.module.css';

interface EntryCard {
  icon:  LucideIcon;
  title: string;
  desc:  string;
  href:  string;
}

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
  const { t } = useTranslation('settings');

  const MASTER_DATA: EntryCard[] = [
    {
      icon:  Shield,
      title: t('subnav.insuranceRules'),
      desc:  t('insuranceRules.description'),
      href:  ROUTES.SETTINGS_INSURANCE_RULES,
    },
    {
      icon:  Tag,
      title: t('subnav.carBrands'),
      desc:  t('carBrands.description'),
      href:  ROUTES.SETTINGS_CAR_BRANDS,
    },
    {
      icon:  Layers,
      title: t('subnav.carModels'),
      desc:  t('carModels.description'),
      href:  ROUTES.SETTINGS_CAR_MODELS,
    },
    {
      icon:  UploadCloud,
      title: t('subnav.bulkUpload'),
      desc:  t('bulkUpload.description'),
      href:  ROUTES.SETTINGS_BULK_UPLOAD,
    },
    {
      icon:  ShieldCheck,
      title: 'Super Admins',
      desc:  'Create Super Admin accounts with full platform access.',
      href:  ROUTES.SETTINGS_SUPER_ADMINS,
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin.title')}</h1>
        <p className={styles.pageSubtitle}>{t('admin.subtitle')}</p>
      </header>

      <div className={styles.grid}>
        {MASTER_DATA.map((card) => (
          <Card key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}
