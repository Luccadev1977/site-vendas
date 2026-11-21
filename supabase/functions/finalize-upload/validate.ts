export type UploadPayload = {
  id: string;
  path: string;
  name: string;
  mime: string;
  size: number;
  purpose: 'asset' | 'attachment' | 'receipt' | 'message';
};
export function fileMime(bytes: Uint8Array) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return 'image/png';
  const text = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  if (text(0, 5) === '%PDF-') return 'application/pdf';
  return null;
}
export function validatePayload(input: unknown, actor: string): UploadPayload {
  if (!input || typeof input !== 'object') throw new Error('Arquivo inválido.');
  const p = input as UploadPayload;
  if (
    typeof p.id !== 'string' ||
    !/^[0-9a-f-]{36}$/.test(p.id) ||
    typeof p.path !== 'string' ||
    !p.path.startsWith(`${p.id}/${actor}/`) ||
    p.path.split('/').length !== 3 ||
    !/^[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/.test(p.path.split('/')[2]) ||
    !['asset', 'attachment', 'receipt', 'message'].includes(p.purpose) ||
    typeof p.name !== 'string' ||
    !p.name.length ||
    p.name.length > 200 ||
    !Number.isInteger(p.size) ||
    p.size < 1 ||
    p.size > 4194304 ||
    !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(p.mime)
  )
    throw new Error('Arquivo inválido.');
  return { ...p, name: p.name.replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 200) };
}
export function validateBytes(p: UploadPayload, bytes: Uint8Array) {
  const mime = fileMime(bytes);
  if (
    bytes.length !== p.size ||
    mime !== p.mime ||
    (p.purpose === 'asset' && !mime?.startsWith('image/'))
  )
    throw new Error('Formato ou tamanho de arquivo inválido.');
}
