-- Create role_permission table
CREATE TABLE IF NOT EXISTS public.role_permission (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES public.master_role(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES public.master_permission(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id, tenant_id)
);

-- Create user_role table
CREATE TABLE IF NOT EXISTS public.user_role (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES public.master_role(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id, tenant_id)
);

-- Insert default admin role if not exists
INSERT INTO public.master_role (name, description, tenant_id, created_by, updated_by)
VALUES ('Admin', 'Administrator with full access', 1, 'system', 'system')
ON CONFLICT (name) DO NOTHING;

-- Insert default user role if not exists
INSERT INTO public.master_role (name, description, tenant_id, created_by, updated_by)
VALUES ('User', 'Regular user with basic access', 1, 'system', 'system')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO public.role_permission (role_id, permission_id, tenant_id, created_by, updated_by)
SELECT 
    1, -- admin role id
    p.id,
    1, -- tenant_id
    'system',
    'system'
FROM public.master_permission p
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING;

-- Assign basic view permissions to user role
INSERT INTO public.role_permission (role_id, permission_id, tenant_id, created_by, updated_by)
SELECT 
    2, -- user role id
    p.id,
    1, -- tenant_id
    'system',
    'system'
FROM public.master_permission p
WHERE p.code IN (
    'MENU_VIEW',
    'USER_VIEW',
    'ROLE_VIEW',
    'PERMISSION_VIEW'
)
ON CONFLICT (role_id, permission_id, tenant_id) DO NOTHING; 