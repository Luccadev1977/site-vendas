import { NextResponse } from 'next/server';
import { session } from '@/lib/supabase/server';
import { failure } from '@/lib/http';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await session();
  if (!auth) return failure('Entre na sua conta.', 401);
  const { id } = await params,
    { data, error } = await auth.db.rpc('get_pix', { pid: id });
  if (error) return failure('O Pix só fica disponível após a aprovação da proposta.', 403);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
