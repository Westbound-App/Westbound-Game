-- WESTBOUND Phase A — seed one sandbox game with a short mock route
-- Coordinates: Portland, ME area (test geometry, not live routing).

DO $$
DECLARE
  v_game_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_route_id uuid := 'a0000000-0000-4000-8000-000000000010';
  v_seg_ids uuid[] := ARRAY[
    'a0000000-0000-4000-8000-000000000101'::uuid,
    'a0000000-0000-4000-8000-000000000102'::uuid,
    'a0000000-0000-4000-8000-000000000103'::uuid,
    'a0000000-0000-4000-8000-000000000104'::uuid,
    'a0000000-0000-4000-8000-000000000105'::uuid,
    'a0000000-0000-4000-8000-000000000106'::uuid,
    'a0000000-0000-4000-8000-000000000107'::uuid,
    'a0000000-0000-4000-8000-000000000108'::uuid
  ];
  -- Segment endpoints (lat, lon) matching mock route
  lats double precision[] := ARRAY[
    43.6591, 43.6612, 43.6638, 43.6665, 43.6688, 43.6712, 43.6735, 43.6758, 43.6785
  ];
  lons double precision[] := ARRAY[
    -70.2568, -70.2615, -70.2662, -70.2718, -70.2775, -70.2828, -70.2882, -70.2935, -70.2985
  ];
  i int;
  dist double precision;
  cum double precision := 0;
  total double precision := 0;
  seg_dists double precision[] := ARRAY[]::double precision[];
  -- Approximate earth radius for seed distances
  R double precision := 6371000;
  dlat double precision;
  dlon double precision;
  a double precision;
BEGIN
  -- Precompute segment distances (haversine)
  FOR i IN 1..8 LOOP
    dlat := radians(lats[i + 1] - lats[i]);
    dlon := radians(lons[i + 1] - lons[i]);
    a := sin(dlat / 2) ^ 2
      + cos(radians(lats[i])) * cos(radians(lats[i + 1])) * sin(dlon / 2) ^ 2;
    dist := 2 * R * asin(sqrt(a));
    seg_dists := array_append(seg_dists, dist);
    total := total + dist;
  END LOOP;

  INSERT INTO games (
    id,
    slug,
    name,
    environment,
    status,
    start_latitude,
    start_longitude,
    destination_latitude,
    destination_longitude,
    destination_radius_meters,
    started_at,
    completed_at,
    completion_locked,
    current_route_version_id,
    config_json
  ) VALUES (
    v_game_id,
    'sandbox-portland',
    'WESTBOUND Sandbox — Portland Loop',
    'sandbox',
    'active',
    lats[1],
    lons[1],
    lats[9],
    lons[9],
    100,
    timezone('utc', now()),
    NULL,
    false,
    NULL,
    jsonb_build_object(
      'publicGameName', 'WESTBOUND Sandbox',
      'walkerName', 'The Walker',
      'sandboxSpeedMultiplier', 100,
      'normalWalkingSpeedMph', 2.5,
      'walkingHoursPerDay', 8,
      'restingHoursPerDay', 16,
      'destinationRadiusMeters', 100,
      'routingProvider', 'mock',
      'mapProvider', 'placeholder',
      'freeTestCreditsOnSignup', 1000,
      'useSimpleSchedule', true
    )
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO route_versions (
    id,
    game_id,
    version_number,
    reason,
    source,
    total_distance_meters,
    encoded_geometry,
    is_active
  ) VALUES (
    v_route_id,
    v_game_id,
    1,
    'initial',
    'seed',
    total,
    -- JSON array of {latitude, longitude}
    '[{"latitude":43.6591,"longitude":-70.2568},{"latitude":43.6612,"longitude":-70.2615},{"latitude":43.6638,"longitude":-70.2662},{"latitude":43.6665,"longitude":-70.2718},{"latitude":43.6688,"longitude":-70.2775},{"latitude":43.6712,"longitude":-70.2828},{"latitude":43.6735,"longitude":-70.2882},{"latitude":43.6758,"longitude":-70.2935},{"latitude":43.6785,"longitude":-70.2985}]',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  cum := 0;
  FOR i IN 1..8 LOOP
    INSERT INTO route_segments (
      id,
      route_version_id,
      segment_index,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
      distance_meters,
      cumulative_start_meters,
      cumulative_end_meters,
      pedestrian_allowed,
      metadata_json
    ) VALUES (
      v_seg_ids[i],
      v_route_id,
      i - 1,
      lats[i],
      lons[i],
      lats[i + 1],
      lons[i + 1],
      seg_dists[i],
      cum,
      cum + seg_dists[i],
      true,
      jsonb_build_object('label', 'sandbox-segment-' || (i - 1)::text)
    )
    ON CONFLICT (id) DO NOTHING;
    cum := cum + seg_dists[i];
  END LOOP;

  UPDATE games
  SET current_route_version_id = v_route_id
  WHERE id = v_game_id;

  -- Base speed 2.5 mph ≈ 1.1176 m/s; sandbox 100x ≈ 111.76 m/s
  INSERT INTO walker_state (
    game_id,
    status,
    latitude,
    longitude,
    active_route_segment_id,
    distance_into_segment_meters,
    total_distance_walked_meters,
    original_route_distance_meters,
    current_projected_remaining_meters,
    current_speed_mps,
    movement_started_at,
    next_state_change_at,
    version_number
  ) VALUES (
    v_game_id,
    'walking',
    lats[1],
    lons[1],
    v_seg_ids[1],
    0,
    0,
    total,
    total,
    111.76,
    timezone('utc', now()),
    NULL,
    1
  )
  ON CONFLICT (game_id) DO NOTHING;

  INSERT INTO game_events (
    game_id,
    event_type,
    title,
    description,
    latitude,
    longitude,
    visibility,
    occurred_at
  ) VALUES (
    v_game_id,
    'game_started',
    'He started walking',
    'The sandbox walker left the Old Port and turned west. This is a test journey, not the production crossing.',
    lats[1],
    lons[1],
    'public',
    timezone('utc', now())
  );
END $$;
