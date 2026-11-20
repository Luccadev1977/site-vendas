import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { categories, defaultConfig, templates } from '../src/lib/catalog';
import { randomUUID } from 'node:crypto';

let db: PGlite;
const owner = '20000000-0000-4000-8000-000000000001',
  other = '20000000-0000-4000-8000-000000000002',
  admin = '20000000-0000-4000-8000-000000000003',
  unverified = '20000000-0000-4000-8000-000000000004';
const cfg = defaultConfig(templates[0]);
const brief = {
  name: 'Cliente de Teste',
  company: 'Empresa Teste',
  email: 'cliente@example.test',
  phone: '+55 11 99999-1234',
  purpose: 'Apresentar os serviços da minha empresa.',
  deadline: '30 dias',
  budget: '',
  domain: '',
  hosting: 'Preciso de orientação',
  additional: '',
  consent: true,
};
async function as(uid: string | null, role = 'authenticated') {
  await db.exec(`reset role; set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid || '']);
}
async function cmd(action: string, payload: unknown) {
  const r = await db.query<{ result: Record<string, unknown> }>(
    'select public.command($1,$2::jsonb) as result',
    [action, JSON.stringify(payload)],
  );
  return r.rows[0].result;
}
async function draft(uid = owner) {
  await as(uid);
  const id = randomUUID();
  await cmd('save_draft', { id, template_id: templates[0].id, config: cfg });
  return id;
}
async function submitted() {
  const id = await draft();
  await cmd('submit', { id, brief });
  return id;
}
async function proposed() {
  const id = await submitted();
  await as(admin);
  await cmd('send_quote', {
    id,
    amount: 350000,
    deadline: '20 dias úteis',
    scope: 'Site completo com as seções aprovadas.',
    terms: 'Pagamento integral via Pix.',
    notes: '',
  });
  return id;
}
async function approved() {
  const id = await proposed();
  await as(owner);
  await cmd('approve_quote', { id });
  return id;
}
async function rows(table: string) {
  return (await db.query<Record<string, unknown>>(`select * from public.${table}`)).rows;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
    grant usage on schema auth,storage to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;`);
  await db.exec(await readFile('supabase/migrations/20261119172527_core_platform.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261119172528_initial_catalog.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261119175055_managed_content.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261120145745_showroom_catalog.sql', 'utf8'));
  for (const [id, email, verified] of [
    [owner, 'owner@example.test', true],
    [other, 'other@example.test', true],
    [admin, 'admin@example.test', true],
    [unverified, 'unverified@example.test', false],
  ] as const) {
    await db.query(
      'insert into auth.users(id,email,email_confirmed_at) values($1,$2,case when $3 then now() else null end)',
      [id, email, verified],
    );
  }
  await db.query('insert into private.administrator(user_id) values($1)', [admin]);
}, 30000);
beforeEach(async () => {
  await db.exec(
    'reset role; truncate public.projects cascade; truncate private.settings,private.rate_limits; truncate storage.objects;',
  );
  await as(owner);
});
afterAll(async () => {
  await db?.close();
});

