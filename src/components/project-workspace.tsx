'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, Paperclip, Send, Check, FileText, Eye } from 'lucide-react';
import { command, upload } from '@/lib/api-client';
import {
  date,
  money,
  statuses,
  type History,
  type Message,
  type Payment,
  type PixSettings,
  type Profile,
  type Project,
  type ProjectFile,
  type Quote,
  type Status,
  type Template,
} from '@/lib/domain';
import { SitePreview } from './site-preview';
import { Field, downloadJSON } from './form-ui';
import { Refresh, StatusBadge } from './dashboard';
import type { Command } from '@/lib/validation';

const transitions: Partial<Record<Status, Status[]>> = {
  received: ['analysis', 'needs_information', 'rejected', 'cancelled'],
  analysis: ['needs_information', 'rejected', 'cancelled'],
  needs_information: ['analysis', 'rejected', 'cancelled'],
  proposal_sent: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['cancelled'],
  development: ['revision'],
  revision: ['development', 'completed'],
  completed: ['revision', 'delivered'],
};
type Props = {
  project: Project;
  quotes: Quote[];
  payments: Payment[];
  messages: Message[];
  files: ProjectFile[];
  history: History[];
  template: Template;
  profile: Profile;
  pix: PixSettings | null;
  userId: string;
  admin: boolean;
};
export function ProjectWorkspace({
  project: p,
  quotes,
  payments,
  messages,
  files,
  history,
  template,
  profile,
  pix,
  userId,
  admin,
}: Props) {
  const router = useRouter(),
    [tab, setTab] = useState('resumo'),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [copied, setCopied] = useState(false);
  const quote = quotes.find((q) => q.status !== 'declined'),
    payment = payments[0];
  async function act(input: Command, successMessage = 'Alteração registrada.') {
    setPending(true);
    setError('');
    setSuccess('');
    try {
      await command(input);
      setSuccess(successMessage);
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }
  async function fileUpload(file: File | undefined, purpose: string) {
    if (!file) return;
    setPending(true);
    setError('');
    try {
      await upload(p.id, file, purpose);
      setSuccess(
        purpose === 'receipt'
          ? 'Comprovante enviado. O pagamento aguarda verificação manual.'
          : 'Arquivo enviado com segurança.',
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    if (tab === 'mensagens') {
      command({ action: 'read_messages', payload: { id: p.id } }).catch(() => {});
    }
  }, [tab, p.id]);
  const brief = p.brief;
  return (
    <main id="conteudo" className="wrap dashboard">
      <Refresh />
      <div className="breadcrumbs">
        <Link href={admin ? '/admin' : '/painel'}>{admin ? 'Administração' : 'Meus projetos'}</Link>
        <span>/</span>
        <span>{p.number}</span>
      </div>
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">{admin ? 'GESTÃO DO PROJETO' : 'SUA IDEIA EM MOVIMENTO'}</span>
          <h1>{p.name}</h1>
          <p>
            {p.number} · Criado em {date(p.created_at)}
          </p>
        </div>
        <div className="inline-actions">
          <StatusBadge status={p.status} />
          <button
            className="icon-button"
            aria-label="Exportar dados completos do projeto"
            onClick={() =>
              downloadJSON(
                { project: p, template, quotes, payments, files, history },
                `${p.number}.json`,
              )
            }
          >
            <Download size={17} />
          </button>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </p>
      )}
      {success && (
        <p className="notice success" role="status" style={{ marginBottom: 20 }}>
          {success}
        </p>
      )}
      <div className="project-layout">
        <div className="project-main">
          <div className="tabs">
            {[
              ['resumo', 'Visão geral'],
              ['previa', 'Prévia & configuração'],
              ['mensagens', `Mensagens (${messages.length})`],
              ['arquivos', `Arquivos (${files.length})`],
            ].map(([id, label]) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'resumo' && (
            <>
              {admin && (
                <div className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Próxima ação</h2>
                      <p>Decisões registradas no histórico e notificadas ao cliente.</p>
                    </div>
                  </div>
                  {['received', 'analysis', 'needs_information'].includes(p.status) && (
                    <QuoteForm
                      pending={pending}
                      onSubmit={(payload) =>
                        act(
                          { action: 'send_quote', payload: { id: p.id, ...payload } },
                          'Proposta enviada ao cliente.',
                        )
                      }
                    />
                  )}
                  <form
                    className="form-stack"
                    style={{ marginTop: 25 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      act({
                        action: 'set_status',
                        payload: {
                          id: p.id,
                          status: String(data.get('status')) as 'analysis',
                          note: String(data.get('note') || ''),
                        },
                      });
                    }}
                  >
                    {transitions[p.status]?.length ? (
                      <>
                        <Field label="Atualizar andamento">
                          <select name="status" key={p.status}>
                            {transitions[p.status]?.map((status) => (
                              <option key={status} value={status}>
                                {statuses[status]}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Observação / motivo da decisão">
                          <textarea
                            name="note"
                            maxLength={4000}
                            placeholder="Informe o próximo passo, solicite informações ou explique sua decisão."
                          />
                        </Field>
                        <button className="button button-outline" disabled={pending}>
                          Registrar atualização
                        </button>
                      </>
                    ) : (
                      <p className="studio-help">
                        {p.status === 'draft'
                          ? 'O cliente ainda não enviou este rascunho.'
                          : p.status === 'awaiting_payment' || p.status === 'payment_review'
                            ? 'Aguardando pagamento ou conferência manual abaixo.'
                            : 'Nenhuma transição administrativa disponível nesta etapa.'}
                      </p>
                    )}
                  </form>
                </div>
              )}
              {quote && (
                <div className="panel">
                  <div className="panel-title">
                    <h2>Proposta comercial</h2>
                    <StatusBadge status={quote.status} />
                  </div>
                  <div className="quote-price">{money(quote.amount)}</div>
                  <div className="quote-details">
                    {[
                      ['Prazo estimado', quote.deadline],
                      ['Serviços incluídos', quote.scope],
                      ['Condições de pagamento', quote.terms],
                      ['Observações', quote.notes],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <strong>{label}</strong>
                          <p>{value}</p>
                        </div>
                      ))}
                  </div>
                  {!admin &&
                    quote.status === 'sent' &&
                    ['proposal_sent', 'awaiting_approval'].includes(p.status) && (
                      <div className="inline-actions">
                        <button
                          className="button"
                          disabled={pending}
                          onClick={() =>
                            act(
                              { action: 'approve_quote', payload: { id: p.id } },
                              'Proposta aprovada. Confira as instruções de pagamento.',
                            )
                          }
                        >
                          <Check size={16} />
                          Aprovar proposta
                        </button>
                        <button
                          className="button button-outline"
                          disabled={pending}
                          onClick={() => {
                            if (
                              confirm(
                                'Deseja recusar esta proposta? Você poderá conversar com o estúdio para ajustar o projeto.',
                              )
                            )
                              act(
                                { action: 'decline_quote', payload: { id: p.id } },
                                'Proposta recusada. O projeto voltou para análise.',
                              );
                          }}
                        >
                          Recusar proposta
                        </button>
                      </div>
                    )}
                </div>
              )}
              {payment && (
                <div className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Pagamento por Pix</h2>
                      <p>{money(payment.amount)} · confirmação manual</p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                  {payment.status === 'confirmed' ? (
                    <p className="notice success">
                      Recebimento confirmado pelo administrador em{' '}
                      {payment.confirmed_at && date(payment.confirmed_at)}.
                    </p>
                  ) : (
                    <>
                      {pix ? (
                        <>
                          <p className="pix-details">
                            <strong>{pix.beneficiary}</strong>
                            <br />
                            {pix.bank}
                            <br />
                            {pix.instructions}
                          </p>
                          <div className="pix-key">
                            <span>{pix.key}</span>
                            <button
                              className="icon-button"
                              aria-label="Copiar chave Pix"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(pix.key);
                                  setCopied(true);
                                } catch {
                                  setError(
                                    'Não foi possível copiar. Selecione a chave manualmente.',
                                  );
                                }
                              }}
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                          {copied && (
                            <p className="studio-help" role="status">
                              Chave copiada.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="notice">
                          O administrador ainda precisa cadastrar as instruções de Pix. Envie uma
                          mensagem pelo projeto.
                        </p>
                      )}
                      <p className="studio-help" style={{ marginBlock: 18 }}>
                        O envio de comprovante não confirma o pagamento. O recebimento é conferido
                        manualmente no banco.
                      </p>
                      {admin ? (
                        <div className="inline-actions">
                          <button
                            disabled={pending}
                            className="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Conferiu o recebimento real de ${money(payment.amount)} no banco? Esta ação registrará o pagamento como confirmado.`,
                                )
                              )
                                act(
                                  { action: 'confirm_payment', payload: { id: p.id } },
                                  'Pagamento confirmado manualmente.',
                                );
                            }}
                          >
                            Confirmar recebimento no banco
                          </button>
                          {payment.status === 'review' && (
                            <button
                              disabled={pending}
                              className="button button-outline"
                              onClick={() =>
                                act({ action: 'payment_pending', payload: { id: p.id } })
                              }
                            >
                              Recebimento não identificado
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="upload-control">
                          {pending ? 'Enviando...' : 'Anexar comprovante privado'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            disabled={pending}
                            onChange={(e) => {
                              fileUpload(e.target.files?.[0], 'receipt');
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                      {files.filter((f) => f.purpose === 'receipt').length > 0 && (
                        <div className="file-list" style={{ marginTop: 18 }}>
                          {files
                            .filter((f) => f.purpose === 'receipt')
                            .map((f) => (
                              <FileLink key={f.id} file={f} />
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {brief && (
                <div className="panel">
                  <div className="panel-title">
                    <h2>Briefing do projeto</h2>
                  </div>
                  <dl className="detail-grid">
                    {[
                      ['Cliente', brief.name],
                      ['Empresa', brief.company],
                      ['E-mail', brief.email],
                      ['WhatsApp', brief.phone],
                      [
                        'Categoria / modelo',
                        `${template.category_name || template.slug.split('-')[0]} · ${template.name}`,
                      ],
                      ['Finalidade', brief.purpose],
                      ['Prazo desejado', brief.deadline],
                      ['Orçamento disponível', brief.budget || 'Não informado'],
                      ['Domínio', brief.domain || 'Não informado'],
                      ['Hospedagem', brief.hosting],
                      ['Informações adicionais', brief.additional || '—'],
                      ['Funcionalidades', p.config.features.join(', ')],
                      ['Ideias especiais', p.config.notes || '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {!admin &&
                [
                  'draft',
                  'received',
                  'analysis',
                  'needs_information',
                  'proposal_sent',
                  'awaiting_approval',
                ].includes(p.status) && (
                  <button
                    className="text-link"
                    style={{ color: 'var(--muted)', justifyContent: 'end' }}
                    disabled={pending}
                    onClick={() => {
                      if (
                        confirm(
                          'Deseja cancelar este projeto? Esta ação ficará registrada no histórico.',
                        )
                      )
                        act({ action: 'cancel', payload: { id: p.id } }, 'Projeto cancelado.');
                    }}
                  >
                    Cancelar projeto
                  </button>
                )}
            </>
          )}
          {tab === 'previa' && (
            <>
              <div className="notice">
                <Eye size={16} style={{ display: 'inline', marginRight: 8 }} />
                Prévia visual enviada pelo cliente. O desenvolvimento final segue o escopo aprovado.
              </div>
              <div className="preview-frame">
                <div className="preview-scroll" style={{ height: 600 }}>
                  <SitePreview config={p.config} template={template} />
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">
                  <h2>Configuração estruturada</h2>
                  <button
                    className="text-link"
                    onClick={() =>
                      downloadJSON(
                        { template_id: p.template_id, config: p.config },
                        `${p.number}-config.json`,
                      )
                    }
                  >
                    Exportar JSON <Download size={15} />
                  </button>
                </div>
                <div className="swatch-row" style={{ marginBottom: 20 }}>
                  {[
                    p.config.primary,
                    p.config.secondary,
                    p.config.background,
                    p.config.buttonColor,
                  ].map((color, i) => (
                    <span key={i} title={color} className="swatch" style={{ background: color }} />
                  ))}
                </div>
                <pre className="config-export">{JSON.stringify(p.config, null, 2)}</pre>
              </div>
            </>
          )}
          {tab === 'mensagens' && (
            <div className="panel">
              <div className="panel-title">
                <div>
                  <h2>Uma conversa sobre seu projeto</h2>
                  <p>Somente o cliente responsável e o administrador têm acesso.</p>
                </div>
              </div>
              <div className="messages-box">
                {messages.length ? (
                  messages.map((m) => (
                    <div
                      className={`message-bubble ${m.sender_id === userId ? 'mine' : ''}`}
                      key={m.id}
                    >
                      <p>{m.body}</p>
                      <small>
                        {m.sender_id === p.client_id
                          ? profile.full_name || 'Cliente'
                          : 'Nexo Studio'}{' '}
                        · {date(m.created_at)}
                      </small>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '.85rem' }}>
                    A conversa começa com um olá. Escreva sua primeira mensagem.
                  </p>
                )}
              </div>
              {p.status !== 'draft' && (
                <form
                  className="message-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const body = String(new FormData(form).get('body'));
                    if (
                      await act(
                        { action: 'message', payload: { id: p.id, body } },
                        'Mensagem enviada.',
                      )
                    )
                      form.reset();
                  }}
                >
                  <textarea
                    name="body"
                    aria-label="Sua mensagem"
                    placeholder="Escreva uma mensagem, dúvida ou solicitação de alteração..."
                    maxLength={4000}
                    required
                  />
                  <div className="inline-actions">
                    <button className="button button-small" disabled={pending}>
                      <Send size={15} />
                      Enviar mensagem
                    </button>
                    <label className="button button-outline button-small">
                      <Paperclip size={14} />
                      Anexar arquivo
                      <input
                        hidden
                        type="file"
                        disabled={pending}
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={(e) => {
                          fileUpload(e.target.files?.[0], 'message');
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </form>
              )}
              {files.filter((f) => f.purpose === 'message').length > 0 && (
                <div className="file-list" style={{ marginTop: 25 }}>
                  {files
                    .filter((f) => f.purpose === 'message')
                    .map((f) => (
                      <FileLink key={f.id} file={f} />
                    ))}
                </div>
              )}
            </div>
          )}
          {tab === 'arquivos' && (
            <div className="panel">
              <div className="panel-title">
                <h2>Arquivos privados</h2>
                <span className="badge">PNG, JPEG, WebP e PDF · até 4 MB</span>
              </div>
              <div className="file-list">
                {files.map((f) => (
                  <FileLink key={f.id} file={f} />
                ))}
                {files.length === 0 && (
                  <p style={{ fontSize: '.85rem' }}>Nenhum arquivo enviado neste projeto.</p>
                )}
              </div>
            </div>
          )}
          {quotes.filter((q) => q.status === 'declined').length > 0 && tab === 'resumo' && (
            <details className="panel">
              <summary style={{ cursor: 'pointer', fontSize: '.85rem' }}>
                Propostas anteriores ({quotes.filter((q) => q.status === 'declined').length})
              </summary>
              {quotes
                .filter((q) => q.status === 'declined')
                .map((q) => (
                  <div className="quote-details" key={q.id}>
                    <strong>
                      {money(q.amount)} · {date(q.created_at)}
                    </strong>
                    <p>{q.scope}</p>
                    <StatusBadge status="declined" />
                  </div>
                ))}
            </details>
          )}
        </div>
        <aside className="project-aside">
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-title">
              <h2>Histórico do projeto</h2>
            </div>
            <ol className="history-list">
              {history.map((h) => (
                <li key={h.id}>
                  <strong>{statuses[h.status]}</strong>
                  <small>{date(h.created_at)}</small>
                  {h.note && <p>{h.note}</p>}
                </li>
              ))}
              {history.length === 0 && (
                <li>
                  <strong>Rascunho em preparação</strong>
                  <small>{date(p.created_at)}</small>
                </li>
              )}
            </ol>
          </div>
          <div className="panel">
            <h3>Um processo transparente.</h3>
            <p style={{ fontSize: '.8rem', marginTop: 15 }}>
              As decisões, propostas e atualizações ficam registradas aqui. Use a conversa sempre
              que precisar de um esclarecimento.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
function FileLink({ file: f }: { file: ProjectFile }) {
  return (
    <a href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer">
      <FileText size={17} />
      <span>
        {f.name}
        <span className="muted" style={{ display: 'block', fontSize: '.65rem' }}>
          {
            {
              asset: 'Imagem do projeto',
              attachment: 'Anexo do briefing',
              receipt: 'Comprovante privado',
              message: 'Arquivo da conversa',
            }[f.purpose]
          }
        </span>
      </span>
      <small>{Math.ceil(f.size / 1024)} KB</small>
      <Download size={14} />
    </a>
  );
}
function QuoteForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (payload: {
    amount: number;
    deadline: string;
    scope: string;
    terms: string;
    notes: string;
  }) => Promise<boolean>;
}) {
  return (
    <details>
      <summary className="button" style={{ display: 'inline-flex' }}>
        Aceitar pedido e preparar proposta
      </summary>
      <form
        className="form-grid"
        style={{ marginTop: 25 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          await onSubmit({
            amount: Math.round(Number(data.get('amount')) * 100),
            deadline: String(data.get('deadline')),
            scope: String(data.get('scope')),
            terms: String(data.get('terms')),
            notes: String(data.get('notes')),
          });
        }}
      >
        <Field label="Preço total (R$)">
          <input type="number" name="amount" step=".01" min="1" max="1000000" required />
        </Field>
        <Field label="Prazo estimado">
          <input
            name="deadline"
            required
            maxLength={200}
            placeholder="Ex.: 20 dias úteis após confirmação"
          />
        </Field>
        <div className="full-width">
          <Field label="Serviços incluídos">
            <textarea name="scope" required minLength={10} maxLength={8000} />
          </Field>
        </div>
        <div className="full-width">
          <Field label="Condições de pagamento">
            <textarea
              name="terms"
              required
              minLength={3}
              maxLength={4000}
              defaultValue="Pagamento integral via Pix após aprovação da proposta."
            />
          </Field>
        </div>
        <div className="full-width">
          <Field label="Observações">
            <textarea name="notes" maxLength={4000} />
          </Field>
        </div>
        <button className="button full-width" disabled={pending}>
          Enviar proposta ao cliente
        </button>
      </form>
    </details>
  );
}
