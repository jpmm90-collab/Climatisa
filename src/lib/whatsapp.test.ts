import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppShareUrl, cleanPhoneForWhatsApp } from "@/lib/whatsapp";

describe("cleanPhoneForWhatsApp", () => {
  it("un número local guatemalteco con guion recibe el código de país 502", () => {
    expect(cleanPhoneForWhatsApp("5555-5555")).toBe("50255555555");
  });

  it("un número local guatemalteco sin guion (8 dígitos) también recibe 502", () => {
    expect(cleanPhoneForWhatsApp("55555555")).toBe("50255555555");
  });

  it("un número local con espacios se limpia igual", () => {
    expect(cleanPhoneForWhatsApp("5555 5555")).toBe("50255555555");
  });

  it("un número que YA trae código de país no se le antepone 502 de nuevo", () => {
    expect(cleanPhoneForWhatsApp("50255555555")).toBe("50255555555");
  });

  it("un número internacional (otro país) se limpia pero no se le antepone 502", () => {
    // +1 (305) 555-1234 -> 11 dígitos, no 8, se asume que ya trae código de país
    expect(cleanPhoneForWhatsApp("+1 305-555-1234")).toBe("13055551234");
  });

  it("quita el signo + y cualquier separador", () => {
    expect(cleanPhoneForWhatsApp("+502 5555-5555")).toBe("50255555555");
  });
});

describe("buildWhatsAppMessage", () => {
  it("sigue el formato sugerido de la sección 43", () => {
    const message = buildWhatsAppMessage({
      clientName: "Juan Pérez",
      clientPhone: "5555-5555",
      quoteNumber: "COT-2026-000123",
      companyName: "Climatisa",
    });
    expect(message).toBe("Hola Juan Pérez, te compartimos la cotización COT-2026-000123 de Climatisa.");
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("arma un link wa.me con el teléfono limpio y el mensaje codificado", () => {
    const url = buildWhatsAppShareUrl({
      clientName: "Juan Pérez",
      clientPhone: "5555-5555",
      quoteNumber: "COT-2026-000123",
      companyName: "Climatisa",
    });

    expect(url).toBe(
      "https://wa.me/50255555555?text=" +
        encodeURIComponent("Hola Juan Pérez, te compartimos la cotización COT-2026-000123 de Climatisa."),
    );
  });

  it("nunca genera una URL de la API de WhatsApp Business (solo wa.me)", () => {
    const url = buildWhatsAppShareUrl({
      clientName: "Ana",
      clientPhone: "12345678",
      quoteNumber: "COT-2026-000001",
      companyName: "Empresa Demo",
    });
    expect(url.startsWith("https://wa.me/")).toBe(true);
    expect(url).not.toContain("graph.facebook.com");
    expect(url).not.toContain("business");
  });

  it("el texto va URL-encoded (espacios, acentos, corchetes no aparecen literales)", () => {
    const url = buildWhatsAppShareUrl({
      clientName: "José Ñández",
      clientPhone: "55555555",
      quoteNumber: "COT-2026-000042",
      companyName: "Climatisa & Cía",
    });
    const queryText = url.split("?text=")[1];
    expect(queryText).not.toContain(" ");
    expect(decodeURIComponent(queryText)).toBe(
      "Hola José Ñández, te compartimos la cotización COT-2026-000042 de Climatisa & Cía.",
    );
  });

  it("respeta un teléfono con código de país ya incluido", () => {
    const url = buildWhatsAppShareUrl({
      clientName: "Cliente Internacional",
      clientPhone: "+1 305-555-1234",
      quoteNumber: "COT-2026-000099",
      companyName: "Climatisa",
    });
    expect(url.startsWith("https://wa.me/13055551234?text=")).toBe(true);
  });
});
