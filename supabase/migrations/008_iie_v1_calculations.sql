-- 008: Calculations Table — Contractor Tier Conflict Resolution
-- Adds versioned calculations storage with RLS and auto-increment trigger

CREATE TABLE IF NOT EXISTS public.calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    input_json JSONB NOT NULL,
    result_json JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own calculations"
ON public.calculations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_calculation_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_calculation_version ON public.calculations;
CREATE TRIGGER trigger_increment_calculation_version
BEFORE UPDATE ON public.calculations
FOR EACH ROW
EXECUTE FUNCTION public.increment_calculation_version();

CREATE INDEX IF NOT EXISTS idx_calculations_user_type
ON public.calculations(user_id, type, created_at DESC);