describe('Transactional project workflow — real PostgreSQL SQL', () => {
  it('enforces configurable Premium pricing through authenticated RPC and blocks non-admin changes', async () => {
    const standard = templates.find((t) => t.content.tier === 'conventional')!,
      premium = templates.find((t) => t.content.tier === 'premium')!;
    await db.exec('begin');
    try {
      await as(admin);
      await cmd('template', {
        ...standard,
        content: { ...standard.content, basePriceCents: '200000' },
      });
      await expect(
        cmd('template', { ...premium, content: { ...premium.content, basePriceCents: '100000' } }),
      ).rejects.toThrow('Premium');
    } finally {
      await db.exec('rollback');
    }
    await db.exec('begin');
    try {
      await as(admin);
      await cmd('template', {
        ...standard,
        content: { ...standard.content, basePriceCents: '200000' },
      });
      await cmd('template', {
        ...premium,
        content: { ...premium.content, basePriceCents: '300000' },
      });
      const saved = (await rows('templates')).find((t) => t.id === premium.id)!;
      expect((saved.content as Record<string, string>).basePriceCents).toBe('300000');
      await expect(
        cmd('template', {
          ...standard,
          content: { ...standard.content, basePriceCents: '400000' },
        }),
      ).rejects.toThrow('convencional');
    } finally {
      await db.exec('rollback');
    }
    await as(owner);
    await expect(cmd('template', premium)).rejects.toThrow('administrador');
  });
  it('retains all 42 original template IDs for historical project snapshots', async () => {
    await as(admin);
    const all = await rows('templates');
    expect(all.filter((t) => String(t.id).startsWith('10000000-'))).toHaveLength(42);
    expect(all.filter((t) => t.active)).toHaveLength(42);
  });
  it('publishes 13 categories and 42 active models while retaining archived sources', async () => {
    await as(null, 'anon');
    expect((await rows('categories')).length).toBe(13);
    expect((await rows('templates')).length).toBe(42);
    expect(categories).toHaveLength(13);
  });
  it('saves a complete draft and submits exactly once with a unique request number', async () => {
    const id = await draft();
    const a = await cmd('submit', { id, brief }),
      b = await cmd('submit', { id, brief });
    expect(a.number).toMatch(/^NX-/);
    expect(a).toEqual(b);
    expect(await rows('projects')).toHaveLength(1);
    expect(await rows('status_history')).toHaveLength(1);
    const p = (await rows('projects'))[0];
    expect(p.config).toEqual(cfg);
    expect(p.brief).toEqual(brief);
  });
  it('makes the full request and customization visible to admin', async () => {
    await submitted();
    await as(admin);
    expect(await rows('projects')).toHaveLength(1);
    expect((await rows('customizations'))[0].config).toEqual(cfg);
    expect(await rows('notifications')).toHaveLength(1);
  });
  it('sends a proposal, approves it and releases Pix only after approval', async () => {
    const id = await proposed();
    await cmd('settings', {
      key: 'pix@example.test',
      beneficiary: 'Nexo Teste',
      bank: 'Banco Teste',
      instructions: 'Confira os dados.',
    });
    await as(owner);
    await expect(db.query('select public.get_pix($1)', [id])).rejects.toThrow(/aprovação/);
    await cmd('approve_quote', { id });
    const result = await db.query<{ pix: { key: string } }>('select public.get_pix($1) as pix', [
      id,
    ]);
    expect(result.rows[0].pix.key).toBe('pix@example.test');
    expect((await rows('payments'))[0].status).toBe('pending');
  });
  it('never confirms payment from a receipt and only admin can confirm the real payment', async () => {
    const id = await approved(),
      path = `${id}/${owner}/${randomUUID()}.pdf`;
    await db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('project-files',$1,$2)",
      [path, JSON.stringify({ size: 100, mimetype: 'application/pdf' })],
    );
    await cmd('register_file', {
      id,
      path,
      name: 'comprovante.pdf',
      size: 100,
      mime: 'application/pdf',
      purpose: 'receipt',
    });
    expect((await rows('payments'))[0].status).toBe('review');
    expect((await rows('projects'))[0].status).toBe('payment_review');
    await expect(cmd('confirm_payment', { id })).rejects.toThrow(/administrador/);
    await as(admin);
    await cmd('confirm_payment', { id });
    expect((await rows('payments'))[0].status).toBe('confirmed');
    expect((await rows('payments'))[0].confirmed_at).toBeTruthy();
    expect((await rows('projects'))[0].status).toBe('development');
  });
  it('records development, review, completion and delivery in order', async () => {
    const id = await approved();
    await as(admin);
    await cmd('confirm_payment', { id });
    for (const status of ['revision', 'completed', 'delivered'])
      await cmd('set_status', { id, status, note: 'Atualização testada.' });
    await as(owner);
    expect((await rows('projects'))[0].status).toBe('delivered');
    expect((await rows('status_history')).length).toBe(7);
  });
  it('supports asking for information, private messages and read receipts', async () => {
    const id = await submitted();
    await as(admin);
    await cmd('set_status', { id, status: 'needs_information', note: 'Qual o seu domínio?' });
    await cmd('message', { id, body: 'Pode informar seu domínio?' });
    await as(owner);
    await cmd('message', { id, body: 'Ainda preciso registrar.' });
    await cmd('read_messages', { id });
    expect(await rows('messages')).toHaveLength(2);
    expect(await rows('project_reads')).toHaveLength(1);
  });
  it('declines a quote and lets the admin send a revised proposal', async () => {
    const id = await proposed();
    await as(owner);
    await cmd('decline_quote', { id });
    expect((await rows('projects'))[0].status).toBe('analysis');
    expect(await rows('payments')).toHaveLength(0);
    await as(admin);
    await cmd('send_quote', {
      id,
      amount: 250000,
      deadline: '25 dias',
      scope: 'Proposta ajustada conforme a conversa.',
      terms: 'Pix integral',
      notes: '',
    });
    expect(await rows('quotes')).toHaveLength(2);
  });
  it('allows manual rejection and records the reason', async () => {
    const id = await submitted();
    await as(admin);
    await cmd('set_status', { id, status: 'rejected', note: 'Escopo fora da especialidade.' });
    await as(owner);
    expect((await rows('projects'))[0].status).toBe('rejected');
    expect(
      (await rows('status_history')).some((h) => h.note === 'Escopo fora da especialidade.'),
    ).toBe(true);
  });
  it('cancels before approval and closes an outstanding proposal', async () => {
    const id = await proposed();
    await as(owner);
    await cmd('cancel', { id });
    expect((await rows('quotes'))[0].status).toBe('declined');
    await expect(cmd('approve_quote', { id })).rejects.toThrow();
  });
});
describe('Isolation and hostile direct API use', () => {
  it('keeps the selected model snapshot and existing draft after the catalog changes', async () => {
    const custom = {
      ...templates[0],
      id: randomUUID(),
      slug: `qa-${randomUUID()}`,
      name: 'Modelo histórico QA',
    };
    await as(admin);
    await cmd('template', custom);
    await as(owner);
    const id = randomUUID();
    await cmd('save_draft', { id, template_id: custom.id, config: cfg });
    await as(admin);
    await cmd('template', { ...custom, active: false, style: 'premium', name: 'Modelo alterado' });
    await as(owner);
    await cmd('save_draft', {
      id,
      template_id: custom.id,
      config: { ...cfg, company: 'Rascunho preservado' },
    });
    const p = (await rows('projects'))[0];
    expect((p.template_snapshot as { name: string; style: string }).name).toBe(
      'Modelo histórico QA',
    );
    expect((p.template_snapshot as { style: string }).style).toBe('minimalista');
    expect((p.template_snapshot as { category_name: string }).category_name).toBe('Advocacia');
    await expect(
      cmd('save_draft', { id: randomUUID(), template_id: custom.id, config: cfg }),
    ).rejects.toThrow(/Modelo indisponível/);
  });
  it('hides all project data from a second client', async () => {
    const id = await proposed();
    await as(owner);
    await cmd('message', { id, body: 'Uma mensagem privada.' });
    await as(other);
    for (const table of [
      'projects',
      'quotes',
      'payments',
      'messages',
      'files',
      'status_history',
      'customizations',
    ])
      expect(await rows(table)).toHaveLength(0);
    await expect(cmd('message', { id, body: 'Tentativa de acesso' })).rejects.toThrow(/Acesso/);
    await expect(db.query('select public.get_pix($1)', [id])).rejects.toThrow(/Acesso/);
  });
  it('blocks direct table updates and financial inserts, including for admin', async () => {
    const id = await submitted();
    await expect(
      db.query("update public.projects set status='delivered' where id=$1", [id]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.exec(
        "insert into public.payments(project_id,quote_id,amount,status) values(gen_random_uuid(),gen_random_uuid(),1,'confirmed')",
      ),
    ).rejects.toThrow(/permission denied/);
    await as(admin);
    await expect(
      db.query('update public.projects set client_id=$1 where id=$2', [other, id]),
    ).rejects.toThrow(/permission denied/);
  });
  it('does not allow a client to change Pix or issue proposals or admin status', async () => {
    const id = await submitted();
    await expect(
      cmd('settings', { key: 'attacker', beneficiary: 'x', bank: 'x', instructions: '' }),
    ).rejects.toThrow(/administrador/);
    await expect(cmd('send_quote', { id, amount: 100 })).rejects.toThrow(/administrador/);
    await expect(cmd('set_status', { id, status: 'delivered' })).rejects.toThrow(/administrador/);
  });
  it('never grants admin privileges from user-editable metadata', async () => {
    await db.exec('reset role');
    await db.query(
      'update auth.users set raw_user_meta_data=\'{"role":"admin","is_admin":true}\' where id=$1',
      [owner],
    );
    await as(owner);
    const r = await db.query<{ admin: boolean }>('select public.is_admin() as admin');
    expect(r.rows[0].admin).toBe(false);
    await expect(
      db.query('insert into private.administrator(user_id) values($1)', [owner]),
    ).rejects.toThrow(/permission denied/);
  });
  it('rejects access without auth and unconfirmed emails', async () => {
    await as(null, 'anon');
    expect(await rows('templates')).toHaveLength(42);
    await expect(cmd('save_draft', {})).rejects.toThrow(/permission denied/);
    await as(unverified);
    await expect(
      cmd('save_draft', { id: randomUUID(), template_id: templates[0].id, config: cfg }),
    ).rejects.toThrow(/Confirme/);
  });
  it('prevents ownership takeover by guessing a draft UUID', async () => {
    const id = await draft();
    await as(other);
    await expect(
      cmd('save_draft', {
        id,
        template_id: templates[0].id,
        config: { ...cfg, company: 'Invasor' },
      }),
    ).rejects.toThrow(/Projeto/);
    await as(owner);
    expect((await rows('projects'))[0].name).toBe(cfg.company);
  });
  it('locks submitted customizations and prevents a client from editing the brief', async () => {
    const id = await submitted();
    await expect(
      cmd('save_draft', { id, template_id: templates[0].id, config: cfg }),
    ).rejects.toThrow(/Projeto/);
    const result = await cmd('submit', { id, brief: { ...brief, name: 'Alterado' } });
    expect(result.number).toBeTruthy();
    expect((await rows('projects'))[0].brief).toEqual(brief);
  });
  it('blocks malicious preview URLs and malformed configuration even through RPC', async () => {
    const id = randomUUID();
    for (const config of [
      { ...cfg, heroImage: 'javascript:alert(1)' },
      { ...cfg, sections: null },
      { ...cfg, features: {} },
      { ...cfg, primary: null },
      { ...cfg, radius: -1 },
    ])
      await expect(cmd('save_draft', { id, template_id: templates[0].id, config })).rejects.toThrow(
        /Dados/,
      );
  });
  it('blocks state skipping and duplicate quote approvals', async () => {
    const id = await submitted();
    await as(admin);
    await expect(cmd('set_status', { id, status: 'delivered' })).rejects.toThrow(/Transição/);
    await expect(cmd('confirm_payment', { id })).rejects.toThrow(/Pagamento/);
    const another = await proposed();
    await as(owner);
    await cmd('approve_quote', { id: another });
    await expect(cmd('approve_quote', { id: another })).rejects.toThrow(/Proposta/);
    expect(await rows('payments')).toHaveLength(1);
  });
  it('rejects forged receipts that do not exist in private Storage', async () => {
    const id = await approved();
    await expect(
      cmd('register_file', {
        id,
        path: `${id}/${owner}/missing.pdf`,
        name: 'fake.pdf',
        mime: 'application/pdf',
        size: 100,
        purpose: 'receipt',
      }),
    ).rejects.toThrow(/Arquivo/);
    expect((await rows('payments'))[0].status).toBe('pending');
  });
  it('enforces Storage ownership and project membership', async () => {
    const id = await draft();
    await as(other);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name,metadata) values('project-files',$1,'{}')",
        [`${id}/${other}/x.pdf`],
      ),
    ).rejects.toThrow(/row-level security/);
    await as(owner);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name,metadata) values('project-files',$1,'{}')",
        [`${id}/${other}/x.pdf`],
      ),
    ).rejects.toThrow(/row-level security/);
  });
  it('validates privacy consent and keeps no request after a failed submission', async () => {
    const id = await draft();
    await expect(cmd('submit', { id, brief: { ...brief, consent: false } })).rejects.toThrow(
      /Dados/,
    );
    expect((await rows('projects'))[0].status).toBe('draft');
    expect(await rows('notifications')).toHaveLength(0);
  });
  it('keeps unpaid proposals out of confirmed revenue', async () => {
    await approved();
    const result = await db.query<{ total: number }>(
      "select coalesce(sum(amount),0)::int as total from public.payments where status='confirmed'",
    );
    expect(result.rows[0].total).toBe(0);
  });
  it('limits accepted commands persistently, not in server memory', async () => {
    await db.exec('reset role');
    await db.query(
      "insert into private.rate_limits(user_id,bucket,count) values($1,date_trunc('minute',now()),60)",
      [owner],
    );
    await as(owner);
    await expect(cmd('read_notifications', {})).rejects.toThrow(/Limite/);
  });
  it('restricts email worker RPCs to the service role', async () => {
    await expect(db.query('select public.claim_emails()')).rejects.toThrow(/permission denied/);
    await submitted();
    await as(null, 'service_role');
    const result = await db.query<{ items: unknown[] }>('select public.claim_emails() as items');
    expect(result.rows[0].items).toHaveLength(2);
  });
  it('protects public portfolio management and requires publication authorization', async () => {
    const payload = {
      id: randomUUID(),
      title: 'Projeto entregue',
      description: 'Um projeto real autorizado pelo cliente.',
      image: '/images/architecture.svg',
      url: 'https://example.test',
      active: true,
      authorized: true,
    };
    await expect(
      db.query('select public.save_portfolio($1)', [JSON.stringify(payload)]),
    ).rejects.toThrow(/administrador/);
    await as(admin);
    await expect(
      db.query('select public.save_portfolio($1)', [
        JSON.stringify({ ...payload, authorized: false }),
      ]),
    ).rejects.toThrow(/autorização/);
    await db.query('select public.save_portfolio($1)', [JSON.stringify(payload)]);
    await as(null, 'anon');
    expect(await rows('portfolio')).toHaveLength(1);
  });
  it('lets only the project participants download private storage and protects registered files from deletion', async () => {
    const id = await draft(),
      path = `${id}/${owner}/${randomUUID()}.png`;
    await db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('project-files',$1,$2)",
      [path, JSON.stringify({ size: 20, mimetype: 'image/png' })],
    );
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(1);
    await cmd('register_file', {
      id,
      path,
      name: 'logo.png',
      size: 20,
      mime: 'image/png',
      purpose: 'asset',
    });
    await db.query('delete from storage.objects where name=$1', [path]);
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(1);
    await as(other);
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
    await as(admin);
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(1);
  });
});
