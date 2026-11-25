'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Archive, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import type { ProjectSummary } from '@/lib/domain';
import { orderFolder } from '@/lib/order-lifecycle';
import { command } from '@/lib/api-client';
import { projectHref, refreshData } from '@/lib/browser-platform';
import { useRouter } from 'next/navigation';

export function OrderActions({
  project,
  enabled = false,
  onFeedback,
}: {
  project: ProjectSummary;
  enabled?: boolean;
  onFeedback: (message: string, error?: boolean) => void;
}) {
  const folder = orderFolder(project),
    router = useRouter();
  const [confirmation, setConfirmation] = useState<'trash' | 'purge' | null>(null);
  const [secondStep, setSecondStep] = useState(false),
    [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const busy = useRef(false),
    menu = useRef<HTMLDetailsElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmation) {
      dialog.current?.showModal();
      cancel.current?.focus();
    } else dialog.current?.close();
  }, [confirmation]);
  function ask(kind: 'trash' | 'purge') {
    if (menu.current) menu.current.open = false;
    setError('');
    setTyped('');
    setSecondStep(false);
    setConfirmation(kind);
  }
  async function run(action: 'archive_order' | 'trash_order' | 'restore_order' | 'purge_order') {
    if (!enabled || busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    if (menu.current) menu.current.open = false;
    try {
      await command(
        action === 'purge_order'
          ? { action, payload: { id: project.id, confirmation: typed } }
          : { action, payload: { id: project.id } },
      );
      setConfirmation(null);
      onFeedback(
        action === 'archive_order'
          ? 'Pedido arquivado.'
          : action === 'trash_order'
            ? 'Pedido movido para a lixeira.'
            : action === 'restore_order'
              ? 'Pedido restaurado para Ativos.'
              : 'Pedido excluído definitivamente. Registro de auditoria preservado.',
      );
      refreshData(router);
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      onFeedback(message, true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  if (!enabled) return <Link href={projectHref(project.id, true)}>Abrir projeto</Link>;
  return (
    <>
      <details
        className="order-menu"
        ref={menu}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && menu.current) menu.current.open = false;
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node) && menu.current)
            menu.current.open = false;
        }}
      >
        <summary aria-label={`Ações do pedido ${project.number}`}>
          <MoreHorizontal size={21} />
        </summary>
        <div className="order-menu-items">
          <Link href={projectHref(project.id, true)}>
            <ExternalLink size={15} />
            Abrir projeto
          </Link>
          {folder === 'active' && (
            <button disabled={pending} onClick={() => void run('archive_order')}>
              <Archive size={15} />
              Arquivar pedido
            </button>
          )}
          {folder !== 'active' && (
            <button disabled={pending} onClick={() => void run('restore_order')}>
              <RotateCcw size={15} />
              Restaurar
            </button>
          )}
          {folder !== 'trash' ? (
            <button disabled={pending} onClick={() => ask('trash')}>
              <Trash2 size={15} />
              Excluir pedido
            </button>
          ) : (
            <button className="order-danger" disabled={pending} onClick={() => ask('purge')}>
              <Trash2 size={15} />
              Excluir definitivamente
            </button>
          )}
        </div>
      </details>
      {pending && <small role="status">Salvando...</small>}
      <dialog
        ref={dialog}
        className="order-dialog"
        aria-label={
          confirmation === 'trash'
            ? 'Mover pedido para a lixeira'
            : 'Excluir pedido definitivamente'
        }
        onCancel={(e) => {
          if (busy.current) e.preventDefault();
          else setConfirmation(null);
        }}
      >
        <h2>
          {confirmation === 'trash'
            ? 'Excluir pedido?'
            : secondStep
              ? 'Confirmação final'
              : 'Excluir definitivamente?'}
        </h2>
        <p>
          <strong>{project.name}</strong> · {project.number}
        </p>
        {confirmation === 'trash' ? (
          <p>
            Tem certeza de que deseja excluir este pedido? Ele será movido para a lixeira e poderá
            ser restaurado posteriormente.
          </p>
        ) : (
          <>
            <p>
              Esta ação não pode ser desfeita. O banco bloqueará a exclusão de pedidos em andamento
              ou que contenham propostas, pagamentos, arquivos, comprovantes ou mensagens. A
              auditoria será preservada.
            </p>
            {secondStep && (
              <label className="field">
                <span>Digite {project.number} para confirmar</span>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  disabled={pending}
                />
              </label>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="inline-actions">
          <button
            ref={cancel}
            className="button button-outline"
            disabled={pending}
            onClick={() => setConfirmation(null)}
          >
            Cancelar
          </button>
          {confirmation === 'trash' ? (
            <button className="button" disabled={pending} onClick={() => void run('trash_order')}>
              {pending ? 'Movendo...' : 'Mover para a lixeira'}
            </button>
          ) : !secondStep ? (
            <button className="button" onClick={() => setSecondStep(true)}>
              Continuar
            </button>
          ) : (
            <button
              className="button order-danger"
              disabled={pending || typed.trim() !== project.number}
              onClick={() => void run('purge_order')}
            >
              {pending ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
