import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name cannot exceed 200 characters'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(100, 'SKU cannot exceed 100 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  quantityOnHand: z.coerce
    .number({ error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  costPrice: z
    .union([z.coerce.number().min(0, 'Cost price cannot be negative'), z.nan(), z.literal('')])
    .optional()
    .transform((val) => (isNaN(val) || val === '' ? null : Number(val))),
  sellingPrice: z
    .union([z.coerce.number().min(0, 'Selling price cannot be negative'), z.nan(), z.literal('')])
    .optional()
    .transform((val) => (isNaN(val) || val === '' ? null : Number(val))),
  lowStockThreshold: z
    .union([
      z.coerce.number().int('Threshold must be an integer').min(0, 'Threshold cannot be negative'),
      z.nan(),
      z.literal(''),
    ])
    .optional()
    .transform((val) => (isNaN(val) || val === '' ? null : Number(val))),
});

export const ProductFormModal = ({ isOpen, onClose, onSave, productToEdit = null }) => {
  const { organization } = useAuth();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      quantityOnHand: 0,
      costPrice: '',
      sellingPrice: '',
      lowStockThreshold: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setServerError('');
      if (productToEdit) {
        reset({
          name: productToEdit.name || '',
          sku: productToEdit.sku || '',
          description: productToEdit.description || '',
          quantityOnHand: productToEdit.quantityOnHand ?? 0,
          costPrice: productToEdit.costPrice !== null && productToEdit.costPrice !== undefined ? productToEdit.costPrice : '',
          sellingPrice: productToEdit.sellingPrice !== null && productToEdit.sellingPrice !== undefined ? productToEdit.sellingPrice : '',
          lowStockThreshold:
            productToEdit.lowStockThreshold !== null && productToEdit.lowStockThreshold !== undefined
              ? productToEdit.lowStockThreshold
              : '',
        });
      } else {
        reset({
          name: '',
          sku: '',
          description: '',
          quantityOnHand: 0,
          costPrice: '',
          sellingPrice: '',
          lowStockThreshold: '',
        });
      }
    }
  }, [isOpen, productToEdit, reset]);

  const onSubmit = async (data) => {
    try {
      setServerError('');
      setIsSubmitting(true);
      await onSave(data, productToEdit?.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product' : 'Add New Product'}
      maxWidth="max-w-xl"
    >
      {serverError && (
        <Alert type="error" message={serverError} onClose={() => setServerError('')} className="mb-4" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name and SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ergonomic Office Chair"
              {...register('name')}
              className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              placeholder="e.g. CHR-001"
              {...register('sku')}
              className={`block w-full rounded-lg border px-3 py-2 text-sm uppercase text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.sku ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Optional item details or notes..."
            {...register('description')}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quantity and Low Stock Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Quantity on Hand *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              {...register('quantityOnHand')}
              className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.quantityOnHand ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.quantityOnHand && (
              <p className="mt-1 text-xs text-red-500">{errors.quantityOnHand.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={`Org Default (${defaultThreshold})`}
              {...register('lowStockThreshold')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Leave blank to use organization default ({defaultThreshold}).
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Cost Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register('costPrice')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Selling Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register('sellingPrice')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition"
          >
            {isSubmitting && (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
