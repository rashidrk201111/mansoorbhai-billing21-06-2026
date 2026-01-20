import { useEffect, useState } from 'react';
import { supabase, Customer } from '../../lib/supabase';
import { Plus, Search, CreditCard as Edit, Trash2, Mail, Phone, MapPin, Download, List, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerTransactions } from '../CustomerTransactions';

export function Customers() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'transactions'>('list');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    gstin: '',
    opening_balance: '0.00',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // First, get all customers with their invoice summaries
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          invoices:invoices!customer_id(
            amount_paid,
            total,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Process the data to calculate total_balance and amount_paid for each customer
      const processedCustomers = (customersData || []).map(customer => {
        const customerInvoices = customer.invoices || [];
        const totalPaid = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);
        const totalInvoicesAmount = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
        
        // Calculate total amount to be received (invoices total - amount paid + opening balance)
        const openingBalance = parseFloat(customer.opening_balance?.toString() || '0');
        const totalReceivable = (totalInvoicesAmount - totalPaid) + openingBalance;

        // Remove the invoices array from the customer object
        const { invoices, ...customerWithoutInvoices } = customer;
        
        return {
          ...customerWithoutInvoices,
          amount_paid: totalPaid,
          total_balance: totalReceivable,
          total_invoices: totalInvoicesAmount,
          total_due: totalInvoicesAmount - totalPaid
        };
      });

      setCustomers(processedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        state: formData.state || '',
        gstin: formData.gstin || '',
        opening_balance: parseFloat(formData.opening_balance) || 0,
        created_by: profile?.id,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '', state: '', gstin: '', opening_balance: '0.00' });
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      state: customer.state || '',
      gstin: customer.gstin || '',
      opening_balance: customer.opening_balance?.toString() || '0.00',
    });
    setShowModal(true);
    // If we're in details view, stay there after edit
    if (activeTab === 'details') {
      setSelectedCustomer(customer);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'State', 'GSTIN', 'Created Date'];
    const csvData = filteredCustomers.map(customer => [
      customer.name,
      customer.email || '',
      customer.phone || '',
      customer.address || '',
      customer.state || '',
      customer.gstin || '',
      new Date(customer.created_at).toLocaleDateString('en-IN')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center py-8">Loading customers...</div>;
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('details');
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedCustomer(null);
  };

  const handleViewTransactions = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('transactions');
  };

  const handleTransactionAdded = () => {
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      {activeTab !== 'list' && (
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Customers
        </button>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
            title="Export to CSV/Excel"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', email: '', phone: '', address: '', state: '', gstin: '', opening_balance: '0.00' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>
      </div>

      <div className={`${activeTab === 'list' ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-3">{customer.name}</h3>

            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span className="flex-1">{customer.address}</span>
                </div>
              )}
              {customer.state && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">State:</span>
                  <span>{customer.state}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">GSTIN:</span>
                  <span className="font-mono">{customer.gstin}</span>
                </div>
              )}
            </div>

            {/* Financial Information Row */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Opening Balance</span>
                  <span className="text-sm font-medium">
                    ₹{parseFloat(customer.opening_balance?.toString() || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Total Invoices</span>
                  <span className="text-sm font-medium">
                    ₹{(customer.total_invoices || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Paid Amount</span>
                  <span className="text-sm font-medium text-green-600">
                    ₹{(customer.amount_paid || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Invoice Balance</span>
                  <span className="text-sm font-medium">
                    ₹{(customer.total_due || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Receivable:</span>
                  <span className={`text-sm font-bold ${(customer.total_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.abs(customer.total_balance || 0).toFixed(2)}
                    {(customer.total_balance || 0) > 0 ? ' (To Receive)' : ' (Advance)'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                <button
                  onClick={() => handleViewDetails(customer)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <User className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => handleViewTransactions(customer)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <List className="w-4 h-4" />
                  Transactions
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details View */}
      {activeTab === 'details' && selectedCustomer && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-slate-500">Customer Details</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedCustomer)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Edit Customer"
              >
                <Edit className="w-5 h-5" />
              </button>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => handleDelete(selectedCustomer.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Customer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {selectedCustomer.email && (
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-slate-900">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="text-slate-900">{selectedCustomer.phone}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="text-slate-900 whitespace-pre-line">{selectedCustomer.address}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Business Information</h3>
              <div className="space-y-3">
                {selectedCustomer.gstin && (
                  <div>
                    <p className="text-sm text-slate-500">GSTIN</p>
                    <p className="font-mono text-slate-900">{selectedCustomer.gstin}</p>
                  </div>
                )}
                {selectedCustomer.state && (
                  <div>
                    <p className="text-sm text-slate-500">State</p>
                    <p className="text-slate-900">{selectedCustomer.state}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Member Since</p>
                  <p className="text-slate-900">
                    {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Opening Balance</p>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{parseFloat(selectedCustomer.opening_balance?.toString() || '0').toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{(selectedCustomer.total_invoices || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Amount Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  ₹{(selectedCustomer.amount_paid || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Balance</p>
                <p className={`text-lg font-semibold ${(selectedCustomer.total_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(selectedCustomer.total_balance || 0).toFixed(2)}
                  {(selectedCustomer.total_balance || 0) > 0 ? ' (To Receive)' : ' (Advance)'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => handleViewTransactions(selectedCustomer)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              View Transactions
            </button>
          </div>
        </div>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && selectedCustomer && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h2>
            <p className="text-slate-500">Transaction History</p>
          </div>
          
          <CustomerTransactions 
            customerId={selectedCustomer.id} 
            onTransactionAdded={handleTransactionAdded} 
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g., 29ABCDE1234F1Z5"
                    maxLength={15}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
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
    </div>
  );
}
