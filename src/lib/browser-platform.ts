'use client';
import { isGitHubPages, publicBasePath } from './deployment';
import { browserSupabase } from './supabase/browser';
export function browserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function projectHref(id: string, admin = false) {
  return isGitHubPages
    ? `${admin ? '/admin/pedido/' : '/painel/projeto/'}?id=${encodeURIComponent(id)}`
    : `${admin ? '/admin/pedidos' : '/painel/projetos'}/${id}`;
}
export function refreshData(router: { refresh: () => void }) {
  window.dispatchEvent(new Event('nexo-refresh'));
  if (!isGitHubPages) router.refresh();
}
export function authRedirect(next = '/painel') {
  return `${window.location.origin}${publicBasePath}/conta/?callback=1&next=${encodeURIComponent(next)}`;
}
export async function fileURL(id: string, download = false) {
  const db = browserSupabase();
  const { data: file, error } = await db
    .from('files')
    .select('path,name,mime')
    .eq('id', id)
    .single();
  if (error || !file) throw new Error('Arquivo indisponível ou sem permissão.');
  const { data, error: signedError } = await db.storage
    .from('project-files')
    .createSignedUrl(file.path, 60, download ? { download: file.name } : {});
  if (signedError || !data) throw new Error('Não foi possível abrir o arquivo privado.');
  return data.signedUrl;
}
export async function publicImageURL(name: string) {
  const { data, error } = await browserSupabase()
    .storage.from('catalog-assets')
    .createSignedUrl(name, 300);
  if (error || !data) throw new Error('Imagem indisponível.');
  return data.signedUrl;
}
