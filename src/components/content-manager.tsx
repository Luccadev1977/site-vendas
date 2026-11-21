'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshData } from '@/lib/browser-platform';
import { command } from '@/lib/api-client';
import type { Portfolio } from '@/lib/domain';
import { Field } from './form-ui';
import { isGitHubPages } from '@/lib/deployment';
import { browserSupabase } from '@/lib/supabase/browser';
export function PublicImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <div>
      <label className="upload-control">
        {pending ? 'Enviando imagem...' : 'Enviar imagem pública (PNG, JPEG, WebP · 4 MB)'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={pending}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setPending(true);
            setError('');
            try {
              const body = new FormData();
              body.set('file', file);
              if (isGitHubPages) {
                const { data, error } = await browserSupabase().functions.invoke(
                  'finalize-upload',
                  { body },
                );
                if (error || data?.error)
                  throw new Error(
                    data?.error || 'Não foi possível validar a imagem. Confira a Edge Function.',
                  );
                onUpload(data.url);
                return;
              }
              const response = await fetch('/api/admin/assets', { method: 'POST', body });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              onUpload(data.url);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ContentManager({ items }: { items: Portfolio[] }) {
  const router = useRouter(),
    [editing, setEditing] = useState<Partial<Portfolio> | null>(null),
    [image, setImage] = useState('/images/architecture.svg'),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <main id="conteudo">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">TRABALHOS QUE PODEM SER COMPARTILHADOS</span>
          <h1>Projetos realizados</h1>
          <p>Publique somente trabalhos entregues e autorizados pelo cliente.</p>
        </div>
        <button
          className="button button-small"
          onClick={() => {
            setEditing({});
            setImage('/images/architecture.svg');
            setError('');
          }}
        >
          Adicionar projeto
        </button>
      </div>
      {editing && (
        <form
          className="panel form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setPending(true);
            setError('');
            try {
              await command({
                action: 'portfolio',
                payload: {
                  id: editing.id || crypto.randomUUID(),
                  title: String(f.get('title')),
                  description: String(f.get('description')),
                  image,
                  url: String(f.get('url')),
                  active: f.has('active'),
                  authorized: true,
                },
              });
              setEditing(null);
              refreshData(router);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          <Field label="Título">
            <input
              name="title"
              required
              minLength={2}
              maxLength={200}
              defaultValue={editing.title}
            />
          </Field>
          <Field label="Endereço público (opcional)">
            <input
              name="url"
              type="url"
              placeholder="https://"
              pattern="https://.*"
              defaultValue={editing.url}
            />
          </Field>
          <div className="full-width">
            <Field label="Descrição">
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={2000}
                defaultValue={editing.description}
              />
            </Field>
          </div>
          <Field label="Imagem">
            <select value={image} onChange={(e) => setImage(e.target.value)}>
              <option value="/images/architecture.svg">Arquitetura</option>
              <option value="/images/sculpture.svg">Escultura</option>
              <option value="/images/abstract.svg">Abstrato</option>
              {image.startsWith('/api/') && <option value={image}>Imagem enviada</option>}
            </select>
          </Field>
          <PublicImageUpload onUpload={setImage} />
          <label className="checkbox-field full-width">
            <input type="checkbox" required />
            Tenho autorização do cliente para divulgar este projeto e as imagens.
          </label>
          <label className="checkbox-field">
            <input type="checkbox" name="active" defaultChecked={editing.active ?? false} />
            Publicar na homepage
          </label>
          {error && <p className="notice error full-width">{error}</p>}
          <div className="inline-actions full-width">
            <button className="button" disabled={pending}>
              Salvar projeto
            </button>
            <button
              className="button button-outline"
              type="button"
              disabled={pending}
              onClick={() => setEditing(null)}
            >
              Cancelar edição
            </button>
          </div>
        </form>
      )}
      <div className="panel" style={{ marginTop: 25 }}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Visibilidade</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.active ? 'Publicado' : 'Oculto'}</td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => {
                        setEditing(item);
                        setImage(item.image);
                        setError('');
                      }}
                    >
                      Editar projeto
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={3}>
                    Nenhum projeto realizado cadastrado. Não publicamos trabalhos fictícios como
                    entregas reais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
