export type User = {
  id: string;
  name: string;
  email: string;
};

export type PG = {
  id: string;
  ownerId: string;
  name: string;
  address: string;
};

export type Room = {
  id: string;
  pgId: string;
  roomNumber: string;
  capacity: number;
  rentPerBed: number;
};

export type Tenant = {
  id: string;
  pgId: string;
  roomId: string;
  bedNumber: number;
  name: string;
  phone: string;
  idProof: string;
  checkInDate: string;
  monthlyRent: number;
  depositAmount: number;
  isActive: boolean;
};

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory = 
  | 'Rent' 
  | 'Electricity' 
  | 'Water' 
  | 'Internet' 
  | 'Maintenance' 
  | 'Groceries' 
  | 'Salary' 
  | 'Other';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';

export type Transaction = {
  id: string;
  pgId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  tenantId?: string;
  paymentMode: PaymentMode;
  notes?: string;
};
