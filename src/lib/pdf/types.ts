export interface QuotePdfEquipmentLine {
  equipmentNameSnapshot: string;
  quantity: number;
  meters: number;
  equipmentPriceSnapshot: number;
  installationPriceSnapshot: number;
  lineTotal: number;
}

export interface QuotePdfArea {
  name: string;
  areaTotal: number;
  equipment: QuotePdfEquipmentLine[];
}

export interface QuotePdfExtra {
  description: string;
  price: number;
}

export interface QuotePdfClient {
  name: string;
  phone: string;
  address: string | null;
  company: string;
  nit: string;
}

export interface QuotePdfCompanySettings {
  companyName: string;
  logoUrl: string | null;
  phone: string;
  email: string;
  address: string;
  commercialTerms: string | null;
}

export interface QuotePdfData {
  quoteNumber: string;
  date: Date | string;
  // Extensión confirmada al skill (ver CLAUDE.md). Opcionales para no
  // romper las pruebas de PDF existentes, que no los necesitan — ausentes
  // equivale a CLIMATISA (comportamiento idéntico al de antes de esta
  // extensión).
  quoteType?: "CLIMATISA" | "CENTO";
  centoVendorName?: string | null;
  centoClientReference?: string | null;
  client: QuotePdfClient;
  areas: QuotePdfArea[];
  extras: QuotePdfExtra[];
  subtotal: number;
  discountAmount: number;
  total: number;
  depositPercentage: number;
  depositAmount: number;
  balance: number;
  additionalDescription: string | null;
  installationNotesExtra: string | null;
  companySettings: QuotePdfCompanySettings;
}
