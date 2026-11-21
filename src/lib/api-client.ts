import type { Command } from './validation';
import { commandSchema } from './validation';
import { isGitHubPages } from './deployment';
import { browserSupabase } from './supabase/browser';
export async function command(input: Command) {
  if (isGitHubPages) {
    const parsed = commandSchema.parse(input);
    const db = browserSupabase();
    const result =
      parsed.action === 'portfolio'
        ? await db.rpc('save_portfolio', { payload: parsed.payload })
        : await db.rpc('command', { action: parsed.action, payload: parsed.payload });
    if (result.error) {
      if (['PGRST202', 'PGRST205', '42883', '42P01'].includes(result.error.code))
        throw new Error(
          'Envio indisponível: o banco da plataforma ainda precisa ser configurado pelo responsável. Nenhum pedido foi confirmado.',
        );
      const safe =
        /^(Limite|Acesso|Transição|Projeto|Proposta|Pagamento|Arquivo|Dados|Modelo|Confirme|Configure|Operação|Mensagem|Valor|Preço|Premium)/.test(
          result.error.message,
        );
      throw new Error(
        safe
          ? result.error.message
          : 'Não foi possível concluir a ação. Verifique os dados e tente novamente.',
      );
    }
    window.dispatchEvent(new Event('nexo-refresh'));
    return result.data;
  }
  const response = await fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
  return data;
}
export async function upload(projectId: string, file: File, purpose: string) {
  if (isGitHubPages) {
    if (
      file.size < 1 ||
      file.size > 4194304 ||
      !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)
    )
      throw new Error('Envie PNG, JPEG, WebP ou PDF de até 4 MB.');
    const db = browserSupabase();
    const { data: user, error: authError } = await db.auth.getUser();
    if (authError || !user.user) throw new Error('Entre na sua conta.');
    const ext: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    const path = `${projectId}/${user.user.id}/${crypto.randomUUID()}.${ext[file.type]}`;
    const { error } = await db.storage
      .from('project-files')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('Não foi possível armazenar o arquivo privado.');
    const { data, error: validationError } = await db.functions.invoke('finalize-upload', {
      body: { id: projectId, path, name: file.name, mime: file.type, size: file.size, purpose },
    });
    if (validationError || data?.error) {
      await db.storage.from('project-files').remove([path]);
      throw new Error(
        data?.error ||
          'Não foi possível validar o arquivo. Verifique a Edge Function finalize-upload.',
      );
    }
    return data as { id: string };
  }
  const body = new FormData();
  body.set('file', file);
  body.set('projectId', projectId);
  body.set('purpose', purpose);
  const response = await fetch('/api/files', { method: 'POST', body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o arquivo.');
  return data as { id: string };
}
