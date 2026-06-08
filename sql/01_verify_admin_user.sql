-- Habilitar la extensión pgcrypto para cifrado bcrypt si no está activa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear la función RPC segura verify_admin_user
CREATE OR REPLACE FUNCTION verify_admin_user(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  v_email text;
  v_name text;
  v_role text;
  v_is_active boolean;
  v_password_hash text;
  v_is_valid boolean := false;
  v_new_hash text;
BEGIN
  -- 1. Buscar el usuario administrador por email
  SELECT id, email, name, role, is_active, password_hash
  INTO v_id, v_email, v_name, v_role, v_is_active, v_password_hash
  FROM admin_users
  WHERE email = p_email
  LIMIT 1;

  -- Anti-enumeración: Retornar error genérico si no se encuentra
  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciales inválidas');
  END IF;

  -- Validar si la cuenta está activa
  IF v_is_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cuenta desactivada. Contacte al administrador.');
  END IF;

  -- 2. Validar la contraseña (migración legacy transparente)
  IF v_password_hash LIKE '$2%' THEN
    -- Contraseña encriptada previamente con bcrypt (pgcrypto)
    IF v_password_hash = crypt(p_password, v_password_hash) THEN
      v_is_valid := true;
    END IF;
  ELSE
    -- Contraseña antigua en texto plano
    IF v_password_hash = p_password THEN
      v_is_valid := true;
      
      -- Encriptar y actualizar en caliente a bcrypt
      v_new_hash := crypt(p_password, gen_salt('bf', 10));
      UPDATE admin_users
      SET password_hash = v_new_hash
      WHERE id = v_id;
      
      RAISE NOTICE 'User % password migrated securely to bcrypt.', p_email;
    END IF;
  END IF;

  -- 3. Retornar respuesta final
  IF v_is_valid THEN
    RETURN jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_id,
        'email', v_email,
        'name', v_name,
        'role', v_role
      )
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Credenciales inválidas');
  END IF;
END;
$$;

-- Otorgar permiso de ejecución al rol público/anónimo
GRANT EXECUTE ON FUNCTION verify_admin_user(text, text) TO anon, authenticated;
