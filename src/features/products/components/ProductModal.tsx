import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Product, CreateProductDto, GlassPosition } from '@/types/models/product';
import type { SelectOption } from '@/types/ui';
import styles from './ProductModal.module.css';

const GLASS_POSITIONS: GlassPosition[] = [
  'Front Windshield',
  'Rear Windshield',
  'Driver Side Window',
  'Passenger Side Window',
  'Rear Left Window',
  'Rear Right Window',
  'Sunroof Glass',
  'Quarter Glass',
];

const POSITION_OPTIONS: SelectOption[] = GLASS_POSITIONS.map((p) => ({ value: p, label: p }));

const productSchema = z.object({
  name:              z.string().min(3, 'Product name is required'),
  sku:               z.string().optional(),
  vehicleMake:       z.string().min(1, 'Vehicle make is required'),
  vehicleModel:      z.string().min(1, 'Vehicle model is required'),
  vehicleYear:       z.string().optional(),
  glassPosition:     z.enum(GLASS_POSITIONS as [GlassPosition, ...GlassPosition[]], {
    errorMap: () => ({ message: 'Select a glass position' }),
  }),
  price:             z.coerce.number().positive('Enter a valid price'),
  costPrice:         z.coerce.number().positive('Enter a valid cost price').optional().or(z.literal('')),
  gstRate:           z.coerce.number().min(0).max(100),
  stockQty:          z.coerce.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(1, 'Threshold must be at least 1'),
  vendorId:          z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const GST_OPTIONS: SelectOption[] = [
  { value: '5',  label: '5%'  },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

interface ProductModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (data: CreateProductDto) => Promise<void>;
  product?:     Product | null;
  isSubmitting: boolean;
  vendorOptions: SelectOption[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  isSubmitting,
  vendorOptions,
}: ProductModalProps) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { gstRate: 18, lowStockThreshold: 3 },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        product
          ? {
              name:              product.name,
              sku:               product.sku ?? '',
              vehicleMake:       product.vehicleMake,
              vehicleModel:      product.vehicleModel,
              vehicleYear:       product.vehicleYear ?? '',
              glassPosition:     product.glassPosition,
              price:             product.price,
              costPrice:         product.costPrice ?? '',
              gstRate:           product.gstRate,
              stockQty:          product.stockQty,
              lowStockThreshold: product.lowStockThreshold,
              vendorId:          product.vendorId ?? '',
            }
          : {
              name: '', sku: '', vehicleMake: '', vehicleModel: '',
              vehicleYear: '', glassPosition: undefined,
              price: undefined, costPrice: '',
              gstRate: 18, stockQty: 0, lowStockThreshold: 3, vendorId: '',
            },
      );
    }
  }, [isOpen, product, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    const dto: CreateProductDto = {
      name:              data.name,
      sku:               data.sku || undefined,
      vehicleMake:       data.vehicleMake,
      vehicleModel:      data.vehicleModel,
      vehicleYear:       data.vehicleYear || undefined,
      glassPosition:     data.glassPosition,
      price:             data.price,
      costPrice:         data.costPrice ? Number(data.costPrice) : undefined,
      gstRate:           data.gstRate,
      stockQty:          data.stockQty,
      lowStockThreshold: data.lowStockThreshold,
      vendorId:          data.vendorId || undefined,
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      maxWidth="680px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      }
    >
      <form
        id="product-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Input
          label="Product Name"
          placeholder="e.g. Maruti Suzuki Swift Front Windshield"
          error={errors.name?.message}
          fullWidth
          required
          {...register('name')}
        />

        <div className={styles.row}>
          <Input
            label="SKU"
            placeholder="e.g. MS-SW-FW-001"
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Select
            label="Glass Position"
            options={POSITION_OPTIONS}
            placeholder="Select position"
            error={errors.glassPosition?.message}
            required
            {...register('glassPosition')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label="Vehicle Make"
            placeholder="e.g. Maruti Suzuki"
            error={errors.vehicleMake?.message}
            required
            {...register('vehicleMake')}
          />
          <Input
            label="Vehicle Model"
            placeholder="e.g. Swift"
            error={errors.vehicleModel?.message}
            required
            {...register('vehicleModel')}
          />
          <Input
            label="Year Range"
            placeholder="e.g. 2018-2024"
            error={errors.vehicleYear?.message}
            {...register('vehicleYear')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label="Selling Price (₹)"
            type="number"
            placeholder="0"
            error={errors.price?.message}
            required
            {...register('price')}
          />
          <Input
            label="Cost Price (₹)"
            type="number"
            placeholder="0"
            error={errors.costPrice?.message}
            {...register('costPrice')}
          />
          <Select
            label="GST Rate"
            options={GST_OPTIONS}
            error={errors.gstRate?.message}
            required
            {...register('gstRate')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label="Stock Qty"
            type="number"
            placeholder="0"
            error={errors.stockQty?.message}
            required
            {...register('stockQty')}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            placeholder="3"
            hint="Alert when stock falls below this"
            error={errors.lowStockThreshold?.message}
            required
            {...register('lowStockThreshold')}
          />
          <Select
            label="Vendor (optional)"
            options={vendorOptions}
            placeholder="Select vendor"
            error={errors.vendorId?.message}
            {...register('vendorId')}
          />
        </div>
      </form>
    </Modal>
  );
}
