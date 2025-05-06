-- Create master_customer table
CREATE SEQUENCE IF NOT EXISTS public.master_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.master_customer (
    id integer DEFAULT nextval('public.master_customer_id_seq'::regclass) NOT NULL,
    customer_number character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    address text,
    city character varying(100),
    postal_code character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT master_customer_pkey PRIMARY KEY (id),
    CONSTRAINT master_customer_tenant_id_customer_number_key UNIQUE (tenant_id, customer_number),
    CONSTRAINT master_customer_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT valid_customer_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);

COMMENT ON TABLE public.master_customer IS 'Stores customer information for orders and transactions';

-- Add customer_id to orders table
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS customer_id integer,
    ADD CONSTRAINT orders_customer_id_fkey 
    FOREIGN KEY (customer_id) 
    REFERENCES public.master_customer(id) 
    ON UPDATE CASCADE 
    ON DELETE RESTRICT;

-- Make existing customer fields nullable since they will be moved to master_customer
ALTER TABLE public.orders 
    ALTER COLUMN customer_name DROP NOT NULL,
    ALTER COLUMN customer_email DROP NOT NULL;

-- Migration script to populate master_customer table from existing orders
DO $$
BEGIN
    -- Insert distinct customers from orders table into master_customer
    INSERT INTO public.master_customer (
        customer_number,
        name,
        email,
        phone,
        address,
        tenant_id,
        created_at,
        created_by,
        updated_at,
        updated_by
    )
    SELECT DISTINCT ON (o.customer_name, o.tenant_id)
        'CUST-' || EXTRACT(EPOCH FROM o.created_at)::integer::text AS customer_number,
        o.customer_name AS name,
        o.customer_email AS email,
        o.customer_phone AS phone,
        o.delivery_address AS address,
        o.tenant_id,
        o.created_at,
        o.created_by,
        o.updated_at,
        o.updated_by
    FROM public.orders o
    WHERE o.customer_name IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Update orders with corresponding customer_id
    UPDATE public.orders o
    SET customer_id = mc.id
    FROM public.master_customer mc
    WHERE o.customer_name = mc.name
    AND o.tenant_id = mc.tenant_id
    AND o.customer_id IS NULL;
END $$; 