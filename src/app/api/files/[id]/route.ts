import { session } from '@/lib/supabase/server';
import { failure, fileType } from '@/lib/http';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await session();
  if (!auth) return failure('Entre na sua conta.', 401);
  const { id } = await params;
  const { data: file } = await auth.db.from('files').select('*').eq('id', id).single();
  if (!file) return failure('Arquivo não encontrado.', 404);
  const { data, error } = await auth.db.storage.from('project-files').download(file.path);
  if (error || !data) return failure('Arquivo indisponível.', 404);
  const bytes = new Uint8Array(await data.arrayBuffer()),
    mime = fileType(bytes);
  if (!mime || mime !== file.mime) return failure('Arquivo inválido.', 415);
  const inline =
    new URL(request.url).searchParams.get('inline') === '1' && mime.startsWith('image/');
  return new Response(bytes, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="arquivo"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
