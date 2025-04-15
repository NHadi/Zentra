-- Create sequence for product category
CREATE SEQUENCE IF NOT EXISTS public.master_product_category_id_seq;

-- Create Product Category table
CREATE TABLE IF NOT EXISTS public.master_product_category (
    id integer NOT NULL DEFAULT nextval('master_product_category_id_seq'::regclass),
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT master_product_category_pkey PRIMARY KEY (id),
    CONSTRAINT master_product_category_code_key UNIQUE (code, tenant_id),
    CONSTRAINT master_product_category_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES public.master_tenant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- Create sequence for product
CREATE SEQUENCE IF NOT EXISTS public.master_product_id_seq;

-- Create Product table
CREATE TABLE IF NOT EXISTS public.master_product (
    id integer NOT NULL DEFAULT nextval('master_product_id_seq'::regclass),
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    category_id integer NOT NULL,
    description text,
    -- Jersey-specific fields
    material character varying(100), -- e.g., Polyester, Cotton, Mesh, etc.
    size_available jsonb, -- Array of available sizes (S, M, L, XL, etc.)
    color_options jsonb, -- Available color combinations
    customization_options jsonb, -- Available customization options (name, number, patches)
    production_time integer, -- Estimated production time in days
    min_order_quantity integer DEFAULT 1,
    base_price numeric(10,2) NOT NULL,
    bulk_discount_rules jsonb, -- Rules for bulk order discounts
    weight numeric(5,2), -- Weight in grams
    is_active boolean DEFAULT true,
    stock_status character varying(50) DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT master_product_pkey PRIMARY KEY (id),
    CONSTRAINT master_product_code_key UNIQUE (code, tenant_id),
    CONSTRAINT master_product_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES public.master_product_category (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT master_product_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES public.master_tenant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT master_product_base_price_check CHECK (base_price >= 0),
    CONSTRAINT master_product_min_order_check CHECK (min_order_quantity > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_product_category_tenant ON public.master_product_category(tenant_id);
CREATE INDEX idx_product_category_code ON public.master_product_category(code);
CREATE INDEX idx_product_tenant ON public.master_product(tenant_id);
CREATE INDEX idx_product_category ON public.master_product(category_id);
CREATE INDEX idx_product_code ON public.master_product(code);
CREATE INDEX idx_product_status ON public.master_product(stock_status);

-- Insert default product categories for jersey production
INSERT INTO public.master_product_category (name, code, description, tenant_id, created_by, updated_by)
VALUES 
    ('Soccer Jersey', 'SOCCER', 'Soccer team jerseys and uniforms', 1, 'system', 'system'),
    ('Basketball Jersey', 'BBALL', 'Basketball team jerseys and uniforms', 1, 'system', 'system'),
    ('Baseball Jersey', 'BASEBALL', 'Baseball team jerseys and uniforms', 1, 'system', 'system'),
    ('Custom Team Jersey', 'CUSTOM', 'Custom designed team jerseys', 1, 'system', 'system'),
    ('Training Jersey', 'TRAINING', 'Training and practice jerseys', 1, 'system', 'system'),
    ('E-Sports Jersey', 'ESPORTS', 'E-Sports team jerseys and uniforms', 1, 'system', 'system');

-- Insert sample products
INSERT INTO public.master_product (
    name, code, category_id, description, material, 
    size_available, color_options, customization_options,
    production_time, min_order_quantity, base_price,
    bulk_discount_rules, weight, tenant_id, created_by, updated_by
)
VALUES (
    'Pro Soccer Jersey', 'PSJ001', 1, 'Professional grade soccer jersey',
    'Premium Polyester', 
    '["S", "M", "L", "XL", "XXL"]',
    '["Red/White", "Blue/White", "Green/White", "Custom"]',
    '{"name": true, "number": true, "team_logo": true, "patches": true}',
    5, 1, 49.99,
    '{"10": 5, "20": 10, "50": 15}', -- Quantity: Discount percentage
    180, 1, 'system', 'system'
),
(
    'Basketball Pro Kit', 'BPK001', 2, 'Professional basketball jersey kit',
    'Mesh Polyester',
    '["S", "M", "L", "XL", "XXL"]',
    '["White/Black", "Black/Gold", "Red/Black", "Custom"]',
    '{"name": true, "number": true, "team_logo": true}',
    7, 5, 59.99,
    '{"10": 5, "20": 10, "50": 15}',
    200, 1, 'system', 'system'
);

-- Grant permissions
ALTER TABLE public.master_product_category OWNER to zentra_admin;
ALTER TABLE public.master_product OWNER to zentra_admin; 