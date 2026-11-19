export function safeReturnPath(value: unknown, fallback = '/painel'): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    Array.from(value).some((c) => c.charCodeAt(0) <= 32 || c === '\\')
  )
    return fallback;
  return value;
}
