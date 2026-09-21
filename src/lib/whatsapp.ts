// Botón "Compartir por WhatsApp" (skill, sección 43): solo un link wa.me con
// mensaje prellenado. Nada de WhatsApp Business API, sin credenciales, y el
// PDF NUNCA se adjunta automáticamente — el usuario lo adjunta a mano desde
// su dispositivo.

// Los clientes guardan el teléfono en formato local guatemalteco (8 dígitos,
// con o sin guion — sección "Teléfonos"), pero wa.me necesita el número
// completo con código de país, solo dígitos, sin "+" ni separadores. Un
// número de exactamente 8 dígitos se asume local y se le antepone 502;
// cualquier otra longitud se asume que ya trae código de país (el skill
// permite números internacionales) y se deja tal cual, solo limpiando
// separadores.
export function cleanPhoneForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    return `502${digitsOnly}`;
  }
  return digitsOnly;
}

export interface WhatsAppShareInput {
  clientName: string;
  clientPhone: string;
  quoteNumber: string;
  companyName: string;
}

// Formato sugerido por la sección 43: "Hola [nombre], te compartimos la
// cotización [COT-2026-000123] de [empresa]."
export function buildWhatsAppMessage(input: WhatsAppShareInput): string {
  return `Hola ${input.clientName}, te compartimos la cotización ${input.quoteNumber} de ${input.companyName}.`;
}

export function buildWhatsAppShareUrl(input: WhatsAppShareInput): string {
  const phone = cleanPhoneForWhatsApp(input.clientPhone);
  const message = buildWhatsAppMessage(input);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
