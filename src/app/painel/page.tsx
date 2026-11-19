import { redirect } from 'next/navigation';
import { session } from '@/lib/supabase/server';
import { ClientDashboard } from '@/components/dashboard';
import type { Notification, Payment, ClientProject, QuoteSummary } from '@/lib/domain';
import { readAll } from '@/lib/read-all';
export const metadata = { title: 'Meus projetos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  const auth = await session();
  if (!auth) redirect('/conta?next=/painel');
  const [p, q, pay, n, profile, m, r] = await Promise.all([
    readAll<ClientProject>(
      auth.db
        .from('projects')
        .select(
          'id,number,client_id,template_id,template_snapshot,name,status,created_at,updated_at',
        )
        .eq('client_id', auth.user.id)
        .order('updated_at', { ascending: false })
        .order('id'),
    ),
    auth.db
      .from('quotes')
      .select('*,projects!inner(client_id)')
      .eq('projects.client_id', auth.user.id)
      .order('created_at', { ascending: false }),
    auth.db
      .from('payments')
      .select('*,projects!inner(client_id)')
      .eq('projects.client_id', auth.user.id)
      .order('created_at', { ascending: false }),
    auth.db
      .from('notifications')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    auth.db.from('profiles').select('full_name').eq('id', auth.user.id).single(),
    auth.db
      .from('messages')
      .select('project_id,sender_id,created_at')
      .neq('sender_id', auth.user.id),
    auth.db.from('project_reads').select('*').eq('user_id', auth.user.id),
  ]);
  if (q.error || pay.error || n.error || profile.error || m.error || r.error)
    throw new Error(
      'Não foi possível carregar os dados da conta. Verifique as migrations e tente novamente.',
    );
  const unread: Record<string, number> = {};
  for (const message of m.data || []) {
    const last = r.data?.find((row) => row.project_id === message.project_id)?.read_at;
    if (!last || message.created_at > last)
      unread[message.project_id] = (unread[message.project_id] || 0) + 1;
  }
  return (
    <ClientDashboard
      name={profile.data?.full_name || ''}
      admin={auth.admin}
      projects={p}
      quotes={q.data as QuoteSummary[]}
      payments={pay.data as Payment[]}
      notifications={n.data as Notification[]}
      unread={unread}
    />
  );
}
