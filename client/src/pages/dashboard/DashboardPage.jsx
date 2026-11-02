import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2,
  Building2
} from 'lucide-react';
import { dashboardService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';

export const DashboardPage = () => {
  const { organization } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError('');
      const res = await dashboardService.getSummary();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError(err.response?.data?.message || 'Could not load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading inventory dashboard..." />;
  }

  const { totalProducts = 0, totalQuantityOnHand = 0, lowStockCount = 0, lowStockItems = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <Building2 className="w-3 h-3" />
              {organization?.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time stock levels and threshold alerts for your organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/products?new=1"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Products */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Products
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalProducts.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Active catalog items</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Quantity on Hand */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Quantity on Hand
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalQuantityOnHand.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Units in storage</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Layers className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Products */}
        <div className={`relative overflow-hidden rounded-xl border p-6 shadow-sm hover:shadow-md transition ${
          lowStockCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Low Stock Products
              </p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${
                lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {lowStockCount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {lowStockCount > 0 ? 'Requires immediate restock' : 'All items sufficiently stocked'}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <h2 className="text-base font-semibold text-slate-900">
              Low Stock Items
            </h2>
            {lowStockCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {lowStockCount}
              </span>
            )}
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <span>View all products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {lowStockItems.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              All inventory levels are healthy
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              No products are currently at or below their low-stock thresholds.
            </p>
          </div>
        ) : (
          /* Low Stock Table */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Product Name</th>
                  <th scope="col" className="px-6 py-3">SKU</th>
                  <th scope="col" className="px-6 py-3 text-right">Quantity on Hand</th>
                  <th scope="col" className="px-6 py-3 text-right">Effective Threshold</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 font-semibold">
                      {item.sku}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-sm">
                        {item.quantityOnHand}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">
                      {item.effectiveThreshold}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        Low Stock
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        to="/products"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
