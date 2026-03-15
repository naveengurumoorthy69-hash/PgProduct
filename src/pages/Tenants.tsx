import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, Search, UserMinus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';

export function Tenants() {
  const { currentPg, rooms, tenants, addTenant, updateTenant, deleteTenant } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'checkout'>('active');
  const [confirmAction, setConfirmAction] = useState<{type: 'checkout' | 'delete', id: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('Aadhar');
  const [idProof, setIdProof] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [monthlyRent, setMonthlyRent] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  if (!currentPg) return null;

  const pgRooms = rooms.filter(r => r.pgId === currentPg.id);
  const pgTenants = tenants.filter(t => t.pgId === currentPg.id);

  const filteredTenants = pgTenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.phone.includes(searchTerm);
    const matchesTab = activeTab === 'active' ? t.isActive : !t.isActive;
    return matchesSearch && matchesTab;
  });

  const availableBeds = useMemo(() => {
    if (!roomId) return [];
    const room = pgRooms.find(r => r.id === roomId);
    if (!room) return [];
    
    const occupiedBeds = pgTenants
      .filter(t => t.roomId === roomId && t.isActive)
      .map(t => t.bedNumber);
      
    return Array.from({ length: room.capacity }, (_, i) => i + 1)
      .filter(bed => !occupiedBeds.includes(bed));
  }, [roomId, pgRooms, pgTenants]);

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoomId = e.target.value;
    setRoomId(selectedRoomId);
    setBedNumber(''); // Reset bed selection when room changes
    const room = pgRooms.find(r => r.id === selectedRoomId);
    if (room) {
      setMonthlyRent(room.rentPerBed.toString());
    }
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (phone.length < 10) {
      setFormError('Phone number must be at least 10 digits.');
      return;
    }

    if (idType === 'Aadhar' && idProof.length !== 12 && idProof.length !== 16) {
      setFormError('Aadhar Number must be 12 or 16 digits.');
      return;
    }

    if (idType === 'PAN' && idProof.length !== 10) {
      setFormError('PAN Number must be exactly 10 characters.');
      return;
    }

    addTenant({
      name, phone, idProof: `${idType}: ${idProof}`, roomId, 
      bedNumber: parseInt(bedNumber), 
      checkInDate, 
      monthlyRent: parseFloat(monthlyRent), 
      depositAmount: parseFloat(depositAmount)
    });
    setIsModalOpen(false);
    
    // Show success message
    setSuccessMessage('Tenant successfully added');
    setTimeout(() => setSuccessMessage(''), 3000);

    // Reset form
    setName(''); setPhone(''); setIdProof(''); setRoomId(''); setBedNumber(''); setMonthlyRent(''); setDepositAmount('');
  };

  const confirmCheckoutOrDelete = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'checkout') {
      updateTenant(confirmAction.id, { isActive: false });
    } else if (confirmAction.type === 'delete') {
      deleteTenant(confirmAction.id);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-500">Manage your paying guests</p>
        </div>
        <Button onClick={() => { setIsModalOpen(true); setFormError(''); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Tenant
        </Button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {successMessage}
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('active')}
            >
              Active Tenants
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'checkout' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('checkout')}
            >
              Checked Out
            </button>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant Info</th>
                <th className="px-6 py-4 font-medium">Room/Bed</th>
                <th className="px-6 py-4 font-medium">Check-in</th>
                <th className="px-6 py-4 font-medium">Rent/Deposit</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {activeTab === 'checkout' && <th className="px-6 py-4 font-medium">Checkout Date</th>}
                <th className="px-6 py-4 font-medium text-right">{activeTab === 'active' ? 'Checkout Tenant' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => {
                const room = pgRooms.find(r => r.id === tenant.roomId);
                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tenant.name}</div>
                      <div className="text-slate-500">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Room {room?.roomNumber || 'N/A'}</div>
                      <div className="text-slate-500">Bed {tenant.bedNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(parseISO(tenant.checkInDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{formatCurrency(tenant.monthlyRent)}</div>
                      <div className="text-slate-500 text-xs">Dep: {formatCurrency(tenant.depositAmount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tenant.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {tenant.isActive ? 'Active' : 'Checked Out'}
                      </span>
                    </td>
                    {activeTab === 'checkout' && (
                      <td className="px-6 py-4 text-slate-600">
                        {format(new Date(), 'MMM dd, yyyy')} {/* Using current date as placeholder since checkoutDate is not in schema */}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      {tenant.isActive ? (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({type: 'checkout', id: tenant.id})} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Checkout Tenant">
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({type: 'delete', id: tenant.id})} className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete Tenant">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No tenants found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Tenant">
        <form onSubmit={handleAddTenant} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone Number" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ID Type</label>
              <select 
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
              >
                <option value="Aadhar">Aadhar</option>
                <option value="PAN">PAN</option>
              </select>
            </div>
            <div className="col-span-2">
              <Input label="ID Number" required value={idProof} onChange={(e) => setIdProof(e.target.value)} placeholder={idType === 'Aadhar' ? '12 or 16 digits' : '10 characters'} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Room</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bed Number</label>
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

          <Input label="Check-in Date" type="date" required value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly Rent (₹)" type="number" required value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
            <Input label="Deposit Amount (₹)" type="number" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!roomId || availableBeds.length === 0}>Save Tenant</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <p className="text-slate-600">
            {confirmAction?.type === 'checkout' 
              ? 'Are you sure you want to mark this tenant as checked out? This will free up their bed.'
              : 'Are you sure you want to permanently delete this tenant record? This action cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button type="button" onClick={confirmCheckoutOrDelete} className={confirmAction?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
