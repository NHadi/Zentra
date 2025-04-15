-- Update master_product table with jersey-specific fields
ALTER TABLE public.master_product
    ADD COLUMN material character varying(100),
    ADD COLUMN size_available jsonb,
    ADD COLUMN color_options jsonb,
    ADD COLUMN customization_options jsonb,
    ADD COLUMN production_time integer,
    ADD COLUMN min_order_quantity integer DEFAULT 1,
    ADD COLUMN base_price numeric(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN bulk_discount_rules jsonb,
    ADD COLUMN weight numeric(5,2),
    ADD COLUMN is_active boolean DEFAULT true,
    ADD COLUMN stock_status character varying(50) DEFAULT 'in_stock',
    ADD CONSTRAINT master_product_base_price_check CHECK (base_price >= 0),
    ADD CONSTRAINT master_product_min_order_check CHECK (min_order_quantity > 0);

-- Drop old price column as we're using base_price now
ALTER TABLE public.master_product DROP COLUMN price;

-- Insert sample product categories if they don't exist
INSERT INTO public.master_product_category (name, code, description, tenant_id, created_by, updated_by)
SELECT * FROM (VALUES 
    ('Soccer Jersey', 'SOCCER', 'Soccer team jerseys and uniforms', 1, 'system', 'system'),
    ('Basketball Jersey', 'BBALL', 'Basketball team jerseys and uniforms', 1, 'system', 'system'),
    ('Baseball Jersey', 'BASEBALL', 'Baseball team jerseys and uniforms', 1, 'system', 'system'),
    ('Custom Team Jersey', 'CUSTOM', 'Custom designed team jerseys', 1, 'system', 'system'),
    ('Training Jersey', 'TRAINING', 'Training and practice jerseys', 1, 'system', 'system'),
    ('E-Sports Jersey', 'ESPORTS', 'E-Sports team jerseys and uniforms', 1, 'system', 'system')
) AS v(name, code, description, tenant_id, created_by, updated_by)
WHERE NOT EXISTS (
    SELECT 1 FROM public.master_product_category 
    WHERE code = v.code AND tenant_id = v.tenant_id
);

-- Insert sample products if they don't exist
INSERT INTO public.master_product (
    name, code, category_id, description, material, 
    size_available, color_options, customization_options,
    production_time, min_order_quantity, base_price,
    bulk_discount_rules, weight, tenant_id, created_by, updated_by
)
SELECT * FROM (VALUES (
    'Pro Soccer Jersey', 'PSJ001', 
    (SELECT id FROM public.master_product_category WHERE code = 'SOCCER' AND tenant_id = 1),
    'Professional grade soccer jersey',
    'Premium Polyester', 
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["Red/White", "Blue/White", "Green/White", "Custom"]'::jsonb,
    '{"name": true, "number": true, "team_logo": true, "patches": true}'::jsonb,
    5, 1, 49.99,
    '{"10": 5, "20": 10, "50": 15}'::jsonb,
    180, 1, 'system', 'system'
), (
    'Basketball Pro Kit', 'BPK001',
    (SELECT id FROM public.master_product_category WHERE code = 'BBALL' AND tenant_id = 1),
    'Professional basketball jersey kit',
    'Mesh Polyester',
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["White/Black", "Black/Gold", "Red/Black", "Custom"]'::jsonb,
    '{"name": true, "number": true, "team_logo": true}'::jsonb,
    7, 5, 59.99,
    '{"10": 5, "20": 10, "50": 15}'::jsonb,
    200, 1, 'system', 'system'
)) AS v(name, code, category_id, description, material, size_available, color_options, customization_options,
    production_time, min_order_quantity, base_price, bulk_discount_rules, weight, tenant_id, created_by, updated_by)
WHERE NOT EXISTS (
    SELECT 1 FROM public.master_product 
    WHERE code = v.code AND tenant_id = v.tenant_id
); 