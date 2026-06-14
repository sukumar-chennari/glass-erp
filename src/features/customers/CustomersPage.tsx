import { useState } from 'react';
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
        toast.success('Customer updated');
      } else {
        await createCustomer(data).unwrap();
        toast.success('Customer added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save customer');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget).unwrap();
      toast.success('Customer removed');
    } catch {
      toast.error('Failed to remove customer');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Customers"
      description="Customer directory with vehicle and service history."
      actions={
        <Button leftIcon={<UserPlus size={16} />} onClick={openAdd}>
          Add Customer
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading
              ? 'Loading…'
              : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
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
        message="Remove this customer? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
