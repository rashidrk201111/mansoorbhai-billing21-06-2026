-- Complete Billing System Schema with Admin Profile Creation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'sales'
    CHECK (role IN ('admin', 'accountant', 'inventory_manager', 'sales', 'sales_person', 'inventory_person', 'purchase_person')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert admin profile
INSERT INTO profiles (id, email, full_name, role)
VALUES ('eb976543-5942-4a0c-aaf1-e3a52e87c173', 'khan191997@gmail.com', 'Admin User', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin User';

-- Company Profile
CREATE TABLE IF NOT EXISTS company_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  address text,
  city text,
  state text,
  gstin text,
  phone text,
  email text,
  logo_url text,
  whatsapp_number text,
  whatsapp_api_token text,
  whatsapp_phone_number_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own company profile"
  ON company_profile FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view company profile on invoices"
  ON company_profile FOR SELECT
  TO anon
  USING (true);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  gstin text,
  address text,
  city text,
  state text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customers"
  ON customers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  hsn_code text,
  unit text DEFAULT 'pcs' CHECK (unit IN ('pcs', 'kg', 'ltr', 'mtr', 'box')),
  price numeric(10,2) NOT NULL,
  gst_rate numeric(5,2) DEFAULT 0,
  stock_quantity numeric(10,2) DEFAULT 0,
  low_stock_threshold numeric(10,2) DEFAULT 10,
  type text DEFAULT 'product' CHECK (type IN ('product', 'service')),
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric(10,2) NOT NULL,
  cgst numeric(10,2) DEFAULT 0,
  sgst numeric(10,2) DEFAULT 0,
  igst numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  place_of_supply text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view invoices"
  ON invoices FOR SELECT
  TO anon
  USING (true);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  hsn_code text,
  quantity numeric(10,2) NOT NULL,
  unit text DEFAULT 'pcs',
  unit_price numeric(10,2) NOT NULL,
  gst_rate numeric(5,2) DEFAULT 0,
  cgst numeric(10,2) DEFAULT 0,
  sgst numeric(10,2) DEFAULT 0,
  igst numeric(10,2) DEFAULT 0,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view invoice items"
  ON invoice_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(10,2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invoice payments"
  ON invoice_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  gstin text,
  address text,
  city text,
  state text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_number text NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(10,2) NOT NULL,
  cgst numeric(10,2) DEFAULT 0,
  sgst numeric(10,2) DEFAULT 0,
  igst numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  hsn_code text,
  quantity numeric(10,2) NOT NULL,
  unit text DEFAULT 'pcs',
  unit_price numeric(10,2) NOT NULL,
  gst_rate numeric(5,2) DEFAULT 0,
  cgst numeric(10,2) DEFAULT 0,
  sgst numeric(10,2) DEFAULT 0,
  igst numeric(10,2) DEFAULT 0,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage purchase items"
  ON purchase_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_items.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

-- Purchase Payments
CREATE TABLE IF NOT EXISTS purchase_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(10,2) NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage purchase payments"
  ON purchase_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_payments.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expense categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid REFERENCES expense_categories(id),
  amount numeric(10,2) NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  description text,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity numeric(10,2) NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inventory movements"
  ON inventory_movements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'accountant', 'inventory_manager', 'sales', 'sales_person', 'inventory_person', 'purchase_person')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  TO authenticated
  USING (employee_user_id = auth.uid());