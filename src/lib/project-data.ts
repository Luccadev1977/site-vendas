import 'server-only';
import { session } from './supabase/server';
import { notFound, redirect } from 'next/navigation';
import type {
  History,
  Message,
  Payment,
  PixSettings,
  Profile,
  Project,
  ProjectFile,
  Quote,
  Template,
} from './domain';
export async function projectData(id: string, adminRequired = false) {
  const auth = await session();
  if (!auth) redirect('/conta');
  if (adminRequired && !auth.admin) notFound();
  const { data: p, error } = await auth.db.from('projects').select('*').eq('id', id).single();
  if (error || !p) notFound();
  const [q, pay, m, f, h, c] = await Promise.all([
    auth.db
      .from('quotes')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    auth.db
      .from('payments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    auth.db.from('messages').select('*').eq('project_id', id).order('created_at'),
    auth.db
      .from('files')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    auth.db
      .from('status_history')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    auth.db.from('profiles').select('*').eq('id', p.client_id).single(),
  ]);
  if (q.error || pay.error || m.error || f.error || h.error || c.error)
    throw new Error('Não foi possível carregar os detalhes do projeto.');
  let pix: PixSettings | null = null;
  if (auth.admin || q.data?.some((q) => q.status === 'approved')) {
    const result = await auth.db.rpc('get_pix', { pid: id });
    if (!result.error) pix = result.data;
  }
  return {
    project: p as Project,
    quotes: q.data as Quote[],
    payments: pay.data as Payment[],
    messages: m.data as Message[],
    files: f.data as ProjectFile[],
    history: h.data as History[],
    template: p.template_snapshot as Template,
    profile: c.data as Profile,
    pix,
    userId: auth.user.id,
    admin: adminRequired,
  };
}
