-- Create sequence first
CREATE SEQUENCE IF NOT EXISTS public.master_tenant_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Create tenant table
CREATE TABLE IF NOT EXISTS public.master_tenant (
    id integer NOT NULL DEFAULT nextval('master_tenant_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    domain character varying(255) COLLATE pg_catalog."default" NOT NULL,
    status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT master_tenant_pkey PRIMARY KEY (id),
    CONSTRAINT master_tenant_domain_key UNIQUE (domain)
);

-- Set sequence owner
ALTER SEQUENCE public.master_tenant_id_seq
    OWNED BY public.master_tenant.id;

-- 2. Insert default tenant
INSERT INTO public.master_tenant (name, domain) 
VALUES ('Default Tenant', 'default.zentra.com');

-- 3. Add tenant_id column to existing tables (allowing NULL initially)
ALTER TABLE public.master_division ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_employee ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_menu ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_permission ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_product ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_product_category ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_region ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_role ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.master_zone ADD COLUMN tenant_id integer REFERENCES master_tenant(id);
ALTER TABLE public.users ADD COLUMN tenant_id integer REFERENCES master_tenant(id);

-- 4. Migrate existing data to default tenant
UPDATE public.master_division SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_employee SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_menu SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_permission SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_product SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_product_category SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_region SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_role SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.master_zone SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);
UPDATE public.users SET tenant_id = (SELECT id FROM master_tenant LIMIT 1);

-- 5. Make tenant_id NOT NULL after data migration
ALTER TABLE public.master_division ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_employee ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_menu ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_permission ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_product ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_product_category ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_region ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_role ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.master_zone ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Add indexes for better performance
CREATE INDEX idx_division_tenant ON public.master_division(tenant_id);
CREATE INDEX idx_employee_tenant ON public.master_employee(tenant_id);
CREATE INDEX idx_menu_tenant ON public.master_menu(tenant_id);
CREATE INDEX idx_permission_tenant ON public.master_permission(tenant_id);
CREATE INDEX idx_product_tenant ON public.master_product(tenant_id);
CREATE INDEX idx_product_category_tenant ON public.master_product_category(tenant_id);
CREATE INDEX idx_region_tenant ON public.master_region(tenant_id);
CREATE INDEX idx_role_tenant ON public.master_role(tenant_id);
CREATE INDEX idx_zone_tenant ON public.master_zone(tenant_id);
CREATE INDEX idx_users_tenant ON public.users(tenant_id);