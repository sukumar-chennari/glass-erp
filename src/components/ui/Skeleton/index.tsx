import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?:     string | number;
  height?:    string | number;
  rounded?:   boolean;
  className?: string;
}

export function Skeleton({ width, height = 14, rounded, className }: SkeletonProps) {
  const style: CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
  };
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  return (
    <span
      className={`${styles.block} ${rounded ? styles.rounded : ''} ${className ?? ''}`}
      style={style}
      aria-hidden="true"
    />
  );
}

const ROW_WIDTHS = ['85%', '72%', '65%', '90%', '58%', '78%', '88%', '62%', '80%', '52%'];

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${cols}, 1fr)` };
  return (
    <div className={styles.tableWrap} role="status" aria-label="Loading data">
      <div className={styles.tableHeader} style={gridStyle}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={11} width="55%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow} style={gridStyle}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={14} width={ROW_WIDTHS[(r * cols + c) % ROW_WIDTHS.length]} />
          ))}
        </div>
      ))}
    </div>
  );
}
