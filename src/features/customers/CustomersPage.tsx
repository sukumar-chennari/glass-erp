import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { CustomerTable } from './components/CustomerTable';
import { CustomerModal } from './components/CustomerModal';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from './services/customersApi';
import type { Customer, CreateCustomerDto } from '@/types/models/customer';
import styles from './CustomersPage.module.css';

export function CustomersPage() {
  const { data: customers = [], isLoading } = useGetCustomersQuery();
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation();
  const toast = useToast();
  const { t } = useTranslation(['customers', 'common']);

  const [modalOpen, setModalOpen]             = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<string | null>(null);

  const openAdd  = () => { setEditingCustomer(null); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditingCustomer(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingCustomer(null); };

  const handleSubmit = async (data: CreateCustomerDto) => {
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, ...data }).unwrap();
        toast.success(t('messages.updated'));
      } else {
        await createCustomer(data).unwrap();
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
      await deleteCustomer(deleteTarget).unwrap();
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
        <Button leftIcon={<UserPlus size={16} />} onClick={openAdd}>
          {t('form.title.add')}
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? t('table.loading') : t('count', { count: customers.length })}
          </span>
        </div>

        <CustomerTable
          customers={customers}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <CustomerModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        customer={editingCustomer}
        isSubmitting={creating || updating}
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
