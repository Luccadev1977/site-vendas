import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { validatePayload, validateBytes, fileMime } from './validate.ts';
// The service credential lives only inside the Edge runtime and is never returned.
Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  const allowed = (Deno.env.get('APP_ORIGINS') || 'https://luccadev1977.github.io')
    .split(',')
    .map((v) => v.trim());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization,apikey,x-client-info,content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
  if (origin && !allowed.includes(origin))
    return new Response(JSON.stringify({ error: 'Origem não autorizada.' }), {
      status: 403,
      headers,
    });
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (request.method !== 'POST') return respond({ error: 'Método não permitido.' }, 405);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Entre na sua conta.' }, 401);
  const url = Deno.env.get('SUPABASE_URL'),
    publicKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY'),
    serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publicKey || !serviceKey)
    return respond({ error: 'Configuração de armazenamento incompleta.' }, 503);
  const userClient = createClient(url, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return respond({ error: 'Sessão inválida.' }, 401);
  if (!auth.user.email_confirmed_at) return respond({ error: 'Confirme seu e-mail.' }, 403);
  try {
    // Read a bounded body even when Content-Length is absent.
    const multipart =
      request.headers.get('content-type')?.startsWith('multipart/form-data') === true;
    if (multipart) {
      const { data: admin, error } = await userClient.rpc('is_admin');
      if (error || admin !== true)
        return respond({ error: 'Acesso exclusivo do administrador.' }, 403);
    }
    const maxBody = multipart ? 4300000 : 10000;
    const reader = request.body?.getReader();
    if (!reader) return respond({ error: 'Arquivo inválido.' }, 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      length += r.value.length;
      if (length > maxBody) {
        await reader.cancel();
        return respond({ error: 'Solicitação muito grande.' }, 413);
      }
      chunks.push(r.value);
    }
    const merged = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    if (multipart) {
      const form = await new Response(merged, {
        headers: { 'Content-Type': request.headers.get('content-type')! },
      }).formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size < 1 || file.size > 4194304)
        return respond({ error: 'Envie uma imagem de até 4 MB.' }, 400);
      const bytes = new Uint8Array(await file.arrayBuffer()),
        mime = fileMime(bytes);
      if (!mime?.startsWith('image/') || mime !== file.type)
        return respond({ error: 'Envie PNG, JPEG ou WebP válido.' }, 400);
      const extensions: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
      };
      const name = `${crypto.randomUUID()}.${extensions[mime]}`;
      const { error } = await userClient.storage
        .from('catalog-assets')
        .upload(name, bytes, { contentType: mime, upsert: false });
      return error
        ? respond({ error: 'Não foi possível armazenar a imagem.' }, 400)
        : respond({ url: `/api/catalog-assets/${name}` });
    }
    const p = validatePayload(JSON.parse(new TextDecoder().decode(merged)), auth.user.id);
    const { data: project, error: projectError } = await userClient
      .from('projects')
      .select('id,status')
      .eq('id', p.id)
      .single();
    if (projectError || !project || ['cancelled', 'rejected', 'delivered'].includes(project.status))
      return respond({ error: 'Acesso ao projeto não autorizado.' }, 403);
    const { data: blob, error: downloadError } = await userClient.storage
      .from('project-files')
      .download(p.path);
    if (downloadError || !blob) return respond({ error: 'Arquivo indisponível.' }, 403);
    try {
      validateBytes(p, new Uint8Array(await blob.arrayBuffer()));
    } catch {
      await userClient.storage.from('project-files').remove([p.path]);
      return respond({ error: 'Formato ou tamanho de arquivo inválido.' }, 400);
    }
    const trusted = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await trusted.rpc('finalize_file', { actor: auth.user.id, payload: p });
    if (error)
      return respond({ error: 'O arquivo não pôde ser vinculado nesta etapa do projeto.' }, 400);
    return respond(data);
  } catch {
    return respond({ error: 'Solicitação de arquivo inválida.' }, 400);
  }
});
