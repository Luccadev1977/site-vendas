import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const configured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export async function supabase() {
  if (!configured()) throw new Error('Configure o Supabase para acessar sua conta.');
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* Proxy refreshes cookies for Server Components. */
          }
        },
      },
    },
  );
}
export async function session() {
  if (!configured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: admin } = await db.rpc('is_admin');
  return { user, admin: admin === true, db };
}
