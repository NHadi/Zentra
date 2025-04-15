-- Create sequence for audit trail
CREATE SEQUENCE IF NOT EXISTS public.audit_trail_id_seq;

-- Create audit trail table
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id integer NOT NULL DEFAULT nextval('audit_trail_id_seq'::regclass),
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'menu', 'user', etc.
    entity_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    old_values JSONB,
    new_values JSONB,
    tenant_id INTEGER NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_trail_pkey PRIMARY KEY (id),
    CONSTRAINT audit_trail_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES public.master_tenant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- Create indexes for better performance
CREATE INDEX idx_audit_trail_entity ON public.audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_trail_tenant ON public.audit_trail(tenant_id);
CREATE INDEX idx_audit_trail_created_at ON public.audit_trail(created_at);

-- Set sequence owner
ALTER SEQUENCE audit_trail_id_seq OWNED BY public.audit_trail.id;

-- Grant permissions
ALTER TABLE IF EXISTS public.audit_trail OWNER to zentra_admin; 