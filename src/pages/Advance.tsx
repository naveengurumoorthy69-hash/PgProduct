import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { UserMinus, Wallet } from 'lucide-react';

export function Advance() {
  const { currentPg, tenants, rooms, updateTenant } = useAppContext();
  const [confirmAction, setConfirmAction] = useState<{id: string} | null>(null);

  if (!currentPg) return null;

  const activeTenants = tenants.filter(t => t.pgId === currentPg.id && t.isActive);
  const totalAdvance = activeTenants.reduce((sum, t) => sum + (t.depositAmount || 0), 0);

  const handleCheckout = () => {
    if (confirmAction) {
      updateTenant(confirmAction.id, { isActive: false });
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Advance / Deposits</h1>
          <p className="text-slate-500">Manage tenant advance payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Advance Held</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalAdvance)}</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Tenant Advances</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant</th>
                <th className="px-6 py-4 font-medium">Room/Bed</th>
                <th className="px-6 py-4 font-medium">Check-in Date</th>
                <th className="px-6 py-4 font-medium">Advance Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTenants.map(tenant => {
                const room = rooms.find(r => r.id === tenant.roomId);
                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tenant.name}</div>
                      <div className="text-slate-500 text-xs">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      Room {room?.roomNumber || 'N/A'} - Bed {tenant.bedNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(parseISO(tenant.checkInDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      {formatCurrency(tenant.depositAmount || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setConfirmAction({ id: tenant.id })} 
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Checkout Tenant & Settle Advance"
                      >
                        <UserMinus className="w-4 h-4 mr-1" /> Checkout
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {activeTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No active tenants with advance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Checkout">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to checkout this tenant? This will mark them as inactive, free up their bed, and remove their advance from the total pool.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button type="button" onClick={handleCheckout}>Confirm Checkout</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
