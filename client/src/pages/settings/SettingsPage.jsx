import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Building2, Sliders, Shield, Save, CheckCircle } from 'lucide-react';
import { settingsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const settingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number({ error: 'Threshold must be a valid number' })
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .max(1000000, 'Threshold value is too high'),
});

export const SettingsPage = () => {
  const { organization, user, updateOrganizationContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultLowStockThreshold: 5,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsService.getSettings();
        if (res.success && res.data) {
          reset({
            defaultLowStockThreshold: res.data.defaultLowStockThreshold,
          });
        }
      } catch (err) {
        console.error('Failed to load organization settings:', err);
        setServerError('Could not load settings from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      setServerError('');
      setSuccessMessage('');
      setIsSubmitting(true);
      const res = await settingsService.updateSettings(data);
      if (res.success && res.data) {
        updateOrganizationContext({
          defaultLowStockThreshold: res.data.defaultLowStockThreshold,
        });
        setSuccessMessage('Organization default threshold updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setServerError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading organization settings..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-700" />
          <span>Organization Settings</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure organization-wide default inventory rules and review tenant properties.
        </p>
      </div>

      {serverError && <Alert type="error" message={serverError} onClose={() => setServerError('')} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {/* Tenant Identity Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>Tenant Context</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Organization Name</span>
            <p className="mt-1 text-base font-bold text-slate-900">{organization?.name}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Tenant ID</span>
            <p className="mt-1 font-mono text-xs font-semibold text-slate-700 truncate" title={organization?.id}>
              {organization?.id}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Owner Account</span>
            <p className="mt-1 text-sm font-semibold text-slate-900 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Default Low-Stock Threshold Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-2">
          <Sliders className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Default Low-Stock Threshold
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Global Low-Stock Threshold (Units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              {...register('defaultLowStockThreshold')}
              className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.defaultLowStockThreshold ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.defaultLowStockThreshold && (
              <p className="mt-1 text-xs text-red-500">
                {errors.defaultLowStockThreshold.message}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This threshold applies automatically to all products in your inventory that do not have their own custom threshold configured. When a product's quantity on hand is less than or equal to this value, it will be flagged as Low Stock across the system.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
