import { renderToBuffer } from "@react-pdf/renderer";
import { QuoteDocument } from "@/lib/pdf/quote-document";
import type { QuotePdfData } from "@/lib/pdf/types";

export async function renderQuotePdf(data: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(QuoteDocument({ data }));
}
