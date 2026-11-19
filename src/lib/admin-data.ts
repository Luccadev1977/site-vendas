import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { session } from './supabase/server';
import type { Notification, Payment, Profile, ProjectSummary, QuoteSummary } from './domain';
import { readAll } from './read-all';
export async function requireAdmin() {
  const auth = await session();
  if (!auth) redirect('/conta');
  if (!auth.admin) notFound();
  return auth;
}
export async function adminData() {
  const auth = await requireAdmin();
  const [p, q, pay, c, n] = await Promise.all([
    readAll<ProjectSummary>(
      auth.db
        .from('projects')
        .select('id,number,client_id,template_id,name,status,brief,created_at,updated_at')
        .order('created_at', { ascending: false })
        .order('id'),
    ),
    readAll<QuoteSummary>(
      auth.db
        .from('quotes')
        .select('id,project_id,amount,status,created_at')
        .order('created_at', { ascending: false })
        .order('id'),
    ),
    readAll<Payment>(
      auth.db.from('payments').select('*').order('created_at', { ascending: false }).order('id'),
    ),
    readAll<Profile>(auth.db.from('profiles').select('*').neq('id', auth.user.id).order('id')),
    auth.db
      .from('notifications')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  if (n.error) throw new Error('Não foi possível carregar a operação. Verifique as migrations.');
  return {
    projects: p,
    quotes: q,
    payments: pay,
    profiles: c,
    notifications: n.data as Notification[],
  };
}
