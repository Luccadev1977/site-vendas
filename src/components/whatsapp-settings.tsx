'use client';
import { useEffect, useState } from 'react';
import { command } from '@/lib/api-client';
import { browserSupabase } from '@/lib/supabase/browser';
import { defaultWhatsApp, type WhatsAppSettings, whatsappURL } from '@/lib/contact';
import { Field } from './form-ui';
import { WhatsAppIcon } from './whatsapp';
export function WhatsAppSettingsForm() {
  const [settings, setSettings] = useState<WhatsAppSettings>(defaultWhatsApp),
    [ready, setReady] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    browserSupabase()
      .from('site_settings')
      .select('phone,message,enabled')
      .eq('singleton', true)
      .single()
      .then(({ data, error }) => {
        if (active) {
          if (error)
            setError('Não foi possível carregar o WhatsApp. Verifique a migration static_orders.');
          else {
            setSettings(data);
            setReady(true);
          }
        }
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="panel settings-form" id="whatsapp-settings">
      <div className="panel-title">
        <div>
          <span className="eyebrow">CONFIGURAÇÕES · ATENDIMENTO</span>
          <h2>WhatsApp</h2>
          <p>Número comercial público. Não substitui o registro do pedido.</p>
        </div>
        <WhatsAppIcon />
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice success" role="status">
          {success}
        </p>
      )}
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError('');
          setSuccess('');
          try {
            await command({ action: 'whatsapp', payload: settings });
            setSuccess('Atendimento pelo WhatsApp atualizado.');
            window.dispatchEvent(new Event('nexo-refresh'));
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Número comercial com 55">
          <input
            value={settings.phone}
            inputMode="tel"
            autoComplete="tel"
            pattern="55[0-9]{10,11}"
            maxLength={13}
            placeholder="55 + DDD + número"
            required={settings.enabled}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value.replace(/\D/g, '') })}
          />
          <small>Sem espaços ou símbolos. Use apenas um número sob seu controle.</small>
        </Field>
        <Field label="Mensagem automática">
          <textarea
            value={settings.message}
            maxLength={1000}
            required
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
          />
          <small>Use {'{modelo}'} para incluir o modelo selecionado.</small>
        </Field>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          Ativar botão flutuante
        </label>
        <div className="inline-actions">
          <button className="button" disabled={pending || !ready}>
            {pending ? 'Salvando...' : 'Salvar WhatsApp'}
          </button>
          {whatsappURL(settings) && (
            <a
              className="button button-outline"
              href={whatsappURL(settings)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir conversa de teste
            </a>
          )}
        </div>
      </form>
    </section>
  );
}
