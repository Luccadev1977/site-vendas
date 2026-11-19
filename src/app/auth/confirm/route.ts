import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/server';
import { safeReturnPath } from '@/lib/navigation';
export async function GET(request: Request) {
  const url = new URL(request.url),
    token_hash = url.searchParams.get('token_hash'),
    type = url.searchParams.get('type');
  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const requested = url.searchParams.get('next') || '/painel';
  const destination = safeReturnPath(requested);
  if (token_hash && ['signup', 'recovery', 'email'].includes(type || '')) {
    const db = await supabase();
    const { error } = await db.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
    if (!error)
      return NextResponse.redirect(
        new URL(type === 'recovery' ? '/conta?modo=nova-senha' : destination, base),
      );
  }
  const code = url.searchParams.get('code');
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, base));
  }
  return NextResponse.redirect(new URL('/conta?erro=link', base));
}
