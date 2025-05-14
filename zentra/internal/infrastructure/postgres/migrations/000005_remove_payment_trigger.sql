-- Drop the trigger and function
DROP TRIGGER IF EXISTS tr_sync_payment_with_cash_flow ON public.payments;
DROP FUNCTION IF EXISTS public.sync_payment_with_cash_flow();

-- Note: We'll keep the PAYMENT transaction category and existing cash_flow records
-- as they'll be managed by the application layer now 