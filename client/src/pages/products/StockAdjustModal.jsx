import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { Plus, Minus, ArrowRight } from 'lucide-react';

export const StockAdjustModal = ({ isOpen, onClose, product, onAdjust }) => {
  const [adjustment, setAdjustment] = useState('');
  const [note, setNote] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const currentQty = product.quantityOnHand;
  const parsedAdjustment = parseInt(adjustment, 10) || 0;
  const newQty = currentQty + parsedAdjustment;
  const isNegative = newQty < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedAdjustment === 0) {
      setServerError('Adjustment amount cannot be zero.');
      return;
    }
    if (isNegative) {
      setServerError(`Cannot reduce quantity below 0. Current is ${currentQty}.`);
      return;
    }

    try {
      setServerError('');
      setIsSubmitting(true);
      await onAdjust(product.id, parsedAdjustment, note);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to adjust stock';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDelta = (delta) => {
    setAdjustment(delta.toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock - ${product.name}`}>
      {serverError && (
        <Alert type="error" message={serverError} onClose={() => setServerError('')} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current vs New Quantity Preview */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</span>
            <p className="text-2xl font-bold text-slate-900">{currentQty}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Quantity</span>
            <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
              {newQty}
            </p>
          </div>
        </div>

        {/* Quick adjustment buttons */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Quick Adjust
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 5, 10, 25].map((amt) => (
              <button
                key={`add-${amt}`}
                type="button"
                onClick={() => setDelta(amt)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                <Plus className="h-3 w-3" />
                {amt}
              </button>
            ))}
            {[-1, -5, -10].map((amt) => (
              <button
                key={`sub-${amt}`}
                type="button"
                onClick={() => setDelta(amt)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition"
              >
                <Minus className="h-3 w-3" />
                {Math.abs(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Input adjustment */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Adjustment Amount (+ or -) *
          </label>
          <input
            type="number"
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            placeholder="e.g. +10 or -5"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Reason / Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Received shipment, returned item, or damaged goods"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
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
            disabled={isSubmitting || parsedAdjustment === 0 || isNegative}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            {isSubmitting && (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            <span>Confirm Adjustment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
