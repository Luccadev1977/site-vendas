import { z } from 'zod';
export const minimumPasswordLength = 8;
export const shortPasswordMessage = 'Sua senha deve conter pelo menos 8 caracteres.';
export const differentPasswordsMessage = 'As senhas informadas não coincidem.';
export const confirmationMessage =
  'Conta confirmada com sucesso! Agora você pode acessar o Nexo Studio.';
export const checkEmailMessage =
  'Enviamos um link de confirmação para seu e-mail. Verifique sua caixa de entrada e, se necessário, a pasta de spam.';
export const expiredLinkMessage =
  'Este link é inválido, expirou ou já foi utilizado. Solicite um novo e-mail abaixo.';
export function validEmail(value: string) {
  return z.email().safeParse(value).success;
}
export function passwordError(password: string, confirmation: string) {
  if (Array.from(password).length < minimumPasswordLength) return shortPasswordMessage;
  if (password !== confirmation) return differentPasswordsMessage;
  return '';
}
export function authErrorMessage(error: unknown) {
  const e = error as { code?: string; name?: string; message?: string; status?: number } | null;
  const code = e?.code || '',
    message = e?.message || '';
  if (e?.status === 429 || /rate_limit|too_many/.test(code) || /rate limit/i.test(message))
    return 'Muitas tentativas. Aguarde antes de tentar novamente.';
  if (code === 'email_not_confirmed')
    return 'Confirme seu e-mail antes de entrar. Você pode reenviar a confirmação abaixo.';
  if (code === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (/otp_expired|otp_disabled|flow_state|bad_code_verifier|validation_failed/.test(code))
    return expiredLinkMessage;
  if (code === 'email_address_invalid' || code === 'email_address_not_allowed')
    return 'Informe um e-mail válido.';
  if (code === 'email_address_not_authorized')
    return 'O envio para este endereço ainda não está disponível. O responsável precisa configurar o serviço de e-mail.';
  if (code === 'weak_password')
    return /longer|maximum|too long|at most/i.test(message)
      ? 'Esta senha excede o limite aceito pelo serviço de autenticação. Use uma frase-senha menor.'
      : shortPasswordMessage;
  if (code === 'signup_disabled')
    return 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.';
  if (
    e?.name === 'AuthRetryableFetchError' ||
    e?.name === 'TypeError' ||
    /fetch|network|connection/i.test(message)
  )
    return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
  if (/sending.*email|smtp|email.*send/i.test(message))
    return 'Não foi possível enviar o e-mail. Tente novamente mais tarde.';
  return 'Não foi possível concluir. Verifique os dados e tente novamente.';
}
export type AuthCallback =
  | { kind: 'token'; tokenHash: string; type: 'email' | 'recovery' }
  | { kind: 'code'; code: string; type: 'email' | 'recovery' }
  | { kind: 'invalid' };
const secretParameters = [
  'code',
  'token_hash',
  'type',
  'callback',
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'error',
  'error_code',
  'error_description',
];
export function readAuthCallback(input: string): {
  callback: AuthCallback | null;
  cleanURL: string;
} {
  const url = new URL(input),
    fragment = new URLSearchParams(url.hash.slice(1));
  const authFragment = secretParameters.some((k) => fragment.has(k));
  const authQuery = secretParameters.some((k) => url.searchParams.has(k));
  const params = authFragment ? fragment : url.searchParams;
  let callback: AuthCallback | null = null;
  if (authFragment || authQuery) {
    const code = params.get('code'),
      tokenHash = params.get('token_hash'),
      type = params.get('type');
    const recovery = type === 'recovery' || url.searchParams.get('modo') === 'nova-senha';
    const duplicate = secretParameters.some((k) => params.getAll(k).length > 1);
    const mixed =
      authFragment &&
      ['code', 'token_hash', 'access_token', 'refresh_token', 'error'].some((k) =>
        url.searchParams.has(k),
      );
    if (
      duplicate ||
      mixed ||
      params.has('error') ||
      params.has('error_code') ||
      params.has('access_token') ||
      params.has('refresh_token') ||
      (code && tokenHash)
    )
      callback = { kind: 'invalid' };
    else if (code && code.length <= 2048)
      callback = { kind: 'code', code, type: recovery ? 'recovery' : 'email' };
    else if (
      tokenHash &&
      /^[A-Za-z0-9_-]{20,1024}$/.test(tokenHash) &&
      ['email', 'signup', 'recovery'].includes(type || '')
    )
      callback = { kind: 'token', tokenHash, type: recovery ? 'recovery' : 'email' };
    else callback = { kind: 'invalid' };
  }
  for (const key of secretParameters) url.searchParams.delete(key);
  if (authFragment) url.hash = '';
  return { callback, cleanURL: url.pathname + url.search + url.hash };
}
type VerificationResult = {
  data: { user: { email_confirmed_at?: string | null; email?: string } | null; session: unknown };
  error: unknown;
};
export type AuthVerifier = {
  verifyOtp: (input: {
    token_hash: string;
    type: 'email' | 'recovery';
  }) => PromiseLike<VerificationResult>;
  exchangeCodeForSession: (code: string) => PromiseLike<VerificationResult>;
};
export async function verifyAuthCallback(auth: AuthVerifier, callback: AuthCallback) {
  if (callback.kind === 'invalid') throw new Error(expiredLinkMessage);
  const result =
    callback.kind === 'code'
      ? await auth.exchangeCodeForSession(callback.code)
      : await auth.verifyOtp({ token_hash: callback.tokenHash, type: callback.type });
  if (result.error) throw result.error;
  if (!result.data.user?.email_confirmed_at || !result.data.session)
    throw new Error(expiredLinkMessage);
  return { type: callback.type, email: result.data.user.email || '' };
}
