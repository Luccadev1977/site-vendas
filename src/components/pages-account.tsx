'use client';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from './auth-form';
import { browserConfigured } from '@/lib/browser-platform';
export function PagesAccount() {
  const params = useSearchParams();
  return (
    <main id="conteudo" className="wrap auth-page">
      <AuthForm
        initialMode={params.get('modo') || 'entrar'}
        next={params.get('next') || '/painel'}
        linkError={params.get('erro') === 'link'}
        configured={browserConfigured()}
      />
    </main>
  );
}
