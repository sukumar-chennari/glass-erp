import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, LogOut, Clock } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { AppearanceSection } from './components/AppearanceSection';
import { AdminSettingsLanding } from './components/AdminSettingsLanding';
import { useAuth } from '@/context/AuthContext';
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
  const { session } = useAuth();
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

  if (session?.role === 'super_admin') {
    return <AdminSettingsLanding />;
  }

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
          <p className={styles.sectionDesc}>
            {t('appearance.description')}
          </p>
          <AppearanceSection />
        </div>
      </SectionCard>

      {/* Security & Sessions */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Security &amp; Sessions</h3>
          <SecuritySection />
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

// ── Security & Sessions section ───────────────────────────────────────────────
// TODO (backend): GET /auth/sessions, DELETE /auth/sessions/:id, GET /auth/activity

const MOCK_SESSIONS = [
  { id: 's-001', device: 'Chrome on Windows', ip: '49.205.XX.XX', location: 'Hyderabad', lastActive: 'Now',        current: true  },
  { id: 's-002', device: 'Safari on iPhone',  ip: '157.47.XX.XX', location: 'Secunderabad', lastActive: '2 days ago', current: false },
];

const MOCK_ACTIVITY = [
  { id: 'a-001', action: 'Login',          device: 'Chrome on Windows', at: 'Today 9:41 AM',       success: true  },
  { id: 'a-002', action: 'Password change', device: 'Chrome on Windows', at: 'Yesterday 3:15 PM',   success: true  },
  { id: 'a-003', action: 'Login attempt',   device: 'Unknown device',    at: '2 days ago 11:07 PM', success: false },
  { id: 'a-004', action: 'Login',           device: 'Safari on iPhone',  at: '3 days ago 8:20 AM',  success: true  },
];

function SecuritySection() {
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function signOutOtherSessions() {
    setSigningOut(true);
    await new Promise((r) => setTimeout(r, 700));
    setSigningOut(false);
    toast.success('All other sessions signed out.'); // TODO (backend): DELETE /auth/sessions/others
  }

  return (
    <div className={styles.securityWrap}>
      {/* Active sessions */}
      <div className={styles.secSubTitle}>
        <Monitor size={14} />
        Active Sessions
      </div>
      <div className={styles.sessionList}>
        {MOCK_SESSIONS.map((s) => (
          <div key={s.id} className={styles.sessionRow}>
            <div className={styles.sessionInfo}>
              <span className={styles.sessionDevice}>{s.device}</span>
              <span className={styles.sessionMeta}>{s.ip} · {s.location} · {s.lastActive}</span>
            </div>
            {s.current
              ? <span className={styles.currentBadge}>This device</span>
              : <span className={styles.sessionAgo}>{s.lastActive}</span>
            }
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<LogOut size={13} />}
        loading={signingOut}
        onClick={signOutOtherSessions}
      >
        Sign out other sessions
      </Button>

      {/* Login activity */}
      <div className={`${styles.secSubTitle} ${styles.secSubTitleSpaced}`}>
        <Clock size={14} />
        Recent Login Activity
      </div>
      <div className={styles.activityList}>
        {MOCK_ACTIVITY.map((a) => (
          <div key={a.id} className={`${styles.activityRow} ${!a.success ? styles.activityFail : ''}`}>
            <div className={`${styles.activityDot} ${a.success ? styles.activityDotOk : styles.activityDotFail}`} />
            <div className={styles.activityInfo}>
              <span className={styles.activityAction}>{a.action}</span>
              <span className={styles.activityMeta}>{a.device} · {a.at}</span>
            </div>
            {!a.success && <span className={styles.failBadge}>Failed</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
