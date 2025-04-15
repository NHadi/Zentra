-- Create master_zone table
CREATE TABLE IF NOT EXISTS master_zone (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES master_region(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    tenant_id INTEGER NOT NULL REFERENCES master_tenant(id) ON DELETE CASCADE
);

-- Create index on tenant_id for better query performance
CREATE INDEX idx_master_zone_tenant_id ON master_zone(tenant_id);

-- Create index on region_id for better query performance
CREATE INDEX idx_master_zone_region_id ON master_zone(region_id);

-- Grant permissions to zentra_admin
ALTER TABLE master_zone OWNER TO zentra_admin; 