import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, Receipt, Download } from 'lucide-react';
import { formatCurrency, exportToCSV } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TransactionCategory, PaymentMode } from '../types';

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Electricity', 'Water', 'Internet', 'Maintenance', 'Groceries', 'Salary', 'Other'
];

export function Expenses() {
  const { currentPg, transactions, addTransaction, deleteTransaction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Form State
  const [category, setCategory] = useState<TransactionCategory>('Electricity');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState('');

  if (!currentPg) return null;

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));

  const expenseTransactions = transactions.filter(t => 
    t.pgId === currentPg.id && 
    t.type === 'EXPENSE'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentMonthExpenses = expenseTransactions.filter(t => 
    isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );

  const totalMonthlyExpense = currentMonthExpenses.reduce((acc, t) => acc + t.amount, 0);

  const handleExport = () => {
    const exportData = currentMonthExpenses.map(tx => ({
      Date: format(parseISO(tx.date), 'yyyy-MM-dd'),
      Category: tx.category,
      Amount: tx.amount,
      Mode: tx.paymentMode,
      Notes: tx.notes || ''
    }));
    exportToCSV(exportData, `Expenses_Report_${selectedMonth}.csv`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      type: 'EXPENSE',
      category,
      amount: parseFloat(amount),
      date,
      paymentMode,
      notes
    });
    setIsModalOpen(false);
    setCategory('Electricity'); setAmount(''); setDate(format(new Date(), 'yyyy-MM-dd')); setPaymentMode('UPI'); setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
          <p className="text-slate-500">Track your PG expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Month:</label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-slate-900 border-none text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-300">
              <Receipt className="w-5 h-5" />
              <h3 className="font-medium">Expenses in {format(parseISO(`${selectedMonth}-01`), 'MMM yyyy')}</h3>
            </div>
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalMonthlyExpense)}</p>
            
            <div className="mt-8 space-y-3">
              {EXPENSE_CATEGORIES.map(cat => {
                const catTotal = currentMonthExpenses.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0);
                if (catTotal === 0) return null;
                return (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{cat}</span>
                    <span className="font-medium">{formatCurrency(catTotal)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Expense History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{format(parseISO(tx.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{tx.category}</td>
                    <td className="px-6 py-4 font-medium text-red-600">-{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {tx.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{tx.notes || '-'}</td>
                  </tr>
                ))}
                {expenseTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select 
              required 
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            >
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₹)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Mode</label>
            <select 
              required 
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <Input label="Notes / Description" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Plumber repair" />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
