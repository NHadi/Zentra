-- Insert default tenant first (if not exists)
INSERT INTO public.master_tenant (id, name, domain) 
VALUES (1, 'Default Tenant', 'default.zentra.com')
ON CONFLICT DO NOTHING;

-- Insert admin role with tenant
INSERT INTO public.master_role (id, name, description, tenant_id)
VALUES 
    (1, 'Admin', 'System Administrator', 1),
    (2, 'Manager', 'Department Manager', 1),
    (3, 'Staff', 'Regular Staff', 1)
ON CONFLICT DO NOTHING;

-- Insert permissions with tenant
INSERT INTO public.master_permission (id, name, description, tenant_id)
VALUES
    (1, 'create', 'Create permission', 1),
    (2, 'read', 'Read permission', 1),
    (3, 'update', 'Update permission', 1),
    (4, 'delete', 'Delete permission', 1)
ON CONFLICT DO NOTHING;

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id)
VALUES
    (1, 1), (1, 2), (1, 3), (1, 4),  -- Admin gets all permissions
    (2, 2), (2, 3),                   -- Manager gets read and update
    (3, 2)                            -- Staff gets read only
ON CONFLICT DO NOTHING;

-- Insert main menus with tenant_id
INSERT INTO public.master_menu (id, name, url, icon, parent_id, sort, tenant_id)
VALUES 
    (1, 'Access Management', NULL, 'ni ni-settings', NULL, 1, 1),
    (2, 'Master Data', NULL, 'ni ni-archive-2', NULL, 2, 1),
    (3, 'Transaction', NULL, 'ni ni-cart', NULL, 3, 1),
    (4, 'Inventory', NULL, 'ni ni-box-2', NULL, 4, 1),
    (5, 'Accounting', NULL, 'ni ni-money-coins', NULL, 5, 1),
    -- Access Management submenus
    (6, 'Permission', '/permission', 'ni ni-key-25', 1, 1, 1),
    (7, 'Role', '/role', 'ni ni-badge', 1, 2, 1),
    (8, 'User', '/user', 'ni ni-single-02', 1, 3, 1),
    (9, 'Menu', '/menu', 'ni ni-bullet-list-67', 1, 4, 1),
    -- Master Data submenus
    (10, 'Zone', '/zone', 'ni ni-map-big', 2, 1, 1),
    (11, 'Region', '/region', 'ni ni-world-2', 2, 2, 1),
    (12, 'Office', '/office', 'ni ni-building', 2, 3, 1),
    (13, 'Product', '/product', 'ni ni-box-2', 2, 4, 1),
    (14, 'Product Category', '/product-category', 'ni ni-tag', 2, 5, 1),
    (15, 'Employee', '/employee', 'ni ni-circle-08', 2, 6, 1),
    (16, 'Division', '/division', 'ni ni-collection', 2, 7, 1),
    -- Transaction submenus
    (17, 'Order', '/order', 'ni ni-cart', 3, 1, 1),
    (18, 'Order Detail', '/order-detail', 'ni ni-bullet-list-67', 3, 2, 1),
    (19, 'Order Detail Item', '/order-detail-item', 'ni ni-box-2', 3, 3, 1),
    (20, 'Payment', '/payment', 'ni ni-money-coins', 3, 4, 1),
    (21, 'Payment Detail', '/payment-detail', 'ni ni-bullet-list-67', 3, 5, 1),
    (22, 'Task', '/task', 'ni ni-calendar-grid-58', 3, 6, 1),
    (23, 'Task History', '/task-history', 'ni ni-time-alarm', 3, 7, 1),
    -- Inventory submenus
    (24, 'Master Item', '/master-item', 'ni ni-box-2', 4, 1, 1),
    (25, 'Stock Name', '/stock-name', 'ni ni-tag', 4, 2, 1),
    (26, 'Master Supplier', '/master-supplier', 'ni ni-delivery-fast', 4, 3, 1),
    -- Accounting submenus
    (27, 'Cash Flow', '/cash-flow', 'ni ni-money-coins', 5, 1, 1),
    (28, 'Purchase List', '/purchase-list', 'ni ni-cart', 5, 2, 1),
    (29, 'Payment List', '/payment-list', 'ni ni-credit-card', 5, 3, 1),
    (30, 'SPK Data', '/spk-data', 'ni ni-file-text', 5, 4, 1),
    (31, 'Petty Cash', '/petty-cash', 'ni ni-money-coins', 5, 5, 1),
    (32, 'Transaction Category', '/transaction-category', 'ni ni-tag', 5, 6, 1),
    (33, 'Petty Cash Request', '/petty-cash-request', 'ni ni-paper-diploma', 5, 7, 1),
    (34, 'Petty Cash Summary', '/petty-cash-summary', 'ni ni-chart-bar-32', 5, 8, 1)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, url = EXCLUDED.url, icon = EXCLUDED.icon, 
    parent_id = EXCLUDED.parent_id, sort = EXCLUDED.sort, tenant_id = EXCLUDED.tenant_id;

