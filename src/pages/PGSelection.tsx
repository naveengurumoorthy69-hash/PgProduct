import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Building2, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export function PGSelection() {
  const { user, pgs, selectPg, addPg } = useAppContext();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPgName, setNewPgName] = useState('');
  const [newPgAddress, setNewPgAddress] = useState('');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSelectPg = (pgId: string) => {
    selectPg(pgId);
    navigate('/');
  };

  const handleAddPg = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPgName && newPgAddress) {
      addPg({ name: newPgName, address: newPgAddress });
      setIsModalOpen(false);
      setNewPgName('');
      setNewPgAddress('');
      // After adding, it auto-selects if it's the first one, but let's navigate anyway
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="mt-2 text-slate-600">Select a PG to manage or add a new one.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pgs.map((pg) => (
            <Card 
              key={pg.id} 
              className="group cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all duration-200"
            >
              <div onClick={() => handleSelectPg(pg.id)}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{pg.name}</h3>
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{pg.address}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 transition-colors group"
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Add New PG</span>
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New PG">
        <form onSubmit={handleAddPg} className="space-y-4">
          <Input
            label="PG Name"
            required
            value={newPgName}
            onChange={(e) => setNewPgName(e.target.value)}
            placeholder="e.g. Sunrise PG"
          />
          <Input
            label="Address"
            required
            value={newPgAddress}
            onChange={(e) => setNewPgAddress(e.target.value)}
            placeholder="Complete address"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create PG</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
