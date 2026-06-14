import { useState } from 'react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { SelectOption } from '@/types/ui';
import styles from './SettingsPage.module.css';

const GST_OPTIONS: SelectOption[] = [
  { value: '5',  label: '5%'  },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)'    },
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

  const handleSaveBusinessInfo = async () => {
    setSaving(true);
    try {
      // Replace with: await updateSettings({ businessName, businessPhone, ... }).unwrap();
      await new Promise((r) => setTimeout(r, 600));
      toast.success('Business information saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      heading="Settings"
      description="Business configuration and system preferences."
    >
      {/* User Profile */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Logged-in User</h3>
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
          <h3 className={styles.sectionTitle}>Business Information</h3>

          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            fullWidth
          />

          <div className={styles.row}>
            <Input
              label="Phone"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <Input
              label="GST Number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <Select
              label="Default GST Rate"
              options={GST_OPTIONS}
              value={defaultGst}
              onChange={(e) => setDefaultGst(e.target.value)}
            />
          </div>

          <Select
            label="Currency"
            options={CURRENCY_OPTIONS}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />

          <Button className={styles.saveBtn} onClick={handleSaveBusinessInfo} loading={saving}>
            Save Business Info
          </Button>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Notifications</h3>

          <Toggle
            id="emailNotif"
            title="Email Notifications"
            desc="Receive email alerts for new jobs and status changes"
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <Toggle
            id="lowStockAlert"
            title="Low Stock Alerts"
            desc="Alert when any product stock falls below the threshold"
            checked={lowStockAlert}
            onChange={setLowStockAlert}
          />
          <Toggle
            id="claimReminder"
            title="Claim Follow-up Reminders"
            desc="Daily reminder for claims pending more than 7 days"
            checked={claimReminder}
            onChange={setClaimReminder}
          />
          <Toggle
            id="invoiceDueAlert"
            title="Invoice Due Date Alerts"
            desc="Alert 3 days before an invoice becomes overdue"
            checked={invoiceDueAlert}
            onChange={setInvoiceDueAlert}
          />
        </div>
      </SectionCard>

      {/* System */}
      <SectionCard>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>System</h3>
          <div className={styles.row}>
            <Input
              label="App Version"
              value="1.0.0-beta"
              disabled
              hint="Read-only"
            />
            <Input
              label="API Mode"
              value={import.meta.env.VITE_USE_MOCK_API === 'true' ? 'Mock (Development)' : 'Live (Production)'}
              disabled
              hint="Toggle via VITE_USE_MOCK_API environment variable"
            />
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
