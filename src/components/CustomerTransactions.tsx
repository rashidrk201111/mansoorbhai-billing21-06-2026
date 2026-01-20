import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Trash2, Edit2, ArrowDown, ArrowUp, X } from 'lucide-react';
import { formatINR } from '../lib/currency';

interface CustomerTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'payment' | 'opening_balance' | 'invoice_payment' | 'credit_note' | 'other';
  reference: string;
  notes: string | null;
  created_at: string;
  created_by: string;
  invoice_id?: string | null;
  payment_method_id?: string | null;
  payment_method?: { name: string } | null;
}

interface CustomerTransactionsProps {
  customerId: string;
  onTransactionAdded: () => void;
}

export function CustomerTransactions({ customerId, onTransactionAdded }: CustomerTransactionsProps) {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'payment' as const,
    reference: '',
    notes: '',
    payment_method_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [editingTransaction, setEditingTransaction] = useState<CustomerTransaction | null>(null);

  useEffect(() => {
    loadTransactions();
    loadPaymentMethods();
  }, [customerId]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_transactions')
        .select(`
          *,
          payment_method:payment_methods(name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionData = {
        customer_id: customerId,
        amount: parseFloat(formData.amount),
        type: formData.type,
        reference: formData.reference,
        notes: formData.notes || null,
        payment_method_id: formData.payment_method_id || null,
        transaction_date: formData.transaction_date,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('customer_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_transactions')
          .insert([transactionData]);
        
        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingTransaction(null);
      setFormData({
        amount: '',
        type: 'payment',
        reference: '',
        notes: '',
        payment_method_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      
      loadTransactions();
      onTransactionAdded();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const { error } = await supabase
        .from('customer_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      loadTransactions();
      onTransactionAdded();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction: ' + (error as Error).message);
    }
  };

  const handleEdit = (transaction: CustomerTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      reference: transaction.reference,
      notes: transaction.notes || '',
      payment_method_id: transaction.payment_method_id || '',
      transaction_date: transaction.created_at.split('T')[0]
    });
    setShowAddModal(true);
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'opening_balance':
        return 'Opening Balance';
      case 'invoice_payment':
        return 'Invoice Payment';
      case 'credit_note':
        return 'Credit Note';
      case 'other':
        return 'Other';
      default:
        return 'Payment';
    }
  };

  const calculateRunningBalance = () => {
    return transactions.reduce((sum, txn) => sum + txn.amount, 0);
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading transactions...</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Transaction History</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reference
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Balance
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => {
                  const isCredit = transaction.amount >= 0;
                  const runningBalance = transactions
                    .slice(0, index + 1)
                    .reduce((sum, txn) => sum + txn.amount, 0);
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {getTransactionTypeLabel(transaction.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {transaction.reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {transaction.payment_method?.name || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-end">
                          {isCredit ? (
                            <ArrowDown className="w-4 h-4 mr-1 text-green-500" />
                          ) : (
                            <ArrowUp className="w-4 h-4 mr-1 text-red-500" />
                          )}
                          {formatINR(Math.abs(transaction.amount))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-slate-900">
                        {formatINR(runningBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-700">
                    Current Balance:
                  </td>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold">
                    {formatINR(calculateRunningBalance())}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTransaction(null);
                }}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="payment">Payment</option>
                    <option value="opening_balance">Opening Balance</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method_id}
                    onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., Receipt #123, Bank Transfer, etc."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about this transaction..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
