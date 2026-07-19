import styles from './InsurancePartners.module.css';

interface Insurer {
  name:  string;
  abbr:  string;
  color: string; // brand accent color for the badge
}

const INSURERS: Insurer[] = [
  { name: 'Bajaj Allianz',        abbr: 'BA',  color: '#DC2626' },
  { name: 'ICICI Lombard',        abbr: 'IL',  color: '#EA580C' },
  { name: 'HDFC ERGO',            abbr: 'HE',  color: '#1D4ED8' },
  { name: 'National Insurance',   abbr: 'NI',  color: '#1E40AF' },
  { name: 'United India',         abbr: 'UI',  color: '#15803D' },
  { name: 'Oriental Insurance',   abbr: 'OI',  color: '#6D28D9' },
  { name: 'New India Assurance',  abbr: 'NIA', color: '#0369A1' },
  { name: 'Reliance General',     abbr: 'RG',  color: '#0E7490' },
];

// Duplicate the list so the marquee loops seamlessly
const TRACK_ITEMS = [...INSURERS, ...INSURERS];

const FEATURE_PILLS = [
  'Cashless Claims',
  'Reimbursement Support',
  'Claim Documentation Help',
  'Doorstep Assistance',
];

export function InsurancePartners() {
  return (
    <section className={styles.section} aria-labelledby="insurer-heading">
      {/* Decorative blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Insurance Partners</p>
        <h2 id="insurer-heading" className={styles.heading}>
          Claim Support Made Easy
        </h2>
        <p className={styles.sub}>
          We work with all major insurers to process cashless and reimbursement
          glass replacement claims — so you can focus on the road, not the paperwork.
        </p>

        {/* Feature pills */}
        <div className={styles.pills} aria-hidden="true">
          {FEATURE_PILLS.map((pill) => (
            <span key={pill} className={styles.pill}>✓ {pill}</span>
          ))}
        </div>
      </div>

      {/* Infinite marquee — pauses on hover */}
      <div className={styles.marqueeWrap} aria-hidden="true">
        <div className={styles.track}>
          {TRACK_ITEMS.map((ins, i) => (
            <div key={`${ins.abbr}-${i}`} className={styles.logoCard}>
              <div
                className={styles.logoBadge}
                style={{ background: ins.color }}
              >
                {ins.abbr}
              </div>
              <span className={styles.logoName}>{ins.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.inner}>
        <p className={styles.note}>
          Subject to policy terms and insurer availability
        </p>
      </div>
    </section>
  );
}
