import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { STOCK_STATUS_MAP, STOCK_STATUS } from '@/constants/statuses';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { Product } from '@/types/models/product';
import styles from './ProductTable.module.css';

interface ProductTableProps {
  products:  Product[];
  isLoading: boolean;
  onEdit:    (product: Product) => void;
  onDelete:  (id: string) => void;
}

export function ProductTable({ products, isLoading, onEdit, onDelete }: ProductTableProps) {
  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className={styles.nameCell}>
          <span className={styles.productName}>{p.name}</span>
          {p.sku && <span className={styles.sku}>{p.sku}</span>}
        </div>
      ),
    },
    {
      key: 'vehicleMake',
      header: 'Vehicle',
      render: (p) => (
        <div className={styles.vehicleCell}>
          <span className={styles.vehicle}>{p.vehicleMake} {p.vehicleModel}</span>
          {p.vehicleYear && <span className={styles.vehicleYear}>{p.vehicleYear}</span>}
        </div>
      ),
    },
    {
      key: 'glassPosition',
      header: 'Position',
      width: '160px',
    },
    {
      key: 'price',
      header: 'Price (incl. GST)',
      align: 'right',
      width: '140px',
      render: (p) => (
        <span className={styles.price}>
          {formatINR(p.price * (1 + p.gstRate / 100))}
        </span>
      ),
    },
    {
      key: 'stockQty',
      header: 'Stock',
      align: 'center',
      width: '80px',
      render: (p) => (
        <span
          className={`${styles.stockQty} ${
            p.stockStatus === STOCK_STATUS.OUT_OF_STOCK
              ? styles.stockOut
              : p.stockStatus === STOCK_STATUS.LOW_STOCK
              ? styles.stockLow
              : ''
          }`}
        >
          {p.stockQty}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Status',
      width: '120px',
      render: (p) => <StatusBadge status={p.stockStatus} statusMap={STOCK_STATUS_MAP} />,
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (p) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Edit product"
            onClick={(e) => { e.stopPropagation(); onEdit(p); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete product"
            onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      emptyMessage="No products found. Add your first glass product."
    />
  );
}
