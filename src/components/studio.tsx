'use client';
/* eslint-disable @next/next/no-img-element -- Local vectors and authenticated private images in the editor. */
import { useEffect, useRef, useState, useReducer } from 'react';
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
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  Building2,
  Sparkles,
  BriefcaseBusiness,
  ListChecks,
  Upload,
} from 'lucide-react';
import type { z } from 'zod';
import type { Project, SiteConfig, Template } from '@/lib/domain';
import { defaultConfig, isPremium, styleLabels } from '@/lib/catalog';
import { briefSchema, configSchema, localConfigSchema } from '@/lib/validation';
import { command, upload } from '@/lib/api-client';
import { SitePreview } from './site-preview';
import { Field, downloadJSON } from './form-ui';
import { isGitHubPages, assetPath } from '@/lib/deployment';
import { browserConfigured, projectHref, refreshData } from '@/lib/browser-platform';
import { useBrowserSession } from './browser-runtime';
import { editorHistory } from '@/lib/editor-history';
import { storeImage, imageData, readImage } from '@/lib/local-images';
import { PreviewImage } from './preview-image';

const sections = [
  ['sobre', 'Sobre a empresa'],
  ['servicos', 'Serviços / soluções'],
  ['galeria', 'Galeria de imagens'],
  ['depoimentos', 'Depoimentos'],
  ['equipe', 'Equipe'],
  ['faq', 'Perguntas frequentes'],
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
  ['identidade', 'Identidade', Building2],
  ['cores', 'Cores', Palette],
  ['tipografia', 'Tipografia', Type],
  ['conteudo', 'Textos', ListChecks],
  ['imagens', 'Imagens', ImageIcon],
  ['secoes', 'Seções', Layers3],
  ['funcionalidades', 'Funcionalidades', Sparkles],
  ['comercial', 'Informações comerciais', BriefcaseBusiness],
] as const;

