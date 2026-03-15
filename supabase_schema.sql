-- =====================================================================================
-- PG Manager Application - PostgreSQL Schema (Supabase Compatible)
-- =====================================================================================

-- 1. Users Table
-- Stores the application users (PG Owners/Managers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PGs Table
-- Stores the different PG properties owned by users
CREATE TABLE pgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rooms Table
-- Stores rooms within a PG
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pg_id UUID NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    rent_per_bed DECIMAL(10, 2) NOT NULL CHECK (rent_per_bed >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tenants Table
-- Stores tenant details and their current room/bed assignment
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pg_id UUID NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_proof VARCHAR(100) NOT NULL,
    bed_number INTEGER NOT NULL CHECK (bed_number > 0),
    check_in_date DATE NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL CHECK (monthly_rent >= 0),
    deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transactions Table
-- Stores all financial transactions (Income/Rent, Expenses, etc.)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pg_id UUID NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Nullable for general expenses
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(100) NOT NULL, -- e.g., 'Rent', 'Electricity', 'Maintenance'
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- e.g., 'UPI', 'Cash', 'Bank Transfer'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- Indexes for Performance Optimization
-- =====================================================================================

CREATE INDEX idx_pgs_owner_id ON pgs(owner_id);
CREATE INDEX idx_rooms_pg_id ON rooms(pg_id);
CREATE INDEX idx_tenants_pg_id ON tenants(pg_id);
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_transactions_pg_id ON transactions(pg_id);
CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX idx_transactions_date ON transactions(date);

-- =====================================================================================
-- Sample DML (Data Manipulation Language) - Mock Data
-- =====================================================================================

-- Insert a User
INSERT INTO users (id, name, email) 
VALUES ('11111111-1111-1111-1111-111111111111', 'John Doe', 'john@example.com');

-- Insert a PG
INSERT INTO pgs (id, owner_id, name, address) 
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Sunrise PG', '123 Main St, City');

-- Insert a Room
INSERT INTO rooms (id, pg_id, room_number, capacity, rent_per_bed) 
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '101', 2, 5000.00);

-- Insert a Tenant
INSERT INTO tenants (id, pg_id, room_id, name, phone, id_proof, bed_number, check_in_date, monthly_rent, deposit_amount, is_active) 
VALUES ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Alice Smith', '9876543210', 'Aadhar: 123456789012', 1, '2023-01-01', 5000.00, 10000.00, TRUE);

-- Insert a Transaction (Rent Payment)
INSERT INTO transactions (pg_id, tenant_id, type, category, amount, date, payment_mode, notes) 
VALUES ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'INCOME', 'Rent', 5000.00, '2023-01-05', 'UPI', 'January Rent');
