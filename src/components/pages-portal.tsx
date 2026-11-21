'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { browserConfigured } from '@/lib/browser-platform';
import { browserSupabase } from '@/lib/supabase/browser';
import { readAll } from '@/lib/read-all';
import type {
  Category,
  Template,
  Testimonial,
  Portfolio,
  Project,
  ProjectSummary,
  Quote,
  QuoteSummary,
  Payment,
  Message,
  ProjectFile,
  History,
  Profile,
  Notification,
  ClientProject,
  PixSettings,
} from '@/lib/domain';
import { useBrowserSession } from './browser-runtime';
import { AuthForm } from './auth-form';
import { AdminShell, AdminOverview, AdminSettings, AdminCatalog } from './admin';
import { ClientDashboard, Logout } from './dashboard';
import { ProjectWorkspace } from './project-workspace';
import { ContentManager } from './content-manager';
type View =
  | 'account'
  | 'client'
  | 'project'
  | 'admin'
  | 'orders'
  | 'finance'
  | 'settings'
  | 'catalog'
  | 'content'
  | 'admin-project';
type ProjectData = React.ComponentProps<typeof ProjectWorkspace>;
type PortalData = {
  admin: boolean;
  projects: ProjectSummary[];
  clientProjects: ClientProject[];
  quotes: QuoteSummary[];
  payments: Payment[];
  profiles: Profile[];
  notifications: Notification[];
  profile: Profile | null;
  project: ProjectData | null;
  pix: PixSettings | null;
  audit: { id: string; action: string; created_at: string; project_id: string | null }[];
  categories: Category[];
  templates: Template[];
  testimonials: Testimonial[];
  portfolio: Portfolio[];
  unread: Record<string, number>;
};
const empty: PortalData = {
  admin: false,
  projects: [],
  clientProjects: [],
  quotes: [],
  payments: [],
  profiles: [],
  notifications: [],
  profile: null,
  project: null,
  pix: null,
  audit: [],
  categories: [],
  templates: [],
  testimonials: [],
  portfolio: [],
  unread: {},
};
async function load(view: View, userId: string, id: string | null): Promise<PortalData> {
  const db = browserSupabase(),
    data = { ...empty };
  const admin = await db.rpc('is_admin');
  if (admin.error)
    throw new Error('Não foi possível verificar as permissões. Confira as migrations do Supabase.');
  data.admin = admin.data === true;
  if (
    ['admin', 'orders', 'finance', 'settings', 'catalog', 'content', 'admin-project'].includes(
      view,
    ) &&
    !data.admin
  )
    return data;
  const query = async <T,>(
    source: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  ): Promise<T> => {
    const r = await source;
    if (r.error)
      throw new Error('Não foi possível carregar os dados. Confira a conexão e as migrations.');
    return r.data as T;
  };
  if (view === 'project' || view === 'admin-project') {
    if (!id || !/^[0-9a-f-]{36}$/.test(id))
      throw new Error('Pedido não encontrado. Abra o pedido pelo painel.');
    const p = await query<Project>(db.from('projects').select('*').eq('id', id).single());
    if (!p || (view === 'project' && p.client_id !== userId))
      throw new Error('Pedido indisponível ou sem permissão.');
    const [q, pay, m, f, h, profile] = await Promise.all([
      query<Quote[]>(
        db
          .from('quotes')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false }),
      ),
      query<Payment[]>(
        db
          .from('payments')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false }),
      ),
      query<Message[]>(db.from('messages').select('*').eq('project_id', id).order('created_at')),
      query<ProjectFile[]>(db.from('files').select('*').eq('project_id', id).order('created_at')),
      query<History[]>(
        db.from('status_history').select('*').eq('project_id', id).order('created_at'),
      ),
      query<Profile>(db.from('profiles').select('*').eq('id', p.client_id).single()),
    ]);
    const pix =
      data.admin || q.some((q) => q.status === 'approved')
        ? await query<PixSettings | null>(db.rpc('get_pix', { pid: id }))
        : null;
    data.project = {
      project: p,
      quotes: q,
      payments: pay,
      messages: m,
      files: f,
      history: h,
      template: p.template_snapshot,
      profile,
      pix,
      userId,
      admin: view === 'admin-project',
    };
    return data;
  }
  if (view === 'settings') {
    [data.pix, data.audit] = await Promise.all([
      query<PixSettings | null>(db.rpc('get_pix')),
      query<PortalData['audit']>(
        db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100),
      ),
    ]);
    return data;
  }
  if (view === 'catalog') {
    [data.categories, data.templates, data.testimonials] = await Promise.all([
      query<Category[]>(db.from('categories').select('*').order('name')),
      query<Template[]>(db.from('templates').select('*').order('name')),
      query<Testimonial[]>(db.from('testimonials').select('*').order('name')),
    ]);
    return data;
  }
  if (view === 'content') {
    data.portfolio = await query<Portfolio[]>(
      db.from('portfolio').select('*').order('created_at', { ascending: false }),
    );
    return data;
  }
  const own = view === 'client' || view === 'account';
  const projectQuery = db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id');
  const [projects, quotes, payments, profiles, notifications] = await Promise.all([
    readAll<Project>(own ? projectQuery.eq('client_id', userId) : projectQuery),
    readAll<QuoteSummary>(
      db
        .from('quotes')
        .select('id,project_id,amount,status,created_at')
        .order('created_at', { ascending: false })
        .order('id'),
    ),
    readAll<Payment>(
      db.from('payments').select('*').order('created_at', { ascending: false }).order('id'),
    ),
    readAll<Profile>(db.from('profiles').select('*').order('id')),
    query<Notification[]>(
      db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
    ),
  ]);
  const ownIds = new Set(projects.map((p) => p.id));
  Object.assign(data, {
    projects,
    clientProjects: projects,
    quotes: own ? quotes.filter((q) => ownIds.has(q.project_id)) : quotes,
    payments: own ? payments.filter((p) => ownIds.has(p.project_id)) : payments,
    profiles: profiles.filter((p) => p.id !== userId),
    profile: profiles.find((p) => p.id === userId) || null,
    notifications,
  });
  if (own && projects.length) {
    const [messages, reads] = await Promise.all([
      readAll<{ project_id: string; sender_id: string; created_at: string }>(
        db.from('messages').select('project_id,sender_id,created_at').order('id'),
      ),
      readAll<{ project_id: string; read_at: string }>(
        db
          .from('project_reads')
          .select('project_id,read_at')
          .eq('user_id', userId)
          .order('project_id'),
      ),
    ]);
    const lastRead = new Map(reads.map((r) => [r.project_id, r.read_at]));
    data.unread = {};
    for (const m of messages)
      if (
        ownIds.has(m.project_id) &&
        m.sender_id !== userId &&
        m.created_at > (lastRead.get(m.project_id) || '')
      )
        data.unread[m.project_id] = (data.unread[m.project_id] || 0) + 1;
  }
  return data;
}
export function PagesPortal({ view }: { view: View }) {
  const auth = useBrowserSession(),
    params = useSearchParams(),
    id = params.get('id'),
    adminView = [
      'admin',
      'orders',
      'finance',
      'settings',
      'catalog',
      'content',
      'admin-project',
    ].includes(view);
  const [data, setData] = useState<PortalData | null>(null),
    [error, setError] = useState(''),
    [version, setVersion] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const loadKey = `${auth.user?.id || ''}:${view}:${id || ''}`;
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    window.addEventListener('nexo-refresh', refresh);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 20000);
    return () => {
      window.removeEventListener('nexo-refresh', refresh);
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    if (!auth.user) return;
    let active = true;
    load(view, auth.user.id, id)
      .then((data) => {
        if (active) {
          setData(data);
          setLoadedKey(loadKey);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [view, id, auth.user, version, loadKey]);
  if (!auth.ready)
    return (
      <main id="conteudo" className="wrap portal-loading" role="status">
        Verificando sua sessão segura...
      </main>
    );
  if (!auth.user)
    return (
      <main id="conteudo" className="wrap auth-page">
        <AuthForm
          admin={adminView}
          initialMode={params.get('modo') || 'entrar'}
          next={adminView ? '/admin' : params.get('next') || '/painel'}
          linkError={false}
          configured={browserConfigured()}
        />
      </main>
    );
  if (error)
    return (
      <main id="conteudo" className="wrap portal-loading">
        <h1>Não foi possível abrir o painel.</h1>
        <p className="notice error" role="alert">
          {error}
        </p>
        <div className="inline-actions">
          <button className="button" onClick={refresh}>
            Tentar novamente
          </button>
          <Logout />
        </div>
      </main>
    );
  if (view === 'account' && params.get('modo') === 'nova-senha')
    return (
      <main id="conteudo" className="wrap auth-page">
        <AuthForm
          initialMode="nova-senha"
          next="/painel"
          linkError={false}
          configured={browserConfigured()}
        />
      </main>
    );
  if (!data || loadedKey !== loadKey)
    return (
      <main id="conteudo" className="wrap portal-loading" role="status">
        Carregando seus dados...
      </main>
    );
  if (adminView && !data.admin)
    return (
      <main id="conteudo" className="wrap portal-loading">
        <h1>Acesso restrito.</h1>
        <p>
          Esta conta não possui permissão administrativa. Nenhum pedido de outro cliente foi
          carregado.
        </p>
        <div className="inline-actions">
          <Link className="button" href="/painel">
            Minha conta
          </Link>
          <Logout />
        </div>
      </main>
    );
  if (data.project) return <ProjectWorkspace key={data.project.project.id} {...data.project} />;
  if (!adminView)
    return (
      <ClientDashboard
        name={data.profile?.full_name || auth.user.email || ''}
        projects={data.clientProjects}
        quotes={data.quotes}
        payments={data.payments}
        notifications={data.notifications}
        admin={data.admin}
        unread={data.unread}
      />
    );
  const content =
    view === 'settings' ? (
      <AdminSettings initial={data.pix} audit={data.audit} />
    ) : view === 'catalog' ? (
      <AdminCatalog
        categories={data.categories}
        templates={data.templates}
        testimonials={data.testimonials}
      />
    ) : view === 'content' ? (
      <ContentManager items={data.portfolio} />
    ) : (
      <AdminOverview
        projects={data.projects}
        quotes={data.quotes}
        payments={data.payments}
        profiles={data.profiles}
        notifications={data.notifications}
        financial={view === 'finance'}
        orders={view === 'orders'}
      />
    );
  return (
    <AdminShell>
      <div className="portal-account">
        <Link href="/painel">Minha conta</Link>
        <Logout />
      </div>
      {content}
    </AdminShell>
  );
}
