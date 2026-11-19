import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { failure } from '@/lib/http';
export const maxDuration = 60;
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET,
    received = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (
    !expected ||
    received.length !== expected.length ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return failure('Acesso não autorizado.', 401);
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASSWORD,
    MAIL_FROM,
    SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SITE_URL,
  } = process.env;
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !MAIL_FROM ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !NEXT_PUBLIC_SUPABASE_URL ||
    !NEXT_PUBLIC_SITE_URL
  )
    return failure('Configure o provedor de e-mail antes de executar o worker.', 503);
  const db = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    requireTLS: SMTP_SECURE !== 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 3000,
    socketTimeout: 8000,
  });
  const { data, error } = await db.rpc('claim_emails');
  if (error) return failure('Não foi possível reservar as notificações.', 500);
  let sent = 0,
    failed = 0;
  for (const item of (data || []) as {
    id: string;
    email: string;
    title: string;
    project_id: string | null;
  }[]) {
    let success = false;
    try {
      await transport.sendMail({
        from: MAIL_FROM,
        to: item.email,
        subject: 'Nexo Studio · Atualização do seu projeto',
        text: `${item.title}\n\nAcesse sua conta para consultar os detalhes:\n${NEXT_PUBLIC_SITE_URL}/painel\n\nDados do projeto e instruções financeiras ficam disponíveis somente na plataforma.`,
        messageId: `<${item.id}@nexo-notifications>`,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      success = true;
      sent++;
    } catch {
      failed++;
    }
    const { error: finishError } = await db.rpc('finish_email', { eid: item.id, success });
    if (finishError)
      return failure(
        'O resultado de envio não pôde ser registrado. Verifique o outbox antes de repetir.',
        500,
      );
  }
  transport.close();
  return NextResponse.json({ sent, failed }, { headers: { 'Cache-Control': 'no-store' } });
}
