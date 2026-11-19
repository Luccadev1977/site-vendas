import { describe, expect, it } from 'vitest';
import { defaultConfig, templates } from '../src/lib/catalog';
import { briefSchema, commandSchema, configSchema } from '../src/lib/validation';
import { fileType, sameOrigin, readLimited } from '../src/lib/http';
import { csvCell } from '../src/lib/csv';
import { safeReturnPath } from '../src/lib/navigation';
import { businessMonth } from '../src/lib/domain';
describe('Input boundaries', () => {
  it('limits streamed bodies even without Content-Length', async () => {
    const valid = new Request('http://localhost:3000', { method: 'POST', body: 'small' });
    expect(new TextDecoder().decode(await readLimited(valid, 5))).toBe('small');
    const oversized = new Request('http://localhost:3000', { method: 'POST', body: 'too big' });
    await expect(readLimited(oversized, 4)).rejects.toThrow(RangeError);
  });
  it('prevents redirect bypasses with control characters and backslashes', () => {
    for (const path of [
      'https://evil.test',
      '//evil.test',
      '/\\evil.test',
      '/\n/evil.test',
      undefined,
      ['/admin'],
    ])
      expect(safeReturnPath(path)).toBe('/painel');
    expect(safeReturnPath('/studio/restaurantes-premium')).toBe('/studio/restaurantes-premium');
  });
  it('groups confirmed payments by month in São Paulo', () => {
    expect(businessMonth('2026-12-01T01:00:00Z')).toBe('2026-11');
    expect(businessMonth('2026-12-01T04:00:00Z')).toBe('2026-12');
  });
  it('escapes CSV formulas and quoted names', () => {
    expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
    expect(csvCell('  =1+1')).toBe('"\'  =1+1"');
    expect(csvCell('Empresa "A"')).toBe('"Empresa ""A"""');
  });
  it('validates all 42 initial configurations', () => {
    for (const t of templates) expect(configSchema.safeParse(defaultConfig(t)).success).toBe(true);
  });
  it('rejects URLs and invalid CSS colors', () => {
    expect(
      configSchema.safeParse({
        ...defaultConfig(templates[0]),
        heroImage: 'https://evil.test/image.svg',
      }).success,
    ).toBe(false);
    expect(
      configSchema.safeParse({ ...defaultConfig(templates[0]), primary: 'red;url(x)' }).success,
    ).toBe(false);
  });
  it('requires affirmative consent and valid contact details', () => {
    expect(briefSchema.safeParse({ name: 'A', consent: false }).success).toBe(false);
  });
  it('does not expose a registration or financial bypass command', () => {
    expect(commandSchema.safeParse({ action: 'register_file', payload: {} }).success).toBe(false);
    expect(commandSchema.safeParse({ action: 'make_admin', payload: {} }).success).toBe(false);
  });
  it('sniffs bytes instead of trusting the upload extension', () => {
    expect(fileType(new TextEncoder().encode('<svg onload="alert(1)">'))).toBe(null);
    expect(fileType(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf');
    expect(fileType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(fileType(new Uint8Array([255, 216, 255]))).toBe('image/jpeg');
  });
  it('rejects cross-origin and missing-origin mutations', () => {
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api/commands', {
          headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' },
        }),
      ),
    ).toBe(true);
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api/commands', {
          headers: { origin: 'https://evil.test' },
        }),
      ),
    ).toBe(false);
    expect(sameOrigin(new Request('http://localhost:3000/api/commands'))).toBe(false);
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api/commands', {
          headers: { origin: 'http://localhost:3000' },
        }),
      ),
    ).toBe(true);
  });
});
