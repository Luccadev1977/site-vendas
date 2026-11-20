'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Gem, Columns3 } from 'lucide-react';
import type { Category, Template } from '@/lib/domain';
import { isPremium, styleLabels } from '@/lib/catalog';
import { TemplateCard, TemplateArtwork, TemplatePrice } from './template-card';
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
    [query, setQuery] = useState(''),
    [tier, setTier] = useState(''),
    [sort, setSort] = useState('curated'),
    [compare, setCompare] = useState<string[]>([]),
    [open, setOpen] = useState(false),
    [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) {
      const element = dialog.current;
      element?.showModal();
      return () => element?.close();
    }
  }, [open]);
  const normalize = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  const visible = templates
    .filter(
      (t) =>
        (!category || categories.find((c) => c.id === t.category_id)?.slug === category) &&
        (!style || t.style === style) &&
        (!tier || (tier === 'premium') === isPremium(t)) &&
        normalize(
          `${t.name} ${t.description} ${categories.find((c) => c.id === t.category_id)?.name}`,
        ).includes(normalize(query)),
    )
    .sort((a, b) =>
      sort === 'az'
        ? a.name.localeCompare(b.name, 'pt-BR')
        : sort === 'za'
          ? b.name.localeCompare(a.name, 'pt-BR')
          : Number(b.featured) - Number(a.featured),
    );
  const premium = visible.filter(isPremium),
    conventional = visible.filter((t) => !isPremium(t)),
    selected = templates.filter((t) => compare.includes(t.id));
  function toggle(t: Template) {
    if (compare.includes(t.id)) {
      setCompare(compare.filter((id) => id !== t.id));
      setNotice('');
    } else if (compare.length < 3) {
      setCompare([...compare, t.id]);
      setNotice('');
    } else
      setNotice('Você pode comparar até três modelos. Remova uma seleção para adicionar outra.');
  }
  const card = (t: Template) => (
    <TemplateCard
      key={t.id}
      template={t}
      category={categories.find((c) => c.id === t.category_id)?.name}
      selected={compare.includes(t.id)}
      onCompare={toggle}
    />
  );
  return (
    <div className="showroom-catalog">
      <div className="showroom-filter">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Buscar modelos"
            placeholder="Busque por nome, negócio ou inspiração..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="filter-caption">
          <SlidersHorizontal size={16} />
          Refine sua seleção
        </span>
        <div className="filter-selects">
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
            {['minimalista', 'moderno', 'elegante'].map((s) => (
              <option value={s} key={s}>
                {styleLabels[s as Template['style']]}
              </option>
            ))}
          </select>
          <select aria-label="Classificação" value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">Todas as coleções</option>
            <option value="conventional">Convencional</option>
            <option value="premium">Premium</option>
          </select>
          <select aria-label="Ordenação" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="curated">Curadoria Nexo</option>
            <option value="az">Nome: A–Z</option>
            <option value="za">Nome: Z–A</option>
          </select>
        </div>
      </div>
      <div className="catalog-result">
        <p aria-live="polite">
          {visible.length} {visible.length === 1 ? 'modelo para explorar' : 'modelos para explorar'}{' '}
          <span>· Encontre a sua direção.</span>
        </p>
        <button
          className="text-button"
          onClick={() => {
            setCategory('');
            setStyle('');
            setTier('');
            setQuery('');
            setSort('curated');
          }}
        >
          Limpar filtros
        </button>
      </div>
      {premium.length > 0 && (
        <section className="premium-collection" aria-labelledby="premium-title">
          <div className="collection-heading">
            <div>
              <span className="eyebrow">
                <Gem size={15} /> THE SIGNATURE COLLECTION
              </span>
              <h2 id="premium-title">
                Coleção <em>Premium.</em>
              </h2>
            </div>
            <p>
              Três experiências autorais.
              <br />
              Para uma presença extraordinária.
            </p>
          </div>
          <div className="premium-grid">{premium.map(card)}</div>
        </section>
      )}
      {conventional.length > 0 && (
        <section className="conventional-collection" aria-labelledby="conventional-title">
          <div className="collection-heading">
            <div>
              <span className="eyebrow">UM NOVO COMEÇO</span>
              <h2 id="conventional-title">Design para o seu negócio.</h2>
            </div>
            <p>
              Minimalista, moderno ou elegante.
              <br />A identidade é toda sua.
            </p>
          </div>
          <div className="template-grid">{conventional.map(card)}</div>
        </section>
      )}
      {!visible.length && (
        <div className="empty-state">
          <Search size={30} />
          <h2>Uma busca, novas possibilidades.</h2>
          <p>Experimente outro termo ou limpe os filtros.</p>
        </div>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {selected.length > 0 && (
        <div className="compare-tray">
          <div>
            <Columns3 size={20} />
            <b>{selected.length}/3 selecionados</b>
            <span>{selected.map((t) => t.name).join(' · ')}</span>
          </div>
          <button className="button button-small" onClick={() => setOpen(true)}>
            Comparar modelos
          </button>
          <button
            className="icon-button"
            aria-label="Limpar comparação"
            onClick={() => {
              setCompare([]);
              setNotice('');
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {open && (
        <dialog
          ref={dialog}
          className="comparison-dialog"
          aria-labelledby="comparison-title"
          onCancel={() => setOpen(false)}
        >
          <div className="modal-header">
            <div>
              <span className="eyebrow">SUA ESCOLHA, COM CLAREZA</span>
              <h2 id="comparison-title">Lado a lado.</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Fechar comparação"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="comparison-scroll">
            <table>
              <caption className="sr-only">Comparação dos modelos selecionados</caption>
              <thead>
                <tr>
                  <th scope="col">Sua próxima presença</th>
                  {selected.map((t) => (
                    <th scope="col" key={t.id}>
                      <TemplateArtwork template={t} />
                      <h3>{t.name}</h3>
                      <button className="text-button" onClick={() => toggle(t)}>
                        Remover
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'Categoria',
                  'Estilo',
                  'Coleção',
                  'Recursos demonstrados',
                  'Personalização',
                  'Investimento inicial',
                  'Próximo passo',
                ].map((label, i) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((t) => (
                      <td key={t.id}>
                        {i === 0 ? (
                          categories.find((c) => c.id === t.category_id)?.name
                        ) : i === 1 ? (
                          styleLabels[t.style]
                        ) : i === 2 ? (
                          isPremium(t) ? (
                            'Premium'
                          ) : (
                            'Convencional'
                          )
                        ) : i === 3 ? (
                          t.content.services
                        ) : i === 4 ? (
                          'Identidade, 6 cores, fontes, textos, imagens e 7 seções'
                        ) : i === 5 ? (
                          <TemplatePrice template={t} />
                        ) : (
                          <Link className="button button-small" href={`/studio/${t.slug}`}>
                            Personalizar
                          </Link>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="studio-help">
            Conteúdo fictício. Recursos comerciais e integrações dependem da análise do projeto;
            nenhuma transação é realizada na demonstração.
          </p>
        </dialog>
      )}
    </div>
  );
}
