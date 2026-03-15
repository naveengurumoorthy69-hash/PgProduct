import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PG, Room, Tenant, Transaction } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  user: User | null;
  pgs: PG[];
  currentPg: PG | null;
  rooms: Room[];
  tenants: Tenant[];
  transactions: Transaction[];
}

interface AppContextType extends AppState {
  login: (name: string, email: string, password?: string, isSignUp?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  addPg: (pg: Omit<PG, 'id' | 'ownerId'>) => Promise<void>;
  selectPg: (pgId: string) => void;
  addRoom: (room: Omit<Room, 'id' | 'pgId'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addTenant: (tenant: Omit<Tenant, 'id' | 'pgId' | 'isActive'>) => Promise<void>;
  updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'pgId'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [currentPg, setCurrentPg] = useState<PG | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 1. Listen for Auth State Changes (Persist Login)
  useEffect(() => {
    if (!supabase) return;
    
    // Get initial session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          name: session.user.user_metadata?.name || '', 
          email: session.user.email! 
        });
      }
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          name: session.user.user_metadata?.name || '', 
          email: session.user.email! 
        });
      } else {
        // Clear state on logout
        setUser(null);
        setPgs([]);
        setCurrentPg(null);
        setRooms([]);
        setTenants([]);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch PGs when User logs in
  useEffect(() => {
    if (!user || !supabase) return;
    const fetchPgs = async () => {
      const { data, error } = await supabase.from('pgs').select('*').eq('owner_id', user.id);
      if (!error && data) {
        const mappedPgs = data.map(pg => ({
          id: pg.id,
          name: pg.name,
          address: pg.address,
          ownerId: pg.owner_id
        }));
        setPgs(mappedPgs);
        if (mappedPgs.length > 0 && !currentPg) {
          setCurrentPg(mappedPgs[0]); // Auto-select first PG
        }
      }
    };
    fetchPgs();
  }, [user]);

  // 3. Fetch Rooms, Tenants, Transactions when Current PG changes
  useEffect(() => {
    if (!currentPg || !supabase) return;
    const fetchPgData = async () => {
      const [roomsRes, tenantsRes, txRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('pg_id', currentPg.id),
        supabase.from('tenants').select('*').eq('pg_id', currentPg.id),
        supabase.from('transactions').select('*').eq('pg_id', currentPg.id)
      ]);
      
      if (roomsRes.data) {
        setRooms(roomsRes.data.map(r => ({
          id: r.id,
          roomNumber: r.room_number,
          capacity: r.capacity,
          rentPerBed: r.rent_per_bed,
          pgId: r.pg_id
        })));
      }
      if (tenantsRes.data) {
        setTenants(tenantsRes.data.map(t => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          idProof: t.id_proof,
          roomId: t.room_id,
          bedNumber: t.bed_number,
          monthlyRent: t.monthly_rent,
          depositAmount: t.deposit_amount,
          checkInDate: t.check_in_date,
          isActive: t.is_active,
          pgId: t.pg_id
        })));
      }
      if (txRes.data) {
        setTransactions(txRes.data.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          notes: tx.notes,
          tenantId: tx.tenant_id,
          pgId: tx.pg_id
        })));
      }
    };
    fetchPgData();
  }, [currentPg]);

  const login = async (name: string, email: string, password?: string, isSignUp?: boolean) => {
    if (supabase && password) {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const addPg = async (pgData: Omit<PG, 'id' | 'ownerId'>) => {
    if (!user || !supabase) return;
    const { data, error } = await supabase
      .from('pgs')
      .insert([{ 
        name: pgData.name,
        address: pgData.address,
        owner_id: user.id 
      }])
      .select()
      .single();
      
    if (!error && data) {
      const mappedPg = {
        id: data.id,
        name: data.name,
        address: data.address,
        ownerId: data.owner_id
      };
      setPgs([...pgs, mappedPg]);
      if (!currentPg) setCurrentPg(mappedPg);
    } else {
      console.error("Error adding PG:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const selectPg = (pgId: string) => {
    const pg = pgs.find(p => p.id === pgId);
    if (pg) setCurrentPg(pg);
  };

  const addRoom = async (roomData: Omit<Room, 'id' | 'pgId'>) => {
    if (!currentPg || !supabase) return;
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ 
        room_number: roomData.roomNumber,
        capacity: roomData.capacity,
        rent_per_bed: roomData.rentPerBed,
        pg_id: currentPg.id 
      }])
      .select()
      .single();
      
    if (!error && data) {
      setRooms([...rooms, {
        id: data.id,
        roomNumber: data.room_number,
        capacity: data.capacity,
        rentPerBed: data.rent_per_bed,
        pgId: data.pg_id
      }]);
    }
    else {
      console.error("Error adding room:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const updateRoom = async (id: string, roomData: Partial<Room>) => {
    if (!supabase) return;
    
    // Convert camelCase to snake_case for Supabase
    const updateData: any = {};
    if (roomData.roomNumber !== undefined) updateData.room_number = roomData.roomNumber;
    if (roomData.capacity !== undefined) updateData.capacity = roomData.capacity;
    if (roomData.rentPerBed !== undefined) updateData.rent_per_bed = roomData.rentPerBed;
    
    const { error } = await supabase.from('rooms').update(updateData).eq('id', id);
    if (!error) setRooms(rooms.map(r => r.id === id ? { ...r, ...roomData } : r));
    else {
      console.error("Error updating room:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const deleteRoom = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (!error) setRooms(rooms.filter(r => r.id !== id));
    else {
      console.error("Error deleting room:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const addTenant = async (tenantData: Omit<Tenant, 'id' | 'pgId' | 'isActive'>) => {
    if (!currentPg || !supabase) return;
    const { data, error } = await supabase
      .from('tenants')
      .insert([{ 
        name: tenantData.name,
        phone: tenantData.phone,
        id_proof: tenantData.idProof,
        room_id: tenantData.roomId,
        bed_number: tenantData.bedNumber,
        monthly_rent: tenantData.monthlyRent,
        deposit_amount: tenantData.depositAmount,
        check_in_date: tenantData.checkInDate,
        is_active: true,
        pg_id: currentPg.id 
      }])
      .select()
      .single();
      
    if (!error && data) {
      setTenants([...tenants, {
        id: data.id,
        name: data.name,
        phone: data.phone,
        idProof: data.id_proof,
        roomId: data.room_id,
        bedNumber: data.bed_number,
        monthlyRent: data.monthly_rent,
        depositAmount: data.deposit_amount,
        checkInDate: data.check_in_date,
        isActive: data.is_active,
        pgId: data.pg_id
      }]);
    }
    else {
      console.error("Error adding tenant:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const updateTenant = async (id: string, tenantData: Partial<Tenant>) => {
    if (!supabase) return;
    
    // Convert camelCase to snake_case for Supabase
    const updateData: any = {};
    if (tenantData.name !== undefined) updateData.name = tenantData.name;
    if (tenantData.phone !== undefined) updateData.phone = tenantData.phone;
    if (tenantData.idProof !== undefined) updateData.id_proof = tenantData.idProof;
    if (tenantData.roomId !== undefined) updateData.room_id = tenantData.roomId;
    if (tenantData.bedNumber !== undefined) updateData.bed_number = tenantData.bedNumber;
    if (tenantData.monthlyRent !== undefined) updateData.monthly_rent = tenantData.monthlyRent;
    if (tenantData.depositAmount !== undefined) updateData.deposit_amount = tenantData.depositAmount;
    if (tenantData.checkInDate !== undefined) updateData.check_in_date = tenantData.checkInDate;
    if (tenantData.isActive !== undefined) updateData.is_active = tenantData.isActive;
    
    const { error } = await supabase.from('tenants').update(updateData).eq('id', id);
    if (!error) setTenants(tenants.map(t => t.id === id ? { ...t, ...tenantData } : t));
    else {
      console.error("Error updating tenant:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const deleteTenant = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (!error) setTenants(tenants.filter(t => t.id !== id));
    else {
      console.error("Error deleting tenant:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'pgId'>) => {
    if (!currentPg || !supabase) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        type: transactionData.type,
        amount: transactionData.amount,
        category: transactionData.category,
        date: transactionData.date,
        notes: transactionData.notes,
        tenant_id: transactionData.tenantId,
        pg_id: currentPg.id 
      }])
      .select()
      .single();
      
    if (!error && data) {
      setTransactions([...transactions, {
        id: data.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        date: data.date,
        notes: data.notes,
        tenantId: data.tenant_id,
        pgId: data.pg_id
      }]);
    }
    else {
      console.error("Error adding transaction:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(t => t.id !== id));
    else {
      console.error("Error deleting transaction:", error);
      alert(`Database Error: ${error?.message}\nDetails: ${error?.details || 'Check console for more info'}`);
    }
  };

  return (
    <AppContext.Provider value={{
      user, pgs, currentPg, rooms, tenants, transactions,
      login, logout, addPg, selectPg, addRoom, updateRoom, deleteRoom,
      addTenant, updateTenant, deleteTenant, addTransaction, deleteTransaction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
