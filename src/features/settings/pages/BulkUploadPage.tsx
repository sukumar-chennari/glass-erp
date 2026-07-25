import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle,
  RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { PageShell, SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { Button }    from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useToast }  from '@/components/ui/Toast';
import type { TableColumn } from '@/types/ui';
import {
  useUploadCatalogMutation,
  useGetCatalogQuery,
} from '@/services/catalogApi';
import type {
  CatalogUploadResult,
  CatalogPricingRow,
} from '@/services/catalogApi';
import styles from './BulkUploadPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_ROW_ERRORS_SHOWN = 20;
const MAX_FILE_MB          = 20;
const MAX_FILE_BYTES       = MAX_FILE_MB * 1024 * 1024;
const CATALOG_LIMIT        = 20;

const UPLOAD_PHASES = [
  'Reading your workbook…',
  'Validating structure…',
  'Processing car brands…',
  'Syncing model variants…',
  'Updating glass pricing…',
  'Finalising records…',
];
const PHASE_DURATION_MS = 2500;

const COUNT_LABELS: { key: keyof CatalogUploadResult; label: string }[] = [
  { key: 'brandsCreated',         label: 'Brands' },
  { key: 'modelsCreated',         label: 'Models' },
  { key: 'variantsCreated',       label: 'Variants' },
  { key: 'glassPartTypesCreated', label: 'Glass Types' },
  { key: 'glassBrandsCreated',    label: 'Glass Brands' },
  { key: 'pricingRowsCreated',    label: 'Prices Created' },
  { key: 'pricingRowsUpdated',    label: 'Prices Updated' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'xlsx') return 'Only .xlsx files are accepted. Please export your workbook as an Excel (.xlsx) file.';
  if (file.size === 0) return 'The selected file is empty. Please choose a valid workbook.';
  if (file.size > MAX_FILE_BYTES) return `File exceeds the ${MAX_FILE_MB} MB limit. Please split the workbook into smaller batches.`;
  return null;
}

function fmtPrice(val: number): string {
  return `₹${val.toLocaleString('en-IN')}`;
}

// ── Upload animation ───────────────────────────────────────────────────────

function UploadingAnimation({ fileName }: { fileName: string }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhaseIdx((i) => (i + 1) % UPLOAD_PHASES.length), PHASE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.uploadAnim}>
      <div className={styles.animBgSweep} aria-hidden="true" />
      <div className={styles.animIconWrap} aria-hidden="true">
        <div className={styles.animRing} />
        <div className={`${styles.animRing} ${styles.animRing2}`} />
        <div className={styles.animIcon}><UploadCloud size={30} strokeWidth={1.6} /></div>
      </div>
      <div className={styles.animPhaseWrap}>
        <span key={phaseIdx} className={styles.animPhase}>{UPLOAD_PHASES[phaseIdx]}</span>
      </div>
      <div className={styles.progressTrack} role="progressbar" aria-valuetext={UPLOAD_PHASES[phaseIdx]}>
        <div className={styles.progressFill} />
      </div>
      <div className={styles.animFile}>{fileName}</div>
      <div className={styles.animNote}>This may take a minute for large workbooks — please don't close this page</div>
    </div>
  );
}

// ── Upload success summary ─────────────────────────────────────────────────

