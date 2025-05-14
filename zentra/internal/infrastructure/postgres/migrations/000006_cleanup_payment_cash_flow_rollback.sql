-- Add back the payment_id column
ALTER TABLE public.cash_flow
    ADD COLUMN IF NOT EXISTS payment_id bigint;

-- Create index for payment_id
CREATE INDEX IF NOT EXISTS idx_cash_flow_payment
    ON public.cash_flow(payment_id);

-- Add foreign key constraint
ALTER TABLE public.cash_flow
    ADD CONSTRAINT cash_flow_payment_id_fkey
    FOREIGN KEY (payment_id)
    REFERENCES public.payments(id)
    ON DELETE CASCADE;

-- Restore comment
COMMENT ON TABLE public.cash_flow IS 'Cash flow table'; 