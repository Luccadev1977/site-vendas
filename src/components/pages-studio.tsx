'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { browserSupabase } from '@/lib/supabase/browser';
import { browserConfigured, projectHref } from '@/lib/browser-platform';
import type { Project, Template } from '@/lib/domain';
import { Studio } from './studio';
import { useBrowserSession } from './browser-runtime';
export function PagesStudio({ template }: { template: Template }) {
  const params = useSearchParams(),
    id = params.get('projeto'),
    auth = useBrowserSession();
  const [state, setState] = useState<{ key: string; project: Project | null; error: string }>({
    key: '',
    project: null,
    error: '',
  });
  const key = `${auth.user?.id || ''}:${id}`;
  useEffect(() => {
    if (!id || !auth.user || !browserConfigured()) return;
    let active = true;
    browserSupabase()
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('client_id', auth.user.id)
      .single()
      .then(({ data, error }) => {
        if (active)
          setState({
            key,
            project: data as Project | null,
            error: error ? 'Rascunho indisponível ou sem permissão.' : '',
          });
      });
    return () => {
      active = false;
    };
  }, [id, auth.user, key]);
  if (!id) return <Studio key={auth.user?.id || 'anonymous'} template={template} userId={null} />;
  if (!auth.ready)
    return (
      <p className="wrap portal-loading" role="status">
        Verificando sua sessão...
      </p>
    );
  if (!auth.user)
    return (
      <main className="wrap portal-loading" id="conteudo">
        <h1>Seu rascunho está na sua conta.</h1>
        <Link
          className="button"
          href={`/conta?next=${encodeURIComponent(`/studio/${template.slug}?projeto=${id}`)}`}
        >
          Entrar para continuar
        </Link>
      </main>
    );
  if (state.key !== key)
    return (
      <p className="wrap portal-loading" role="status">
        Carregando rascunho...
      </p>
    );
  if (state.error || !state.project)
    return (
      <p className="notice wrap" role="alert">
        {state.error || 'Rascunho indisponível.'}
      </p>
    );
  if (state.project.status !== 'draft')
    return (
      <main className="wrap portal-loading" id="conteudo">
        <h1>Este pedido já foi enviado.</h1>
        <Link className="button" href={projectHref(state.project.id)}>
          Acompanhar pedido
        </Link>
      </main>
    );
  return (
    <Studio
      key={state.project.id}
      template={state.project.template_snapshot}
      initialProject={state.project}
      userId={auth.user.id}
    />
  );
}
