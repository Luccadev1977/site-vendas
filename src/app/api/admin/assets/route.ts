import { NextResponse } from 'next/server';
import { session } from '@/lib/supabase/server';
import { failure, fileType, sameOrigin } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Origem não autorizada.', 403);
  const auth = await session();
  if (!auth) return failure('Entre na sua conta.', 401);
  if (!auth.admin || !auth.user.email_confirmed_at)
    return failure('Acesso exclusivo do administrador.', 403);
  try {
    const reader = request.body?.getReader();
    if (!reader) return failure('Arquivo inválido.');
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4300000) {
        await reader.cancel();
        return failure('Imagem deve ter até 4 MB.', 413);
      }
      chunks.push(value);
    }
    const form = await new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
      body: Buffer.concat(chunks),
    }).formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 4194304 || file.size < 1)
      return failure('Imagem inválida.');
    const bytes = new Uint8Array(await file.arrayBuffer()),
      mime = fileType(bytes);
    if (!mime?.startsWith('image/') || mime !== file.type) return failure('Use PNG, JPEG ou WebP.');
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg',
      name = `${crypto.randomUUID()}.${ext}`;
    const { error } = await auth.db.storage
      .from('catalog-assets')
      .upload(name, bytes, { contentType: mime, upsert: false });
    if (error) return failure('Não foi possível armazenar a imagem.');
    return NextResponse.json({ url: `/api/catalog-assets/${name}` });
  } catch {
    return failure('Não foi possível processar a imagem.');
  }
}
