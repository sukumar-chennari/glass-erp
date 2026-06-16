import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { glassPositionKey } from '@/i18n/statusKeys';
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

const GST_OPTIONS: SelectOption[] = [
  { value: '5',  label: '5%'  },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

interface ProductFormData {
  name: string;
  sku?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: string;
  glassPosition: GlassPosition;
  price: number;
  costPrice?: number | '';
  gstRate: number;
  stockQty: number;
  lowStockThreshold: number;
  vendorId?: string;
}

interface ProductModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  onSubmit:      (data: CreateProductDto) => Promise<void>;
  product?:      Product | null;
  isSubmitting:  boolean;
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
  const { t } = useTranslation(['products', 'common']);
  const isEdit = !!product;

  const productSchema = useMemo(() => z.object({
    name:              z.string().min(3, t('form.errors.nameRequired')),
    sku:               z.string().optional(),
    vehicleMake:       z.string().min(1, t('form.errors.vehicleMakeRequired')),
    vehicleModel:      z.string().min(1, t('form.errors.vehicleModelRequired')),
    vehicleYear:       z.string().optional(),
    glassPosition:     z.enum(GLASS_POSITIONS as [GlassPosition, ...GlassPosition[]], {
      errorMap: () => ({ message: t('form.errors.selectPosition') }),
    }),
    price:             z.coerce.number().positive(t('form.errors.priceInvalid')),
    costPrice:         z.coerce.number().positive(t('form.errors.costPriceInvalid')).optional().or(z.literal('')),
    gstRate:           z.coerce.number().min(0).max(100),
    stockQty:          z.coerce.number().int().min(0, t('form.errors.stockNegative')),
    lowStockThreshold: z.coerce.number().int().min(1, t('form.errors.thresholdMin')),
    vendorId:          z.string().optional(),
  }), [t]);

  const positionOptions: SelectOption[] = GLASS_POSITIONS.map((p) => ({
    value: p,
    label: t(`glassPositions.${glassPositionKey(p)}`),
  }));

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
      title={isEdit ? t('form.title.edit') : t('form.title.add')}
      maxWidth="680px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="product-form" loading={isSubmitting}>
            {isEdit ? t('actions.saveChanges') : t('form.title.add')}
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
          label={t('form.name')}
          placeholder={t('form.placeholders.name')}
          error={errors.name?.message}
          fullWidth
          required
          {...register('name')}
        />

        <div className={styles.row}>
          <Input
            label={t('form.sku')}
            placeholder={t('form.placeholders.sku')}
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Select
            label={t('form.glassPosition')}
            options={positionOptions}
            placeholder={t('placeholders.select')}
            error={errors.glassPosition?.message}
            required
            {...register('glassPosition')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label={t('form.vehicleMake')}
            placeholder={t('form.placeholders.vehicleMake')}
            error={errors.vehicleMake?.message}
            required
            {...register('vehicleMake')}
          />
          <Input
            label={t('form.vehicleModel')}
            placeholder={t('form.placeholders.vehicleModel')}
            error={errors.vehicleModel?.message}
            required
            {...register('vehicleModel')}
          />
          <Input
            label={t('form.vehicleYear')}
            placeholder={t('form.placeholders.vehicleYear')}
            error={errors.vehicleYear?.message}
            {...register('vehicleYear')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label={t('form.price')}
            type="number"
            placeholder="0"
            error={errors.price?.message}
            required
            {...register('price')}
          />
          <Input
            label={t('form.costPrice')}
            type="number"
            placeholder="0"
            error={errors.costPrice?.message}
            {...register('costPrice')}
          />
          <Select
            label={t('form.gstRate')}
            options={GST_OPTIONS}
            error={errors.gstRate?.message}
            required
            {...register('gstRate')}
          />
        </div>

        <div className={styles.row3}>
          <Input
            label={t('form.stockQty')}
            type="number"
            placeholder="0"
            error={errors.stockQty?.message}
            required
            {...register('stockQty')}
          />
          <Input
            label={t('form.lowStockThreshold')}
            type="number"
            placeholder="3"
            hint={t('form.hints.lowStockThreshold')}
            error={errors.lowStockThreshold?.message}
            required
            {...register('lowStockThreshold')}
          />
          <Select
            label={t('form.vendor')}
            options={vendorOptions}
            placeholder={t('placeholders.select')}
            error={errors.vendorId?.message}
            {...register('vendorId')}
          />
        </div>
      </form>
    </Modal>
  );
}
