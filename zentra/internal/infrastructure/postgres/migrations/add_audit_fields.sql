-- Add audit columns to all master tables
ALTER TABLE public.master_tenant 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_division 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_employee 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_menu 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_permission 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_product 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_product_category 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_region 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_role 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_zone 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.users 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.role_menus 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.role_permissions 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE public.master_user_menu 
ADD COLUMN created_by VARCHAR(255),
ADD COLUMN updated_by VARCHAR(255);

-- Set default values for existing records
UPDATE public.master_tenant SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_division SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_employee SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_menu SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_permission SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_product SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_product_category SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_region SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_role SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_zone SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.users SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.role_menus SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.role_permissions SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;
UPDATE public.master_user_menu SET created_by = 'system', updated_by = 'system' WHERE created_by IS NULL;

-- Add NOT NULL constraints after setting default values
ALTER TABLE public.master_tenant ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_tenant ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_division ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_division ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_employee ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_employee ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_menu ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_menu ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_permission ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_permission ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_product ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_product ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_product_category ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_product_category ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_region ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_region ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_role ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_role ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_zone ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_zone ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.users ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.role_menus ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.role_menus ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.role_permissions ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.role_permissions ALTER COLUMN updated_by SET NOT NULL;

ALTER TABLE public.master_user_menu ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.master_user_menu ALTER COLUMN updated_by SET NOT NULL;