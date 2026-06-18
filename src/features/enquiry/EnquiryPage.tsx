import { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';
import styles from './EnquiryPage.module.css';

const LS_KEY = 'glass_erp_enquiry_url';

type AlertState = { msg: string; type: 'success' | 'error' } | null;

export function EnquiryPage() {
  const { t } = useTranslation(['enquiry', 'common']);
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
      showSetup(t('messages.invalidUrl'), 'error');
      return;
    }
    localStorage.setItem(LS_KEY, url);
    setSavedUrl(url);
    showSetup(t('messages.urlSaved'), 'success');
  }

  function sendLink() {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length !== 10) {
      showSend(t('messages.invalidPhone'), 'error');
      return;
    }
    if (!savedUrl) {
      showSend(t('messages.noUrl'), 'error');
      return;
    }
    const msg = t('whatsapp.message', { url: savedUrl });
    window.open(`https://wa.me/91${digits}?text=${encodeURIComponent(msg)}`, '_blank');
    setPhone('');
    const fmt = digits.replace(/(\d{5})(\d{5})/, '$1 $2');
    showSend(t('messages.whatsappOpened', { phone: fmt }), 'success');
  }

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
    >
      <div className={styles.panels}>

        {/* ── Send Panel ── */}
        <SectionCard className={styles.sendPanel}>
          <div className={styles.panelTitle}>{t('send.panelTitle')}</div>

          {sendAlert && (
            <div className={`${styles.alert} ${sendAlert.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
              {sendAlert.msg}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('send.phoneLabel')}</label>
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
            {t('send.sendButton')}
          </button>

          <div className={styles.savedUrlBox}>
            <div className={styles.savedUrlLabel}>{t('send.savedUrlLabel')}</div>
            {savedUrl
              ? <div className={styles.savedUrlText}>{savedUrl}</div>
              : <div className={styles.savedUrlEmpty}>{t('send.savedUrlEmpty')}</div>
            }
          </div>
        </SectionCard>

        {/* ── Setup Panel ── */}
        <SectionCard className={styles.setupPanel}>
          <div className={styles.panelTitle}>{t('setup.panelTitle')}</div>

          <p className={styles.setupDesc}>
            <Trans i18nKey="setup.description" ns="enquiry">
              Host the <strong>glass-enquiry-form.html</strong> file online once — takes 30 seconds, free forever.
            </Trans>
          </p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepTitle}>{t('setup.step1Title')}</div>
              <div className={styles.stepDesc}>
                <Trans i18nKey="setup.step1Desc" ns="enquiry">
                  Open <strong>app.netlify.com/drop</strong> in your browser and drag &amp; drop the{' '}
                  <strong>glass-enquiry-form.html</strong> file onto the page. Netlify gives you a URL instantly.
                </Trans>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepTitle}>{t('setup.step2Title')}</div>
              {setupAlert && (
                <div className={`${styles.alert} ${setupAlert.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                  {setupAlert.msg}
                </div>
              )}
              <div className={styles.urlRow}>
                <input
                  type="url"
                  className={styles.urlInput}
                  placeholder={t('setup.urlPlaceholder')}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveUrl(); }}
                />
                <Button variant="primary" size="sm" onClick={saveUrl}>{t('setup.save')}</Button>
              </div>
            </div>
          </div>

          <div className={styles.setupNote}>{t('setup.note')}</div>
        </SectionCard>

      </div>
    </PageShell>
  );
}
