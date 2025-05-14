-- Create trigger function for payment-cash flow synchronization
CREATE OR REPLACE FUNCTION public.sync_payment_with_cash_flow() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Create new cash flow record for the payment
        INSERT INTO public.cash_flow (
            transaction_date,
            transaction_type,
            category_id,
            amount,
            description,
            reference_number,
            reference_type,
            reference_id,
            payment_id,
            office_id,
            status,
            tenant_id,
            created_by,
            updated_by
        )
        SELECT
            NEW.payment_date::date,
            'income',
            tc.id,
            NEW.amount,
            CASE 
                WHEN o.customer_id IS NOT NULL THEN 
                    'Payment from customer ' || mc.name || ' for order ' || o.order_number
                ELSE 
                    'Payment for order ' || o.order_number
            END,
            NEW.reference_number,
            'payment',
            NEW.id,
            NEW.id,
            o.office_id,
            CASE 
                WHEN NEW.status = 'completed' THEN 'completed'
                ELSE 'pending'
            END,
            NEW.tenant_id,
            NEW.created_by,
            NEW.updated_by
        FROM public.orders o
        LEFT JOIN public.master_customer mc ON o.customer_id = mc.id
        LEFT JOIN public.transaction_categories tc ON tc.code = 'PAYMENT' AND tc.tenant_id = NEW.tenant_id
        WHERE o.id = NEW.order_id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Update existing cash flow record
        UPDATE public.cash_flow
        SET amount = NEW.amount,
            status = CASE 
                WHEN NEW.status = 'completed' THEN 'completed'
                ELSE 'pending'
            END,
            updated_by = NEW.updated_by,
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = NEW.id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Delete corresponding cash flow record
        DELETE FROM public.cash_flow WHERE payment_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Add trigger to payments table
DROP TRIGGER IF EXISTS tr_sync_payment_with_cash_flow ON public.payments;
CREATE TRIGGER tr_sync_payment_with_cash_flow
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.sync_payment_with_cash_flow();

-- Ensure PAYMENT transaction category exists for each tenant
INSERT INTO public.transaction_categories (
    code,
    name,
    description,
    type,
    tenant_id,
    created_by,
    updated_by
)
SELECT 
    'PAYMENT',
    'Payment',
    'Transaction category for order payments',
    'income',
    id,
    'system',
    'system'
FROM public.master_tenant
ON CONFLICT (code, tenant_id) DO NOTHING;

-- Sync existing payments with cash_flow
INSERT INTO public.cash_flow (
    transaction_date,
    transaction_type,
    category_id,
    amount,
    description,
    reference_number,
    reference_type,
    reference_id,
    payment_id,
    office_id,
    status,
    tenant_id,
    created_by,
    updated_by
)
SELECT
    p.payment_date::date,
    'income',
    tc.id,
    p.amount,
    CASE 
        WHEN o.customer_id IS NOT NULL THEN 
            'Payment from customer ' || mc.name || ' for order ' || o.order_number
        ELSE 
            'Payment for order ' || o.order_number
    END,
    p.reference_number,
    'payment',
    p.id,
    p.id,
    o.office_id,
    CASE 
        WHEN p.status = 'completed' THEN 'completed'
        ELSE 'pending'
    END,
    p.tenant_id,
    p.created_by,
    p.updated_by
FROM public.payments p
JOIN public.orders o ON p.order_id = o.id
LEFT JOIN public.master_customer mc ON o.customer_id = mc.id
LEFT JOIN public.transaction_categories tc ON tc.code = 'PAYMENT' AND tc.tenant_id = p.tenant_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.cash_flow cf WHERE cf.payment_id = p.id
); 