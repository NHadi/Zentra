-- Add zones for each region
INSERT INTO master_zone (name, region_id, description, created_at, created_by, updated_at, updated_by, tenant_id)
VALUES 
    -- North Region Zones
    ('North Zone 1', 1, 'Northern Zone 1', NOW(), 'admin', NOW(), 'admin', 1),
    ('North Zone 2', 1, 'Northern Zone 2', NOW(), 'admin', NOW(), 'admin', 1),
    ('North Zone 3', 1, 'Northern Zone 3', NOW(), 'admin', NOW(), 'admin', 1),
    
    -- South Region Zones
    ('South Zone 1', 2, 'Southern Zone 1', NOW(), 'admin', NOW(), 'admin', 1),
    ('South Zone 2', 2, 'Southern Zone 2', NOW(), 'admin', NOW(), 'admin', 1),
    ('South Zone 3', 2, 'Southern Zone 3', NOW(), 'admin', NOW(), 'admin', 1),
    
    -- East Region Zones
    ('East Zone 1', 3, 'Eastern Zone 1', NOW(), 'admin', NOW(), 'admin', 1),
    ('East Zone 2', 3, 'Eastern Zone 2', NOW(), 'admin', NOW(), 'admin', 1),
    ('East Zone 3', 3, 'Eastern Zone 3', NOW(), 'admin', NOW(), 'admin', 1),
    
    -- West Region Zones
    ('West Zone 1', 4, 'Western Zone 1', NOW(), 'admin', NOW(), 'admin', 1),
    ('West Zone 2', 4, 'Western Zone 2', NOW(), 'admin', NOW(), 'admin', 1),
    ('West Zone 3', 4, 'Western Zone 3', NOW(), 'admin', NOW(), 'admin', 1),
    
    -- Central Region Zones
    ('Central Zone 1', 5, 'Central Zone 1', NOW(), 'admin', NOW(), 'admin', 1),
    ('Central Zone 2', 5, 'Central Zone 2', NOW(), 'admin', NOW(), 'admin', 1),
    ('Central Zone 3', 5, 'Central Zone 3', NOW(), 'admin', NOW(), 'admin', 1); 