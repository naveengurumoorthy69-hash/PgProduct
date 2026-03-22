import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, IndianRupee, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { formatCurrency, exportToCSV } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isSameMonth } from 'date-fns';
import { PaymentMode } from '../types';

export function Rent() {
  const { currentPg, tenants, rooms, transactions, addTransaction, updateTenant } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Form State
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [electricityAmount, setElectricityAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Room/Bed Update State
  const [roomId, setRoomId] = useState('');
  const [bedNumber, setBedNumber] = useState('');

  if (!currentPg) return null;

  const pgRooms = rooms.filter(r => r.pgId === currentPg.id);
  const activeTenants = tenants.filter(t => t.pgId === currentPg.id && t.isActive);
  
  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));

  const currentMonthTx = transactions.filter(t => 
    t.pgId === currentPg.id && 
    t.type === 'INCOME' && 
    ['Rent', 'Electricity'].includes(t.category) &&
    isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );

  // Group by tenant
  const paidTenantIds = Array.from(new Set(currentMonthTx.map(t => t.tenantId).filter(Boolean)));
  
  const paymentsList = paidTenantIds.map(id => {
    const tenant = tenants.find(t => t.id === id);
    const tenantTx = currentMonthTx.filter(t => t.tenantId === id);
    const rentTx = tenantTx.find(t => t.category === 'Rent');
    const elecTx = tenantTx.find(t => t.category === 'Electricity');
    
    return {
      tenantId: id,
      tenantName: tenant?.name || 'Unknown',
      phone: tenant?.phone || '',
      roomId: tenant?.roomId || '',
      bedNumber: tenant?.bedNumber || '',
      rentAmount: rentTx?.amount || 0,
      electricityAmount: elecTx?.amount || 0,
      date: rentTx?.date || elecTx?.date || '',
      mode: rentTx?.paymentMode || elecTx?.paymentMode || '',
      notes: rentTx?.notes || elecTx?.notes || ''
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExport = () => {
    const exportData = paymentsList.map(p => {
      const room = rooms.find(r => r.id === p.roomId);
      return {
        Date: format(parseISO(p.date), 'yyyy-MM-dd'),
        'Tenant Name': p.tenantName,
        Phone: p.phone,
        Room: room?.roomNumber || p.roomId,
        Bed: p.bedNumber,
        'Rent Amount': p.rentAmount,
        'Electricity Amount': p.electricityAmount,
        'Total Amount': p.rentAmount + p.electricityAmount,
        Mode: p.mode,
        Notes: p.notes
      };
    });
    exportToCSV(exportData, `Rent_Report_${selectedMonth}.csv`);
  };

  const availableBeds = useMemo(() => {
    if (!roomId) return [];
    const room = pgRooms.find(r => r.id === roomId);
    if (!room) return [];
    
    const occupiedBeds = activeTenants
      .filter(t => t.roomId === roomId && t.id !== tenantId) // Exclude current tenant's bed
      .map(t => t.bedNumber);
      
    return Array.from({ length: room.capacity }, (_, i) => i + 1)
      .filter(bed => !occupiedBeds.includes(bed));
  }, [roomId, pgRooms, activeTenants, tenantId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const selectedDate = parseISO(date);
    const isDuplicate = transactions.some(t => 
      t.pgId === currentPg.id &&
      t.tenantId === tenantId && 
      t.category === 'Rent' &&
      isSameMonth(parseISO(t.date), selectedDate)
    );

    if (isDuplicate) {
      setError('Rent for this month has already been recorded for this tenant.');
      return;
    }

    try {
      if (parseFloat(amount) > 0) {
        await addTransaction({
          type: 'INCOME',
          category: 'Rent',
          amount: parseFloat(amount),
          date,
          tenantId,
          paymentMode,
          notes
        });
      }

      if (electricityAmount && parseFloat(electricityAmount) > 0) {
        await addTransaction({
          type: 'INCOME',
          category: 'Electricity',
          amount: parseFloat(electricityAmount),
          date,
          tenantId,
          paymentMode,
          notes
        });
      }

      const tenant = activeTenants.find(t => t.id === tenantId);
      if (tenant && (tenant.roomId !== roomId || tenant.bedNumber.toString() !== bedNumber)) {
        await updateTenant(tenantId, { roomId, bedNumber: parseInt(bedNumber) });
      }

      setIsModalOpen(false);
      setTenantId(''); setAmount(''); setElectricityAmount(''); setDate(format(new Date(), 'yyyy-MM-dd')); setPaymentMode('UPI'); setNotes('');
      setRoomId(''); setBedNumber('');
    } catch (err: any) {
      setError(err.message || 'Failed to record payment. Please try again.');
    }
  };

  const handleTenantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setTenantId(id);
    setError('');
    const tenant = activeTenants.find(t => t.id === id);
    if (tenant) {
      setAmount(tenant.monthlyRent.toString());
      setElectricityAmount('');
      setRoomId(tenant.roomId);
      setBedNumber(tenant.bedNumber.toString());
    } else {
      setAmount('');
      setRoomId('');
      setBedNumber('');
    }
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoomId = e.target.value;
    setRoomId(selectedRoomId);
    setBedNumber(''); // Reset bed selection when room changes
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Management</h1>
          <p className="text-slate-500">Track and collect monthly rent</p>
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
          <Button onClick={() => { setIsModalOpen(true); setError(''); }} className="gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Payments in {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Tenant</th>
                    <th className="px-6 py-4 font-medium">Rent</th>
                    <th className="px-6 py-4 font-medium">Electricity</th>
                    <th className="px-6 py-4 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsList.map((tx, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-600">{format(parseISO(tx.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{tx.tenantName}</td>
                        <td className="px-6 py-4 font-medium text-emerald-600">+{formatCurrency(tx.rentAmount)}</td>
                        <td className="px-6 py-4 font-medium text-amber-600">+{formatCurrency(tx.electricityAmount)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {tx.mode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {paymentsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No rent payments recorded in this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Status for {format(parseISO(`${selectedMonth}-01`), 'MMM yyyy')}</h3>
              <div className="space-y-4">
                {activeTenants.map(tenant => {
                  const hasPaid = paymentsList.some(p => p.tenantId === tenant.id);
                  return (
                    <div key={tenant.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(tenant.monthlyRent)}</p>
                      </div>
                      {hasPaid ? (
                        <div className="flex items-center text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Paid
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600 text-sm font-medium">
                          <AlertCircle className="w-4 h-4 mr-1" /> Pending
                        </div>
                      )}
                    </div>
                  );
                })}
                {activeTenants.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No active tenants.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Rent Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenant</label>
            <select 
              required 
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={tenantId}
              onChange={handleTenantSelect}
            >
              <option value="">Select Tenant</option>
              {activeTenants.map(t => {
                const room = pgRooms.find(r => r.id === t.roomId);
                return <option key={t.id} value={t.id}>{t.name} (Room {room?.roomNumber || t.roomId})</option>;
              })}
            </select>
          </div>
          
          {tenantId && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Room</label>
                <select 
                  required 
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={roomId}
                  onChange={handleRoomChange}
                >
                  <option value="">Select Room</option>
                  {pgRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Bed</label>
                <select 
                  required 
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  disabled={!roomId || availableBeds.length === 0}
                >
                  <option value="">{roomId ? (availableBeds.length > 0 ? "Select Bed" : "No beds available") : "Select Room first"}</option>
                  {availableBeds.map(bed => <option key={bed} value={bed}>Bed {bed}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input label="Rent Amount (₹)" type="number" required value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} />
            <Input label="Electricity (₹)" type="number" required value={electricityAmount} onChange={(e) => { setElectricityAmount(e.target.value); setError(''); }} placeholder="e.g. 500" />
            <Input label="Date" type="date" required value={date} onChange={(e) => { setDate(e.target.value); setError(''); }} />
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

          <Input label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transaction ID or notes" />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={tenantId ? (!roomId || availableBeds.length === 0) : false}>Save Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