-- Assign menus to roles
-- Admin gets all menus
INSERT INTO public.role_menus (role_id, menu_id)
SELECT 1, id FROM public.master_menu WHERE tenant_id = 1
ON CONFLICT DO NOTHING;

-- Manager gets Master Data and Transaction menus
INSERT INTO public.role_menus (role_id, menu_id)
SELECT 2, id FROM public.master_menu 
WHERE (parent_id = 2 OR parent_id = 3) AND tenant_id = 1
ON CONFLICT DO NOTHING;

-- Give Manager the parent menus
INSERT INTO public.role_menus (role_id, menu_id)
VALUES 
    (2, 2),  -- Master Data parent menu
    (2, 3)   -- Transaction parent menu
ON CONFLICT DO NOTHING;

-- Staff gets only Transaction menus
INSERT INTO public.role_menus (role_id, menu_id)
SELECT 3, id FROM public.master_menu 
WHERE parent_id = 3 AND tenant_id = 1
ON CONFLICT DO NOTHING;

-- Give Staff the Transaction parent menu
INSERT INTO public.role_menus (role_id, menu_id)
VALUES (3, 3)
ON CONFLICT DO NOTHING;

-- Insert default admin user
INSERT INTO public.users (username, email, password, role_id, tenant_id)
VALUES (
    'admin',
    'admin@zentra.com',
    '$2a$10$ZOlYP9/5gHzKQmYX6JqOu.vHoFxVtcHQ.OhEb1ej0qKqkUoEGNHVe',  -- hashed 'admin123'
    1,  -- Admin role
    1   -- Default tenant
) ON CONFLICT DO NOTHING;

-- Seed data for master_region
INSERT INTO public.master_region (name, description, tenant_id, created_by, updated_by, created_at, updated_at) VALUES
('North Region', 'Northern region of the country', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('South Region', 'Southern region of the country', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('East Region', 'Eastern region of the country', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('West Region', 'Western region of the country', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Central Region', 'Central region of the country', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed data for master_zone
INSERT INTO public.master_zone (name, region_id, description, tenant_id, created_by, updated_by, created_at, updated_at) VALUES
('North Zone 1', 1, 'First zone in North Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('North Zone 2', 1, 'Second zone in North Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('South Zone 1', 2, 'First zone in South Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('South Zone 2', 2, 'Second zone in South Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('East Zone 1', 3, 'First zone in East Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('East Zone 2', 3, 'Second zone in East Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('West Zone 1', 4, 'First zone in West Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('West Zone 2', 4, 'Second zone in West Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Central Zone 1', 5, 'First zone in Central Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Central Zone 2', 5, 'Second zone in Central Region', 1, 'admin', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample offices
INSERT INTO public.master_office (name, code, address, phone, email, zone_id, created_at, updated_at, created_by, updated_by, tenant_id)
VALUES 
    -- North Zone A Offices
    ('North City Main Office', 'NCMA001', '123 North City Main St', '+12345678901', 'north.city@office.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('North City Branch Office', 'NCBA001', '456 North City Branch Ave', '+12345678902', 'north.branch@office.com', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- North Zone B Offices
    ('North Rural Main Office', 'NRMA001', '789 North Rural Main Rd', '+12345678903', 'north.rural@office.com', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('North Rural Branch Office', 'NRBA001', '321 North Rural Branch St', '+12345678904', 'north.rural.branch@office.com', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- South Zone A Offices
    ('South City Main Office', 'SCMA001', '123 South City Main St', '+12345678905', 'south.city@office.com', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('South City Branch Office', 'SCBA001', '456 South City Branch Ave', '+12345678906', 'south.branch@office.com', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- South Zone B Offices
    ('South Rural Main Office', 'SRMA001', '789 South Rural Main Rd', '+12345678907', 'south.rural@office.com', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('South Rural Branch Office', 'SRBA001', '321 South Rural Branch St', '+12345678908', 'south.rural.branch@office.com', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- East Zone A Offices
    ('East City Main Office', 'ECMA001', '123 East City Main St', '+12345678909', 'east.city@office.com', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('East City Branch Office', 'ECBA001', '456 East City Branch Ave', '+12345678910', 'east.branch@office.com', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- East Zone B Offices
    ('East Rural Main Office', 'ERMA001', '789 East Rural Main Rd', '+12345678911', 'east.rural@office.com', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('East Rural Branch Office', 'ERBA001', '321 East Rural Branch St', '+12345678912', 'east.rural.branch@office.com', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- West Zone A Offices
    ('West City Main Office', 'WCMA001', '123 West City Main St', '+12345678913', 'west.city@office.com', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('West City Branch Office', 'WCBA001', '456 West City Branch Ave', '+12345678914', 'west.branch@office.com', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    
    -- West Zone B Offices
    ('West Rural Main Office', 'WRMA001', '789 West Rural Main Rd', '+12345678915', 'west.rural@office.com', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1),
    ('West Rural Branch Office', 'WRBA001', '321 West Rural Branch St', '+12345678916', 'west.rural.branch@office.com', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin', 1);