'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, LogOut, Bell } from 'lucide-react';
import { browserSupabase } from '@/lib/supabase/browser';
import { command } from '@/lib/api-client';
import {
  date,
  money,
  statuses,
  type Notification,
  type Payment,
  type ClientProject as Project,
  type QuoteSummary as Quote,
} from '@/lib/domain';
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statuses[status as keyof typeof statuses] ||
        (
          {
            pending: 'Pendente',
            review: 'Em verificação',
            confirmed: 'Confirmado',
            sent: 'Enviada',
            approved: 'Aprovada',
            declined: 'Recusada',
          } as Record<string, string>
        )[status] ||
        status}
    </span>
  );
}
export function Refresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 20000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
export function Logout() {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <>
      <button
        className="button button-outline button-small"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            const { error } = await browserSupabase().auth.signOut();
            if (error) throw error;
            router.replace('/conta');
            router.refresh();
          } catch {
            setError('Não foi possível sair. Tente novamente.');
            setPending(false);
          }
        }}
      >
        <LogOut size={14} />
        Sair
      </button>
      {error && (
        <span role="alert" className="error-text">
          {error}
        </span>
      )}
    </>
  );
}
export function Notifications({
  items,
  admin = false,
}: {
  items: Notification[];
  admin?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState(''),
    [pending, setPending] = useState(false);
  return (
    <div className="panel">
      <div className="panel-title">
        <h2>
          <Bell size={17} style={{ display: 'inline', marginRight: 8 }} />
          Notificações
        </h2>
        {items.some((n) => !n.read_at) && (
          <button
            className="text-link"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await command({ action: 'read_notifications', payload: {} });
                router.refresh();
              } catch {
                setError('Não foi possível marcar como lidas.');
              } finally {
                setPending(false);
              }
            }}
          >
            Ler todas
          </button>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
      {items.length ? (
        <div className="notification-list">
          {items.map((n) => (
            <Link
              key={n.id}
              href={
                n.project_id
                  ? `${admin ? '/admin/pedidos' : '/painel/projetos'}/${n.project_id}`
                  : admin
                    ? '/admin'
                    : '/painel'
              }
              className={!n.read_at ? 'unread' : ''}
            >
              {n.title}
              <small>{date(n.created_at)}</small>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '.8rem' }}>Seus próximos passos aparecerão por aqui.</p>
      )}
    </div>
  );
}
export function ClientDashboard({
  name,
  projects,
  quotes,
  payments,
  notifications,
  admin,
  unread,
}: {
  name: string;
  projects: Project[];
  quotes: Quote[];
  payments: Payment[];
  notifications: Notification[];
  admin: boolean;
  unread: Record<string, number>;
}) {
  const [tab, setTab] = useState('projetos');
  const visible = projects.filter((p) =>
    tab === 'concluidos'
      ? ['completed', 'delivered'].includes(p.status)
      : tab === 'rascunhos'
        ? p.status === 'draft'
        : p.status !== 'draft',
  );
  return (
    <main id="conteudo" className="wrap dashboard">
      <Refresh />
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">SUA ÁREA, SEUS PRÓXIMOS PASSOS</span>
          <h1>Olá, {name.split(' ')[0] || 'boas-vindas'}.</h1>
          <p>Acompanhe cada detalhe da sua presença digital.</p>
        </div>
        <div className="inline-actions">
          {admin && (
            <Link className="button button-outline button-small" href="/admin">
              Administração
            </Link>
          )}
          <Logout />
          <Link className="button button-small" href="/modelos">
            <Plus size={16} />
            Novo projeto
          </Link>
        </div>
      </div>
      <div className="metric-grid">
        {[
          ['Projetos enviados', projects.filter((p) => p.status !== 'draft').length],
          ['Propostas aguardando você', quotes.filter((q) => q.status === 'sent').length],
          [
            'Em desenvolvimento',
            projects.filter((p) => ['development', 'revision'].includes(p.status)).length,
          ],
          [
            'Pagamentos confirmados',
            money(
              payments.filter((p) => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0),
            ),
          ],
        ].map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div>
          <div className="tabs" aria-label="Dados da conta">
            {[
              ['projetos', 'Meus projetos'],
              ['rascunhos', 'Rascunhos'],
              ['orcamentos', 'Orçamentos'],
              ['pagamentos', 'Pagamentos'],
              ['concluidos', 'Concluídos'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={tab === id ? 'active' : ''}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'orcamentos' ? (
            <div className="project-list">
              {quotes.map((q) => (
                <Link className="project-row" key={q.id} href={`/painel/projetos/${q.project_id}`}>
                  <div>
                    <h3>{projects.find((p) => p.id === q.project_id)?.name}</h3>
                    <small>Proposta · {date(q.created_at)}</small>
                  </div>
                  <div className="project-row-right">
                    <strong>{money(q.amount)}</strong>
                    <StatusBadge status={q.status} />
                  </div>
                </Link>
              ))}
              {quotes.length === 0 && (
                <Empty text="Suas propostas aparecerão aqui depois da análise do projeto." />
              )}
            </div>
          ) : tab === 'pagamentos' ? (
            <div className="project-list">
              {payments.map((p) => (
                <Link key={p.id} className="project-row" href={`/painel/projetos/${p.project_id}`}>
                  <div>
                    <h3>{projects.find((project) => project.id === p.project_id)?.name}</h3>
                    <small>
                      Pix ·{' '}
                      {p.confirmed_at ? date(p.confirmed_at) : 'Aguardando confirmação manual'}
                    </small>
                  </div>
                  <div className="project-row-right">
                    <strong>{money(p.amount)}</strong>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
              {payments.length === 0 && (
                <Empty text="As instruções de pagamento ficam disponíveis após aprovar uma proposta." />
              )}
            </div>
          ) : (
            <div className="project-list">
              {visible.map((p) => (
                <Link
                  key={p.id}
                  className="project-row"
                  href={
                    p.status === 'draft'
                      ? `/studio/${p.template_snapshot.slug}?projeto=${p.id}`
                      : `/painel/projetos/${p.id}`
                  }
                >
                  <div>
                    <h3>{p.name}</h3>
                    <small>
                      {p.number} · {date(p.updated_at)}
                    </small>
                    {unread[p.id] > 0 && (
                      <small style={{ color: 'var(--blue)' }}>
                        {unread[p.id]} mensagens não lidas
                      </small>
                    )}
                  </div>
                  <div className="project-row-right">
                    <StatusBadge status={p.status} />
                    <small>
                      {p.status === 'draft' ? 'Continuar personalização' : 'Acompanhar projeto'}
                    </small>
                  </div>
                </Link>
              ))}
              {visible.length === 0 && (
                <Empty
                  text={
                    tab === 'rascunhos'
                      ? 'Rascunhos salvos na conta aparecerão aqui.'
                      : 'Seu próximo capítulo começa com uma ideia.'
                  }
                />
              )}
            </div>
          )}
        </div>
        <aside>
          <Notifications items={notifications} />
        </aside>
      </div>
    </main>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <FolderOpen size={33} />
      <h2>Espaço para o próximo passo.</h2>
      <p>{text}</p>
      <Link className="button button-outline" href="/modelos">
        Explorar modelos
      </Link>
    </div>
  );
}