function SuccessResult({ result }: { result: CatalogUploadResult }) {
  const rowErrors   = result.rowErrors ?? [];
  const hasErrors   = rowErrors.length > 0;
  const shown       = rowErrors.slice(0, MAX_ROW_ERRORS_SHOWN);
  const hiddenCount = rowErrors.length - shown.length;
  const counts      = COUNT_LABELS.map(({ key, label }) => ({ label, value: result[key] as number }));

  return (
    <div className={`${styles.result} ${hasErrors ? styles.resultPartial : styles.resultSuccess}`}>
      <div className={styles.resultHeader}>
        {hasErrors
          ? <AlertTriangle size={18} className={styles.resultIconWarn} />
          : <CheckCircle2  size={18} className={styles.resultIconOk}   />}
        <span className={styles.resultTitle}>
          {hasErrors ? 'Upload complete — with row errors' : 'Upload successful'}
        </span>
      </div>
      <div className={styles.countRow}>
        {counts.map(({ label, value }) => (
          <div key={label} className={styles.countTile}>
            <span className={styles.countVal}>{value}</span>
            <span className={styles.countLabel}>{label}</span>
          </div>
        ))}
      </div>
      {hasErrors && (
        <div className={styles.errSection}>
          <div className={styles.errSectionTitle}>
            {rowErrors.length} row {rowErrors.length === 1 ? 'error' : 'errors'} detected
          </div>
          <ul className={styles.errList}>
            {shown.map((e, i) => (
              <li key={i} className={styles.errItem}>
                {e.row != null && <span className={styles.errRow}>Row {e.row}</span>}
                {e.field        && <span className={styles.errField}>{e.field}</span>}
                <span className={styles.errMsg}>{e.message}</span>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <p className={styles.errMore}>
              …and {hiddenCount} more {hiddenCount === 1 ? 'error' : 'errors'} not shown. Fix the workbook and re-upload.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Catalog listing ────────────────────────────────────────────────────────

function CatalogSection({
  catalogPage,
  onPageChange,
}: {
  catalogPage:  number;
  onPageChange: (p: number) => void;
}) {
  const { data, isLoading, isError, refetch } =
    useGetCatalogQuery({ page: catalogPage, limit: CATALOG_LIMIT });

  const brandNames = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();
    data.data.forEach((row) => Object.keys(row.prices).forEach((k) => names.add(k)));
    return [...names].sort();
  }, [data]);

  const columns = useMemo<TableColumn<CatalogPricingRow>[]>(() => [
    {
      key:    'variantName',
      header: 'Variant',
      width:  '240px',
      render: (row) => (
        <div className={styles.variantCell}>
          <span className={styles.variantName}>{row.variantName || '—'}</span>
          <span className={styles.variantSub}>{row.carBrand} · {row.carModel}</span>
          {row.period && <span className={styles.variantPeriod}>{row.period}</span>}
        </div>
      ),
    },
    {
      key:    'glassPartType',
      header: 'Glass Part',
      width:  '160px',
    },
    {
      key:    'cc',
      header: 'CC',
      width:  '70px',
      align:  'right',
      render: (row) => <span className={styles.metaVal}>{row.cc != null ? row.cc : '—'}</span>,
    },
    {
      key:    'bodyType',
      header: 'Body',
      width:  '70px',
      render: (row) => <span className={styles.metaVal}>{row.bodyType || '—'}</span>,
    },
    ...brandNames.map((brand) => ({
      key:    `price_${brand}`,
      header: brand,
      align:  'right' as const,
      width:  '90px',
      render: (row: CatalogPricingRow) => {
        const val = row.prices[brand];
        return val != null
          ? <span className={styles.priceVal}>{fmtPrice(val)}</span>
          : <span className={styles.priceNil}>—</span>;
      },
    })),
  ], [brandNames]);

  const total    = data?.total ?? 0;
  const from     = total === 0 ? 0 : (catalogPage - 1) * CATALOG_LIMIT + 1;
  const to       = Math.min(catalogPage * CATALOG_LIMIT, total);
  const hasPages = total > CATALOG_LIMIT;

  const countChip = !isLoading && !isError
    ? <span className={styles.catalogCount}>{total.toLocaleString()} records</span>
    : null;

  return (
    <SectionCard>
      <SectionHeader title="Pricing Catalog" actions={countChip ?? undefined} />

      {isError ? (
        <div className={styles.catalogError}>
          <AlertCircle size={16} className={styles.catalogErrorIcon} />
          <span>Failed to load catalog records.</span>
          <button className={styles.catalogRetry} onClick={() => void refetch()}>Retry</button>
        </div>
      ) : (
        <div className={styles.catalogTableWrap}>
          <DataTable<CatalogPricingRow>
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            emptyMessage="No catalog records yet. Upload a workbook to populate the catalog."
          />
        </div>
      )}

      {!isLoading && !isError && hasPages && (
        <div className={styles.paginationRow}>
          <span className={styles.paginationInfo}>{from}–{to} of {total.toLocaleString()}</span>
          <div className={styles.paginationBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(Math.max(1, catalogPage - 1))}
              disabled={catalogPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => onPageChange(catalogPage + 1)}
              disabled={to >= total}
              aria-label="Next page"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function BulkUploadPage() {
  const toast    = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file,         setFile]         = useState<File | null>(null);
  const [fileError,    setFileError]    = useState<string | null>(null);
  const [uploadState,  setUploadState]  = useState<UploadState>('idle');
  const [uploadResult, setUploadResult] = useState<CatalogUploadResult | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const [catalogPage,  setCatalogPage]  = useState(1);

  const [uploadCatalog, { isLoading: isMutating }] = useUploadCatalogMutation();

  function applyFile(f: File) {
    setFile(f);
    setFileError(validateFile(f));
    setUploadState('idle');
    setUploadResult(null);
    setUploadError(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
    e.target.value = '';
  }

  function handleClear() {
    setFile(null);
    setFileError(null);
    setUploadState('idle');
    setUploadResult(null);
    setUploadError(null);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) applyFile(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload() {
    if (!file || fileError || isMutating) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadState('uploading');
    setUploadResult(null);
    setUploadError(null);

    const result = await uploadCatalog(formData);

    if ('error' in result) {
      const err    = result.error as { status?: number; data?: { message?: string } };
      const status = err?.status;
      let msg: string;
      if (status === 400) {
        const detail = err?.data?.message;
        msg = detail
          ? `Upload rejected: ${detail}`
          : 'The server rejected this file. Please check that you are uploading the correct catalog workbook in .xlsx format with the expected sheet structure.';
      } else if (status === 413) {
        msg = 'The file is too large for the server to accept. Please reduce the workbook size and try again.';
      } else {
        msg = 'Upload failed due to a network or server error. Please check your connection and try again.';
      }
      setUploadState('error');
      setUploadError(msg);
      toast.error('Upload failed');
      return;
    }

    setUploadState('success');
    setUploadResult(result.data);
    setCatalogPage(1);
    const rowErrCount = (result.data.rowErrors ?? []).length;
    if (rowErrCount > 0) {
      toast.warning(`Upload complete — ${rowErrCount} row ${rowErrCount === 1 ? 'error' : 'errors'} found`);
    } else {
      toast.success('Catalog uploaded successfully');
    }
  }

  const canUpload = !!file && !fileError && uploadState !== 'uploading';

  return (
    <PageShell
      heading="Bulk Upload"
      description="Upload a catalog workbook to create or update brands, models, and glass-pricing data in bulk."
    >

      {/* ── Upload section ── */}
      <SectionCard>
        <SectionHeader title="Upload Workbook" />

        <div className={styles.uploadBody}>

          {/* Info list */}
          <div className={styles.infoList}>
            <span className={styles.infoItem}>Accepts a single <strong>.xlsx</strong> workbook</span>
            <span className={styles.infoItem}>Supports: car brands, models, variants, glass part types, and pricing</span>
            <span className={styles.infoItem}>Matching records are <strong>updated</strong>; new entries are <strong>created</strong></span>
            <span className={styles.infoItem}>Invalid rows are skipped and shown in the error report below</span>
          </div>

          {/* Drop zone or animation */}
          {uploadState !== 'uploading' ? (
            <div
              className={[
                styles.dropZone,
                isDragging ? styles.dropZoneDragging : '',
                file       ? styles.dropZoneHasFile  : '',
              ].join(' ')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Drop .xlsx file here or click to browse"
              onClick={() => !file && inputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !file) {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className={styles.hiddenInput}
                onChange={handleInputChange}
                aria-label="Choose .xlsx workbook"
              />
              {!file ? (
                <div className={styles.dropEmpty}>
                  <UploadCloud size={32} className={styles.dropIcon} />
                  <div className={styles.dropTitle}>Drop your workbook here</div>
                  <div className={styles.dropSub}>
                    or{' '}
                    <button type="button" className={styles.browseLink} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                      browse files
                    </button>
                  </div>
                  <div className={styles.dropHint}>.xlsx only · max {MAX_FILE_MB} MB</div>
                </div>
              ) : (
                <div className={styles.fileRow}>
                  <FileSpreadsheet size={26} className={`${styles.fileIcon} ${fileError ? styles.fileIconErr : ''}`} />
                  <div className={styles.fileMeta}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                    {fileError && <div className={styles.fileErr}>{fileError}</div>}
                  </div>
                  <button type="button" className={styles.fileClearBtn} onClick={(e) => { e.stopPropagation(); handleClear(); }} aria-label="Remove selected file">
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            file && <UploadingAnimation fileName={file.name} />
          )}

          {/* Actions */}
          {uploadState !== 'uploading' && (
            <div className={styles.actions}>
              {(uploadState === 'success' || uploadState === 'error') && (
                <Button variant="secondary" onClick={handleClear}>
                  <RefreshCw size={14} /> Upload another file
                </Button>
              )}
              <Button onClick={() => void handleUpload()} disabled={!canUpload}>
                <UploadCloud size={14} /> Upload workbook
              </Button>
            </div>
          )}

          {/* Upload error */}
          {uploadState === 'error' && uploadError && (
            <div className={styles.errorCard}>
              <AlertCircle size={16} className={styles.errorIcon} />
              <div>
                <div className={styles.errorTitle}>Upload failed</div>
                <div className={styles.errorMsg}>{uploadError}</div>
              </div>
            </div>
          )}

          {/* Upload success summary */}
          {uploadState === 'success' && uploadResult && (
            <SuccessResult result={uploadResult} />
          )}

        </div>
      </SectionCard>

      {/* ── Catalog listing ── */}
      <CatalogSection catalogPage={catalogPage} onPageChange={setCatalogPage} />

    </PageShell>
  );
}
