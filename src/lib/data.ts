import 'server-only';
import { categories as initialCategories, templates as initialTemplates } from './catalog';
import { configured, supabase } from './supabase/server';
import type { Category, Template, Testimonial, Portfolio } from './domain';
export async function catalog() {
  if (!configured())
    return {
      categories: initialCategories,
      templates: initialTemplates,
      local: true,
      error: false,
    };
  try {
    const db = await supabase();
    const [c, t] = await Promise.all([
      db.from('categories').select('*').eq('active', true).order('name'),
      db.from('templates').select('*').eq('active', true).order('name'),
    ]);
    if (c.error || t.error) throw new Error('catalog');
    return {
      categories: c.data as Category[],
      templates: t.data as Template[],
      local: false,
      error: false,
    };
  } catch {
    return { categories: [] as Category[], templates: [] as Template[], local: false, error: true };
  }
}
export async function testimonials(): Promise<Testimonial[]> {
  if (!configured()) return [];
  const db = await supabase();
  const { data } = await db.from('testimonials').select('*').eq('active', true);
  return data || [];
}
export async function portfolio(): Promise<Portfolio[]> {
  if (!configured()) return [];
  const db = await supabase();
  const { data } = await db
    .from('portfolio')
    .select('*')
    .eq('active', true)
    .eq('authorized', true)
    .order('created_at', { ascending: false });
  return data || [];
}
