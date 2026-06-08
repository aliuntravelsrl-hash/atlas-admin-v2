-- 1. Habilitar Row Level Security en la tabla admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Revocar privilegios directos de manipulación y lectura para el rol anónimo (anon)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.admin_users FROM anon;

-- 3. Crear política restrictiva explícita para el rol anónimo
DROP POLICY IF EXISTS "Denegar select anon" ON public.admin_users;
CREATE POLICY "Denegar select anon" 
ON public.admin_users FOR SELECT
TO anon
USING (false);

-- 4. Permitir que usuarios autenticados consulten únicamente su propio registro
DROP POLICY IF EXISTS "Admins read own profile" ON public.admin_users;
CREATE POLICY "Admins read own profile"
ON public.admin_users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. Permitir que los administradores autorizados puedan insertar/actualizar/borrar
DROP POLICY IF EXISTS "Super admins control all" ON public.admin_users;
CREATE POLICY "Super admins control all"
ON public.admin_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users auth_user
    WHERE auth_user.id = auth.uid() 
    AND auth_user.role IN ('admin', 'super_admin')
  )
);
