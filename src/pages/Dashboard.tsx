import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { BedDouble, Users, IndianRupee, Receipt, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from 'date-fns';

export function Dashboard() {
  const { currentPg, rooms, tenants, transactions } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  if (!currentPg) return null;

  // Calculate Stats
  const totalRooms = rooms.filter(r => r.pgId === currentPg.id).length;
  const totalCapacity = rooms.filter(r => r.pgId === currentPg.id).reduce((acc, room) => acc + room.capacity, 0);
  
  const activeTenants = tenants.filter(t => t.pgId === currentPg.id && t.isActive);
  const occupiedBeds = activeTenants.length;
  const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
  const overCapacity = occupiedBeds > totalCapacity ? occupiedBeds - totalCapacity : 0;

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));

  const currentMonthTransactions = transactions.filter(t => 
    t.pgId === currentPg.id && 
    isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyElectricity = currentMonthTransactions
    .filter(t => t.type === 'INCOME' && t.category === 'Electricity')
    .reduce((acc, t) => acc + t.amount, 0);

  // Calculate expected rent vs paid rent
  const expectedRent = activeTenants.reduce((acc, t) => acc + t.monthlyRent, 0);
  const paidRent = currentMonthTransactions
    .filter(t => t.type === 'INCOME' && t.category === 'Rent')
    .reduce((acc, t) => acc + t.amount, 0);
  const pendingRent = expectedRent - paidRent;

  // Chart Data (Mock last 6 months based on current month for demo)
  const chartData = [
    { name: 'Jan', income: 40000, expense: 24000 },
    { name: 'Feb', income: 30000, expense: 13980 },
    { name: 'Mar', income: 20000, expense: 9800 },
    { name: 'Apr', income: 27800, expense: 3908 },
    { name: 'May', income: 18900, expense: 4800 },
    { name: 'Jun', income: monthlyIncome, expense: monthlyExpense },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={trend.isPositive ? "text-emerald-600" : "text-red-600"}>
              {trend.value}
            </span>
            <span className="text-slate-500 ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of {currentPg.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Select Month:</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Occupancy" 
          value={`${occupiedBeds} / ${totalCapacity}`} 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-600"
          trend={{ 
            value: overCapacity > 0 ? `${overCapacity} beds` : `${vacantBeds} beds`, 
            label: overCapacity > 0 ? "over capacity" : "currently vacant", 
            isPositive: overCapacity === 0 
          }}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={formatCurrency(monthlyIncome)} 
          icon={IndianRupee} 
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Pending Rent" 
          value={formatCurrency(Math.max(0, pendingRent))} 
          icon={AlertCircle} 
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Income vs Expenses (6 Months)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Total Rooms</span>
                <span className="font-semibold text-slate-900">{totalRooms}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Total Beds</span>
                <span className="font-semibold text-slate-900">{totalCapacity}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Electricity Collected</span>
                <span className="font-semibold text-slate-900">{formatCurrency(monthlyElectricity)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Total Expenses</span>
                <span className="font-semibold text-slate-900">{formatCurrency(monthlyExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Active Tenants</span>
                <span className="font-semibold text-slate-900">{activeTenants.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
