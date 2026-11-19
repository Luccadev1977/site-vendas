'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { browserSupabase } from '@/lib/supabase/browser';
import { Field } from './form-ui';
import { safeReturnPath } from '@/lib/navigation';
export function AuthForm({
  initialMode,
  next,
  linkError,
  configured,
}: {
  initialMode: string;
  next: string;
  linkError: boolean;
  configured: boolean;
}) {
  const router = useRouter(),
    [mode, setMode] = useState(initialMode),
    [pending, setPending] = useState(false),
    [error, setError] = useState(
      linkError ? 'O link expirou ou já foi utilizado. Solicite um novo link.' : '',
    ),
    [message, setMessage] = useState('');
  const destination = safeReturnPath(next);
  const labels =
    mode === 'cadastro'
      ? [
          'Seu próximo capítulo.',
          'Crie sua conta para salvar ideias e acompanhar cada etapa.',
          'Criar minha conta',
        ]
      : mode === 'recuperar'
        ? [
            'Vamos recuperar seu acesso.',
            'Enviaremos um link seguro para definir uma nova senha.',
            'Enviar link de recuperação',
          ]
        : mode === 'nova-senha'
          ? [
              'Uma nova senha.',
              'Use uma senha exclusiva com pelo menos 12 caracteres.',
              'Salvar nova senha',
            ]
          : [
              'Bom ter você por aqui.',
              'Acesse seus projetos, propostas e próximos passos.',
              'Entrar na minha conta',
            ];
  function switchMode(value: string) {
    setMode(value);
    setError('');
    setMessage('');
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    const fields = new FormData(e.currentTarget),
      email = String(fields.get('email') || ''),
      password = String(fields.get('password') || '');
    try {
      const db = browserSupabase();
      if (mode === 'cadastro') {
        if (password.length < 12) throw new Error('Use pelo menos 12 caracteres na senha.');
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(fields.get('name') || '') },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(destination)}`,
          },
        });
        if (error) throw error;
        setMessage(
          'Se o cadastro puder ser concluído, você receberá um e-mail de confirmação. Confira sua caixa de entrada e spam. Depois, entre para continuar seu projeto.',
        );
      } else if (mode === 'recuperar') {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/conta?modo=nova-senha')}`,
        });
        if (error) throw error;
        setMessage('Se houver uma conta para este e-mail, você receberá o link de recuperação.');
      } else if (mode === 'nova-senha') {
        if (password.length < 12) throw new Error('Use pelo menos 12 caracteres na senha.');
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        router.replace('/painel');
        router.refresh();
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(destination);
        router.refresh();
      }
    } catch (e) {
      const raw = (e as Error).message;
      setError(
        /Invalid login/.test(raw)
          ? 'E-mail ou senha incorretos.'
          : /Email not confirmed/.test(raw)
            ? 'Confirme seu e-mail antes de entrar.'
            : /rate limit/i.test(raw)
              ? 'Muitas tentativas. Aguarde um pouco e tente novamente.'
              : raw.includes('Supabase')
                ? raw
                : 'Não foi possível concluir. Verifique os dados e tente novamente.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="panel auth-card">
      <span className="eyebrow">ÁREA DO CLIENTE</span>
      <h1>{labels[0]}</h1>
      <p>{labels[1]}</p>
      {!configured && (
        <p className="notice" style={{ marginBottom: 20 }}>
          O acesso às contas depende da configuração do Supabase pelo responsável pela plataforma.
          Você pode <Link href="/modelos">explorar os modelos</Link> e salvar sua personalização
          neste dispositivo.
        </p>
      )}
      {error && (
        <p role="alert" className="notice error" style={{ marginBottom: 20 }}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice success" style={{ marginBottom: 20 }}>
          {message}
        </p>
      )}
      <form className="form-stack" onSubmit={submit}>
        {mode === 'cadastro' && (
          <Field label="Nome completo">
            <input name="name" autoComplete="name" required minLength={3} maxLength={200} />
          </Field>
        )}
        {mode !== 'nova-senha' && (
          <Field label="E-mail">
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </Field>
        )}
        {mode !== 'recuperar' && (
          <Field
            label="Senha"
            hint={
              mode === 'cadastro' ? 'Pelo menos 12 caracteres. Use uma senha exclusiva.' : undefined
            }
          >
            <input
              name="password"
              type="password"
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'entrar' ? 1 : 12}
              maxLength={128}
            />
          </Field>
        )}
        {mode === 'cadastro' && (
          <label className="checkbox-field">
            <input type="checkbox" required />
            <span>
              Li os <Link href="/termos">Termos de Uso</Link> e a{' '}
              <Link href="/privacidade">Política de Privacidade</Link>.
            </span>
          </label>
        )}
        <button className="button" disabled={pending || !configured}>
          {pending ? 'Aguarde...' : labels[2]}
        </button>
      </form>
      <div className="auth-links">
        {mode !== 'entrar' ? (
          <button onClick={() => switchMode('entrar')}>Já tenho uma conta</button>
        ) : (
          <>
            <button onClick={() => switchMode('cadastro')}>Criar conta</button>
            <button onClick={() => switchMode('recuperar')}>Esqueci minha senha</button>
          </>
        )}
      </div>
    </div>
  );
}
