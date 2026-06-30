import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/types/ui';
import styles from './InsuranceDetailsPanel.module.css';

export interface InsuranceFormState {
  insurer:      string;
  policyNo:     string;
  accidentDate: string;
  excessAmount: string;
}

const INSURER_OPTIONS: SelectOption[] = [
  { value: 'New India Assurance',    label: 'New India Assurance'    },
  { value: 'ICICI Lombard',          label: 'ICICI Lombard'          },
  { value: 'HDFC ERGO',              label: 'HDFC ERGO'              },
  { value: 'Bajaj Allianz',          label: 'Bajaj Allianz'          },
  { value: 'United India Insurance', label: 'United India Insurance' },
  { value: 'National Insurance',     label: 'National Insurance'     },
  { value: 'Oriental Insurance',     label: 'Oriental Insurance'     },
  { value: 'Other',                  label: 'Other'                  },
];

interface Props {
  value:    InsuranceFormState;
  onChange: (v: InsuranceFormState) => void;
}

export function InsuranceDetailsPanel({ value, onChange }: Props) {
  function f(k: keyof InsuranceFormState, v: string) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <Shield size={14} />
        Insurance Details
      </div>

      <div className={styles.row2}>
        <Select
          label="Insurer"
          options={INSURER_OPTIONS}
          value={value.insurer}
          onChange={(e) => f('insurer', e.target.value)}
          fullWidth
        />
        <Input
          label="Policy Number"
          value={value.policyNo}
          onChange={(e) => f('policyNo', e.target.value)}
          placeholder="POL-2024-001234"
        />
      </div>

      <div className={`${styles.row2} ${styles.mt3}`}>
        <Input
          label="Accident / Damage Date"
          type="date"
          value={value.accidentDate}
          onChange={(e) => f('accidentDate', e.target.value)}
        />
        <Input
          label="Excess Amount (₹)"
          type="number"
          value={value.excessAmount}
          onChange={(e) => f('excessAmount', e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );
}
