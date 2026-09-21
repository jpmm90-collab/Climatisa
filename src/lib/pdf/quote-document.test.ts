import { describe, expect, it } from "vitest";
import pdfParse from "pdf-parse";
import { renderQuotePdf } from "@/lib/pdf/render-quote-pdf";
import type { QuotePdfData } from "@/lib/pdf/types";
import { VENDEDOR_RESPONSABLE, INSTALLATION_BASE_TEXT } from "@/lib/constants";

function baseData(overrides: Partial<QuotePdfData> = {}): QuotePdfData {
  return {
    quoteNumber: "COT-2026-000123",
    date: new Date("2026-06-15T12:00:00.000Z"),
    client: {
      name: "Juan Pérez",
      phone: "5555-5555",
      address: "3a calle 4-56 zona 1",
      company: "Empresa Cliente",
      nit: "CF",
    },
    areas: [
      {
        name: "Habitación principal",
        areaTotal: 8500,
        equipment: [
          {
            equipmentNameSnapshot: "Cassette Multi Split LG 12,000 BTU",
            quantity: 1,
            meters: 8,
            equipmentPriceSnapshot: 8000,
            installationPriceSnapshot: 500,
            lineTotal: 8500,
          },
        ],
      },
    ],
    extras: [{ description: "Canaleta especial", price: 500 }],
    subtotal: 9000,
    discountAmount: 0,
    total: 9000,
    depositPercentage: 50,
    depositAmount: 4500,
    balance: 4500,
    additionalDescription: null,
    installationNotesExtra: null,
    companySettings: {
      companyName: "Empresa Demo",
      logoUrl: null,
      phone: "0000-0000",
      email: "demo@empresa.test",
      address: "Dirección demo, Guatemala",
      commercialTerms: null,
    },
    ...overrides,
  };
}

async function textOf(data: QuotePdfData): Promise<string> {
  const buffer = await renderQuotePdf(data);
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

describe("renderQuotePdf — contenido real del PDF (skill, sección 38.12)", () => {
  it("incluye el número de cotización", async () => {
    const text = await textOf(baseData());
    expect(text).toContain("COT-2026-000123");
  });

  it("incluye 'Romeo Morales' como vendedor, siempre", async () => {
    const text = await textOf(baseData());
    expect(text).toContain(VENDEDOR_RESPONSABLE);
  });

  it("incluye el texto base obligatorio de instalación", async () => {
    const text = await textOf(baseData());
    expect(text).toContain(INSTALLATION_BASE_TEXT);
  });

  it("muestra el NIT en su forma correcta (CF en mayúsculas)", async () => {
    const text = await textOf(baseData({ client: { ...baseData().client, nit: "CF" } }));
    expect(text).toContain("CF");
  });

  it("muestra un NIT numérico tal como se guardó, sin convertirlo", async () => {
    const text = await textOf(baseData({ client: { ...baseData().client, nit: "1234567-8" } }));
    expect(text).toContain("1234567-8");
  });

  it("incluye el texto adicional de instalación cuando existe, junto al base", async () => {
    const text = await textOf(baseData({ installationNotesExtra: "Acceso por el segundo nivel." }));
    expect(text).toContain(INSTALLATION_BASE_TEXT);
    expect(text).toContain("Acceso por el segundo nivel.");
  });

  it("incluye los datos del cliente", async () => {
    const text = await textOf(baseData());
    expect(text).toContain("Juan Pérez");
    expect(text).toContain("5555-5555");
  });

  it("incluye el nombre del equipo, extras y totales calculados", async () => {
    const text = await textOf(baseData());
    expect(text).toContain("Cassette Multi Split LG 12,000 BTU");
    expect(text).toContain("Canaleta especial");
    expect(text).toContain("Q 9,000.00");
  });

  it("no muestra el nivel de complejidad ni desglosa kit/ajuste por separado (sección 21)", async () => {
    const text = await textOf(baseData());
    // Solo debe aparecer "Instalación" combinada, nunca términos técnicos internos.
    expect(text).not.toMatch(/nivel|complejidad|multiplicador|factor \d/i);
  });
});

describe("renderQuotePdf — datos de empresa desde CompanySettings, no hardcodeados", () => {
  it("usa el nombre, contacto y condiciones de la empresa A", async () => {
    const text = await textOf(
      baseData({
        companySettings: {
          companyName: "Climatisa Empresa A",
          logoUrl: null,
          phone: "1111-1111",
          email: "a@empresa-a.test",
          address: "Dirección Empresa A",
          commercialTerms: "Condiciones comerciales de la Empresa A",
        },
      }),
    );
    expect(text).toContain("Climatisa Empresa A");
    expect(text).toContain("1111-1111");
    expect(text).toContain("Dirección Empresa A");
    expect(text).toContain("Condiciones comerciales de la Empresa A");
  });

  it("usa datos completamente distintos para la empresa B (prueba que no está hardcodeado)", async () => {
    const text = await textOf(
      baseData({
        companySettings: {
          companyName: "Otra Empresa B S.A.",
          logoUrl: null,
          phone: "2222-2222",
          email: "b@empresa-b.test",
          address: "Otra dirección distinta",
          commercialTerms: "Otras condiciones completamente diferentes",
        },
      }),
    );
    expect(text).toContain("Otra Empresa B S.A.");
    expect(text).toContain("2222-2222");
    expect(text).not.toContain("Climatisa Empresa A");
    expect(text).not.toContain("Condiciones comerciales de la Empresa A");
  });

  it("omite la sección de condiciones comerciales cuando no están configuradas", async () => {
    const text = await textOf(baseData({ companySettings: { ...baseData().companySettings, commercialTerms: null } }));
    expect(text).not.toContain("Condiciones comerciales");
  });
});

describe("renderQuotePdf — el vendedor nunca depende de datos externos", () => {
  it("el vendedor es siempre Romeo Morales sin importar los datos del cliente o la empresa", async () => {
    const text = await textOf(
      baseData({
        client: {
          name: "Cliente Cualquiera",
          phone: "0000-0000",
          address: null,
          company: "X",
          nit: "CF",
        },
        companySettings: { ...baseData().companySettings, companyName: "Otra Empresa" },
      }),
    );
    expect(text).toContain("Romeo Morales");
    // QuotePdfData no tiene ningún campo para el nombre del vendedor — es
    // estructuralmente imposible que el PDF muestre otro nombre.
    expect("vendorName" in baseData()).toBe(false);
  });
});
