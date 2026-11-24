'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useId } from 'react';
import { Check, Circle, LoaderCircle, MailCheck } from 'lucide-react';
import { browserSupabase } from '@/lib/supabase/browser';
import { safeReturnPath } from '@/lib/navigation';
import { authRedirect, refreshData } from '@/lib/browser-platform';
import {
  validEmail,
  passwordError,
  authErrorMessage,
  readAuthCallback,
  verifyAuthCallback,
  minimumPasswordLength,
  confirmationMessage,
  checkEmailMessage,
  expiredLinkMessage,
  type AuthCallback,
} from '@/lib/auth-flow';
import { PasswordField } from './password-field';
type Mode = 'entrar' | 'cadastro' | 'recuperar' | 'nova-senha' | 'reenviar';
export function AuthForm({
  initialMode,
  next,
  linkError,
  configured,
  admin = false,
}: {
  initialMode: string;
  next: string;
  linkError: boolean;
  configured: boolean;
  admin?: boolean;
}) {
  const router = useRouter(),
    id = useId();
  const [mode, setMode] = useState<Mode>(
    ['cadastro', 'recuperar', 'nova-senha', 'reenviar'].includes(initialMode)
      ? (initialMode as Mode)
      : 'entrar',
  );
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false),
    [confirming, setConfirming] = useState(false),
    [error, setError] = useState(linkError ? expiredLinkMessage : ''),
    [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [sent, setSent] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [remaining, setRemaining] = useState(0);
  const busy = useRef(false),
    callback = useRef<AuthCallback | null | undefined>(undefined),
    verification = useRef<ReturnType<typeof verifyAuthCallback> | null>(null);
  const destination = safeReturnPath(next),
    newPassword = mode === 'cadastro' || mode === 'nova-senha';
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);
  useEffect(() => {
    if (!configured) return;
    if (callback.current === undefined) {
      const parsed = readAuthCallback(window.location.href);
      callback.current = parsed.callback;
      if (parsed.callback) window.history.replaceState(null, '', parsed.cleanURL);
    }
    if (!callback.current) return;
    let active = true;
    if (!verification.current) {
      busy.current = true;
      verification.current = verifyAuthCallback(browserSupabase().auth, callback.current);
    }
    // This synchronizes with the real one-time Auth request, including Strict Mode re-subscriptions.
    const request = verification.current;
    request
      .then((result) => {
        if (!active) return;
        setEmail(result.email);
        setErrors({});
        setError('');
        setSent(false);
        if (result.type === 'recovery') {
          setMode('nova-senha');
          setMessage('Link validado. Defina sua nova senha.');
        } else {
          setMode('entrar');
          setConfirmed(true);
          setMessage(confirmationMessage);
        }
        window.dispatchEvent(new Event('nexo-session'));
      })
      .catch((cause) => {
        if (!active) return;
        const mapped = authErrorMessage(cause);
        setError(
          mapped.includes('conexão') || mapped.includes('tentativas') ? mapped : expiredLinkMessage,
        );
        setMode(
          callback.current && 'type' in callback.current && callback.current.type === 'recovery'
            ? 'recuperar'
            : 'reenviar',
        );
      })
      .finally(() => {
        busy.current = false;
        if (active) {
          setConfirming(false);
          setPending(false);
        }
      });
    // Hydrate callback progress from an external URL, never from a success query flag.
    setConfirming(true);
    return () => {
      active = false;
    };
  }, [configured]);
  function switchMode(value: Mode) {
    if (busy.current) return;
    setMode(value);
    setErrors({});
    setError('');
    setMessage('');
    setSent(false);
    setConfirmed(false);
    setPassword('');
    setConfirmation('');
  }
  function changePassword(value: string, repeat = false) {
    if (repeat) setConfirmation(value);
    else setPassword(value);
    setErrors((previous) => {
      const updated = { ...previous };
      delete updated.password;
      delete updated.confirmation;
      return updated;
    });
  }
  async function resend() {
    if (busy.current || remaining > 0 || !configured) return;
    if (!validEmail(email.trim())) {
      setMode('reenviar');
      setErrors({ email: 'Informe um e-mail válido.' });
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    setMessage('');
    try {
      const { error } = await browserSupabase().auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: authRedirect(destination) },
      });
      if (error) throw error;
      setMessage(checkEmailMessage);
      setSent(true);
      setRemaining(60);
    } catch (cause) {
      const msg = authErrorMessage(cause);
      setError(msg);
      if (msg.includes('tentativas')) setRemaining(60);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current || !configured) return;
    if (['cadastro', 'recuperar', 'reenviar'].includes(mode) && remaining > 0) return;
    if (mode === 'reenviar') {
      await resend();
      return;
    }
    const fields = new FormData(e.currentTarget),
      validation: Record<string, string> = {};
    if (mode !== 'nova-senha' && !validEmail(email.trim()))
      validation.email = 'Informe um e-mail válido.';
    if (mode === 'cadastro') {
      if (String(fields.get('name') || '').trim().length < 3)
        validation.name = 'Informe seu nome completo.';
      if (!fields.get('consent'))
        validation.consent = 'Aceite os Termos de Uso e a Política de Privacidade para continuar.';
    }
    if (newPassword) {
      const issue = passwordError(password, confirmation);
      if (issue) validation[issue.includes('coincidem') ? 'confirmation' : 'password'] = issue;
    } else if (mode === 'entrar' && !password) validation.password = 'Informe sua senha.';
    setErrors(validation);
    setError('');
    setMessage('');
    if (Object.keys(validation).length) return;
    busy.current = true;
    setPending(true);
    try {
      const db = browserSupabase();
      if (mode === 'cadastro') {
        const { data, error } = await db.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: String(fields.get('name') || '').trim() },
            emailRedirectTo: authRedirect(destination),
          },
        });
        if (error) throw error;
        if (data.session || data.user?.email_confirmed_at) {
          setError(
            'A confirmação por e-mail precisa ser ativada pelo responsável pela plataforma.',
          );
          return;
        }
        setMessage(checkEmailMessage);
        setSent(true);
        setRemaining(60);
        setPassword('');
        setConfirmation('');
      } else if (mode === 'recuperar') {
        const { error } = await db.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authRedirect('/painel') + '&modo=nova-senha',
        });
        if (error) throw error;
        setMessage('Se houver uma conta para este e-mail, você receberá o link de recuperação.');
        setRemaining(60);
      } else if (mode === 'nova-senha') {
        const { data, error: sessionError } = await db.auth.getUser();
        if (sessionError || !data.user) {
          setError(expiredLinkMessage);
          return;
        }
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        setMode('entrar');
        setMessage('Senha atualizada com sucesso. Você já pode entrar na sua conta.');
      } else {
        const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setPassword('');
        window.dispatchEvent(new Event('nexo-session'));
        router.replace(destination);
        refreshData(router);
      }
    } catch (cause) {
      const msg = authErrorMessage(cause);
      setError(msg);
      if (msg.includes('tentativas')) setRemaining(60);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const labels: Record<Mode, [string, string, string]> = {
    cadastro: [
      'Seu próximo capítulo.',
      'Crie sua conta para salvar ideias e acompanhar cada etapa.',
      'Criar minha conta',
    ],
    entrar: [
      'Bom ter você por aqui.',
      'Acesse seus projetos, propostas e próximos passos.',
      'Entrar na minha conta',
    ],
    recuperar: [
      'Vamos recuperar seu acesso.',
      'Enviaremos um link seguro para definir uma nova senha.',
      'Enviar link de recuperação',
    ],
    'nova-senha': [
      'Uma nova senha.',
      'Escolha uma frase-senha exclusiva com pelo menos 8 caracteres.',
      'Salvar nova senha',
    ],
    reenviar: [
      'Vamos confirmar seu e-mail.',
      'Informe o e-mail do cadastro para receber um novo link.',
      'Reenviar e-mail de confirmação',
    ],
  };
  const disabled = pending || confirming || !configured;
  return (
    <section className="panel auth-card" aria-labelledby={id + '-title'}>
      <span className="eyebrow">{admin ? 'ACESSO ADMINISTRATIVO' : 'ÁREA DO CLIENTE'}</span>
      <h1 id={id + '-title'}>
        {confirming
          ? 'Validando seu link...'
          : sent && mode === 'cadastro'
            ? 'Confira seu e-mail.'
            : confirmed
              ? 'Conta confirmada.'
              : admin && mode === 'entrar'
                ? 'Seu estúdio. Seu controle.'
                : labels[mode][0]}
      </h1>
      <p>
        {admin
          ? 'Entre com sua conta autorizada. As permissões são verificadas no banco de dados.'
          : labels[mode][1]}
      </p>
      {!configured && (
        <p className="notice">
          O acesso às contas depende da configuração do Supabase pelo responsável pela plataforma.
          Você pode <Link href="/modelos">explorar os modelos</Link> e salvar sua personalização
          neste dispositivo.
        </p>
      )}
      {confirming && (
        <p className="notice" role="status">
          <LoaderCircle className="auth-spinner" size={18} />
          Conferindo a confirmação com segurança...
        </p>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice success">
          {message}
        </p>
      )}
      {sent && mode === 'cadastro' ? (
        <div className="auth-email-next">
          <MailCheck size={34} aria-hidden="true" />
          <p>
            Abra o e-mail e clique em <strong>Confirmar minha conta</strong>. Só depois da
            confirmação sua conta poderá acessar os projetos.
          </p>
          <p className="studio-help">
            O envio pode levar alguns minutos. Se você já possui uma conta, utilize a opção de
            entrar.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <fieldset className="form-stack auth-fields" disabled={disabled}>
            {mode === 'cadastro' && (
              <div className="field">
                <label htmlFor={id + '-name'}>Nome completo</label>
                <input
                  id={id + '-name'}
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={200}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? id + '-name-error' : undefined}
                />
                {errors.name && (
                  <span id={id + '-name-error'} className="error-text" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>
            )}
            {mode !== 'nova-senha' && (
              <div className="field">
                <label htmlFor={id + '-email'}>E-mail</label>
                <input
                  id={id + '-email'}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? id + '-email-error' : undefined}
                />
                {errors.email && (
                  <span id={id + '-email-error'} className="error-text" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>
            )}
            {!['recuperar', 'reenviar'].includes(mode) && (
              <PasswordField
                id={id + '-password'}
                name="password"
                label="Senha"
                value={password}
                onChange={changePassword}
                newPassword={newPassword}
                error={errors.password}
              />
            )}
            {newPassword && (
              <>
                <PasswordField
                  id={id + '-confirmation'}
                  name="confirmation"
                  label="Confirmar senha"
                  value={confirmation}
                  onChange={(value) => changePassword(value, true)}
                  newPassword
                  error={errors.confirmation}
                />
                <ul className="password-requirements" aria-live="polite">
                  <li className={Array.from(password).length >= minimumPasswordLength ? 'met' : ''}>
                    {Array.from(password).length >= minimumPasswordLength ? (
                      <Check size={15} />
                    ) : (
                      <Circle size={15} />
                    )}
                    Pelo menos 8 caracteres
                  </li>
                  <li className={confirmation && confirmation === password ? 'met' : ''}>
                    {confirmation && confirmation === password ? (
                      <Check size={15} />
                    ) : (
                      <Circle size={15} />
                    )}
                    As duas senhas devem ser iguais
                  </li>
                </ul>
                <p className="studio-help">
                  Você pode usar uma frase-senha longa, com espaços. Não reutilize senhas de outras
                  contas.
                </p>
              </>
            )}
            {mode === 'cadastro' && (
              <>
                <label className="checkbox-field">
                  <input type="checkbox" name="consent" required />
                  <span>
                    Li os{' '}
                    <Link href="/termos" target="_blank" rel="noopener noreferrer">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacidade" target="_blank" rel="noopener noreferrer">
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <span className="error-text" role="alert">
                    {errors.consent}
                  </span>
                )}
              </>
            )}
            <button
              className="button"
              disabled={
                disabled || (['cadastro', 'recuperar', 'reenviar'].includes(mode) && remaining > 0)
              }
            >
              {pending ? (
                <>
                  <LoaderCircle size={17} className="auth-spinner" />
                  Aguarde...
                </>
              ) : ['cadastro', 'recuperar', 'reenviar'].includes(mode) && remaining > 0 ? (
                `Aguarde ${remaining}s`
              ) : (
                labels[mode][2]
              )}
            </button>
          </fieldset>
        </form>
      )}
      {((sent && mode === 'cadastro') || mode === 'entrar') && (
        <button
          className="button button-outline auth-resend"
          type="button"
          disabled={disabled || remaining > 0}
          onClick={resend}
        >
          {remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar e-mail de confirmação'}
        </button>
      )}
      {confirmed && (
        <Link className="button auth-access" href={destination}>
          Acessar minha conta
        </Link>
      )}
      <div className="auth-links">
        {mode !== 'entrar' ? (
          <button disabled={disabled} onClick={() => switchMode('entrar')}>
            Já possui uma conta? Entrar
          </button>
        ) : (
          <>
            {!admin && (
              <button disabled={disabled} onClick={() => switchMode('cadastro')}>
                Criar conta
              </button>
            )}
            <button disabled={disabled} onClick={() => switchMode('recuperar')}>
              Esqueci minha senha
            </button>
          </>
        )}
      </div>
      {admin && (
        <details className="admin-first-access">
          <summary>Primeiro acesso do administrador</summary>
          <p>
            Crie sua conta em <Link href="/conta?modo=cadastro">Cadastro</Link> e confirme seu
            e-mail. O proprietário do projeto deve autorizar o UUID dessa conta executando
            bootstrap-admin.sql no SQL Editor do Supabase. Criar uma conta comum não concede acesso
            administrativo.
          </p>
        </details>
      )}
    </section>
  );
}
