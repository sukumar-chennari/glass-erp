import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import styles from './PricingPage.module.css';

// Base pricing per glass type × quality grade
// TODO (backend): GET /pricing  /  PUT /pricing

interface PriceRow {
  glassType: string;
  oem:       number;
  oee:       number;
  am:        number;
  labour:    number;
  sealant:   number;
}

const INITIAL_PRICING: PriceRow[] = [
  { glassType: 'Front Windshield',      oem: 5800, oee: 4400, am: 3200, labour: 800, sealant: 250 },
  { glassType: 'Rear Windshield',       oem: 4200, oee: 3200, am: 2400, labour: 800, sealant: 250 },
  { glassType: 'Driver Side Window',    oem: 2200, oee: 1700, am: 1300, labour: 600, sealant: 0   },
  { glassType: 'Passenger Side Window', oem: 2200, oee: 1700, am: 1300, labour: 600, sealant: 0   },
  { glassType: 'Rear Left Window',      oem: 1900, oee: 1500, am: 1100, labour: 600, sealant: 0   },
  { glassType: 'Rear Right Window',     oem: 1900, oee: 1500, am: 1100, labour: 600, sealant: 0   },
  { glassType: 'Sunroof Glass',         oem: 8500, oee: 6500, am: 4800, labour: 1200, sealant: 400 },
  { glassType: 'Quarter Glass',         oem: 1600, oee: 1200, am: 900,  labour: 500, sealant: 0   },
];

type EditMap = Record<string, Partial<Record<keyof Omit<PriceRow, 'glassType'>, string>>>;

export function PricingPage() {
  const toast = useToast();
  const [pricing, setPricing] = useState<PriceRow[]>(INITIAL_PRICING);
  const [editMode, setEditMode] = useState(false);
  const [draft,    setDraft]    = useState<EditMap>({});
  const [saving,   setSaving]   = useState(false);

  function startEdit() {
    const map: EditMap = {};
    pricing.forEach((row) => {
      map[row.glassType] = {
        oem:    String(row.oem),
        oee:    String(row.oee),
        am:     String(row.am),
        labour: String(row.labour),
        sealant:String(row.sealant),
      };
    });
    setDraft(map);
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft({});
    setEditMode(false);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500)); // TODO (backend): PUT /pricing
      const updated = pricing.map((row) => {
        const d = draft[row.glassType];
        if (!d) return row;
        return {
          ...row,
          oem:    Number(d.oem)     || row.oem,
          oee:    Number(d.oee)     || row.oee,
          am:     Number(d.am)      || row.am,
          labour: Number(d.labour)  || row.labour,
          sealant:Number(d.sealant) || 0,
        };
      });
      setPricing(updated);
      setDraft({});
      setEditMode(false);
      toast.success('Pricing updated successfully.');
    } finally {
      setSaving(false);
    }
  }

  function updateDraft(glassType: string, field: keyof Omit<PriceRow, 'glassType'>, val: string) {
    setDraft((d) => ({
      ...d,
      [glassType]: { ...d[glassType], [field]: val },
    }));
  }

  const cols: Array<{ key: keyof Omit<PriceRow, 'glassType'>; label: string }> = [
    { key: 'oem',    label: 'OEM'           },
    { key: 'oee',    label: 'OEE'           },
    { key: 'am',     label: 'Aftermarket'   },
    { key: 'labour', label: 'Labour'        },
    { key: 'sealant',label: 'Sealant'       },
  ];

  return (
    <PageShell
      heading="Pricing Management"
      description="Configure base glass prices and labour rates. These are used in quote generation."
      actions={
        editMode ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" leftIcon={<X size={14} />} onClick={cancelEdit} disabled={saving}>
              Cancel
            </Button>
            <Button leftIcon={<Check size={14} />} onClick={saveEdit} loading={saving}>
              Save Prices
            </Button>
          </div>
        ) : (
          <Button variant="secondary" leftIcon={<Pencil size={14} />} onClick={startEdit}>
            Edit Prices
          </Button>
        )
      }
    >
      <SectionCard>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.glassCol}>Glass Type</th>
                {cols.map((c) => <th key={c.key}>{c.label} (₹)</th>)}
              </tr>
            </thead>
            <tbody>
              {pricing.map((row) => (
                <tr key={row.glassType}>
                  <td className={styles.glassLabel}>{row.glassType}</td>
                  {cols.map((col) => (
                    <td key={col.key}>
                      {editMode ? (
                        <input
                          className={styles.priceInput}
                          type="number"
                          min="0"
                          value={draft[row.glassType]?.[col.key] ?? ''}
                          onChange={(e) => updateDraft(row.glassType, col.key, e.target.value)}
                        />
                      ) : (
                        <span className={styles.priceVal}>
                          {row[col.key] === 0 ? '—' : `₹${row[col.key].toLocaleString('en-IN')}`}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!editMode && (
          <p className={styles.hint}>
            Prices apply before any customer-specific discounts or insurer negotiated rates.
            OEM = Original Equipment Manufacturer; OEE = OE-Equivalent; Aftermarket = economy grade.
          </p>
        )}
      </SectionCard>
    </PageShell>
  );
}
