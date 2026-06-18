import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { ProductTable } from './components/ProductTable';
import { ProductModal } from './components/ProductModal';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from './services/productsApi';
import { useGetVendorsQuery } from '@/features/vendors/services/vendorsApi';
import type { Product, CreateProductDto } from '@/types/models/product';
import type { SelectOption } from '@/types/ui';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const { data: products = [], isLoading } = useGetProductsQuery();
  const { data: vendors = [] } = useGetVendorsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const toast = useToast();
  const { t } = useTranslation(['products', 'common']);

  const [modalOpen, setModalOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<string | null>(null);

  const vendorOptions = useMemo<SelectOption[]>(
    () => vendors.map((v) => ({ value: v.id, label: v.companyName })),
    [vendors],
  );

  const openAdd  = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product: Product) => { setEditingProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingProduct(null); };

  const handleSubmit = async (data: CreateProductDto) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, ...data }).unwrap();
        toast.success(t('messages.updated'));
      } else {
        await createProduct(data).unwrap();
        toast.success(t('messages.added'));
      }
      closeModal();
    } catch {
      toast.error(t('messages.saveFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget).unwrap();
      toast.success(t('messages.removed'));
    } catch {
      toast.error(t('messages.removeFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          {t('form.title.add')}
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? t('table.loading') : t('count', { count: products.length })}
          </span>
        </div>

        <ProductTable
          products={products}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <ProductModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        product={editingProduct}
        isSubmitting={creating || updating}
        vendorOptions={vendorOptions}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={t('messages.confirmDelete')}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
