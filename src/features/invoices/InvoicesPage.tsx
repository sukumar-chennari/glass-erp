import { useState } from 'react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceStatusModal } from './components/InvoiceStatusModal';
import {
  useGetInvoicesQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from './services/invoicesApi';
import type { Invoice, UpdateInvoiceDto } from '@/types/models/invoice';
import styles from './InvoicesPage.module.css';

export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useGetInvoicesQuery();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]           = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<'customer' | 'vendor'>('customer');

  const openEdit   = (inv: Invoice) => { setEditingInvoice(inv); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingInvoice(null); };

  const handleUpdate = async (dto: UpdateInvoiceDto) => {
    if (!editingInvoice) return;
    try {
      await updateInvoice({ id: editingInvoice.id, ...dto }).unwrap();
      toast.success('Invoice updated');
      closeModal();
    } catch {
      toast.error('Failed to update invoice');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvoice(deleteTarget).unwrap();
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Invoices"
      description="Customer billing and payment tracking."
    >
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'customer' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          Customer Invoices
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'vendor' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('vendor')}
        >
          Vendor Invoices
        </button>
      </div>

      <SectionCard>
        {activeTab === 'customer' ? (
          <>
            <div className={styles.tableHeader}>
              <span className={styles.count}>
                {isLoading
                  ? 'Loading…'
                  : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <InvoiceTable
              invoices={invoices}
              isLoading={isLoading}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          </>
        ) : (
          <div className={styles.emptyTab}>
            <p className={styles.emptyTitle}>No vendor invoices yet</p>
            <p className={styles.emptyHint}>Vendor billing will appear here once integrated.</p>
          </div>
        )}
      </SectionCard>

      <InvoiceStatusModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleUpdate}
        invoice={editingInvoice}
        isSubmitting={updating}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Delete this invoice? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
