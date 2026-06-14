import { useState, useEffect } from 'react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';
import styles from './EnquiryPage.module.css';

const LS_KEY = 'glass_erp_enquiry_url';

type AlertState = { msg: string; type: 'success' | 'error' } | null;

export function EnquiryPage() {
  const [phone,       setPhone]       = useState('');
  const [urlInput,    setUrlInput]    = useState('');
  const [savedUrl,    setSavedUrl]    = useState('');
  const [sendAlert,   setSendAlert]   = useState<AlertState>(null);
  const [setupAlert,  setSetupAlert]  = useState<AlertState>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) ?? '';
    if (stored) { setSavedUrl(stored); setUrlInput(stored); }
  }, []);

  function showSend(msg: string, type: 'success' | 'error') {
    setSendAlert({ msg, type });
    setTimeout(() => setSendAlert(null), 5000);
  }

  function showSetup(msg: string, type: 'success' | 'error') {
    setSetupAlert({ msg, type });
    setTimeout(() => setSetupAlert(null), 5000);
  }

  function saveUrl() {
    const url = urlInput.trim();
    if (!url || !url.startsWith('http')) {
      showSetup('Please enter a valid URL starting with https://', 'error');
      return;
    }
    localStorage.setItem(LS_KEY, url);
    setSavedUrl(url);
    showSetup('✓ Form URL saved! You can now send it to customers.', 'success');
  }

  function sendLink() {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length !== 10) {
      showSend('Enter a valid 10-digit WhatsApp number.', 'error');
      return;
    }
    if (!savedUrl) {
      showSend('No form URL saved yet. Complete the setup steps on the right first.', 'error');
      return;
    }
    const msg =
      `Hello! 👋\n\nPlease fill in our *Glass Service Enquiry Form* so we can assist you quickly:\n\n🔗 ${savedUrl}\n\n` +
      `_Tap the link, fill in your vehicle & glass details and submit. It takes less than a minute!_ 🪟\n\n— *Glass ERP Pro*`;
    window.open(`https://wa.me/91${digits}?text=${encodeURIComponent(msg)}`, '_blank');
    setPhone('');
    const fmt = digits.replace(/(\d{5})(\d{5})/, '$1 $2');
    showSend(`✓ WhatsApp opened! Sending form link to +91 ${fmt}`, 'success');
  }

  return (
    <PageShell
      heading="Send Enquiry Form"
      description="Send a WhatsApp message with a link to the enquiry form. Customers tap it, fill their details, and submit."
    >
      <div className={styles.panels}>

        {/* ── Send Panel ── */}
        <SectionCard className={styles.sendPanel}>
          <div className={styles.panelTitle}>📱 Send to Customer</div>

          {sendAlert && (
            <div className={`${styles.alert} ${sendAlert.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
              {sendAlert.msg}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Customer WhatsApp Number *</label>
            <div className={styles.phoneRow}>
              <span className={styles.prefix}>🇮🇳 +91</span>
              <input
                type="tel"
                className={styles.phoneInput}
                placeholder="98765 43210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') sendLink(); }}
              />
            </div>
          </div>

          <button className={styles.waBtn} onClick={sendLink}>
            <MessageCircle size={20} />
            Send Enquiry Link via WhatsApp
          </button>

          <div className={styles.savedUrlBox}>
            <div className={styles.savedUrlLabel}>Saved Form URL</div>
            {savedUrl
              ? <div className={styles.savedUrlText}>{savedUrl}</div>
              : <div className={styles.savedUrlEmpty}>Not set — see setup steps →</div>
            }
          </div>
        </SectionCard>

        {/* ── Setup Panel ── */}
        <SectionCard className={styles.setupPanel}>
          <div className={styles.panelTitle}>🔧 One-Time Setup</div>

          <p className={styles.setupDesc}>
            Host the <strong>glass-enquiry-form.html</strong> file online once — takes 30 seconds, free forever.
          </p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepTitle}>Step 1 — Upload to Netlify (free)</div>
              <div className={styles.stepDesc}>
                Open <strong>app.netlify.com/drop</strong> in your browser and drag &amp; drop the{' '}
                <strong>glass-enquiry-form.html</strong> file onto the page. Netlify gives you a URL instantly.
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepTitle}>Step 2 — Save the URL here</div>
              {setupAlert && (
                <div className={`${styles.alert} ${setupAlert.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                  {setupAlert.msg}
                </div>
              )}
              <div className={styles.urlRow}>
                <input
                  type="url"
                  className={styles.urlInput}
                  placeholder="https://your-site.netlify.app/glass-enquiry-form.html"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveUrl(); }}
                />
                <Button variant="primary" size="sm" onClick={saveUrl}>Save</Button>
              </div>
            </div>
          </div>

          <div className={styles.setupNote}>
            ✓ Save once — every customer gets the same link automatically.
          </div>
        </SectionCard>

      </div>
    </PageShell>
  );
}
