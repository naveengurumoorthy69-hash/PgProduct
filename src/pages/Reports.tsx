import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { formatCurrency, exportToCSV } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { Download, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function Reports() {
  const { currentPg, transactions } = useAppContext();
  const [showExportMsg, setShowExportMsg] = useState(false);

  if (!currentPg) return null;

  const pgTransactions = transactions.filter(t => t.pgId === currentPg.id);

  // Generate last 6 months data
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    
    const monthTx = pgTransactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
    const income = monthTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    
    return {
      name: format(d, 'MMM yyyy'),
      income,
      expense
    };
  });

  // Current month expenses by category
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const currentMonthExpenses = pgTransactions.filter(t => 
    t.type === 'EXPENSE' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );

  const expensesByCategory = currentMonthExpenses.reduce((acc, tx) => {
    const existing = acc.find(item => item.name === tx.category);
    if (existing) {
      existing.value += tx.amount;
    } else {
      acc.push({ name: tx.category, value: tx.amount });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const handleDownload = () => {
    const exportData = last6Months.slice().reverse().map(m => ({
      Month: m.name,
      'Total Income': m.income,
      'Total Expenses': m.expense
    }));
    exportToCSV(exportData, 'Financial_Summary_Report.csv');
    
    setShowExportMsg(true);
    setTimeout(() => setShowExportMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500">Analyze your PG's financial performance</p>
        </div>
        <div className="flex items-center gap-3">
          {showExportMsg && (
            <span className="text-sm text-emerald-600 flex items-center font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Report generated
            </span>
          )}
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Income vs Expenses (6 Months)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Expense Breakdown (Current Month)</h3>
            <div className="h-80">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No expenses recorded this month.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Monthly Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Month</th>
                  <th className="px-6 py-4 font-medium">Total Income</th>
                  <th className="px-6 py-4 font-medium">Total Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {last6Months.slice().reverse().map((month, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{month.name}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(month.income)}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">{formatCurrency(month.expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
