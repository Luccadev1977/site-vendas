import type { Command } from './validation';
export async function command(input: Command) {
  const response = await fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
  return data;
}
export async function upload(projectId: string, file: File, purpose: string) {
  const body = new FormData();
  body.set('file', file);
  body.set('projectId', projectId);
  body.set('purpose', purpose);
  const response = await fetch('/api/files', { method: 'POST', body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o arquivo.');
  return data as { id: string };
}
