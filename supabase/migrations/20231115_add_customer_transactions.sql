-- Create customer_transactions table
CREATE TABLE IF NOT EXISTS public.customer_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'opening_balance', 'invoice_payment', 'credit_note', 'other')),
  reference TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view transactions
CREATE POLICY "Allow read access to own customer transactions"
ON public.customer_transactions
FOR SELECT
USING (auth.uid() = created_by);

-- Allow users to insert their own transactions
CREATE POLICY "Allow insert for own customer transactions"
ON public.customer_transactions
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own transactions
CREATE POLICY "Allow update for own customer transactions"
ON public.customer_transactions
FOR UPDATE
USING (auth.uid() = created_or_updated_by())
WITH CHECK (auth.uid() = created_or_updated_by());

-- Allow users to delete their own transactions
CREATE POLICY "Allow delete for own customer transactions"
ON public.customer_transactions
FOR DELETE
USING (auth.uid() = created_by);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
DROP TRIGGER IF EXISTS update_customer_transactions_updated_at ON public.customer_transactions;
CREATE TRIGGER update_customer_transactions_updated_at
BEFORE UPDATE ON public.customer_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to handle opening balance updates
CREATE OR REPLACE FUNCTION public.handle_customer_opening_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer's opening_balance when a new transaction of type 'opening_balance' is inserted
  IF TG_OP = 'INSERT' AND NEW.type = 'opening_balance' THEN
    UPDATE public.customers
    SET opening_balance = NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  -- If the transaction is updated, update the customer's opening_balance if it's an opening_balance transaction
  IF TG_OP = 'UPDATE' AND NEW.type = 'opening_balance' THEN
    UPDATE public.customers
    SET opening_balance = NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  -- If the transaction is deleted, set the customer's opening_balance to 0 if it was an opening_balance transaction
  IF TG_OP = 'DELETE' AND OLD.type = 'opening_balance' THEN
    UPDATE public.customers
    SET opening_balance = 0,
        updated_at = NOW()
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the opening balance handler
DROP TRIGGER IF EXISTS customer_transactions_after_insert ON public.customer_transactions;
CREATE TRIGGER customer_transactions_after_insert
AFTER INSERT ON public.customer_transactions
FOR EACH ROW
WHEN (NEW.type = 'opening_balance')
EXECUTE FUNCTION public.handle_customer_opening_balance();

DROP TRIGGER IF EXISTS customer_transactions_after_update ON public.customer_transactions;
CREATE TRIGGER customer_transactions_after_update
AFTER UPDATE ON public.customer_transactions
FOR EACH ROW
WHEN (NEW.type = 'opening_balance')
EXECUTE FUNCTION public.handle_customer_opening_balance();

DROP TRIGGER IF EXISTS customer_transactions_after_delete ON public.customer_transactions;
CREATE TRIGGER customer_transactions_after_delete
AFTER DELETE ON public.customer_transactions
FOR EACH ROW
WHEN (OLD.type = 'opening_balance')
EXECUTE FUNCTION public.handle_customer_opening_balance();

-- Create a function to get the created_by user for RLS
CREATE OR REPLACE FUNCTION public.created_or_updated_by()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Grant necessary permissions
GRANT ALL ON TABLE public.customer_transactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.customer_transactions_id_seq TO authenticated;
