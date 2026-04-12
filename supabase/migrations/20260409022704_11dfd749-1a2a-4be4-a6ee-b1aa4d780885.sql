
-- Allow admins to delete users from the public.users table
CREATE POLICY "admins_can_delete_users"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
