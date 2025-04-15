-- Create sequence for backup table
CREATE SEQUENCE IF NOT EXISTS public.backup_id_seq;

-- Create backup table
CREATE TABLE IF NOT EXISTS public.backup (
    id integer NOT NULL DEFAULT nextval('backup_id_seq'::regclass),
    file_name character varying(255) NOT NULL,
    size bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    tenant_id integer NOT NULL,
    CONSTRAINT backup_pkey PRIMARY KEY (id),
    CONSTRAINT backup_tenant_id_fkey FOREIGN KEY (tenant_id)
        REFERENCES public.master_tenant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- Create index for better performance
CREATE INDEX idx_backup_tenant ON public.backup(tenant_id);
CREATE INDEX idx_backup_created_at ON public.backup(created_at);

-- Set sequence owner
ALTER SEQUENCE backup_id_seq OWNED BY public.backup.id;

-- Grant permissions
ALTER TABLE public.backup OWNER to zentra_admin; 