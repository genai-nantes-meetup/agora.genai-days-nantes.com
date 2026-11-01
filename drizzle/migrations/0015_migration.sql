DROP POLICY IF EXISTS avatar_update ON storage.objects;
DROP POLICY IF EXISTS avatar_delete ON storage.objects;
DROP POLICY IF EXISTS avatar_insert ON storage.objects;
CREATE POLICY avatar_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text) AND name = (select auth.uid()::text) || '/avatar.jpg');
CREATE POLICY avatar_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text) AND name = (select auth.uid()::text) || '/avatar.jpg')
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text) AND name = (select auth.uid()::text) || '/avatar.jpg');
CREATE POLICY avatar_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid()::text) AND name = (select auth.uid()::text) || '/avatar.jpg');