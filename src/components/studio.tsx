'use client';
/* eslint-disable @next/next/no-img-element -- Local vectors and authenticated private images in the editor. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Palette,
  Type,
  ImageIcon,
  Layers3,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Check,
  X,
  Download,
  Cloud,
  RotateCcw,
} from 'lucide-react';
import type { z } from 'zod';
import type { Project, SiteConfig, Template } from '@/lib/domain';
import { defaultConfig } from '@/lib/catalog';
import { briefSchema, configSchema } from '@/lib/validation';
import { command, upload } from '@/lib/api-client';
import { SitePreview } from './site-preview';
import { Field, downloadJSON } from './form-ui';
import { isGitHubPages, assetPath } from '@/lib/deployment';

const sections = [
  ['sobre', 'Sobre a empresa'],
  ['servicos', 'Serviços / soluções'],
  ['galeria', 'Galeria de imagens'],
  ['depoimentos', 'Depoimentos'],
  ['contato', 'Contato'],
];
const features = [
  ['formulario', 'Formulário de contato'],
  ['whatsapp', 'Botão de WhatsApp'],
  ['catalogo', 'Catálogo de produtos'],
  ['agendamento', 'Agendamento'],
  ['blog', 'Blog'],
  ['integracoes', 'Integrações externas'],
];
const tabs = [
  ['identidade', 'Identidade', Palette],
  ['conteudo', 'Conteúdo', Type],
  ['imagens', 'Imagens', ImageIcon],
  ['estrutura', 'Estrutura', Layers3],
] as const;

export function Studio({
  template,
  userId,
  initialProject,
}: {
  template: Template;
  userId: string | null;
  initialProject?: Project;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig>(
    initialProject?.config || defaultConfig(template),
  );
  const [tab, setTab] = useState('identidade'),
    [device, setDevice] = useState('desktop'),
    [projectId, setProjectId] = useState(initialProject?.id || ''),
    [ready, setReady] = useState(false),
    [localSaved, setLocalSaved] = useState(false),
    [cloudSaved, setCloudSaved] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [modal, setModal] = useState(false),
    [files, setFiles] = useState<File[]>([]),
    [confirmation, setConfirmation] = useState<{ id: string; number: string } | null>(null);
  const dirty = useRef(false),
    dialog = useRef<HTMLDialogElement>(null);
  const key = `${isGitHubPages ? 'nexo-pages-draft' : 'nexo-draft'}:${initialProject?.id || template.slug}`;
  const form = useForm<z.input<typeof briefSchema>>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      name: '',
      company: config.company,
      email: config.email,
      phone: config.phone,
      purpose: '',
      deadline: '',
      budget: '',
      domain: '',
      hosting: 'Preciso de orientação',
      additional: '',
    },
  });
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      const parsed = configSchema.safeParse(stored?.config);
      if (
        parsed.success &&
        (!initialProject || new Date(stored.savedAt) > new Date(initialProject.updated_at))
      ) {
        // Synchronize the React editor with a persisted external draft once on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConfig(parsed.data);
        setLocalSaved(true);
        if (stored.owner === userId && stored.id) setProjectId(stored.id);
      }
    } catch {}
    setReady(true);
  }, [key, initialProject, userId]);
  useEffect(() => {
    if (!ready) return;
    if (confirmation) {
      localStorage.removeItem(key);
      return;
    }
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            config,
            id: projectId,
            owner: userId,
            savedAt: new Date().toISOString(),
          }),
        );
        setLocalSaved(true);
        dirty.current = false;
      } catch {
        setError(
          'Não foi possível salvar neste dispositivo. Exporte sua configuração ou salve na conta.',
        );
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [config, key, projectId, ready, userId, confirmation]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const el = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    el?.querySelector('input')?.focus();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, [modal]);
  function update<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setLocalSaved(false);
    setCloudSaved(false);
    dirty.current = true;
    setMessage('');
  }
  function toggle(key: 'sections' | 'features', value: string) {
    update(
      key,
      config[key].includes(value)
        ? config[key].filter((v) => v !== value)
        : [...config[key], value],
    );
  }
  async function persist() {
    if (isGitHubPages)
      throw new Error('Esta versão salva no dispositivo. A nuvem requer a versão com servidor.');
    if (!userId)
      throw new Error(
        'Entre na sua conta para salvar na nuvem e enviar o pedido. Seu rascunho fica neste dispositivo.',
      );
    const parsed = configSchema.safeParse(config);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    const id = projectId || crypto.randomUUID();
    await command({
      action: 'save_draft',
      payload: { id, template_id: template.id, config: parsed.data },
    });
    setProjectId(id);
    setCloudSaved(true);
    return id;
  }
  async function save() {
    setPending(true);
    setError('');
    try {
      if (isGitHubPages) {
        localStorage.setItem(
          key,
          JSON.stringify({ config, id: '', owner: null, savedAt: new Date().toISOString() }),
        );
        setLocalSaved(true);
        dirty.current = false;
        setMessage('Rascunho salvo neste dispositivo.');
        return;
      }
      await persist();
      setMessage('Rascunho salvo na sua conta.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function imageUpload(file: File | undefined, target: 'logo' | 'heroImage' | 'images') {
    if (!file) return;
    setPending(true);
    setError('');
    try {
      if (!file.type.startsWith('image/'))
        throw new Error('Selecione uma imagem PNG, JPEG ou WebP.');
      const id = await persist();
      const result = await upload(id, file, 'asset');
      const url = `/api/files/${result.id}?inline=1`;
      update(target, target === 'images' ? [...config.images, url].slice(0, 12) : url);
      setMessage('Imagem enviada. Salve para incluir no projeto.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function submit(brief: z.input<typeof briefSchema>) {
    setPending(true);
    setError('');
    try {
      if (isGitHubPages) {
        downloadJSON(
          {
            version: 1,
            template,
            config,
            brief: briefSchema.parse(brief),
            exportedAt: new Date().toISOString(),
          },
          'solicitacao-nexo.json',
        );
        setModal(false);
        setMessage(
          'Solicitação exportada em JSON. Nenhum pedido foi enviado ou armazenado em um servidor.',
        );
        return;
      }
      const id = await persist();
      for (const file of files) await upload(id, file, 'attachment');
      const result = await command({
        action: 'submit',
        payload: { id, brief: briefSchema.parse(brief) },
      });
      setConfirmation(result);
      dirty.current = false;
      localStorage.removeItem(key);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  const input = (
    label: string,
    key:
      | 'company'
      | 'slogan'
      | 'title'
      | 'subtitle'
      | 'email'
      | 'phone'
      | 'address'
      | 'instagram'
      | 'cta',
    type = 'text',
  ) => (
    <Field label={label}>
      <input
        type={type}
        value={config[key]}
        maxLength={key === 'address' ? 500 : 200}
        onChange={(e) => update(key, e.target.value)}
      />
    </Field>
  );
  const progress = [
    config.company !== defaultConfig(template).company,
    config.title !== defaultConfig(template).title,
    config.description !== defaultConfig(template).description,
    config.notes.length > 0,
  ].filter(Boolean).length;
  return (
    <main id="conteudo">
      <div className="studio-top">
        <div>
          <h1>
            Estúdio de personalização <span className="muted">/ {template.name}</span>
          </h1>
          <p>Sua ideia, em tempo real. O desenvolvimento final começa após a aprovação.</p>
        </div>
        <div className="inline-actions">
          <button
            className="icon-button"
            aria-label="Restaurar modelo"
            title="Restaurar modelo"
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  'Restaurar o modelo original? Suas personalizações atuais neste rascunho serão substituídas.',
                )
              ) {
                setConfig(defaultConfig(template));
                setCloudSaved(false);
                setLocalSaved(false);
                dirty.current = true;
              }
            }}
          >
            <RotateCcw size={16} />
          </button>
          <span className="saved-state" role="status">
            {cloudSaved ? (
              <>
                <Cloud size={14} />
                Salvo na conta
              </>
            ) : localSaved ? (
              <>
                <Check size={14} />
                Salvo neste dispositivo
              </>
            ) : (
              <>
                <Save size={14} />
                Salvando...
              </>
            )}
          </span>
          <button
            className="icon-button"
            aria-label="Exportar configuração JSON"
            title="Exportar configuração"
            onClick={() => downloadJSON({ template, config }, 'meu-projeto-nexo.json')}
          >
            <Download size={16} />
          </button>
          <button className="button button-outline button-small" onClick={save} disabled={pending}>
            {isGitHubPages ? 'Salvar no dispositivo' : 'Salvar rascunho'}
          </button>
          <button
            className="button button-small"
            disabled={pending}
            onClick={() => {
              setError('');
              form.setValue('company', config.company);
              form.setValue('email', config.email);
              form.setValue('phone', config.phone);
              setModal(true);
            }}
          >
            Solicitar orçamento
          </button>
        </div>
      </div>
      <div className="studio-shell">
        <aside className="studio-sidebar">
          <div
            className="progress-track"
            aria-label={`${Math.round((progress / 4) * 100)}% dos campos principais personalizados`}
          >
            <span style={{ width: `${Math.max(8, (progress / 4) * 100)}%` }} />
          </div>
          <div className="studio-tabs" role="tablist" aria-label="Áreas de personalização">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                aria-controls="editor-fields"
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          {(error || message) && !modal && (
            <p
              className={`notice ${error ? 'error' : 'success'}`}
              role="status"
              style={{ marginBottom: 18 }}
            >
              {error || message}
              {!userId && error && (
                <>
                  {' '}
                  <Link href={`/conta?next=${encodeURIComponent(`/studio/${template.slug}`)}`}>
                    Entrar ou criar conta
                  </Link>
                </>
              )}
            </p>
          )}
          <fieldset
            disabled={pending}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
            className="form-stack"
            id="editor-fields"
            role="tabpanel"
            aria-label={tabs.find((t) => t[0] === tab)?.[1]}
          >
            {tab === 'identidade' && (
              <>
                {input('Nome da empresa', 'company')}
                {input('Slogan', 'slogan')}
                <div className="color-grid">
                  {[
                    ['Cor principal', 'primary'],
                    ['Cor secundária', 'secondary'],
                    ['Fundo', 'background'],
                    ['Botões', 'buttonColor'],
                  ].map(([label, key]) => (
                    <Field key={key} label={label}>
                      <input
                        type="color"
                        aria-label={label}
                        value={config[key as 'primary']}
                        onChange={(e) => update(key as 'primary', e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
                <Field label="Tipografia">
                  <select
                    value={config.font}
                    onChange={(e) => update('font', e.target.value as SiteConfig['font'])}
                  >
                    <option value="sans">Moderna · Sans serif</option>
                    <option value="serif">Editorial · Serifada</option>
                    <option value="mono">Técnica · Monoespaçada</option>
                  </select>
                </Field>
                <Field label={`Arredondamento · ${config.radius}px`}>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={config.radius}
                    onChange={(e) => update('radius', +e.target.value)}
                  />
                </Field>
                <p className="studio-help">
                  {isGitHubPages
                    ? 'Uploads de logotipo exigem a versão com servidor.'
                    : 'Seu logotipo pode ser enviado na aba Imagens.'}
                </p>
              </>
            )}
            {tab === 'conteudo' && (
              <>
                {input('Título principal', 'title')}
                {input('Subtítulo', 'subtitle')}
                <Field label="Sobre o negócio">
                  <textarea
                    value={config.description}
                    maxLength={4000}
                    onChange={(e) => update('description', e.target.value)}
                  />
                </Field>
                <Field label="Serviços (um por linha)">
                  <textarea
                    value={config.services.join('\n')}
                    maxLength={4000}
                    onChange={(e) => update('services', e.target.value.split('\n').slice(0, 20))}
                  />
                </Field>
                {input('Texto do botão', 'cta')}
                {input('E-mail de contato', 'email', 'email')}
                {input('WhatsApp com código do país', 'phone', 'tel')}
                {input('Endereço', 'address')}
                {input('Instagram (usuário)', 'instagram')}
              </>
            )}
            {tab === 'imagens' && (
              <>
                <p className="studio-help">
                  {isGitHubPages
                    ? 'Escolha uma composição ilustrativa. Uploads privados e logotipos exigem a versão com servidor; esta publicação não recebe arquivos.'
                    : 'Escolha uma composição ilustrativa ou envie suas imagens. Uploads privados exigem uma conta e rascunho salvo. PNG, JPEG ou WebP, até 4 MB.'}
                </p>
                <div className="image-options">
                  {['architecture', 'sculpture', 'abstract'].map((img) => (
                    <button
                      key={img}
                      title={`Usar composição ${img}`}
                      onClick={() => update('heroImage', `/images/${img}.svg`)}
                    >
                      <img src={assetPath(`/images/${img}.svg`)} alt={`Composição ${img}`} />
                    </button>
                  ))}
                </div>
                {[
                  ['Logotipo', 'logo'],
                  ['Imagem principal', 'heroImage'],
                  ['Adicionar à galeria', 'images'],
                ].map(([label, target]) => (
                  <label key={target} className="upload-control">
                    {label}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={pending || isGitHubPages}
                      onChange={(e) => {
                        imageUpload(e.target.files?.[0], target as 'logo');
                        e.target.value = '';
                      }}
                    />
                  </label>
                ))}
                {config.logo && (
                  <Field label="Logotipo selecionado">
                    <img
                      src={assetPath(config.logo)}
                      alt="Logotipo selecionado"
                      style={{ maxHeight: 70, objectFit: 'contain' }}
                    />
                    <button
                      className="button button-outline button-small"
                      onClick={() => update('logo', '')}
                    >
                      Remover logo
                    </button>
                  </Field>
                )}
                <div className="image-options">
                  {config.images.map((src, i) => (
                    <button
                      key={i}
                      title="Remover imagem da galeria"
                      onClick={() =>
                        update(
                          'images',
                          config.images.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <img src={assetPath(src)} alt={`Galeria ${i + 1} — clique para remover`} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'estrutura' && (
              <>
                <Field label="Quantidade de páginas">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.pages}
                    onChange={(e) => update('pages', Math.max(1, Math.min(100, +e.target.value)))}
                  />
                </Field>
                <div className="studio-checkboxes">
                  <span className="studio-help">SEÇÕES DA PRÉVIA</span>
                  {sections.map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={config.sections.includes(id)}
                        onChange={() => toggle('sections', id)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="studio-checkboxes">
                  <span className="studio-help">FUNCIONALIDADES SOLICITADAS</span>
                  {features.map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={config.features.includes(id)}
                        onChange={() => toggle('features', id)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Field label="Integrações e ideias especiais">
                  <textarea
                    value={config.notes}
                    maxLength={8000}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Conte o que mais seu site precisa fazer..."
                  />
                </Field>
                <p className="studio-help">
                  Páginas adicionais, integrações, blog e agendamento entram no escopo para análise.
                  A prévia não representa esses sistemas funcionando.
                </p>
              </>
            )}
          </fieldset>
        </aside>
        <section className="studio-preview-area" aria-label="Prévia ao vivo">
          <div className="preview-toolbar">
            <span>PRÉVIA AO VIVO · {template.style.toUpperCase()}</span>
            <div className="device-switch" aria-label="Dispositivo da prévia">
              {[
                ['desktop', 'Desktop', Monitor],
                ['tablet', 'Tablet', Tablet],
                ['mobile', 'Celular', Smartphone],
              ].map(([id, label, Icon]) => (
                <button
                  key={String(id)}
                  aria-label={String(label)}
                  aria-pressed={device === id}
                  className={device === id ? 'active' : ''}
                  onClick={() => setDevice(String(id))}
                >
                  {typeof Icon !== 'string' && <Icon size={15} />}
                  <span>{String(label)}</span>
                </button>
              ))}
            </div>
          </div>
          <div
            className="preview-frame"
            style={{ maxWidth: device === 'mobile' ? 375 : device === 'tablet' ? 768 : 1400 }}
          >
            <div className="browser-toolbar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>Prévia do seu projeto</span>
              <span>✦</span>
            </div>
            <div className="preview-scroll">
              <SitePreview config={config} template={template} />
            </div>
          </div>
          <p className="preview-note">
            Navegue pelas seções da prévia. Todas as alterações são preservadas ao trocar de
            dispositivo.
          </p>
        </section>
      </div>
      {modal && (
        <dialog
          ref={dialog}
          className="modal"
          aria-labelledby="brief-dialog-title"
          onCancel={(e) => {
            if (pending) e.preventDefault();
            else setModal(false);
          }}
          style={{ color: 'var(--text)', margin: 'auto' }}
        >
          <div className="modal-header">
            <div>
              <span className="eyebrow">O PRÓXIMO PASSO É UMA CONVERSA</span>
              <h2 id="brief-dialog-title">
                {confirmation
                  ? 'Seu projeto chegou.'
                  : isGitHubPages
                    ? 'Leve sua ideia com você.'
                    : 'Conte um pouco mais.'}
              </h2>
              <p>
                {confirmation
                  ? 'Vamos analisar cada detalhe da sua ideia.'
                  : isGitHubPages
                    ? 'Esta versão prepara um arquivo JSON com a sua personalização e os detalhes abaixo. Nada é enviado ao servidor.'
                    : 'Sua personalização será incluída automaticamente no pedido.'}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Fechar formulário"
              disabled={pending}
              onClick={() => setModal(false)}
            >
              <X size={18} />
            </button>
          </div>
          {confirmation ? (
            <div className="form-stack">
              <div className="notice success">
                Pedido recebido · <strong>{confirmation.number}</strong>
              </div>
              <p>
                O orçamento será preparado após a análise. Você acompanha a proposta, o pagamento e
                o desenvolvimento na sua conta.
              </p>
              <Link className="button" href={`/painel/projetos/${confirmation.id}`}>
                Acompanhar meu projeto
              </Link>
            </div>
          ) : !userId && !isGitHubPages ? (
            <div className="form-stack">
              <p className="notice">
                Crie sua conta ou entre para enviar o pedido com segurança. Seu rascunho está salvo
                neste dispositivo.
              </p>
              <Link
                className="button"
                href={`/conta?modo=cadastro&next=${encodeURIComponent(`/studio/${template.slug}`)}`}
              >
                Criar minha conta
              </Link>
              <Link
                className="button button-outline"
                href={`/conta?next=${encodeURIComponent(`/studio/${template.slug}`)}`}
              >
                Já tenho uma conta
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                void form.handleSubmit(submit)(e);
              }}
              className="form-grid"
            >
              {error && (
                <p className="notice error full-width" role="alert">
                  {error}
                </p>
              )}
              {[
                ['name', 'Nome completo', 'text'],
                ['company', 'Empresa', 'text'],
                ['email', 'E-mail', 'email'],
                ['phone', 'WhatsApp', 'tel'],
                ['deadline', 'Prazo desejado', 'text'],
                ['budget', 'Faixa de orçamento (opcional)', 'text'],
                ['domain', 'Domínio existente (opcional)', 'text'],
              ].map(([name, label, type]) => (
                <Field key={name} label={label}>
                  <input type={type} {...form.register(name as 'name')} />
                  {form.formState.errors[name as 'name'] && (
                    <span className="error-text">
                      {form.formState.errors[name as 'name']?.message}
                    </span>
                  )}
                </Field>
              ))}
              <Field label="Hospedagem">
                <select {...form.register('hosting')}>
                  <option>Preciso de orientação</option>
                  <option>Já tenho hospedagem</option>
                  <option>Quero incluir na proposta</option>
                </select>
              </Field>
              <div className="full-width">
                <Field label="Finalidade do projeto">
                  <textarea
                    {...form.register('purpose')}
                    placeholder="O que seu novo site precisa alcançar?"
                  />
                  {form.formState.errors.purpose && (
                    <span className="error-text">{form.formState.errors.purpose.message}</span>
                  )}
                </Field>
              </div>
              <div className="full-width">
                <Field label="Informações adicionais">
                  <textarea {...form.register('additional')} />
                </Field>
              </div>
              <div className="full-width">
                <Field label="Anexos (até 5 arquivos, 4 MB cada)">
                  <input
                    type="file"
                    multiple
                    disabled={isGitHubPages}
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
                  />
                  <small>
                    {isGitHubPages
                      ? 'Anexos exigem a versão com servidor. O JSON contém somente os dados e a configuração informados.'
                      : 'PNG, JPEG, WebP ou PDF. Arquivos privados, visíveis somente por você e pelo administrador.'}
                  </small>
                </Field>
              </div>
              <label className="checkbox-field full-width">
                <input type="checkbox" {...form.register('consent')} />
                <span>
                  Li a{' '}
                  <Link href="/privacidade" target="_blank">
                    Política de Privacidade
                  </Link>{' '}
                  {isGitHubPages
                    ? 'e entendo que o JSON conterá os dados informados e ficará sob minha responsabilidade. Nenhum pedido será enviado.'
                    : 'e autorizo o tratamento dos meus dados para analisar este pedido e entrar em contato.'}
                </span>
              </label>
              {form.formState.errors.consent && (
                <span className="error-text full-width">
                  {form.formState.errors.consent.message}
                </span>
              )}
              <button className="button full-width" disabled={pending}>
                {pending
                  ? 'Preparando...'
                  : isGitHubPages
                    ? 'Baixar solicitação em JSON'
                    : 'Enviar meu projeto para análise'}
              </button>
            </form>
          )}
        </dialog>
      )}
    </main>
  );
}
