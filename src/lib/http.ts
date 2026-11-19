import { NextResponse } from 'next/server';
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const requestURL = new URL(request.url);
    const expected = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : `${requestURL.protocol}//${request.headers.get('host') || requestURL.host}`;
    return Boolean(origin) && new URL(origin!).origin === expected;
  } catch {
    return false;
  }
}
export function failure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function readLimited(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new RangeError('Corpo acima do limite.');
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export function fileType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return 'image/png';
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  if (text(0, 5) === '%PDF-') return 'application/pdf';
  return null;
}
