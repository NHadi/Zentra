-- First ensure all orders have a valid customer_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM public.orders 
        WHERE customer_id IS NULL 
        AND customer_name IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot proceed with migration: Some orders still have customer information but no customer_id';
    END IF;
END $$;

-- Remove redundant customer fields from orders table
ALTER TABLE public.orders 
    DROP COLUMN IF EXISTS customer_name,
    DROP COLUMN IF EXISTS customer_email,
    DROP COLUMN IF EXISTS customer_phone,
    DROP COLUMN IF EXISTS delivery_address;

-- Add NOT NULL constraint to customer_id as it should be required now
ALTER TABLE public.orders 
    ALTER COLUMN customer_id SET NOT NULL; 