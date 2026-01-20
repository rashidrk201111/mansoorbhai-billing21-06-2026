import { useEffect, useState } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { Plus, Search, CreditCard as Edit, Trash2, AlertTriangle, Barcode, Download, X as XIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR } from '../../lib/currency';
import { BarcodeLabel } from '../barcode/BarcodeLabel';

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export function Inventory() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    cost_price: '',
    selling_price: '',
    quantity: '',
    reorder_level: '',
    unit: 'piece',
    hsn_code: '',
    gst_rate: '18',
    color: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('inventory_type', 'raw_material')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseFloat(formData.quantity),
        reorder_level: parseFloat(formData.reorder_level),
        unit: formData.unit,
        hsn_code: formData.hsn_code || '',
        gst_rate: parseFloat(formData.gst_rate),
        color: formData.color || null,
        created_by: profile?.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        reorder_level: '',
        hsn_code: '',
        gst_rate: '18',
        color: '',
      });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      quantity: product.quantity.toString(),
      reorder_level: product.reorder_level.toString(),
      unit: product.unit || 'piece',
      hsn_code: product.hsn_code || '',
      gst_rate: product.gst_rate?.toString() || '18',
      color: product.color || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const getStockStatus = (product: Product): 'out_of_stock' | 'low_stock' | 'in_stock' => {
    if (product.quantity === 0) return 'out_of_stock';
    if (product.quantity <= product.reorder_level) return 'low_stock';
    return 'in_stock';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (stockFilter === 'all') return true;

    const status = getStockStatus(product);
    return status === stockFilter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  const totalItems = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.reorder_level).length;
  const inStockCount = products.filter(p => p.quantity > p.reorder_level).length;

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Stock Alert!</p>
            <p className="text-sm">{notification}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-white hover:bg-red-700 rounded p-1"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (filteredProducts.length === 0) {
                alert('No products to download');
                return;
              }
              const csv = [
                ['Product Name', 'SKU', 'HSN Code', 'Color', 'Cost Price', 'Selling Price', 'GST %', 'Quantity', 'Unit', 'Reorder Level', 'Status'],
                ...filteredProducts.map(p => [
                  p.name,
                  p.sku,
                  p.hsn_code || '',
                  p.color || '',
                  p.cost_price,
                  p.selling_price,
                  p.gst_rate,
                  p.quantity,
                  p.unit,
                  p.reorder_level,
                  p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.reorder_level ? 'Low Stock' : 'In Stock'
                ])
              ].map(row => row.join(',')).join('\n');

              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            <Download className="w-5 h-5" />
            Download CSV
          </button>
          <button
            onClick={() => {
              if (filteredProducts.length === 0) {
                alert('No products to print barcodes for');
                return;
              }
              setSelectedProducts(filteredProducts);
              setShowBarcodeModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            <Barcode className="w-5 h-5" />
            Print Barcodes
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                description: '',
                sku: '',
                cost_price: '',
                selling_price: '',
                quantity: '',
                reorder_level: '',
                unit: 'piece',
                hsn_code: '',
                gst_rate: '18',
                color: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">Total Inventory Items</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalItems.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Unique Products</p>
            <p className="text-2xl font-semibold text-blue-600">{filteredProducts.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setStockFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            stockFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400'
          }`}
        >
          All Products ({products.length})
        </button>
        <button
          onClick={() => setStockFilter('in_stock')}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            stockFilter === 'in_stock'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-green-400'
          }`}
        >
          In Stock ({inStockCount})
        </button>
        <button
          onClick={() => setStockFilter('low_stock')}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            stockFilter === 'low_stock'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-orange-400'
          }`}
        >
          Low Stock ({lowStockCount})
        </button>
        <button
          onClick={() => setStockFilter('out_of_stock')}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            stockFilter === 'out_of_stock'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
          }`}
        >
          Out of Stock ({outOfStockCount})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">SKU / HSN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cost Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">GST %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{product.sku}</div>
                    {product.hsn_code && (
                      <div className="text-xs text-slate-500">HSN: {product.hsn_code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{formatINR(product.cost_price)}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{formatINR(product.selling_price)}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{product.gst_rate}%</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {product.quantity} <span className="text-slate-500">{product.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.quantity === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                        <AlertTriangle className="w-3 h-3" />
                        Out of Stock
                      </span>
                    ) : product.quantity <= product.reorder_level ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedProducts([product]);
                          setShowBarcodeModal(true);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                        title="Print Barcode"
                      >
                        <Barcode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {profile?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Red, Blue, Black"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    placeholder="e.g., 6109"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GST Rate (%)</label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cost Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Selling Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);

                      if (value === '' || numValue >= 0) {
                        setFormData({ ...formData, quantity: value });

                        if (numValue === 0 && editingProduct && editingProduct.quantity > 0) {
                          setNotification(`${formData.name || 'Product'} stock has reached zero!`);
                          setTimeout(() => setNotification(null), 5000);
                        }
                      }
                    }}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="meter">Meter (m)</option>
                    <option value="centimeter">Centimeter (cm)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="milliliter">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="packet">Packet</option>
                    <option value="dozen">Dozen</option>
                    <option value="set">Set</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBarcodeModal && (
        <BarcodeLabel
          products={selectedProducts}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </div>
  );
}
