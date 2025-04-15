-- Access Management Module Permissions
INSERT INTO public.master_permission (name, description, code, module, tenant_id, created_by, updated_by) VALUES
-- Permission Management
('View Permissions', 'Can view permission list', 'PERMISSION_VIEW', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Manage Permissions', 'Can create/update permissions', 'PERMISSION_MANAGE', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),

-- Role Management
('View Roles', 'Can view role list', 'ROLE_VIEW', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Manage Roles', 'Can create/update roles', 'ROLE_MANAGE', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Delete Roles', 'Can delete roles', 'ROLE_DELETE', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),

-- User Management
('View Users', 'Can view user list', 'USER_VIEW', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Manage Users', 'Can create/update users', 'USER_MANAGE', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Delete Users', 'Can delete users', 'USER_DELETE', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),

-- Menu Management
('View Menus', 'Can view menu list', 'MENU_VIEW', 'ACCESS_MANAGEMENT', 1, 'system', 'system'),
('Manage Menus', 'Can create/update menus', 'MENU_MANAGE', 'ACCESS_MANAGEMENT', 1, 'system', 'system');

-- Master Data Module Permissions
INSERT INTO public.master_permission (name, description, code, module, tenant_id, created_by, updated_by) VALUES
-- Zone
('View Zones', 'Can view zone list', 'ZONE_VIEW', 'MASTER_DATA', 1, 'system', 'system'),
('Manage Zones', 'Can create/update zones', 'ZONE_MANAGE', 'MASTER_DATA', 1, 'system', 'system'),
('Delete Zones', 'Can delete zones', 'ZONE_DELETE', 'MASTER_DATA', 1, 'system', 'system');

-- Transaction Module Permissions
INSERT INTO public.master_permission (name, description, code, module, tenant_id, created_by, updated_by) VALUES
-- Order Management
('View Orders', 'Can view order list', 'ORDER_VIEW', 'TRANSACTION', 1, 'system', 'system'),
('Create Orders', 'Can create new orders', 'ORDER_CREATE', 'TRANSACTION', 1, 'system', 'system'),
('Update Orders', 'Can update orders', 'ORDER_UPDATE', 'TRANSACTION', 1, 'system', 'system'),
('Delete Orders', 'Can delete orders', 'ORDER_DELETE', 'TRANSACTION', 1, 'system', 'system'),
('Approve Orders', 'Can approve orders', 'ORDER_APPROVE', 'TRANSACTION', 1, 'system', 'system'),

-- Payment Management
('View Payments', 'Can view payments', 'PAYMENT_VIEW', 'TRANSACTION', 1, 'system', 'system'),
('Process Payments', 'Can process payments', 'PAYMENT_PROCESS', 'TRANSACTION', 1, 'system', 'system'),
('Cancel Payments', 'Can cancel payments', 'PAYMENT_CANCEL', 'TRANSACTION', 1, 'system', 'system'),

-- Task Management
('View Tasks', 'Can view tasks', 'TASK_VIEW', 'TRANSACTION', 1, 'system', 'system'),
('Manage Tasks', 'Can create/update tasks', 'TASK_MANAGE', 'TRANSACTION', 1, 'system', 'system'),
('Delete Tasks', 'Can delete tasks', 'TASK_DELETE', 'TRANSACTION', 1, 'system', 'system');

-- Accounting Module Permissions
INSERT INTO public.master_permission (name, description, code, module, tenant_id, created_by, updated_by) VALUES
-- Cash Flow
('View Cash Flow', 'Can view cash flow', 'CASH_FLOW_VIEW', 'ACCOUNTING', 1, 'system', 'system'),
('Manage Cash Flow', 'Can manage cash flow', 'CASH_FLOW_MANAGE', 'ACCOUNTING', 1, 'system', 'system'),

-- Petty Cash
('View Petty Cash', 'Can view petty cash', 'PETTY_CASH_VIEW', 'ACCOUNTING', 1, 'system', 'system'),
('Create Petty Cash', 'Can create petty cash', 'PETTY_CASH_CREATE', 'ACCOUNTING', 1, 'system', 'system'),
('Approve Petty Cash', 'Can approve petty cash', 'PETTY_CASH_APPROVE', 'ACCOUNTING', 1, 'system', 'system');
