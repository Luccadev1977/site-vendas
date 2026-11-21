import { describe, expect, it } from 'vitest';
import {
  fileMime,
  validatePayload,
  validateBytes,
} from '../supabase/functions/finalize-upload/validate';
import { whatsappURL } from '../src/lib/contact';
const actor = '20000000-0000-4000-8000-000000000001',
  id = '30000000-0000-4000-8000-000000000001';
const payload = {
  id,
  path: `${id}/${actor}/40000000-0000-4000-8000-000000000001.pdf`,
  name: 'comprovante.pdf',
  mime: 'application/pdf',
  size: 9,
  purpose: 'receipt' as const,
};
describe('Static commerce trusted boundaries', () => {
  it('validates file bytes instead of trusting extension and browser MIME', () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\n');
    expect(fileMime(bytes)).toBe('application/pdf');
    expect(() => validateBytes(payload, bytes)).not.toThrow();
    expect(() => validateBytes({ ...payload, mime: 'image/png' }, bytes)).toThrow();
    expect(() => validateBytes({ ...payload, size: 200 }, bytes)).toThrow();
    expect(() => validateBytes({ ...payload, purpose: 'asset' }, bytes)).toThrow();
    expect(() => validateBytes(payload, new TextEncoder().encode('<script/>'))).toThrow();
  });
  it('rejects another user path, traversals, oversized bodies and invalid purposes', () => {
    expect(validatePayload(payload, actor).path).toBe(payload.path);
    for (const value of [
      { ...payload, path: payload.path.replace(actor, '20000000-0000-4000-8000-000000000002') },
      { ...payload, path: payload.path.replace('40000000', 'prefix40000000') },
      { ...payload, size: 4194305 },
      { ...payload, size: 0 },
      { ...payload, purpose: 'confirm_payment' },
      { ...payload, path: payload.path + '/../x.pdf' },
    ])
      expect(() => validatePayload(value, actor)).toThrow();
  });
  it('only builds configured enabled Brazilian WhatsApp links and adds the model name', () => {
    const settings = {
      phone: '5511999990000',
      message: 'Olá! Tenho interesse no modelo {modelo}.',
      enabled: true,
    };
    expect(whatsappURL({ ...settings, enabled: false }, 'Signature Commerce')).toBeNull();
    expect(whatsappURL({ ...settings, phone: '' }, 'Modelo')).toBeNull();
    const url = new URL(whatsappURL(settings, 'Signature Commerce')!);
    expect(url.hostname).toBe('wa.me');
    expect(url.pathname).toBe('/5511999990000');
    expect(url.searchParams.get('text')).toContain('Signature Commerce');
    expect(whatsappURL({ ...settings, phone: '5511999990000&x=1' }, 'Modelo')).toBeNull();
  });
});
