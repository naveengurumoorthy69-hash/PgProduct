import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, BedDouble, Users, Edit2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function Rooms() {
  const { currentPg, rooms, tenants, addRoom, updateRoom, deleteRoom } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [rentPerBed, setRentPerBed] = useState('');

  if (!currentPg) return null;

  const pgRooms = rooms.filter(r => r.pgId === currentPg.id);
  const pgTenants = tenants.filter(t => t.pgId === currentPg.id && t.isActive);

  const handleOpenModal = (room?: any) => {
    if (room) {
      setEditingRoomId(room.id);
      setRoomNumber(room.roomNumber);
      setCapacity(room.capacity.toString());
      setRentPerBed(room.rentPerBed.toString());
    } else {
      setEditingRoomId(null);
      setRoomNumber('');
      setCapacity('2');
      setRentPerBed('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoomId(null);
    setRoomNumber('');
    setCapacity('2');
    setRentPerBed('');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoomId) {
      updateRoom(editingRoomId, {
        roomNumber,
        capacity: parseInt(capacity),
        rentPerBed: parseFloat(rentPerBed)
      });
    } else {
      addRoom({
        roomNumber,
        capacity: parseInt(capacity),
        rentPerBed: parseFloat(rentPerBed)
      });
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
          <p className="text-slate-500">Manage rooms and bed assignments</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pgRooms.map(room => {
          const roomTenants = pgTenants.filter(t => t.roomId === room.id);
          const occupied = roomTenants.length;
          const isFull = occupied >= room.capacity;

          return (
            <Card key={room.id} className="flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Room {room.roomNumber}</h3>
                      <p className="text-sm text-slate-500">{formatCurrency(room.rentPerBed)} / bed</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {occupied}/{room.capacity} Occupied
                  </span>
                </div>

                <div className="space-y-3 mt-6">
                  {Array.from({ length: room.capacity }).map((_, idx) => {
                    const tenant = roomTenants.find(t => t.bedNumber === idx + 1);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tenant ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                          B{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          {tenant ? (
                            <>
                              <p className="text-sm font-medium text-slate-900 truncate">{tenant.name}</p>
                              <p className="text-xs text-slate-500 truncate">{tenant.phone}</p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Available</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenModal(room)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteRoom(room.id)}>
                  Delete Room
                </Button>
              </div>
            </Card>
          );
        })}
        {pgRooms.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No rooms added yet</h3>
            <p className="text-slate-500 mt-1">Click the "Add Room" button to get started.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRoomId ? "Edit Room" : "Add New Room"}>
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <Input
            label="Room Number / Name"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 101 or A1"
          />
          <Input
            label="Capacity (Number of Beds)"
            type="number"
            min="1"
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Input
            label="Rent per Bed (₹)"
            type="number"
            min="0"
            required
            value={rentPerBed}
            onChange={(e) => setRentPerBed(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingRoomId ? "Update Room" : "Save Room"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
