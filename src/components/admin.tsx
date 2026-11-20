'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  FolderOpen,
  Wallet,
  Layers3,
  Settings,
  ShieldCheck,
  Download,
  Plus,
  X,
} from 'lucide-react';
import { command } from '@/lib/api-client';
import {
  date,
  money,
  businessMonth,
  statuses,
  type Category,
  type Notification,
  type Payment,
  type PixSettings,
  type Profile,
  type ProjectSummary as Project,
  type QuoteSummary as Quote,
  type Template,
  type Testimonial,
} from '@/lib/domain';
import type { Command } from '@/lib/validation';
import { Field, downloadJSON } from './form-ui';
import { isPremium, basePrice, styleLabels } from '@/lib/catalog';
import { Logout, Notifications, Refresh, StatusBadge } from './dashboard';
import { PublicImageUpload } from './content-manager';
function catalogTemplate(item:Template|Category|Testimonial):item is Template{return 'category_id' in item && 'content' in item;}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span className="eyebrow">
          <ShieldCheck size={15} style={{ display: 'inline', marginRight: 5 }} />
          NEXO · ADMIN
        </span>
        <nav className="admin-nav" aria-label="Administração">
          {[
            ['/admin', 'Visão geral', BarChart3],
            ['/admin/pedidos', 'Pedidos', FolderOpen],
            ['/admin/financeiro', 'Financeiro', Wallet],
            ['/admin/catalogo', 'Catálogo', Layers3],
            ['/admin/conteudo', 'Projetos realizados', FolderOpen],
            ['/admin/configuracoes', 'Configurações', Settings],
          ].map(([href, label, Icon]) => (
            <Link
              key={String(href)}
              href={String(href)}
              className={pathname === href ? 'active' : ''}
            >
              {typeof Icon !== 'string' && <Icon size={17} />}
              <span>{String(label)}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
export function AdminOverview({
  projects,
  quotes,
  payments,
  profiles,
  notifications,
  financial = false,
  orders = false,
}: {
  projects: Project[];
  quotes: Quote[];
  payments: Payment[];
  profiles: Profile[];
  notifications: Notification[];
  financial?: boolean;
  orders?: boolean;
}) {
  const [period, setPeriod] = useState('all'),
    [status, setStatus] = useState(''),
    [search, setSearch] = useState('');
  const [asOf] = useState(() => Date.now());
  const since = period === 'all' ? 0 : asOf - Number(period) * 86400000;
  const selected = projects.filter(
    (p) => p.status !== 'draft' && new Date(p.created_at).getTime() >= since,
  );
  const confirmed = payments.filter(
    (p) => p.status === 'confirmed' && new Date(p.confirmed_at!).getTime() >= since,
  );
  const pendingQuotes = quotes.filter(
    (q) => q.status === 'sent' && new Date(q.created_at).getTime() >= since,
  );
  const rows = selected.filter(
    (p) =>
      (!status || p.status === status) &&
      `${p.name} ${p.number} ${profiles.find((c) => c.id === p.client_id)?.full_name || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const received = confirmed.reduce((s, p) => s + p.amount, 0),
    pendingValue = pendingQuotes.reduce((s, q) => s + q.amount, 0);
  const metrics: [string, string | number][] = financial
    ? [
        ['Receita recebida', money(received)],
        ['Propostas pendentes', money(pendingValue)],
        [
          'Orçamentos enviados',
          quotes.filter((q) => new Date(q.created_at).getTime() >= since).length,
        ],
        [
          'Orçamentos aprovados',
          quotes.filter((q) => q.status === 'approved' && new Date(q.created_at).getTime() >= since)
            .length,
        ],
        [
          'Pagamentos pendentes',
          payments.filter(
            (p) => p.status === 'pending' && new Date(p.created_at).getTime() >= since,
          ).length,
        ],
        [
          'Em verificação',
          payments.filter((p) => p.status === 'review' && new Date(p.created_at).getTime() >= since)
            .length,
        ],
        ['Pagamentos confirmados', confirmed.length],
        [
          'Valor pendente de pagamento',
          money(
            payments
              .filter((p) => p.status !== 'confirmed' && new Date(p.created_at).getTime() >= since)
              .reduce((s, p) => s + p.amount, 0),
          ),
        ],
      ]
    : [
        [
          'Clientes cadastrados',
          profiles.filter((p) => new Date(p.created_at).getTime() >= since).length,
        ],
        ['Pedidos novos', selected.filter((p) => p.status === 'received').length],
        [
          'Aguardando análise',
          selected.filter((p) => ['received', 'analysis', 'needs_information'].includes(p.status))
            .length,
        ],
        [
          'Projetos aceitos',
          selected.filter(
            (p) =>
              !['received', 'analysis', 'needs_information', 'rejected', 'cancelled'].includes(
                p.status,
              ),
          ).length,
        ],
        ['Projetos recusados', selected.filter((p) => p.status === 'rejected').length],
        ['Propostas sem resposta', pendingQuotes.length],
        [
          'Pagamentos pendentes',
          payments.filter(
            (p) => p.status !== 'confirmed' && new Date(p.created_at).getTime() >= since,
          ).length,
        ],
        [
          'Em desenvolvimento',
          selected.filter((p) => ['development', 'revision'].includes(p.status)).length,
        ],
        [
          'Projetos concluídos',
          selected.filter((p) => ['completed', 'delivered'].includes(p.status)).length,
        ],
        ['Receita recebida', money(received)],
        ['Propostas pendentes', money(pendingValue)],
      ];
  const months = Array.from({ length: 6 }, (_, i) => {
    const [year, month] = businessMonth(asOf).split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 6 + i, 1));
    const monthKey = start.toISOString().slice(0, 7);
    const amount = confirmed
      .filter((p) => businessMonth(p.confirmed_at!) === monthKey)
      .reduce((s, p) => s + p.amount, 0);
    return {
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(start),
      amount,
    };
  });
  const max = Math.max(...months.map((m) => m.amount), 1);
  return (
    <main id="conteudo">
      <Refresh />
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">OPERAÇÃO DO ESTÚDIO</span>
          <h1>{financial ? 'Financeiro' : orders ? 'Gerenciar pedidos' : 'Tudo sob controle.'}</h1>
          <p>
            {financial
              ? 'Receita reconhecida somente após confirmação manual do recebimento.'
              : 'Cada projeto, decisão e próximo passo em um só lugar.'}
          </p>
        </div>
        <Logout />
      </div>
      <div className="admin-toolbar">
        <select
          aria-label="Filtrar período"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="all">Todo o período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Últimos 12 meses</option>
        </select>
        {financial && (
          <a
            className="button button-outline button-small"
            href={`/api/admin/export?days=${period}`}
          >
            <Download size={15} />
            Exportar CSV
          </a>
        )}
        <span className="studio-help">Atualização automática a cada 20 segundos.</span>
      </div>
      {!orders && (
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <div className="metric-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      {!orders && (
        <div className="panel" style={{ marginBottom: 25 }}>
          <div className="panel-title">
            <div>
              <h2>Receita confirmada por mês</h2>
              <p>Últimos seis meses · valores dos pagamentos confirmados no período selecionado.</p>
            </div>
            <span className="badge">Dados reais</span>
          </div>
          <div
            className="chart"
            role="img"
            aria-label={months.map((m) => `${m.label}: ${money(m.amount)}`).join('; ')}
          >
            {months.map((m, i) => (
              <div key={i} className="chart-column">
                <span>{money(m.amount)}</span>
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max(0.8, (m.amount / max) * 85)}%` }}
                />
                <small>{m.label}</small>
              </div>
            ))}
          </div>
        </div>
      )}
      {financial ? (
        <div className="panel">
          <div className="panel-title">
            <h2>Histórico de pagamentos</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Recebido em</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .filter((p) => new Date(p.confirmed_at || p.created_at).getTime() >= since)
                  .map((pay) => (
                    <tr key={pay.id}>
                      <td>
                        <Link href={`/admin/pedidos/${pay.project_id}`}>
                          {projects.find((p) => p.id === pay.project_id)?.name}
                        </Link>
                      </td>
                      <td>{money(pay.amount)}</td>
                      <td>
                        <StatusBadge status={pay.status} />
                      </td>
                      <td>{pay.confirmed_at ? date(pay.confirmed_at) : '—'}</td>
                    </tr>
                  ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={4}>Nenhum pagamento registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-title">
            <h2>{orders ? 'Todos os pedidos' : 'Projetos em movimento'}</h2>
          </div>
          <div className="admin-toolbar">
            <input
              aria-label="Buscar pedido"
              placeholder="Buscar por cliente, projeto ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <select
              aria-label="Filtrar status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {Object.entries(statuses)
                .filter(([key]) => key !== 'draft')
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Recebido em</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <small>{p.number}</small>
                    </td>
                    <td>
                      {profiles.find((c) => c.id === p.client_id)?.full_name || 'Cliente'}
                      <small>{p.brief?.email}</small>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{date(p.created_at)}</td>
                    <td>
                      <Link href={`/admin/pedidos/${p.id}`}>Abrir projeto</Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5}>Nenhum pedido corresponde aos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!orders && !financial && (
        <div style={{ marginTop: 25 }}>
          <Notifications items={notifications} admin />
        </div>
      )}
    </main>
  );
}
export function AdminSettings({
  initial,
  audit,
}: {
  initial: PixSettings | null;
  audit: { id: string; action: string; created_at: string; project_id: string | null }[];
}) {
  const router = useRouter(),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  return (
    <main id="conteudo">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">AJUSTES DA OPERAÇÃO</span>
          <h1>Configurações</h1>
          <p>Dados de pagamento privados e registro de ações importantes.</p>
        </div>
      </div>
      <div className="panel settings-form">
        <div className="panel-title">
          <div>
            <h2>Recebimento via Pix</h2>
            <p>A chave só fica visível ao cliente depois da aprovação da proposta.</p>
          </div>
          <ShieldCheck size={23} />
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="notice success" role="status">
            {success}
          </p>
        )}
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setPending(true);
            setError('');
            setSuccess('');
            try {
              await command({
                action: 'settings',
                payload: {
                  key: String(f.get('key')),
                  beneficiary: String(f.get('beneficiary')),
                  bank: String(f.get('bank')),
                  instructions: String(f.get('instructions')),
                },
              });
              setSuccess('Dados Pix atualizados.');
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          {[
            ['key', 'Chave Pix'],
            ['beneficiary', 'Nome do beneficiário'],
            ['bank', 'Banco'],
          ].map(([name, label]) => (
            <Field key={name} label={label}>
              <input
                name={name}
                defaultValue={initial?.[name as 'key'] || ''}
                required
                maxLength={200}
              />
            </Field>
          ))}
          <Field label="Instruções de pagamento">
            <textarea
              name="instructions"
              defaultValue={initial?.instructions || ''}
              maxLength={4000}
            />
          </Field>
          <p className="studio-help">
            Confira os dados antes de salvar. A plataforma não gera QR Code nem confirma pagamentos
            automaticamente.
          </p>
          <button className="button" disabled={pending}>
            {pending ? 'Salvando...' : 'Salvar dados de pagamento'}
          </button>
        </form>
      </div>
      <div className="panel" style={{ marginTop: 25 }}>
        <div className="panel-title">
          <h2>Auditoria administrativa</h2>
          <span className="badge">Últimas 100 ações</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Projeto</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td>{date(a.created_at)}</td>
                  <td>{a.action}</td>
                  <td>
                    {a.project_id ? (
                      <Link href={`/admin/pedidos/${a.project_id}`}>Abrir projeto</Link>
                    ) : (
                      'Configuração'
                    )}
                  </td>
                </tr>
              ))}
              {!audit.length && (
                <tr>
                  <td colSpan={3}>Nenhuma ação administrativa registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
export function AdminCatalog({
  categories,
  templates,
  testimonials,
}: {
  categories: Category[];
  templates: Template[];
  testimonials: Testimonial[];
}) {
  const router = useRouter(),
    [tab, setTab] = useState('templates'),
    [demoImage, setDemoImage] = useState('/images/architecture.svg'),
    [editing, setEditing] = useState<{
      kind: string;
      value: Partial<Template & Category & Testimonial>;
    } | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  function edit(kind: string, value: Partial<Template & Category & Testimonial> = {}) {
    setError('');
    setDemoImage(value.content?.heroImage || '/images/architecture.svg');
    setEditing({ kind, value });
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget),
      text = (key: string) => String(f.get(key) || '');
    const id = editing.value.id || crypto.randomUUID();
    let input: Command;
    if (editing.kind === 'categories')
      input = {
        action: 'category',
        payload: {
          id,
          name: text('name'),
          slug: text('slug'),
          description: text('description'),
          active: f.has('active'),
        },
      };
    else if (editing.kind === 'testimonials')
      input = {
        action: 'testimonial',
        payload: {
          id,
          name: text('name'),
          company: text('company'),
          body: text('body'),
          demo: f.has('demo'),
          active: f.has('active'),
        },
      };
    else
      input = {
        action: 'template',
        payload: {
          id,
          name: text('name'),
          slug: text('slug'),
          category_id: text('category_id'),
          style: text('style') as Template['style'],
          description: text('description'),
          accent: text('accent'),
          featured: f.has('featured'),
          active: f.has('active'),
          content: {
            ...editing.value.content,
            company: text('company'),
            title: text('description'),
            slogan: text('slogan'),
            services: text('services'),
            heroImage: demoImage,
            secondary: text('secondary'),
            background: text('background'),
            buttonColor: text('buttonColor'),
            tier: text('tier'),
            basePriceCents: text('basePrice')
              ? String(Math.round(Number(text('basePrice')) * 100))
              : '',
          },
        },
      };
    setPending(true);
    setError('');
    try {
      if (input.action === 'template') {
        const current = input.payload,
          price = basePrice(current);
        const peers = templates.filter(
          (t) => t.id !== current.id && t.active && basePrice(t) !== null,
        );
        if (
          price !== null &&
          current.active &&
          (isPremium(current)
            ? peers.some((t) => !isPremium(t) && basePrice(t)! >= price)
            : peers.some((t) => isPremium(t) && basePrice(t)! <= price))
        )
          throw new Error(
            'Os preços-base Premium devem superar todos os preços convencionais configurados.',
          );
      }
      await command(input);
      setEditing(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <main id="conteudo">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">SUA VITRINE EM MOVIMENTO</span>
          <h1>Catálogo & conteúdo</h1>
          <p>Gerencie modelos, categorias e depoimentos publicados.</p>
          <p className="studio-help">
            Valores em branco aparecem como “Sob consulta”. Preços cadastrados são estimativas
            iniciais. O Pages recebe alterações na próxima compilação com o catálogo público
            exportado.
          </p>
          <button
            className="text-button"
            onClick={() =>
              downloadJSON(
                {
                  version: 1,
                  templates: templates
                    .filter((t) => t.active && t.id.startsWith('11000000-'))
                    .map((t) => ({
                      id: t.id,
                      tier: t.content.tier || 'conventional',
                      basePriceCents: t.content.basePriceCents || '',
                    })),
                },
                'catalog-settings.json',
              )
            }
          >
            Exportar preços e classificações para o Pages
          </button>
        </div>
        <button className="button button-small" onClick={() => edit(tab)}>
          <Plus size={15} />
          Adicionar{' '}
          {tab === 'templates' ? 'modelo' : tab === 'categories' ? 'categoria' : 'depoimento'}
        </button>
      </div>
      <div className="tabs">
        {[
          ['templates', 'Modelos'],
          ['categories', 'Categorias'],
          ['testimonials', 'Depoimentos'],
        ].map(([id, label]) => (
          <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="table-scroll panel">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>
                {tab === 'templates' ? 'Estilo' : tab === 'categories' ? 'Endereço' : 'Empresa'}
              </th>
              <th>Visibilidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(tab === 'templates'
              ? templates
              : tab === 'categories'
                ? categories
                : testimonials
            ).map((item) => (
              <tr key={item.id}>
                <td>
                  {item.name}
                  {'featured' in item && item.featured === true && (
                    <small>Destaque na homepage</small>
                  )}
                  {'demo' in item && item.demo === true && <small>Demonstrativo</small>}
                </td>
                <td>
                  {catalogTemplate(item) ? (
                    <>
                      {styleLabels[item.style]}
                      <small>
                        {isPremium(item) ? 'Premium' : 'Convencional'} ·{' '}
                        {basePrice(item) !== null ? money(basePrice(item)!) : 'Sob consulta'}
                      </small>
                    </>
                  ) : 'slug' in item ? (
                    item.slug
                  ) : (
                    item.company
                  )}
                </td>
                <td>
                  <span className="badge">{item.active ? 'Ativo' : 'Desativado'}</span>
                </td>
                <td>
                  <button className="text-link" onClick={() => edit(tab, item)}>
                    Editar
                  </button>
                  {'style' in item && (
                    <Link
                      href={`/demo/${'slug' in item ? String(item.slug) : ''}`}
                      className="text-link"
                      style={{ marginLeft: 20 }}
                    >
                      Ver demonstração
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {tab === 'testimonials' && testimonials.length === 0 && (
              <tr>
                <td colSpan={4}>
                  Cadastre somente depoimentos autorizados ou identifique como demonstrativos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar conteúdo"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !pending) setEditing(null);
            }}
          >
            <div className="modal-header">
              <h2>
                {editing.value.id ? 'Editar' : 'Adicionar'}{' '}
                {editing.kind === 'templates'
                  ? 'modelo'
                  : editing.kind === 'categories'
                    ? 'categoria'
                    : 'depoimento'}
              </h2>
              <button
                className="icon-button"
                aria-label="Fechar edição"
                disabled={pending}
                onClick={() => setEditing(null)}
              >
                <X size={17} />
              </button>
            </div>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <form className="form-grid" onSubmit={save}>
              <Field label="Nome">
                <input name="name" defaultValue={editing.value.name} required maxLength={200} />
              </Field>
              {editing.kind !== 'testimonials' && (
                <Field label="Endereço (slug)">
                  <input
                    name="slug"
                    defaultValue={editing.value.slug}
                    pattern="[a-z0-9-]{2,80}"
                    placeholder="meu-modelo"
                    required
                  />
                </Field>
              )}
              {editing.kind === 'templates' && (
                <>
                  <Field label="Categoria">
                    <select
                      name="category_id"
                      defaultValue={editing.value.category_id || categories[0]?.id}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estilo">
                    <select name="style" defaultValue={editing.value.style || 'moderno'}>
                      <option value="minimalista">Minimalista</option>
                      <option value="moderno">Moderno</option>
                      <option value="elegante">Elegante</option>
                      {editing.value.style === 'premium' && (
                        <option value="premium">Elegante (legado)</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Classificação">
                    <select
                      name="tier"
                      defaultValue={editing.value.content?.tier || 'conventional'}
                    >
                      <option value="conventional">Convencional</option>
                      <option value="premium">Premium</option>
                    </select>
                  </Field>
                  <Field label="Valor inicial estimado (R$)">
                    <input
                      name="basePrice"
                      type="number"
                      min="1"
                      max="1000000"
                      step="0.01"
                      placeholder="Sob consulta"
                      defaultValue={
                        editing.value.content?.basePriceCents
                          ? Number(editing.value.content.basePriceCents) / 100
                          : ''
                      }
                    />
                    <small>
                      Deixe em branco até definir valores reais. Premium deve superar os preços
                      convencionais.
                    </small>
                  </Field>
                  <Field label="Nome da empresa demonstrativa">
                    <input
                      name="company"
                      defaultValue={editing.value.content?.company}
                      required
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Slogan">
                    <input
                      name="slogan"
                      defaultValue={editing.value.content?.slogan}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Serviços (separados por vírgula)">
                    <input
                      name="services"
                      defaultValue={editing.value.content?.services}
                      maxLength={2000}
                    />
                  </Field>
                  <Field label="Cor principal">
                    <input
                      type="color"
                      name="accent"
                      defaultValue={editing.value.accent || '#6797ff'}
                    />
                  </Field>
                  {(
                    [
                      ['secondary', 'Cor secundária', '#a7b2c8'],
                      ['background', 'Fundo padrão', '#11151b'],
                      ['buttonColor', 'Cor dos botões', editing.value.accent || '#6797ff'],
                    ] as const
                  ).map(([name, label, fallback]) => (
                    <Field key={name} label={label}>
                      <input
                        type="color"
                        name={name}
                        defaultValue={editing.value.content?.[name] || fallback}
                      />
                    </Field>
                  ))}
                  <Field label="Imagem demonstrativa">
                    <select value={demoImage} onChange={(e) => setDemoImage(e.target.value)}>
                      <option value="/images/architecture.svg">Arquitetura</option>
                      <option value="/images/sculpture.svg">Escultura</option>
                      <option value="/images/abstract.svg">Abstrato</option>
                      {demoImage.endsWith('.webp') && demoImage.startsWith('/images/') && (
                        <option value={demoImage}>Imagem da coleção</option>
                      )}
                      {demoImage.startsWith('/api/') && (
                        <option value={demoImage}>Imagem enviada</option>
                      )}
                    </select>
                  </Field>
                  <PublicImageUpload onUpload={setDemoImage} />
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={editing.value.featured}
                    />
                    Destacar na homepage
                  </label>
                </>
              )}
              {editing.kind === 'testimonials' ? (
                <>
                  <Field label="Empresa">
                    <input name="company" defaultValue={editing.value.company} maxLength={200} />
                  </Field>
                  <div className="full-width">
                    <Field label="Depoimento">
                      <textarea
                        name="body"
                        defaultValue={editing.value.body}
                        minLength={10}
                        maxLength={2000}
                        required
                      />
                    </Field>
                  </div>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      name="demo"
                      defaultChecked={editing.value.demo ?? true}
                    />
                    Conteúdo demonstrativo
                  </label>
                </>
              ) : (
                <div className="full-width">
                  <Field
                    label={
                      editing.kind === 'templates' ? 'Título principal / descrição' : 'Descrição'
                    }
                  >
                    <textarea
                      name="description"
                      defaultValue={editing.value.description}
                      required
                      maxLength={editing.kind === 'templates' ? 200 : 1000}
                    />
                  </Field>
                </div>
              )}
              <label className="checkbox-field">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={editing.value.active ?? true}
                />
                Publicar / manter ativo
              </label>
              <p className="studio-help full-width">
                {editing.kind === 'templates'
                  ? 'As imagens demonstrativas enviadas serão públicas. Use apenas arquivos autorizados, sem dados privados.'
                  : 'Depoimentos reais devem ter autorização do cliente para publicação.'}
              </p>
              <button className="button full-width" disabled={pending}>
                Salvar conteúdo
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
