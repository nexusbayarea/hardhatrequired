-- Equipment Rental Discovery schema
-- Implements the federated index for heavy machinery rental search
-- with PostGIS geospatial matching, partner trust scoring, and temporal availability.

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Equipment inventory table
CREATE TABLE IF NOT EXISTS equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR(255) NOT NULL,
  equipment_class VARCHAR(100) NOT NULL,
  daily_rate NUMERIC(10, 2) NOT NULL,
  weekly_rate NUMERIC(10, 2),
  monthly_rate NUMERIC(10, 2),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_radius_miles INTEGER NOT NULL DEFAULT 60,
  geo_location GEOGRAPHY(POINT, 4326) NOT NULL,
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  dispatch_email VARCHAR(255),
  website VARCHAR(500),
  active_permits TEXT[],
  insurance_verified BOOLEAN DEFAULT FALSE,
  operator_included BOOLEAN DEFAULT FALSE,
  requires_cdl BOOLEAN DEFAULT FALSE,
  minimum_rental_days INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'available',
  partner_rating NUMERIC(2, 1) DEFAULT 5.0,
  historical_completions INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for geospatial and filter queries
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_geo ON equipment_inventory USING GIST (geo_location);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_class ON equipment_inventory (equipment_class);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_status ON equipment_inventory (status);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_partner ON equipment_inventory (partner_name);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_zip ON equipment_inventory (zip);

-- Availability calendar table for temporal queries
CREATE TABLE IF NOT EXISTS equipment_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_inventory(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  UNIQUE(equipment_id, available_date)
);

CREATE INDEX IF NOT EXISTS idx_equipment_availability_date ON equipment_availability (available_date);
CREATE INDEX IF NOT EXISTS idx_equipment_availability_eqid ON equipment_availability (equipment_id);

-- Booking / lead capture table
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_inventory(id),
  organization_id UUID NOT NULL,
  user_id UUID,
  project_id UUID,
  lease_start DATE NOT NULL,
  lease_end DATE,
  status VARCHAR(50) DEFAULT 'inquiry',
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  notes TEXT,
  source VARCHAR(50) DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_bookings_org ON equipment_bookings (organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_status ON equipment_bookings (status);

-- Enable RLS
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies: inventory and availability are publicly readable, bookings are org-scoped
CREATE POLICY "equipment_inventory_select_public" ON equipment_inventory
  FOR SELECT USING (true);

CREATE POLICY "equipment_availability_select_public" ON equipment_availability
  FOR SELECT USING (true);

CREATE POLICY "equipment_bookings_select_org" ON equipment_bookings
  FOR SELECT TO authenticated
  USING (organization_id = auth.uid());

CREATE POLICY "equipment_bookings_insert_auth" ON equipment_bookings
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = auth.uid());

-- Grant API access
GRANT SELECT ON equipment_inventory TO anon, authenticated;
GRANT SELECT ON equipment_availability TO anon, authenticated;
GRANT SELECT, INSERT ON equipment_bookings TO authenticated;

-- Geospatial search function
CREATE OR REPLACE FUNCTION search_equipment_by_location(
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION,
  p_radius_miles INTEGER DEFAULT 25,
  p_equipment_class VARCHAR DEFAULT NULL,
  p_target_date DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  partner_name VARCHAR,
  equipment_class VARCHAR,
  daily_rate NUMERIC,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  delivery_fee NUMERIC,
  distance_miles DOUBLE PRECISION,
  proximity_score DOUBLE PRECISION,
  trust_index DOUBLE PRECISION,
  composite_rank DOUBLE PRECISION,
  is_verified_partner BOOLEAN,
  contact_phone VARCHAR,
  dispatch_email VARCHAR,
  city VARCHAR,
  state VARCHAR
)
LANGUAGE SQL
STABLE
AS $$
  WITH geo_filter AS (
    SELECT
      e.*,
      ST_Distance(
        e.geo_location,
        ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
      ) / 1609.34 AS distance_miles
    FROM equipment_inventory e
    WHERE e.status = 'available'
      AND (
        p_equipment_class IS NULL
        OR e.equipment_class = p_equipment_class
      )
  ),
  scored AS (
    SELECT
      *,
      GREATEST(0, 100 * (1 - distance_miles / p_radius_miles::DOUBLE PRECISION)) AS proximity_score,
      (0.50 * partner_rating / 5.0 + 0.30 * LEAST(historical_completions, 100) / 100.0 + 0.20 * CASE WHEN insurance_verified THEN 1 ELSE 0 END) AS trust_index
    FROM geo_filter
    WHERE distance_miles <= p_radius_miles
  )
  SELECT
    id,
    partner_name,
    equipment_class,
    daily_rate,
    weekly_rate,
    monthly_rate,
    delivery_fee,
    distance_miles,
    proximity_score,
    trust_index,
    (0.50 * proximity_score + 0.30 * trust_index * 100 + 0.20 * CASE WHEN status = 'available' THEN 100 ELSE 0 END) AS composite_rank,
    insurance_verified AS is_verified_partner,
    contact_phone,
    dispatch_email,
    city,
    state
  FROM scored
  ORDER BY composite_rank DESC
  LIMIT p_limit;
$$;
