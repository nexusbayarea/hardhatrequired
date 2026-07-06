-- Public read models for the landing page / public API layer
-- CQRS-style read models powered by the same graph, no auth required

-- Coverage statistics: single query returns all aggregate counts
CREATE OR REPLACE FUNCTION get_public_coverage()
RETURNS json
LANGUAGE sql
STABLE
AS $$
SELECT json_build_object(
  'companies', COALESCE((SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL), 0),
  'permits', COALESCE((
    SELECT SUM(
      CASE WHEN permits IS NOT NULL AND jsonb_typeof(permits) = 'array'
           THEN jsonb_array_length(permits) ELSE 0 END
    ) FROM deep_profiles
  ), 0),
  'equipment', COALESCE((
    SELECT COUNT(*) FROM deep_profiles
    WHERE equipment IS NOT NULL AND equipment != '[]'::jsonb
  ), 0),
  'bids', COALESCE((
    SELECT COUNT(*) FROM bid_results
    WHERE status IN ('open', 'closing_soon')
  ), 0),
  'deepProfiles', COALESCE((SELECT COUNT(*) FROM deep_profiles), 0),
  'states', COALESCE((
    SELECT COUNT(DISTINCT state) FROM deep_profiles WHERE state IS NOT NULL
  ), 0)
);
$$;
