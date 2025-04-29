-- Create persona_owners table
CREATE TABLE IF NOT EXISTS persona_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_persona_owners_persona_id ON persona_owners(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_owners_owner_id ON persona_owners(owner_id);

-- Create a unique constraint to prevent duplicate persona-owner relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_persona_owner ON persona_owners(persona_id, owner_id); 