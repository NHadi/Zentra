-- First, remove any foreign key constraints
ALTER TABLE IF EXISTS public.cash_flow
    DROP CONSTRAINT IF EXISTS cash_flow_payment_id_fkey;

-- Remove payment-related indexes
DROP INDEX IF EXISTS idx_cash_flow_payment;

-- Remove existing cash flow records that are linked to payments
DELETE FROM public.cash_flow
WHERE payment_id IS NOT NULL;

-- Remove the payment_id column from cash_flow table
ALTER TABLE public.cash_flow
    DROP COLUMN IF EXISTS payment_id;

-- Clean up any orphaned transaction categories
DELETE FROM public.transaction_categories 
WHERE code = 'PAYMENT' 
AND NOT EXISTS (
    SELECT 1 
    FROM public.cash_flow 
    WHERE cash_flow.category_id = transaction_categories.id
);

-- Add comment to track migration
COMMENT ON TABLE public.cash_flow IS 'Cash flow table - Payment relationship removed in migration 000006'; 