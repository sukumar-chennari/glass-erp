import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Download, Info } from 'lucide-react';
import { Modal }      from '@/components/ui/Modal';
import { Button }     from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import styles from './BulkUploadModal.module.css';

// ── Entity config ─────────────────────────────────────────────────────────

export type BulkEntity = 'brands' | 'models';

interface RequirementGroup {
  label:      string;
  candidates: string[];
}

const COLUMN_REQUIREMENTS: Record<BulkEntity, RequirementGroup[]> = {
  brands: [
    { label: 'Brand name',     candidates: ['name', 'brandName', 'brand_name'] },
  ],
  models: [
    { label: 'Model name',     candidates: ['name', 'modelName', 'model_name'] },
    { label: 'Brand reference', candidates: ['brandId', 'brand_id', 'brandName', 'brand_name'] },
  ],
};

// Template CSVs generated client-side — no server dependency
const TEMPLATES: Record<BulkEntity, { filename: string; content: string }> = {
  brands: {
    filename: 'car-brands-template.csv',
    content:  'name,compare_name,status\nMaruti Suzuki,maruti suzuki,ACTIVE\nHyundai,hyundai,ACTIVE',
  },
  models: {
    filename: 'car-models-template.csv',
    content:  'brandName,name,compare_name,status\nMaruti Suzuki,Swift,swift,ACTIVE\nMaruti Suzuki,Alto,alto,ACTIVE',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────

interface ParsedData {
  headers:   string[];
  rows:      Record<string, string>[];
  totalRows: number;
}

type ParseStage = 'idle' | 'parsing' | 'ready' | 'error';

// ── Helpers ───────────────────────────────────────────────────────────────

function meetsRequirement(group: RequirementGroup, headers: string[]): boolean {
  const lower = headers.map((h) => h.trim().toLowerCase());
  return group.candidates.some((c) => lower.includes(c.toLowerCase()));
}

function downloadTemplate(entityType: BulkEntity) {
  const { filename, content } = TEMPLATES[entityType];
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function parseSpreadsheet(file: File): Promise<ParsedData> {
  const arrayBuffer = await file.arrayBuffer();
  // Dynamic import keeps xlsx out of the main bundle until first use
  const { read, utils } = await import('xlsx');
  const workbook  = read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in file');
  const worksheet = workbook.Sheets[sheetName];
  const allRows   = utils.sheet_to_json<Record<string, string>>(worksheet, {
    defval: '',
    raw:    false,
  });
  if (allRows.length === 0) throw new Error('File appears to be empty');
  const headers = Object.keys(allRows[0]);
  return { headers, rows: allRows.slice(0, 10), totalRows: allRows.length };
}

// ── Component ─────────────────────────────────────────────────────────────

interface BulkUploadModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  entityType: BulkEntity;
}

export function BulkUploadModal({ isOpen, onClose, entityType }: BulkUploadModalProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [file,       setFile]       = useState<File | null>(null);
  const [stage,      setStage]      = useState<ParseStage>('idle');
  const [parsed,     setParsed]     = useState<ParsedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Reset internal state whenever the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStage('idle');
      setParsed(null);
      setParseError(null);
    }
  }, [isOpen]);

  async function handleFile(f: File) {
    setFile(f);
    setStage('parsing');
    setParseError(null);
    try {
      const data = await parseSpreadsheet(f);
      setParsed(data);
      setStage('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setParseError(`Could not parse this file: ${msg}. Ensure it is a valid CSV or XLSX.`);
      setStage('error');
    }
  }

  function handleClear() {
    setFile(null);
    setStage('idle');
    setParsed(null);
    setParseError(null);
  }

  const requirements = COLUMN_REQUIREMENTS[entityType];
  const allValid     = parsed
    ? requirements.every((r) => meetsRequirement(r, parsed.headers))
    : false;

  // Compute entity label via t() so it reflects the active locale
  const entityLabel = entityType === 'brands' ? t('carBrands.heading') : t('carModels.heading');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('bulkUpload.title', { entity: entityLabel })}
      maxWidth="720px"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button
            disabled
            title={t('bulkUpload.importDisabledTitle')}
          >
            {t('bulkUpload.import', { entity: entityLabel })}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>

        {/* ── Template download hint ──────────────────────────────── */}
        <div className={styles.templateRow}>
          <Info size={14} className={styles.infoIcon} />
          <span>{t('bulkUpload.templateHint')}</span>
          <button
            type="button"
            className={styles.templateLink}
            onClick={() => downloadTemplate(entityType)}
          >
            <Download size={12} />
            {t('bulkUpload.downloadTemplate')}
          </button>
        </div>

        {/* ── File picker ─────────────────────────────────────────── */}
        <FileUpload
          file={file}
          onFile={handleFile}
          onClear={handleClear}
          accept=".csv,.xlsx"
          hint={t('bulkUpload.fileHint')}
          error={stage === 'error' ? (parseError ?? undefined) : undefined}
        />

        {/* ── Parsing indicator ────────────────────────────────────── */}
        {stage === 'parsing' && (
          <p className={styles.parsingStat}>{t('bulkUpload.parsing')}</p>
        )}

        {/* ── Preview ──────────────────────────────────────────────── */}
        {stage === 'ready' && parsed && (
          <div className={styles.preview}>

            {/* Column detection */}
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                {t('bulkUpload.detectedColumns', { count: parsed.headers.length })}
              </p>
              <div className={styles.columnBadges}>
                {parsed.headers.map((h) => (
                  <span key={h} className={styles.columnBadge}>{h}</span>
                ))}
              </div>
            </div>

            {/* Requirement check */}
            <div className={styles.section}>
              <p className={styles.sectionLabel}>{t('bulkUpload.columnValidation')}</p>
              <div className={styles.validationList}>
                {requirements.map((req) => {
                  const ok = meetsRequirement(req, parsed.headers);
                  return (
                    <div
                      key={req.label}
                      className={`${styles.validationRow} ${ok ? styles.validOk : styles.validFail}`}
                    >
                      {ok
                        ? <CheckCircle2 size={14} className={styles.validIcon} />
                        : <XCircle      size={14} className={styles.validIcon} />
                      }
                      <span>{req.label}</span>
                      {!ok && (
                        <span className={styles.validHint}>
                          {t('bulkUpload.accepted')} {req.candidates.slice(0, 3).join(' / ')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {!allValid && (
                <p className={styles.validError}>
                  {t('bulkUpload.fixColumnsError')}
                </p>
              )}
            </div>

            {/* Row preview table */}
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                {t('bulkUpload.preview', { count: parsed.rows.length, total: parsed.totalRows })}
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {parsed.headers.map((h) => (
                        <th key={h} className={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, i) => (
                      <tr key={i} className={styles.tr}>
                        {parsed.headers.map((h) => (
                          <td key={h} className={styles.td}>{row[h] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </Modal>
  );
}
