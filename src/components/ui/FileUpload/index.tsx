import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFile:   (file: File) => void;
  file:     File | null;
  onClear:  () => void;
  accept?:  string;
  hint?:    string;
  error?:   string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onFile,
  file,
  onClear,
  accept = '.csv,.xlsx',
  hint,
  error,
}: FileUploadProps) {
  const { t } = useTranslation('common');
  const inputRef           = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
    e.target.value = '';
  }

  if (file) {
    return (
      <div className={styles.fileSelected}>
        <FileText size={18} className={styles.fileIcon} />
        <div className={styles.fileMeta}>
          <span className={styles.fileName}>{file.name}</span>
          <span className={styles.fileSize}>{formatBytes(file.size)}</span>
        </div>
        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClear}
          aria-label={t('fileUpload.removeFile')}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${error ? styles.hasError : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label={t('fileUpload.ariaLabel')}
      >
        <Upload size={22} className={styles.dropIcon} />
        <span className={styles.dropText}>
          <strong>{t('fileUpload.clickToBrowse')}</strong> {t('fileUpload.dragAndDrop')}
        </span>
        <span className={styles.dropHint}>{hint ?? t('fileUpload.ariaLabel')}</span>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
