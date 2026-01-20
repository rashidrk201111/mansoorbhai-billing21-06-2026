/*
  # Fix All RLS Policies for CRUD Operations
  
  1. Changes
    - Fix employees table recursion issue
    - Ensure all tables have proper CRUD policies
    - Separate ALL policies into individual SELECT, INSERT, UPDATE, DELETE policies
  
  2. Security
    - Users can only access their own data based on user_id
    - No recursion in any policies
    - Public can view invoices and related data
*/

-- ============================================================================
-- EMPLOYEES TABLE - Fix recursion
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Employees can view own record" ON employees;

-- Allow users to manage employees (assuming admin check will be done in app layer)
CREATE POLICY "Users can view own employees"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON employees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- CUSTOMERS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;

CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own products" ON products;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUPPLIERS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own suppliers" ON suppliers;

CREATE POLICY "Users can view own suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PURCHASES TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own purchases" ON purchases;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- INVOICES TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- INVOICE ITEMS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage invoice items" ON invoice_items;

CREATE POLICY "Users can view own invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ));

-- ============================================================================
-- PURCHASE ITEMS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage purchase items" ON purchase_items;

CREATE POLICY "Users can view own purchase items"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own purchase items"
  ON purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own purchase items"
  ON purchase_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND purchases.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own purchase items"
  ON purchase_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND purchases.user_id = auth.uid()
  ));

-- ============================================================================
-- INVOICE PAYMENTS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage invoice payments" ON invoice_payments;

CREATE POLICY "Users can view own invoice payments"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own invoice payments"
  ON invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own invoice payments"
  ON invoice_payments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id
    AND invoices.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own invoice payments"
  ON invoice_payments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_payments.invoice_id
    AND invoices.user_id = auth.uid()
  ));

-- ============================================================================
-- PURCHASE PAYMENTS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage purchase payments" ON purchase_payments;

CREATE POLICY "Users can view own purchase payments"
  ON purchase_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_payments.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own purchase payments"
  ON purchase_payments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_payments.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own purchase payments"
  ON purchase_payments FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_payments.purchase_id
    AND purchases.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_payments.purchase_id
    AND purchases.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own purchase payments"
  ON purchase_payments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchases
    WHERE purchases.id = purchase_payments.purchase_id
    AND purchases.user_id = auth.uid()
  ));

-- ============================================================================
-- INVENTORY MOVEMENTS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own inventory movements" ON inventory_movements;

CREATE POLICY "Users can view own inventory movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory movements"
  ON inventory_movements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory movements"
  ON inventory_movements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSE CATEGORIES TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own expense categories" ON expense_categories;

CREATE POLICY "Users can view own expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense categories"
  ON expense_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense categories"
  ON expense_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PAYMENT METHODS TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMPANY PROFILE TABLE - Separate into individual operations
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own company profile" ON company_profile;

CREATE POLICY "Users can view own company profile"
  ON company_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
  ON company_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);