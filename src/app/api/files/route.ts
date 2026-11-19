import { NextResponse } from 'next/server';
import { session } from '@/lib/supabase/server';
import { failure, fileType, sameOrigin } from '@/lib/http';
export const maxDuration = 30;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Origem não autorizada.', 403);
  const auth = await session();
  if (!auth) return failure('Entre na sua conta.', 401);
  if (!auth.user.email_confirmed_at) return failure('Confirme seu e-mail.', 403);
  try {
    const limit = 4300000;
    let size = 0;
    const chunks: Uint8Array[] = [];
    const reader = request.body?.getReader();
    if (!reader) return failure('Arquivo inválido.');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return failure('O arquivo deve ter no máximo 4 MB.', 413);
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks),
      form = await new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': request.headers.get('content-type') || '' },
        body,
      }).formData();
    const file = form.get('file'),
      pid = String(form.get('projectId') || ''),
      purpose = String(form.get('purpose') || '');
    if (
      !(file instanceof File) ||
      file.size < 1 ||
      file.size > 4194304 ||
      !['asset', 'attachment', 'receipt', 'message'].includes(purpose) ||
      !/^[0-9a-f-]{36}$/.test(pid)
    )
      return failure('Arquivo inválido. Envie PNG, JPEG, WebP ou PDF de até 4 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer()),
      mime = fileType(bytes);
    if (!mime || mime !== file.type || (purpose === 'asset' && !mime.startsWith('image/')))
      return failure('Formato do arquivo não permitido.');
    const { data: p } = await auth.db
      .from('projects')
      .select('id,status,client_id')
      .eq('id', pid)
      .single();
    if (!p) return failure('Acesso ao projeto não autorizado.', 403);
    if (['cancelled', 'rejected', 'delivered'].includes(p.status))
      return failure('O projeto não aceita novos arquivos.');
    const ext = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    }[mime as 'image/png'];
    const path = `${pid}/${auth.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await auth.db.storage
      .from('project-files')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error)
      return failure(
        'Não foi possível armazenar o arquivo. Verifique o limite de arquivos do projeto.',
      );
    const { data, error: registerError } = await auth.db.rpc('command', {
      action: 'register_file',
      payload: {
        id: pid,
        path,
        name: file.name.replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 200) || `arquivo.${ext}`,
        mime,
        size: file.size,
        purpose,
      },
    });
    if (registerError) {
      await auth.db.storage.from('project-files').remove([path]);
      return failure('Não foi possível vincular o arquivo nesta etapa do projeto.');
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return failure('Não foi possível processar o arquivo.');
  }
}
