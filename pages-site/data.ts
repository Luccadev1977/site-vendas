import { categories, templates } from '@/lib/catalog';
import type { Testimonial, Portfolio } from '@/lib/domain';
export async function catalog() {
  return { categories, templates, local: true, error: false };
}
export async function testimonials(): Promise<Testimonial[]> {
  return [];
}
export async function portfolio(): Promise<Portfolio[]> {
  return [];
}
