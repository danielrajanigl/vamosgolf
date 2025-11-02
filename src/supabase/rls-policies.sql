-- ============================================
-- VAMOSGOLF ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper Function: Check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vamosgolf_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor')
  );
$$;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
ON vamosgolf_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON vamosgolf_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "admins_read_all_profiles"
ON vamosgolf_profiles
FOR SELECT
TO authenticated
USING (is_admin_or_editor());

-- Admins can update all profiles
CREATE POLICY "admins_update_all_profiles"
ON vamosgolf_profiles
FOR UPDATE
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- ============================================
-- TRIPS TABLE POLICIES
-- ============================================

-- Everyone can read published trips (including anonymous)
CREATE POLICY "anyone_read_published_trips"
ON vamosgolf_trips
FOR SELECT
TO public
USING (status = 'published');

-- Admins and editors can read all trips
CREATE POLICY "admins_read_all_trips"
ON vamosgolf_trips
FOR SELECT
TO authenticated
USING (is_admin_or_editor());

-- Admins and editors can insert trips
CREATE POLICY "admins_insert_trips"
ON vamosgolf_trips
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_editor());

-- Admins and editors can update trips
CREATE POLICY "admins_update_trips"
ON vamosgolf_trips
FOR UPDATE
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- Only admins can delete trips
CREATE POLICY "admins_delete_trips"
ON vamosgolf_trips
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vamosgolf_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- TRIP PACKAGES TABLE POLICIES
-- ============================================

-- Everyone can read active packages for published trips
CREATE POLICY "anyone_read_active_packages"
ON vamosgolf_trip_packages
FOR SELECT
TO public
USING (
  active = true
  AND EXISTS (
    SELECT 1 FROM vamosgolf_trips
    WHERE id = trip_id AND status = 'published'
  )
);

-- Admins and editors can manage packages
CREATE POLICY "admins_manage_packages"
ON vamosgolf_trip_packages
FOR ALL
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- ============================================
-- TRIP DATES TABLE POLICIES
-- ============================================

-- Everyone can read confirmed dates for published trips
CREATE POLICY "anyone_read_confirmed_dates"
ON vamosgolf_trip_dates
FOR SELECT
TO public
USING (
  status = 'confirmed'
  AND EXISTS (
    SELECT 1 FROM vamosgolf_trips
    WHERE id = trip_id AND status = 'published'
  )
);

-- Admins and editors can manage dates
CREATE POLICY "admins_manage_dates"
ON vamosgolf_trip_dates
FOR ALL
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

-- Users can read their own bookings
CREATE POLICY "users_read_own_bookings"
ON vamosgolf_bookings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY "users_create_own_bookings"
ON vamosgolf_bookings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can read all bookings
CREATE POLICY "admins_read_all_bookings"
ON vamosgolf_bookings
FOR SELECT
TO authenticated
USING (is_admin_or_editor());

-- Admins can update all bookings
CREATE POLICY "admins_update_all_bookings"
ON vamosgolf_bookings
FOR UPDATE
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- Only admins can delete bookings
CREATE POLICY "admins_delete_bookings"
ON vamosgolf_bookings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vamosgolf_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- CANCEL RULES TABLE POLICIES
-- ============================================

-- Everyone can read cancel rules for published trips
CREATE POLICY "anyone_read_cancel_rules"
ON vamosgolf_cancel_rules
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM vamosgolf_trips
    WHERE id = trip_id AND status = 'published'
  )
);

-- Admins can manage cancel rules
CREATE POLICY "admins_manage_cancel_rules"
ON vamosgolf_cancel_rules
FOR ALL
TO authenticated
USING (is_admin_or_editor())
WITH CHECK (is_admin_or_editor());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON vamosgolf_profiles(role);
CREATE INDEX IF NOT EXISTS idx_trips_status ON vamosgolf_trips(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON vamosgolf_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON vamosgolf_bookings(trip_id);
