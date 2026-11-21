export type WhatsAppSettings = { phone: string; message: string; enabled: boolean };
export const defaultWhatsApp: WhatsAppSettings = {
  phone: '',
  enabled: false,
  message: 'Olá! Encontrei o Nexo Studio e gostaria de conversar sobre a criação de um site.',
};
export function whatsappURL(settings: WhatsAppSettings, model?: string) {
  if (!settings.enabled || !/^55\d{10,11}$/.test(settings.phone)) return null;
  let text = settings.message.replaceAll('{modelo}', model || 'um site');
  if (model && !settings.message.includes('{modelo}'))
    text += `\nTenho interesse no modelo ${model} e gostaria de mais informações.`;
  return `https://wa.me/${settings.phone}?text=${encodeURIComponent(text)}`;
}
