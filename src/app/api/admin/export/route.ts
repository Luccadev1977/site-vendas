import { session } from '@/lib/supabase/server';
import { failure } from '@/lib/http';
import { csvCell } from '@/lib/csv';
import { readAll } from '@/lib/read-all';
import type { Payment } from '@/lib/domain';
export async function GET(request: Request) {
  const auth = await session();
  if (!auth) return failure('Entre na sua conta.', 401);
  if (!auth.admin) return failure('Acesso exclusivo do administrador.', 403);
  const days = new URL(request.url).searchParams.get('days') || 'all';
  if (!['all', '7', '30', '90', '365'].includes(days)) return failure('Período inválido.');
  let data: (Payment & { projects: { name: string; number: string } })[];
  try {
    data = await readAll<Payment & { projects: { name: string; number: string } }>(
      auth.db
        .from('payments')
        .select('*,projects(name,number)')
        .order('created_at', { ascending: false })
        .order('id'),
    );
  } catch {
    return failure('Não foi possível exportar todos os registros.');
  }
  const since = days === 'all' ? 0 : Date.now() - Number(days) * 86400000;
  const rows = [
    ['Número', 'Projeto', 'Valor BRL', 'Status', 'Criado em', 'Confirmado em'],
    ...(data || [])
      .filter((p) => new Date(p.confirmed_at || p.created_at).getTime() >= since)
      .map((p) => [
        p.projects?.number,
        p.projects?.name,
        (p.amount / 100).toFixed(2),
        p.status,
        p.created_at,
        p.confirmed_at || '',
      ]),
  ];
  return new Response('\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nexo-financeiro.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
