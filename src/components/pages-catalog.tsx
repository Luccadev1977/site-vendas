'use client';
import { useSearchParams } from 'next/navigation';
import { CatalogBrowser } from './catalog-browser';
import { categories, templates } from '@/lib/catalog';
export function PagesCatalog() {
  const params = useSearchParams();
  const category = params.get('categoria') || '';
  return (
    <CatalogBrowser
      key={category}
      categories={categories}
      templates={templates}
      initialCategory={category}
    />
  );
}
