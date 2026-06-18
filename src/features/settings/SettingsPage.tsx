import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { AppearanceSection } from './components/AppearanceSection';
import type { SelectOption } from '@/types/ui';
import styles from './SettingsPage.module.css';

const GST_OPTIONS: SelectOption[] = [
  { value: '5',  label: '5%'  },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

interface ToggleProps {
  id:      string;
  title:   string;
  desc:    string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ id, title, desc, checked, onChange }: ToggleProps) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleLabel}>
        <span className={styles.toggleTitle}>{title}</span>
        <span className={styles.toggleDesc}>{desc}</span>
      </div>
      <label className={styles.toggle} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.slider} />
      </label>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('WindX Auto Glass');
  const [businessPhone, setBusinessPhone] = useState('9876543200');
  const [businessEmail, setBusinessEmail] = useState('admin@windxglass.in');
  const [gstNumber, setGstNumber] = useState('27AABCW1234A1Z5');
  const [defaultGst, setDefaultGst] = useState('18');
  const [currency, setCurrency] = useState('INR');

  const [emailNotif, setEmailNotif] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [claimReminder, setClaimReminder] = useState(true);
  const [invoiceDueAlert, setInvoiceDueAlert] = useState(false);

  const CURRENCY_OPTIONS: SelectOption[] = [
    { value: 'INR', label: t('business.currencyOptions.inr') },
    { value: 'USD', label: t('business.currencyOptions.usd') },
  ];

  const handleSaveBusinessInfo = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success(t('business.saved'));
    } catch {
      toast.error(t('business.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
    >
      {/* User Profile */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('sections.user')}</h3>
          <div className={styles.userCard}>
            <div className={styles.avatar}>JS</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>John Smith</span>
              <span className={styles.userEmail}>john.smith@windxglass.in</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Business Info */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('sections.business')}</h3>

          <Input
            label={t('business.name')}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            fullWidth
          />

          <div className={styles.row}>
            <Input
              label={t('business.phone')}
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
            />
            <Input
              label={t('business.email')}
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <Input
              label={t('business.gstNumber')}
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <Select
              label={t('business.defaultGstRate')}
              options={GST_OPTIONS}
              value={defaultGst}
              onChange={(e) => setDefaultGst(e.target.value)}
            />
          </div>

          <Select
            label={t('business.currency')}
            options={CURRENCY_OPTIONS}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />

          <Button className={styles.saveBtn} onClick={handleSaveBusinessInfo} loading={saving}>
            {t('business.save')}
          </Button>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('sections.notifications')}</h3>

          <Toggle
            id="emailNotif"
            title={t('notifications.newJob.title')}
            desc={t('notifications.newJob.description')}
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <Toggle
            id="lowStockAlert"
            title={t('notifications.lowStock.title')}
            desc={t('notifications.lowStock.description')}
            checked={lowStockAlert}
            onChange={setLowStockAlert}
          />
          <Toggle
            id="claimReminder"
            title={t('notifications.claimUpdate.title')}
            desc={t('notifications.claimUpdate.description')}
            checked={claimReminder}
            onChange={setClaimReminder}
          />
          <Toggle
            id="invoiceDueAlert"
            title={t('notifications.invoiceDue.title')}
            desc={t('notifications.invoiceDue.description')}
            checked={invoiceDueAlert}
            onChange={setInvoiceDueAlert}
          />
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('sections.appearance')}</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            {t('appearance.description')}
          </p>
          <AppearanceSection />
        </div>
      </SectionCard>

      {/* System */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('sections.system')}</h3>
          <div className={styles.row}>
            <Input
              label={t('system.version')}
              value="1.0.0-beta"
              disabled
              hint={t('user.readOnly')}
            />
            <Input
              label={t('system.apiMode')}
              value={import.meta.env.VITE_USE_MOCK_API === 'true' ? t('system.mock') : t('system.live')}
              disabled
              hint={t('system.apiModeHint')}
            />
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
