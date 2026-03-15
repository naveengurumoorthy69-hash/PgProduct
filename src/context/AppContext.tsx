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
  logout: () => void;
  addPg: (pg: Omit<PG, 'id' | 'ownerId'>) => void;
  selectPg: (pgId: string) => void;
  addRoom: (room: Omit<Room, 'id' | 'pgId'>) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'pgId' | 'isActive'>) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'pgId'>) => void;
  deleteTransaction: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveState = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadState('pg_user', null));
  const [pgs, setPgs] = useState<PG[]>(() => loadState('pg_pgs', []));
  const [currentPg, setCurrentPg] = useState<PG | null>(() => loadState('pg_currentPg', null));
  const [rooms, setRooms] = useState<Room[]>(() => loadState('pg_rooms', []));
  const [tenants, setTenants] = useState<Tenant[]>(() => loadState('pg_tenants', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('pg_transactions', []));

  useEffect(() => { saveState('pg_user', user); }, [user]);
  useEffect(() => { saveState('pg_pgs', pgs); }, [pgs]);
  useEffect(() => { saveState('pg_currentPg', currentPg); }, [currentPg]);
  useEffect(() => { saveState('pg_rooms', rooms); }, [rooms]);
  useEffect(() => { saveState('pg_tenants', tenants); }, [tenants]);
  useEffect(() => { saveState('pg_transactions', transactions); }, [transactions]);

  const login = async (name: string, email: string, password?: string, isSignUp?: boolean) => {
    if (supabase && password) {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, name: data.user.user_metadata?.name || name, email: data.user.email! });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, name: data.user.user_metadata?.name || name, email: data.user.email! });
        }
      }
    } else {
      // Fallback to local storage mock
      const newUser = { id: crypto.randomUUID(), name, email };
      setUser(newUser);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCurrentPg(null);
  };

  const addPg = (pgData: Omit<PG, 'id' | 'ownerId'>) => {
    if (!user) return;
    const newPg: PG = { ...pgData, id: crypto.randomUUID(), ownerId: user.id };
    setPgs([...pgs, newPg]);
    if (!currentPg) setCurrentPg(newPg);
  };

  const selectPg = (pgId: string) => {
    const pg = pgs.find(p => p.id === pgId);
    if (pg) setCurrentPg(pg);
  };

  const addRoom = (roomData: Omit<Room, 'id' | 'pgId'>) => {
    if (!currentPg) return;
    const newRoom: Room = { ...roomData, id: crypto.randomUUID(), pgId: currentPg.id };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (id: string, roomData: Partial<Room>) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, ...roomData } : r));
  };

  const deleteRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const addTenant = (tenantData: Omit<Tenant, 'id' | 'pgId' | 'isActive'>) => {
    if (!currentPg) return;
    const newTenant: Tenant = { ...tenantData, id: crypto.randomUUID(), pgId: currentPg.id, isActive: true };
    setTenants([...tenants, newTenant]);
  };

  const updateTenant = (id: string, tenantData: Partial<Tenant>) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, ...tenantData } : t));
  };

  const deleteTenant = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'pgId'>) => {
    if (!currentPg) return;
    const newTransaction: Transaction = { ...transactionData, id: crypto.randomUUID(), pgId: currentPg.id };
    setTransactions([...transactions, newTransaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
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
