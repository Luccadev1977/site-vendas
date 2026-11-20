import { mkdirSync, writeFileSync } from 'node:fs';
import { categories, seedTemplates as templates } from '../src/lib/catalog.ts';
const sql = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const rows = (items, keys) =>
  items
    .map(
      (item) =>
        '(' +
        keys
          .map((key) =>
            typeof item[key] === 'boolean'
              ? String(item[key])
              : sql(typeof item[key] === 'object' ? JSON.stringify(item[key]) : item[key]),
          )
          .join(',') +
        ')',
    )
    .join(',\n');
const ck = ['id', 'slug', 'name', 'description', 'active'],
  tk = [
    'id',
    'slug',
    'name',
    'category_id',
    'style',
    'description',
    'accent',
    'featured',
    'active',
    'content',
  ];
// A seed preview must never rewrite a migration that may already be applied.
mkdirSync(new URL('../.local-tools/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../.local-tools/catalog-seed.sql', import.meta.url),
  `-- Original demonstration catalog. No fabricated clients or payments.\ninsert into public.categories(${ck.join(',')}) values\n${rows(categories, ck)};\ninsert into public.templates(${tk.join(',')}) values\n${rows(templates, tk)};\n`,
);
console.log(
  'SQL de revisão gerado em .local-tools/catalog-seed.sql. Nenhuma migration existente foi alterada.',
);
