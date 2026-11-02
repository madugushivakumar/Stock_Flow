import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  SlidersHorizontal,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import { productService } from '../../services/api';
import { ProductFormModal } from './ProductFormModal';
import { StockAdjustModal } from './StockAdjustModal';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setError('');
      const res = await productService.getProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.message || 'Failed to load products list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle URL param ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setProductToEdit(null);
      setIsFormModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Client-side search and filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query));

      const matchesLowStock = !filterLowStockOnly || p.isLowStock;

      return matchesSearch && matchesLowStock;
    });
  }, [products, searchQuery, filterLowStockOnly]);

  // Handle Create or Update
  const handleSaveProduct = async (formData, id) => {
    if (id) {
      await productService.updateProduct(id, formData);
      setSuccessMessage(`Product "${formData.name}" updated successfully.`);
    } else {
      await productService.createProduct(formData);
      setSuccessMessage(`Product "${formData.name}" added to inventory.`);
    }
    await fetchProducts();
  };

  // Handle Stock Adjustment
  const handleAdjustStock = async (id, adjustment, note) => {
    await productService.adjustStock(id, { adjustment, note });
    setSuccessMessage(`Stock adjusted successfully.`);
    await fetchProducts();
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await productService.deleteProduct(productToDelete.id);
      setSuccessMessage(`Product "${productToDelete.name}" deleted.`);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading products catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Products & Inventory
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Maintain catalog items, track on-hand stock quantities, and manage low-stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchProducts(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Refresh product list"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProductToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              filterLowStockOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
              <Package className="h-8 w-8" />
            </div>
            {searchQuery || filterLowStockOnly ? (
              <>
                <h3 className="text-base font-semibold text-slate-900">No matching products found</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  Try adjusting your search query or clear the active filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterLowStockOnly(false);
                  }}
                  className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-slate-900">No products in inventory yet</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  Start tracking your inventory by adding your organization's first product.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProductToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Product</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Product Name</th>
                  <th scope="col" className="px-6 py-3.5">SKU</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Quantity on Hand</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Threshold</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Selling Price</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    {/* Name & description */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={p.description}>
                          {p.description}
                        </div>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-slate-700">
                      {p.sku}
                    </td>

                    {/* Quantity on Hand */}
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className={`inline-block font-bold text-sm px-2 py-0.5 rounded ${
                        p.isLowStock ? 'bg-red-50 text-red-700' : 'text-slate-900'
                      }`}>
                        {p.quantityOnHand}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      {p.isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* Low Stock Threshold */}
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-600">
                      <span>{p.effectiveThreshold}</span>
                      {p.lowStockThreshold === null && (
                        <span className="ml-1 text-[10px] text-slate-400">(Default)</span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-800">
                      {p.sellingPrice !== null && p.sellingPrice !== undefined
                        ? `$${Number(p.sellingPrice).toFixed(2)}`
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>

                    {/* Available Actions */}
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Quick Stock Adjustment */}
                        <button
                          type="button"
                          onClick={() => {
                            setProductToAdjust(p);
                            setIsAdjustModalOpen(true);
                          }}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition"
                          title="Adjust stock quantity"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </button>

                        {/* Edit Action */}
                        <button
                          type="button"
                          onClick={() => {
                            setProductToEdit(p);
                            setIsFormModalOpen(true);
                          }}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Edit product"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => {
                            setProductToDelete(p);
                            setIsDeleteModalOpen(true);
                          }}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Adjust Stock Modal */}
      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setProductToAdjust(null);
        }}
        product={productToAdjust}
        onAdjust={handleAdjustStock}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        title="Confirm Product Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-slate-900">{productToDelete?.name}</span> (SKU: {productToDelete?.sku})?
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            Warning: This action will permanently remove the product from your organization's inventory catalog.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setProductToDelete(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {isDeleting && (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              <span>Delete Product</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
