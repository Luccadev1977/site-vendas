import { NextResponse } from 'next/server';
import { session } from '@/lib/supabase/server';
import { commandSchema } from '@/lib/validation';
import { failure, sameOrigin, readLimited } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Origem não autorizada.', 403);
  if (Number(request.headers.get('content-length') || 0) > 100000)
    return failure('Solicitação muito grande.', 413);
  const auth = await session();
  if (!auth) return failure('Entre na sua conta para continuar.', 401);
  if (!auth.user.email_confirmed_at) return failure('Confirme seu e-mail para continuar.', 403);
  try {
    const text = new TextDecoder().decode(await readLimited(request, 100000));
    const parsed = commandSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return failure(
        parsed.error.issues
          .map((i) => i.message)
          .slice(0, 3)
          .join(' '),
      );
    if (
      [
        'send_quote',
        'confirm_payment',
        'payment_pending',
        'set_status',
        'settings',
        'whatsapp',
        'category',
        'template',
        'testimonial',
        'portfolio',
      ].includes(parsed.data.action) &&
      !auth.admin
    )
      return failure('Acesso exclusivo do administrador.', 403);
    const { data, error } =
      parsed.data.action === 'portfolio'
        ? await auth.db.rpc('save_portfolio', { payload: parsed.data.payload })
        : await auth.db.rpc('command', {
            action: parsed.data.action,
            payload: parsed.data.payload,
          });
    if (error) {
      const safe =
        /^(Limite|Acesso|Transição|Projeto|Proposta|Pagamento|Arquivo|Dados|Modelo|Confirme|Configure|Operação|Mensagem)/.test(
          error.message,
        );
      return failure(
        safe
          ? error.message
          : 'Não foi possível concluir a ação. Verifique os dados e tente novamente.',
        error.code === '42501' ? 403 : 400,
      );
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RangeError) return failure('Solicitação muito grande.', 413);
    return failure('Solicitação inválida.');
  }
}
