create or replace function vamosgolf_increment_date_bookings(p_trip_date_id uuid, p_inc int) returns void language plpgsql as $$
begin
  update vamosgolf_trip_dates set current_bookings = greatest(0, current_bookings + p_inc) where id = p_trip_date_id;
end; $$;
