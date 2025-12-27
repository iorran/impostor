-- Test script for room cleanup functionality
-- Run these tests manually in Supabase SQL Editor to verify cleanup works

-- Test 1: Verify trigger cleans up empty room when last player leaves
-- Step 1: Create a test room and player
DO $$
DECLARE
  test_room_id UUID;
  test_player_id UUID;
BEGIN
  -- Create test room
  INSERT INTO public.rooms (code, status) 
  VALUES ('TEST1', 'lobby')
  RETURNING id INTO test_room_id;
  
  -- Create test player
  INSERT INTO public.players (room_id, name, is_host)
  VALUES (test_room_id, 'Test Player', true)
  RETURNING id INTO test_player_id;
  
  -- Update room with host
  UPDATE public.rooms SET host_player_id = test_player_id WHERE id = test_room_id;
  
  -- Verify room exists
  IF EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 1 Setup: Room % created with player %', test_room_id, test_player_id;
  END IF;
  
  -- Delete the player (should trigger room cleanup)
  DELETE FROM public.players WHERE id = test_player_id;
  
  -- Verify room was deleted
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 1 PASSED: Room was automatically deleted when last player left';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: Room still exists after last player left';
  END IF;
END $$;

-- Test 2: Verify trigger does NOT delete room with remaining players
DO $$
DECLARE
  test_room_id UUID;
  test_player1_id UUID;
  test_player2_id UUID;
BEGIN
  -- Create test room
  INSERT INTO public.rooms (code, status) 
  VALUES ('TEST2', 'lobby')
  RETURNING id INTO test_room_id;
  
  -- Create two test players
  INSERT INTO public.players (room_id, name, is_host)
  VALUES (test_room_id, 'Test Player 1', true)
  RETURNING id INTO test_player1_id;
  
  INSERT INTO public.players (room_id, name, is_host)
  VALUES (test_room_id, 'Test Player 2', false)
  RETURNING id INTO test_player2_id;
  
  -- Update room with host
  UPDATE public.rooms SET host_player_id = test_player1_id WHERE id = test_room_id;
  
  -- Delete one player (room should remain)
  DELETE FROM public.players WHERE id = test_player1_id;
  
  -- Verify room still exists
  IF EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 2 PASSED: Room remains when players still exist';
  ELSE
    RAISE NOTICE 'Test 2 FAILED: Room was deleted even though players remain';
  END IF;
  
  -- Cleanup: Delete remaining player
  DELETE FROM public.players WHERE id = test_player2_id;
END $$;

-- Test 3: Verify scheduled cleanup function works
-- Note: This test requires rooms to be old enough (>24h) or you can temporarily modify the function
DO $$
DECLARE
  test_room_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Create an old test room (simulate by setting created_at in the past)
  INSERT INTO public.rooms (code, status, created_at) 
  VALUES ('TEST3', 'lobby', NOW() - INTERVAL '25 hours')
  RETURNING id INTO test_room_id;
  
  -- Verify room exists
  IF EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 3 Setup: Old room % created', test_room_id;
  END IF;
  
  -- Run cleanup function
  SELECT cleanup_inactive_rooms() INTO deleted_count;
  
  -- Verify room was deleted
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 3 PASSED: Old inactive room was cleaned up. Deleted count: %', deleted_count;
  ELSE
    RAISE NOTICE 'Test 3 FAILED: Old room was not cleaned up';
  END IF;
END $$;

-- Test 4: Verify rooms in 'in_progress' status are NOT deleted
DO $$
DECLARE
  test_room_id UUID;
  test_player_id UUID;
BEGIN
  -- Create test room in progress
  INSERT INTO public.rooms (code, status) 
  VALUES ('TEST4', 'in_progress')
  RETURNING id INTO test_room_id;
  
  -- Create test player
  INSERT INTO public.players (room_id, name, is_host)
  VALUES (test_room_id, 'Test Player', true)
  RETURNING id INTO test_player_id;
  
  -- Update room with host
  UPDATE public.rooms SET host_player_id = test_player_id WHERE id = test_room_id;
  
  -- Make room old
  UPDATE public.rooms SET created_at = NOW() - INTERVAL '25 hours' WHERE id = test_room_id;
  
  -- Run cleanup (should NOT delete in_progress rooms)
  PERFORM cleanup_inactive_rooms();
  
  -- Verify room still exists
  IF EXISTS (SELECT 1 FROM public.rooms WHERE id = test_room_id) THEN
    RAISE NOTICE 'Test 4 PASSED: Room in progress was preserved';
  ELSE
    RAISE NOTICE 'Test 4 FAILED: Room in progress was deleted';
  END IF;
  
  -- Cleanup
  DELETE FROM public.players WHERE id = test_player_id;
END $$;

-- Summary: All tests completed
SELECT 'Room cleanup tests completed. Check NOTICE messages above for results.' AS test_summary;

