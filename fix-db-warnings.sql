-- 1. Enable RLS on public.matches table (Warning: Table public.matches is public, but RLS has not been enabled.)
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;

-- 1.a Drop old policies if any exist (optional but good for clean slate)
DROP POLICY IF EXISTS "Users can read own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON public.matches;

-- 1.b Create precise RLS policies for public.matches
-- READ: Users can only read their own matches
CREATE POLICY "Users can read own matches" 
ON public.matches FOR SELECT TO authenticated 
USING ((select auth.uid()) = user_id);

-- INSERT: Users can only insert matches if they set themselves as the user_id
CREATE POLICY "Users can insert own matches" 
ON public.matches FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own matches
CREATE POLICY "Users can update own matches" 
ON public.matches FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id) 
WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own matches
CREATE POLICY "Users can delete own matches" 
ON public.matches FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

-- 1.c Drop old policies for subscriptions to fix the performance warning
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

-- 1.d Create optimized RLS policies for public.subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT TO authenticated 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id) 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own subscriptions" 
ON public.subscriptions FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

-- 2. Fix mutable search_path warning on update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Fix mutable search_path warning on handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 4. Supabase Auth compromised passwords check:
-- To fix "Leaked password protection is currently disabled", go to your Supabase Dashboard:
-- Authentication -> Providers -> Email -> Scroll down to "Security" -> Enable "Check for leaked passwords"
