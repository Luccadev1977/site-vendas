import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  passwordError,
  shortPasswordMessage,
  differentPasswordsMessage,
  validEmail,
  readAuthCallback,
  verifyAuthCallback,
  authErrorMessage,
  type AuthVerifier,
} from '../src/lib/auth-flow';
describe('Account and confirmation security', () => {
  it('exchanges a PKCE code through the SDK and rejects a response without a session', async () => {
    const exchangeCodeForSession = vi
      .fn()
      .mockResolvedValue({
        data: {
          user: { email_confirmed_at: '2026-11-24', email: 'cliente@example.test' },
          session: { access_token: 'local-fixture' },
        },
        error: null,
      });
    const auth = { exchangeCodeForSession, verifyOtp: vi.fn() } as AuthVerifier;
    await expect(
      verifyAuthCallback(auth, { kind: 'code', code: 'local-code', type: 'email' }),
    ).resolves.toMatchObject({ type: 'email' });
    expect(exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('local-code');
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { email_confirmed_at: '2026-11-24' }, session: null },
      error: null,
    });
    await expect(
      verifyAuthCallback(auth, { kind: 'code', code: 'local-code', type: 'email' }),
    ).rejects.toThrow(/inválido/);
  });
  it('rejects seven characters, accepts eight and keeps long passphrases intact', () => {
    expect(passwordError('1234567', '1234567')).toBe(shortPasswordMessage);
    expect(passwordError('12345678', '12345678')).toBe('');
    expect(passwordError('12345678', '12345679')).toBe(differentPasswordsMessage);
    const phrase = 'Uma frase longa com espaços e acentuação. '.repeat(20);
    expect(passwordError(phrase, phrase)).toBe('');
    expect(passwordError('😀😀😀😀', '😀😀😀😀')).toBe(shortPasswordMessage);
  });
  it('rejects invalid e-mails before sending credentials', () => {
    for (const value of ['', 'cliente', 'a@', 'a b@example.test'])
      expect(validEmail(value)).toBe(false);
    expect(validEmail('cliente@example.test')).toBe(true);
  });
  it('parses the real template link under the Pages basePath and removes its token', async () => {
    const template = await readFile('supabase/templates/confirmation.html', 'utf8');
    expect(template).not.toContain('supabase');
    expect(template).toContain('{{ .TokenHash }}');
    const hash = 'a'.repeat(64),
      redirect =
        'https://luccadev1977.github.io/site-vendas/conta/?callback=1&next=%2Fstudio%2Frestaurantes-elegante';
    const href = /href="([^"]+)"/
      .exec(template)![1]
      .replace('{{ .RedirectTo }}', redirect)
      .replace('{{ .TokenHash }}', hash)
      .replaceAll('&amp;', '&');
    const parsed = readAuthCallback(href);
    expect(parsed.callback).toEqual({ kind: 'token', tokenHash: hash, type: 'email' });
    expect(parsed.cleanURL).toBe('/site-vendas/conta/?next=%2Fstudio%2Frestaurantes-elegante');
    expect(parsed.cleanURL).not.toContain(hash);
  });
  it('supports legacy token-hash query links and recovery/PKCE callbacks without trusting success flags', () => {
    expect(readAuthCallback('https://example.test/conta?confirmed=1').callback).toBeNull();
    expect(
      readAuthCallback('https://example.test/conta?token_hash=' + 'b'.repeat(64) + '&type=signup')
        .callback,
    ).toMatchObject({ kind: 'token', type: 'email' });
    expect(
      readAuthCallback('https://example.test/conta/?code=real-code&modo=nova-senha').callback,
    ).toMatchObject({ kind: 'code', type: 'recovery' });
    expect(
      readAuthCallback(
        'https://example.test/conta/?callback=1#token_hash=' + 'c'.repeat(64) + '&type=recovery',
      ).callback,
    ).toMatchObject({ kind: 'token', type: 'recovery' });
  });
  it('rejects ambiguous, expired and implicit-token callbacks and cleans all credential parameters', () => {
    for (const suffix of [
      '?code=one&code=two',
      '?code=one&token_hash=' + 'a'.repeat(64) + '&type=email',
      '?callback=1#error=access_denied&error_description=secret-detail',
      '#access_token=secret&refresh_token=private',
      '?token_hash=' + 'a'.repeat(64) + '&type=admin',
    ]) {
      const r = readAuthCallback('https://example.test/conta/' + suffix);
      expect(r.callback).toEqual({ kind: 'invalid' });
      expect(r.cleanURL).toBe('/conta/');
    }
  });
  it('only confirms after Supabase returns a verified user and a real session', async () => {
    const callback = { kind: 'token' as const, tokenHash: 'd'.repeat(64), type: 'email' as const };
    const verifyOtp = vi.fn().mockResolvedValue({
      data: {
        user: { email_confirmed_at: '2026-11-24', email: 'cliente@example.test' },
        session: { access_token: 'local-fixture' },
      },
      error: null,
    });
    const auth = { verifyOtp, exchangeCodeForSession: vi.fn() } as AuthVerifier;
    await expect(verifyAuthCallback(auth, callback)).resolves.toEqual({
      type: 'email',
      email: 'cliente@example.test',
    });
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: callback.tokenHash, type: 'email' });
    verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'otp_expired' },
    });
    await expect(verifyAuthCallback(auth, callback)).rejects.toMatchObject({ code: 'otp_expired' });
    verifyOtp.mockResolvedValue({
      data: { user: { email_confirmed_at: null }, session: {} },
      error: null,
    });
    await expect(verifyAuthCallback(auth, callback)).rejects.toThrow(/inválido/);
    await expect(verifyAuthCallback(auth, { kind: 'invalid' })).rejects.toThrow(/inválido/);
  });
  it('maps rate limits, SMTP failures and network errors without exposing raw tokens or internals', () => {
    expect(authErrorMessage({ status: 429 })).toContain('tentativas');
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toContain('Confirme');
    expect(authErrorMessage({ name: 'AuthRetryableFetchError' })).toContain('conexão');
    expect(
      authErrorMessage({ message: 'Error sending confirmation email: secret-token' }),
    ).toContain('enviar o e-mail');
    expect(authErrorMessage({ message: 'private SQL detail secret-token' })).not.toContain(
      'secret-token',
    );
  });
});
