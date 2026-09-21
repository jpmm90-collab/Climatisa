import { describe, expect, it } from "vitest";
import { deriveQuote } from "@/lib/quote-wizard/derive";
import { INITIAL_WIZARD_STATE, type QuoteWizardState } from "@/lib/quote-wizard/types";

function makeState(overrides: Partial<QuoteWizardState>): QuoteWizardState {
  return { ...INITIAL_WIZARD_STATE, ...overrides };
}

describe("deriveQuote", () => {
  it("calcula el ejemplo del skill (sección 19)", () => {
    const state = makeState({
      areas: [
        {
          areaId: "a1",
          name: "Habitación principal",
          equipmentLines: [
            {
              lineId: "l1",
              equipmentId: "e1",
              equipmentName: "Cassette Multi Split LG 12,000 BTU",
              equipmentPrice: 8000,
              quantity: 1,
              meters: 8,
              complexityId: "c1",
              complexityName: "Media",
              complexityAdjustment: 500,
              kitId: "k1",
              kitPrice: 0,
            },
          ],
        },
        {
          areaId: "a2",
          name: "Sala",
          equipmentLines: [
            {
              lineId: "l2",
              equipmentId: "e2",
              equipmentName: "Split LG 18,000 BTU",
              equipmentPrice: 7200,
              quantity: 1,
              meters: 3,
              complexityId: "c2",
              complexityName: "Sencilla",
              complexityAdjustment: 0,
              kitId: "k2",
              kitPrice: 0,
            },
          ],
        },
      ],
      extras: [{ extraId: "x1", description: "Canaleta especial", price: 500 }],
      depositPercentage: 50,
      discountType: "AMOUNT",
      discountValue: 0,
    });

    const result = deriveQuote(state);

    expect(result.areas[0].areaTotal).toBe(8500);
    expect(result.areas[1].areaTotal).toBe(7200);
    expect(result.subtotal).toBe(16200);
    expect(result.total).toBe(16200);
    expect(result.depositAmount).toBe(8100);
    expect(result.balance).toBe(8100);
  });

  it("un área con varias líneas de equipo suma correctamente", () => {
    const state = makeState({
      areas: [
        {
          areaId: "a1",
          name: "Oficina",
          equipmentLines: [
            {
              lineId: "l1",
              equipmentId: "e1",
              equipmentName: "Split 12k",
              equipmentPrice: 4000,
              quantity: 2,
              meters: 5,
              complexityId: "c1",
              complexityName: "Sencilla",
              complexityAdjustment: 0,
              kitId: "k1",
              kitPrice: 200,
            },
            {
              lineId: "l2",
              equipmentId: "e2",
              equipmentName: "Split 18k",
              equipmentPrice: 6000,
              quantity: 1,
              meters: 12,
              complexityId: "c2",
              complexityName: "Compleja",
              complexityAdjustment: 800,
              kitId: "k2",
              kitPrice: 400,
            },
          ],
        },
      ],
    });

    const result = deriveQuote(state);
    // línea 1: (4000*2) + (200*2) = 8400; línea 2: 6000 + (400+800) = 7200
    expect(result.areas[0].areaTotal).toBe(15600);
  });

  it("aplica descuento porcentual sobre el subtotal con extras", () => {
    const state = makeState({
      areas: [
        {
          areaId: "a1",
          name: "Área",
          equipmentLines: [
            {
              lineId: "l1",
              equipmentId: "e1",
              equipmentName: "Equipo",
              equipmentPrice: 5000,
              quantity: 1,
              meters: 2,
              complexityId: "c1",
              complexityName: "Sencilla",
              complexityAdjustment: 0,
              kitId: "k1",
              kitPrice: 0,
            },
          ],
        },
      ],
      extras: [{ extraId: "x1", description: "Extra", price: 1000 }],
      discountType: "PERCENTAGE",
      discountValue: 10,
      depositPercentage: 25,
    });

    const result = deriveQuote(state);
    expect(result.subtotal).toBe(6000);
    expect(result.discountAmount).toBe(600);
    expect(result.total).toBe(5400);
    expect(result.depositAmount).toBe(1350);
    expect(result.balance).toBe(4050);
  });

  it("un asistente vacío da totales en cero", () => {
    const result = deriveQuote(INITIAL_WIZARD_STATE);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.depositAmount).toBe(0);
  });
});
