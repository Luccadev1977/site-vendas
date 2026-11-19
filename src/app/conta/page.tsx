import { AuthForm } from '@/components/auth-form';
import { configured } from '@/lib/supabase/server';
export const metadata = { title: 'Sua conta', robots: { index: false, follow: false } };
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  return (
    <main id="conteudo" className="auth-wrap">
      <AuthForm
        initialMode={
          ['cadastro', 'recuperar', 'nova-senha'].includes(params.modo || '')
            ? params.modo!
            : 'entrar'
        }
        next={params.next || '/painel'}
        linkError={params.erro === 'link'}
        configured={configured()}
      />
    </main>
  );
}