export function Studio({
  template,
  userId: serverUserId,
  initialProject,
}: {
  template: Template;
  userId: string | null;
  initialProject?: Project;
}) {
  const router = useRouter();
  const session = useBrowserSession(),
    userId = isGitHubPages ? session.user?.id || null : serverUserId;
  const ordersEnabled = browserConfigured();
  const draftId = useRef(initialProject?.id || '');
  const uploadedImages = useRef(new Map<string, string>());
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [history, dispatch] = useReducer(editorHistory, {
    past: [],
    present: initialProject?.config || defaultConfig(template),
    future: [],
  });
  const config = history.present;
  const setConfig = (value: SiteConfig | ((c: SiteConfig) => SiteConfig)) =>
    dispatch({ type: 'change', value });
  const [toolsOpen, setToolsOpen] = useState(true),
    [fullScreen, setFullScreen] = useState(false),
    [reviewing, setReviewing] = useState(true);
  const [imageCandidate, setImageCandidate] = useState<{
    file: File;
    target: 'logo' | 'heroImage' | 'images';
    url: string;
  } | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [pastedProject, setPastedProject] = useState('');
  useEffect(
    () => () => {
      if (imageCandidate) URL.revokeObjectURL(imageCandidate.url);
    },
    [imageCandidate],
  );
  useEffect(() => {
    const exit = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullScreen(false);
        setMobileToolsOpen(false);
      }
    };
    window.addEventListener('keydown', exit);
    return () => window.removeEventListener('keydown', exit);
  }, []);
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
  const key = `${isGitHubPages ? 'nexo-pages-draft' : 'nexo-draft'}:${initialProject?.id || template.slug}:${userId || 'anonymous'}`;
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
      const anonymousKey = `${isGitHubPages ? 'nexo-pages-draft' : 'nexo-draft'}:${template.slug}:anonymous`;
      const legacyKey = `${isGitHubPages ? 'nexo-pages-draft' : 'nexo-draft'}:${initialProject?.id || template.slug}`;
      const stored = JSON.parse(
        localStorage.getItem(key) ||
          (!initialProject && userId && localStorage.getItem(anonymousKey)) ||
          localStorage.getItem(legacyKey) ||
          'null',
      );
      const parsed = (isGitHubPages ? localConfigSchema : configSchema).safeParse(stored?.config);
      if (
        parsed.success &&
        (!stored.owner || stored.owner === userId) &&
        (!initialProject || new Date(stored.savedAt) > new Date(initialProject.updated_at))
      ) {
        // Synchronize the React editor with a persisted external draft once on mount.
        dispatch({ type: 'load', value: parsed.data });
        // Hydrate the editor once from an external persisted draft.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalSaved(true);
        if (stored.owner === userId && stored.id) {
          setProjectId(stored.id);
          draftId.current = stored.id;
        }
      }
    } catch {}
    setReady(true);
  }, [key, initialProject, userId, template.slug]);
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
  async function persist(value: SiteConfig = config) {
    if (!ordersEnabled)
      throw new Error(
        'Envio indisponível: o Supabase ainda não foi configurado. Sua personalização continua salva neste dispositivo.',
      );
    if (!userId)
      throw new Error(
        'Entre na sua conta para salvar na nuvem e enviar o pedido. Seu rascunho fica neste dispositivo.',
      );
    const parsed = configSchema.safeParse(value);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    const id = projectId || draftId.current || crypto.randomUUID();
    draftId.current = id;
    await command({
      action: 'save_draft',
      payload: { id, template_id: template.id, config: parsed.data },
    });
    setProjectId(id);
    setCloudSaved(true);
    return id;
  }
  async function persistAll() {
    if (!isGitHubPages) return persist();
    const local = [config.logo, config.heroImage, ...config.images].filter((v) =>
      v.startsWith('local-image:'),
    );
    if (!local.length) return persist();
    const base = {
      ...config,
      logo: config.logo.startsWith('local-image:') ? '' : config.logo,
      heroImage: config.heroImage.startsWith('local-image:')
        ? defaultConfig(template).heroImage
        : config.heroImage,
      images: config.images.filter((v) => !v.startsWith('local-image:')),
    };
    const id = await persist(base);
    for (const ref of new Set(local)) {
      if (uploadedImages.current.has(id + ref)) continue;
      const blob = await readImage(ref);
      if (!blob)
        throw new Error('Imagem local não encontrada. Selecione-a novamente antes de enviar.');
      const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
      const result = await upload(
        id,
        new File([blob], 'imagem.' + ext, { type: blob.type }),
        'asset',
      );
      uploadedImages.current.set(id + ref, '/api/files/' + result.id + '?inline=1');
    }
    const convert = (ref: string) => uploadedImages.current.get(id + ref) || ref;
    const cloud = {
      ...config,
      logo: convert(config.logo),
      heroImage: convert(config.heroImage),
      images: config.images.map(convert),
    };
    await persist(cloud);
    setConfig(cloud);
    return id;
  }
  async function save() {
    setPending(true);
    setError('');
    try {
      if (isGitHubPages && (!userId || !ordersEnabled)) {
        localStorage.setItem(
          key,
          JSON.stringify({ config, id: '', owner: null, savedAt: new Date().toISOString() }),
        );
        setLocalSaved(true);
        dirty.current = false;
        setMessage('Rascunho salvo neste dispositivo.');
        return;
      }
      await persistAll();
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
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
        file.size > 4 * 1024 * 1024
      )
        throw new Error('Use PNG, JPEG ou WebP de até 4 MB.');
      if (isGitHubPages) {
        const url = await storeImage(file);
        update(target, target === 'images' ? [...config.images, url].slice(0, 12) : url);
        setMessage('Imagem salva somente neste navegador. Exporte o projeto para transportá-la.');
        return;
      }
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
      if (!ordersEnabled)
        throw new Error('Envio indisponível: o Supabase ainda não foi configurado.');
      const id = await persistAll();
      for (const file of files) await upload(id, file, 'attachment');
      const result = await command({
        action: 'submit',
        payload: { id, brief: briefSchema.parse(brief) },
      });
      if (!result?.id || typeof result.number !== 'string')
        throw new Error(
          'O servidor não confirmou o pedido. Consulte sua conta antes de tentar novamente.',
        );
      setConfirmation(result);
      dirty.current = false;
      localStorage.removeItem(key);
      refreshData(router);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function collectAssets() {
    const ids = [config.logo, config.heroImage, ...config.images].filter((v) =>
      v.startsWith('local-image:'),
    );
    return Object.fromEntries(
      await Promise.all([...new Set(ids)].map(async (id) => [id, await imageData(id)])),
    );
  }
  async function exportProject() {
    try {
      (isGitHubPages ? localConfigSchema : configSchema).parse(config);
      downloadJSON(
        { version: 2, template, config, assets: await collectAssets() },
        'meu-projeto-nexo.json',
      );
      setMessage('Projeto exportado com as imagens locais.');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function importProject(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 90 * 1024 * 1024) throw new Error('Arquivo muito grande. Limite de 90 MB.');
      const bundle = JSON.parse(await file.text());
      if (bundle.template?.slug !== template.slug)
        throw new Error(
          'Abra o estúdio do modelo ' +
            (bundle.template?.name || 'original') +
            ' para importar este projeto.',
        );
      const parsed = (isGitHubPages ? localConfigSchema : configSchema).parse(bundle.config);
      const ids = [
        ...new Set(
          [parsed.logo, parsed.heroImage, ...parsed.images].filter((v) =>
            v.startsWith('local-image:'),
          ),
        ),
      ];
      for (const id of ids) {
        const data = bundle.assets?.[id];
        if (
          typeof data !== 'string' ||
          data.length > 6 * 1024 * 1024 ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(data)
        )
          throw new Error('Imagem local ausente ou inválida no arquivo.');
        const encoded = data.slice(data.indexOf(',') + 1),
          decoded = atob(encoded);
        const blob = new Blob([Uint8Array.from(decoded, (c) => c.charCodeAt(0))], {
          type: data.slice(5, data.indexOf(';')),
        });
        if (blob.size > 4 * 1024 * 1024) throw new Error('Imagem acima de 4 MB.');
        await storeImage(blob, id);
      }
      setConfig(parsed);
      setLocalSaved(false);
      setCloudSaved(false);
      dirty.current = true;
      setMessage('Projeto importado. O rascunho será salvo neste navegador.');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function chooseImage(file: File | undefined, target: 'logo' | 'heroImage' | 'images') {
    if (!file) return;
    if (target === 'images' && config.images.length >= 12) {
      setError('A galeria aceita até 12 imagens. Remova uma antes de adicionar outra.');
      return;
    }
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError('Use PNG, JPEG ou WebP de até 4 MB.');
      return;
    }
    setImageCandidate({ file, target, url: URL.createObjectURL(file) });
  }
  function openReview() {
    setError('');
    form.setValue('company', config.company);
    form.setValue('email', config.email);
    form.setValue('phone', config.phone);
    setReviewing(true);
    setModal(true);
  }
  function undoRedo(type: 'undo' | 'redo') {
    dispatch({ type });
    setLocalSaved(false);
    setCloudSaved(false);
    setCloudSaved(false);
    dirty.current = true;
  }
  function editPreview(field: keyof SiteConfig) {
    const next = field === 'company' || field === 'slogan' ? 'identidade' : 'conteudo';
    setTab(next);
    setToolsOpen(true);
    setMobileToolsOpen(true);
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>('[data-config-field="' + field + '"]')?.focus(),
    );
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
        data-config-field={key}
        value={config[key]}
        maxLength={key === 'address' ? 500 : 200}
        onChange={(e) => update(key, e.target.value)}
      />
    </Field>
  );
  const progress = [
    config.company !== defaultConfig(template).company,
    config.primary !== defaultConfig(template).primary ||
      config.background !== defaultConfig(template).background,
    config.font !== defaultConfig(template).font,
    config.title !== defaultConfig(template).title,
    config.description !== defaultConfig(template).description,
    config.notes.length > 0 ||
      JSON.stringify(config.features) !== JSON.stringify(defaultConfig(template).features),
  ].filter(Boolean).length;
  return (
    <main
      id="conteudo"
      className={`studio-workspace ${fullScreen ? 'studio-fullscreen' : ''} ${!toolsOpen ? 'tools-collapsed' : ''} ${mobileToolsOpen ? 'mobile-tools-open' : ''}`}
    >
      <div className="studio-top">
        <div>
          <h1>
            {config.company} <span className="muted">/ {template.name}</span>
          </h1>
          <p>
            ESTÚDIO NEXO · {isPremium(template) ? 'COLEÇÃO PREMIUM' : styleLabels[template.style]} ·
            Prévia ao vivo
          </p>
        </div>
        <div className="inline-actions">
          <button
            className="icon-button"
            aria-label="Desfazer"
            title="Desfazer"
            disabled={!history.past.length || pending}
            onClick={() => undoRedo('undo')}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Refazer"
            title="Refazer"
            disabled={!history.future.length || pending}
            onClick={() => undoRedo('redo')}
          >
            <Redo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={fullScreen ? 'Sair da tela cheia' : 'Visualizar em tela cheia'}
            title="Tela cheia"
            onClick={() => setFullScreen(!fullScreen)}
          >
            {fullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
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
            onClick={exportProject}
          >
            <Download size={16} />
          </button>
          <button className="button button-outline button-small" onClick={save} disabled={pending}>
            Salvar rascunho
          </button>
          <button className="button button-small" disabled={pending} onClick={openReview}>
            Enviar o pedido
          </button>
        </div>
      </div>
      <nav className="studio-journey" aria-label="Etapas do projeto">
        <Link href="/modelos">Escolher modelo</Link>
        {[
          ['identidade', 'Definir identidade'],
          ['conteudo', 'Personalizar conteúdo'],
          ['funcionalidades', 'Selecionar funcionalidades'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id);
              setToolsOpen(true);
            }}
          >
            {label}
          </button>
        ))}
        <button onClick={openReview}>Revisar projeto</button>
        <span>Enviar solicitação</span>
      </nav>
      <button
        className="studio-panel-toggle"
        aria-expanded={toolsOpen}
        onClick={() => setToolsOpen(!toolsOpen)}
      >
        <PanelLeftClose size={16} />
        {toolsOpen ? 'Recolher ferramentas' : 'Abrir ferramentas'}
      </button>
      <div className="studio-shell">
        <aside className="studio-sidebar">
          <div
            className="progress-track"
            aria-label={`${Math.round((progress / 6) * 100)}% dos grupos principais personalizados`}
          >
            <span style={{ width: `${Math.max(8, (progress / 6) * 100)}%` }} />
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
              {!userId && ordersEnabled && error && (
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
                  Escolha a essência da sua marca. Clique em um texto da prévia para editá-lo aqui.
                </p>
              </>
            )}
            {tab === 'cores' && (
              <>
                <h2 className="tool-heading">Uma paleta, sua identidade.</h2>
                <p className="studio-help">Escolha uma combinação ou ajuste cada cor.</p>
                <div className="palette-presets">
                  {[
                    ['Botânico', '#638377', '#e5eee7', '#f5f4ec', '#25382e'],
                    ['Noturno', '#8da7ff', '#b5bbd0', '#131b22', '#f4f6fb'],
                    ['Terracota', '#b47650', '#a69483', '#f4ede4', '#35291f'],
                    ['Elétrico', '#a4ff9b', '#92b7fa', '#101811', '#edf8ec'],
                  ].map(([name, primary, secondary, background, text]) => (
                    <button
                      key={name}
                      title={name}
                      aria-label={`Aplicar paleta ${name}`}
                      onClick={() => {
                        setConfig((c) => ({
                          ...c,
                          primary,
                          secondary,
                          background,
                          textColor: text,
                          highlight: primary,
                          buttonColor: primary,
                        }));
                        setLocalSaved(false);
                        dirty.current = true;
                      }}
                    >
                      <span>
                        {[primary, secondary, background, text].map((v, i) => (
                          <i key={i} style={{ background: v }} />
                        ))}
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
                <div className="color-grid">
                  {[
                    ['Cor principal', 'primary'],
                    ['Cor secundária', 'secondary'],
                    ['Fundo', 'background'],
                    ['Textos', 'textColor'],
                    ['Botões', 'buttonColor'],
                    ['Destaque', 'highlight'],
                  ].map(([label, key]) => (
                    <Field key={key} label={label}>
                      <input
                        type="color"
                        value={config[key as 'primary'] || '#f4f6fb'}
                        onChange={(e) => update(key as 'primary', e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </>
            )}
            {tab === 'tipografia' && (
              <>
                <h2 className="tool-heading">Dê voz à sua marca.</h2>
                <div className="font-options">
                  {[
                    ['sans', 'Contemporânea', 'Segoe UI + Arial', 'Clara. Direta. Versátil.'],
                    ['serif', 'Editorial', 'Georgia + Segoe UI', 'Elegância em cada palavra.'],
                    ['mono', 'Digital', 'Consolas + Arial', 'Precisão com personalidade.'],
                  ].map(([id, name, pair, line]) => (
                    <button
                      key={id}
                      aria-pressed={config.font === id}
                      className={config.font === id ? 'active' : ''}
                      onClick={() => update('font', id as SiteConfig['font'])}
                    >
                      <small>{pair}</small>
                      <strong
                        style={{
                          fontFamily:
                            id === 'serif' ? 'Georgia' : id === 'mono' ? 'Consolas' : 'Segoe UI',
                        }}
                      >
                        {name}
                      </strong>
                      <span>{line}</span>
                    </button>
                  ))}
                </div>
                <p className="studio-help">
                  Fontes de sistema: carregamento imediato, sem serviços externos.
                </p>
              </>
            )}
            {tab === 'conteudo' && (
              <>
                {input('Título principal', 'title')}
                {input('Subtítulo', 'subtitle')}
                <Field label="Sobre o negócio">
                  <textarea
                    data-config-field="description"
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
              </>
            )}
            {tab === 'comercial' && (
              <>
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
                    ? 'Imagens ficam somente neste navegador. PNG, JPEG ou WebP, até 4 MB. A exportação inclui suas imagens para levar o projeto a outro dispositivo.'
                    : 'Pré-visualize suas imagens antes de enviar. Uploads privados exigem conta e rascunho salvo. PNG, JPEG ou WebP, até 4 MB.'}
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
                      disabled={pending}
                      onChange={(e) => {
                        chooseImage(e.target.files?.[0], target as 'logo');
                        e.target.value = '';
                      }}
                    />
                  </label>
                ))}
                {imageCandidate && (
                  <div className="image-confirm">
                    <img src={imageCandidate.url} alt="Prévia da imagem selecionada" />
                    <p>
                      {imageCandidate.file.name} · {(imageCandidate.file.size / 1024).toFixed(0)} KB
                    </p>
                    <div className="inline-actions">
                      <button
                        className="button button-small"
                        onClick={async () => {
                          await imageUpload(imageCandidate.file, imageCandidate.target);
                          setImageCandidate(null);
                        }}
                      >
                        Usar esta imagem
                      </button>
                      <button className="text-button" onClick={() => setImageCandidate(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {config.logo && (
                  <Field label="Logotipo selecionado">
                    <PreviewImage src={config.logo} alt="Logotipo selecionado" />
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
                      <PreviewImage src={src} alt={`Galeria ${i + 1} — clique para remover`} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'secoes' && (
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
              </>
            )}
            {tab === 'funcionalidades' && (
              <>
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
          <div className="studio-import">
            <button className="text-button" onClick={() => importInput.current?.click()}>
              <Upload size={15} />
              Importar projeto JSON
            </button>
            <input
              ref={importInput}
              type="file"
              hidden
              accept="application/json,.json"
              onChange={(e) => {
                importProject(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <p>
              Trocar de tela preserva a edição. Para outro dispositivo, exporte e importe o JSON.
            </p>
            <details className="paste-project">
              <summary>Ou colar projeto JSON</summary>
              <Field label="Conteúdo do projeto JSON">
                <textarea
                  value={pastedProject}
                  onChange={(e) => setPastedProject(e.target.value)}
                  maxLength={90 * 1024 * 1024}
                  placeholder="Cole aqui o conteúdo do arquivo exportado"
                />
              </Field>
              <button
                className="text-button"
                disabled={!pastedProject.trim()}
                onClick={async () => {
                  await importProject(
                    new File([pastedProject], 'projeto.json', { type: 'application/json' }),
                  );
                  setPastedProject('');
                }}
              >
                Aplicar projeto JSON
              </button>
            </details>
          </div>
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
              <SitePreview config={config} template={template} onEdit={editPreview} />
            </div>
          </div>
          <p className="preview-note">
            Navegue pelas seções da prévia. Todas as alterações são preservadas ao trocar de
            dispositivo.
          </p>
        </section>
      </div>
      <div className="mobile-studio-bar">
        <button
          aria-expanded={mobileToolsOpen}
          onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
        >
          <Palette size={18} />
          Ferramentas
        </button>
        <button onClick={save} disabled={pending}>
          <Save size={18} />
          Salvar
        </button>
        <button className="mobile-order" onClick={openReview} disabled={pending}>
          Enviar o pedido
        </button>
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
                  : reviewing
                    ? 'Seu projeto, em perspectiva.'
                    : isGitHubPages
                      ? 'Conte um pouco mais.'
                      : 'Conte um pouco mais.'}
              </h2>
              <p>
                {confirmation
                  ? 'Vamos analisar cada detalhe da sua ideia.'
                  : 'Sua personalização será incluída no pedido armazenado em sua conta.'}
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
              <Link className="button" href={projectHref(confirmation.id)}>
                Acompanhar meu projeto
              </Link>
            </div>
          ) : reviewing ? (
            <div className="review-panel">
              <p>Confira suas escolhas antes de preparar a solicitação.</p>
              <dl>
                {[
                  ['Modelo', template.name],
                  ['Coleção', isPremium(template) ? 'Premium' : 'Convencional'],
                  ['Projeto', config.company],
                  ['Título', config.title],
                  ['Slogan', config.slogan || 'Não informado'],
                  ['Subtítulo', config.subtitle || 'Não informado'],
                  ['Sobre o negócio', config.description],
                  ['Serviços', config.services.join(', ')],
                  ['Botão principal', config.cta],
                  [
                    'Contato',
                    [config.email, config.phone, config.address, config.instagram]
                      .filter(Boolean)
                      .join(' · ') || 'Não informado',
                  ],
                  ['Arredondamento', `${config.radius}px`],
                  [
                    'Imagens',
                    `${config.logo ? 'Logotipo · ' : ''}Imagem principal · ${config.images.length} na galeria`,
                  ],
                  [
                    'Tipografia',
                    config.font === 'serif'
                      ? 'Editorial'
                      : config.font === 'mono'
                        ? 'Digital'
                        : 'Contemporânea',
                  ],
                  [
                    'Seções',
                    config.sections
                      .map((s) => sections.find((v) => v[0] === s)?.[1] || s)
                      .join(', '),
                  ],
                  [
                    'Funcionalidades',
                    config.features
                      .map((s) => features.find((v) => v[0] === s)?.[1] || s)
                      .join(', ') || 'Nenhuma adicional',
                  ],
                  ['Páginas solicitadas', String(config.pages)],
                  ['Observações', config.notes || 'Nenhuma'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <PreviewImage
                className="review-image"
                src={config.heroImage}
                alt="Imagem principal escolhida"
              />
              <div className="review-swatches">
                {[
                  config.primary,
                  config.secondary,
                  config.background,
                  config.textColor,
                  config.buttonColor,
                  config.highlight,
                ].map((v, i) => (
                  <span key={i} style={{ background: v }} title={v} />
                ))}
              </div>
              <p className="notice">
                {ordersEnabled
                  ? 'A proposta final será preparada após análise. Nenhum valor é cobrado nesta etapa.'
                  : 'Envio indisponível: o Supabase ainda não foi configurado. Sua personalização permanece salva neste dispositivo.'}
              </p>
              <div className="inline-actions">
                <button className="button" onClick={() => setReviewing(false)}>
                  Continuar para os detalhes
                </button>
                <button className="text-button" onClick={() => setModal(false)}>
                  Voltar à edição
                </button>
              </div>
            </div>
          ) : !userId && ordersEnabled ? (
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
                    disabled={pending || !ordersEnabled}
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
                  />
                  <small>
                    PNG, JPEG, WebP ou PDF, até 4 MB. Arquivos privados, visíveis somente por você e
                    pelo administrador.
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
                  e autorizo o tratamento dos meus dados para analisar este pedido e entrar em
                  contato.
                </span>
              </label>
              {form.formState.errors.consent && (
                <span className="error-text full-width">
                  {form.formState.errors.consent.message}
                </span>
              )}
              {!ordersEnabled && (
                <p className="notice full-width" role="status">
                  Envio indisponível: o Supabase ainda não foi configurado. Nenhum pedido foi
                  recebido. Seu rascunho continua neste dispositivo.
                </p>
              )}
              <button className="button full-width" disabled={pending || !ordersEnabled}>
                {pending ? 'Enviando...' : 'Enviar o pedido'}
              </button>
            </form>
          )}
        </dialog>
      )}
    </main>
  );
}
