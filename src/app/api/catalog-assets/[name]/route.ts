import { configured, supabase } from '@/lib/supabase/server';
import { failure, fileType } from '@/lib/http';
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name) || !configured())
    return failure('Imagem não encontrada.', 404);
  const db = await supabase(),
    { data, error } = await db.storage.from('catalog-assets').download(name);
  if (error || !data) return failure('Imagem não encontrada.', 404);
  const bytes = new Uint8Array(await data.arrayBuffer()),
    mime = fileType(bytes);
  if (!mime?.startsWith('image/')) return failure('Imagem inválida.', 415);
  return new Response(bytes, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
