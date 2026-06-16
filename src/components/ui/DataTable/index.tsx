import { useTranslation } from 'react-i18next';
import type { TableColumn } from '@/types/ui';
import styles from './DataTable.module.css';

interface DataTableProps<T extends { id: string }> {
  columns:       TableColumn<T>[];
  data:          T[];
  isLoading?:    boolean;
  emptyMessage?: string;
  onRowClick?:   (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading    = false,
  emptyMessage,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useTranslation('common');
  const noDataMsg = emptyMessage ?? t('table.noData');
  const SKELETON_ROWS = 5;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                scope="col"
                key={String(col.key)}
                className={`${styles.th} ${col.align === 'right' ? styles.right : ''} ${
                  col.align === 'center' ? styles.center : ''
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
              <tr key={rowIdx} className={`${styles.tr} ${styles.loadingRow}`}>
                {columns.map((col) => (
                  <td key={String(col.key)} className={styles.td}>
                    <div className={styles.skeleton} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr className={styles.emptyRow}>
              <td colSpan={columns.length}>{noDataMsg}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className={styles.tr}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`${styles.td} ${col.align === 'right' ? styles.right : ''} ${
                      col.align === 'center' ? styles.center : ''
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
