import {
  calculateAreaPrice,
  calculateDeposit,
  calculateLineTotal,
  calculateQuoteTotals,
  type LineTotals,
} from "@/lib/pricing/engine";
import type { QuoteWizardState, WizardArea } from "@/lib/quote-wizard/types";

export interface DerivedLine extends LineTotals {
  lineId: string;
}

export interface DerivedArea {
  areaId: string;
  name: string;
  lines: DerivedLine[];
  areaTotal: number;
}

export interface DerivedQuote {
  areas: DerivedArea[];
  subtotal: number;
  discountAmount: number;
  total: number;
  depositAmount: number;
  balance: number;
}

function deriveArea(area: WizardArea): DerivedArea {
  const lines: DerivedLine[] = area.equipmentLines.map((line) => ({
    lineId: line.lineId,
    ...calculateLineTotal({
      equipmentPrice: line.equipmentPrice,
      quantity: line.quantity,
      kitPrice: line.kitPrice,
      complexityAdjustment: line.complexityAdjustment,
    }),
  }));

  return {
    areaId: area.areaId,
    name: area.name,
    lines,
    areaTotal: calculateAreaPrice(lines),
  };
}

export function deriveQuote(state: QuoteWizardState): DerivedQuote {
  const areas = state.areas.map(deriveArea);
  const { subtotal, discountAmount, total } = calculateQuoteTotals({
    areaTotals: areas.map((area) => area.areaTotal),
    extras: state.extras.map((extra) => extra.price),
    discountType: state.discountType,
    discountValue: state.discountValue,
  });
  const { depositAmount, balance } = calculateDeposit(total, state.depositPercentage);

  return { areas, subtotal, discountAmount, total, depositAmount, balance };
}
