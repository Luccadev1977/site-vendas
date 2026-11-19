'use client';
import { useState } from 'react';
import { Search, Layers3 } from 'lucide-react';
import type { Category, Template } from '@/lib/domain';
import { TemplateCard } from './template-card';
export function CatalogBrowser({
  categories,
  templates,
  initialCategory,
}: {
  categories: Category[];
  templates: Template[];
  initialCategory: string;
}) {
  const [category, setCategory] = useState(initialCategory),
    [style, setStyle] = useState(''),
    [query, setQuery] = useState('');
  const visible = templates.filter(
    (t) =>
      (!category || categories.find((c) => c.id === t.category_id)?.slug === category) &&
      (!style || t.style === style) &&
      `${t.name} ${t.description}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
  );
  return (
    <>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar modelos"
            placeholder="Busque seu próximo ponto de partida..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Estilo" value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="">Todos os estilos</option>
          <option value="minimalista">Minimalista</option>
          <option value="moderno">Moderno</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <p className="count-label" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'modelo para explorar' : 'modelos para explorar'} ·
        Sua identidade é o próximo detalhe.
      </p>
      <div className="template-grid">
        {visible.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            category={categories.find((c) => c.id === t.category_id)?.name}
          />
        ))}
        {visible.length === 0 && (
          <div className="empty-state">
            <Layers3 size={32} />
            <h2>Uma busca, novas possibilidades.</h2>
            <p>Tente outra categoria ou remova um filtro para explorar mais modelos.</p>
            <button
              className="button button-outline"
              onClick={() => {
                setCategory('');
                setStyle('');
                setQuery('');
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </>
  );
}
