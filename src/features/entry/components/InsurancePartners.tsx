import { useState, useEffect, useRef } from 'react';
import ackoLogo       from '../../../../assets/insurance_images/acko.webp';
import bajajLogo      from '../../../../assets/insurance_images/bajajnew.jpg';
import goDigitLogo    from '../../../../assets/insurance_images/go-digit.webp';
import partner1Logo   from '../../../../assets/insurance_images/insurance-partner1.webp';
import logo3          from '../../../../assets/insurance_images/insurance-logo-3.webp';
import logo8          from '../../../../assets/insurance_images/insurance-logo-8.webp';
import logo9          from '../../../../assets/insurance_images/insurance-logo-9.webp';
import logo10         from '../../../../assets/insurance_images/insurance-logo-10.webp';
import logo15         from '../../../../assets/insurance_images/insurance-logo-15.webp';
import logo16         from '../../../../assets/insurance_images/insurance-logo-16.webp';
import styles from './InsurancePartners.module.css';

interface Insurer {
  name: string;
  logo: string;
}

const INSURERS: Insurer[] = [
  { name: 'Bajaj Allianz',    logo: bajajLogo },
  { name: 'Acko Insurance',   logo: ackoLogo },
  { name: 'Go Digit',         logo: goDigitLogo },
  { name: 'Insurance Partner', logo: partner1Logo },
  { name: 'Insurance Partner', logo: logo3 },
  { name: 'Insurance Partner', logo: logo8 },
  { name: 'Insurance Partner', logo: logo9 },
  { name: 'Insurance Partner', logo: logo10 },
  { name: 'Insurance Partner', logo: logo15 },
  { name: 'Insurance Partner', logo: logo16 },
];

// Duplicate for seamless infinite marquee loop
const TRACK_ITEMS = [...INSURERS, ...INSURERS];

const FEATURE_PILLS = [
  'Cashless Claims',
  'Reimbursement Support',
  'Claim Documentation Help',
  'Doorstep Assistance',
];

export function InsurancePartners() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${visible ? styles.sectionVisible : ''}`}
      aria-labelledby="insurer-heading"
    >
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
            <div key={`${ins.name}-${i}`} className={styles.logoCard}>
              <img
                src={ins.logo}
                alt={ins.name}
                className={styles.logoImg}
                loading="lazy"
              />
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
