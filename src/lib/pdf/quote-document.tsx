import path from "node:path";
import fs from "node:fs";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { INSTALLATION_BASE_TEXT, VENDEDOR_RESPONSABLE } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { QuotePdfData } from "@/lib/pdf/types";

// @react-pdf/renderer's <Image> resolves string `src` values through
// fetch() — even local filesystem paths — which fails silently on this
// platform. Local fallback logo must be read into a buffer and passed as
// {data, format} instead. The bundled asset is actually a JPEG despite its
// .png extension (pre-existing in the project scaffold; browsers/next/image
// tolerate this via content-sniffing, @react-pdf/renderer does not).
const FALLBACK_LOGO_SRC = {
  data: fs.readFileSync(path.join(process.cwd(), "public", "branding", "climatisa-logo.png")),
  format: "jpg" as const,
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  logo: { width: 48, height: 48 },
  companyBlock: { flexDirection: "row", gap: 10, alignItems: "center" },
  companyName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  muted: { color: "#6b7280" },
  quoteTitleBlock: { alignItems: "flex-end" },
  quoteNumber: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  areaBlock: {
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  areaName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  areaTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontFamily: "Helvetica-Bold",
  },
  totalsBlock: { marginTop: 8, alignSelf: "flex-end", width: 220 },
  totalRowEmphasis: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#171717",
  },
  footer: { marginTop: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
});

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  const { companySettings } = data;
  const logoSrc = companySettings.logoUrl || FALLBACK_LOGO_SRC;

  return (
    <Document title={data.quoteNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>; no alt prop exists in this API */}
            <Image src={logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{companySettings.companyName}</Text>
              <Text style={styles.muted}>{companySettings.address}</Text>
              <Text style={styles.muted}>
                {companySettings.phone} · {companySettings.email}
              </Text>
            </View>
          </View>
          <View style={styles.quoteTitleBlock}>
            <Text style={styles.quoteNumber}>{data.quoteNumber}</Text>
            <Text style={styles.muted}>{formatDate(data.date)}</Text>
            {/* Vendedor/responsable fijo — nunca el usuario autenticado (sección 43). */}
            <Text style={styles.muted}>Vendedor: {VENDEDOR_RESPONSABLE}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text>{data.client.name}</Text>
          <Text style={styles.muted}>{data.client.company}</Text>
          <Text style={styles.muted}>Tel. {data.client.phone}</Text>
          {data.client.address ? <Text style={styles.muted}>{data.client.address}</Text> : null}
          <Text style={styles.muted}>NIT: {data.client.nit}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Áreas</Text>
          {data.areas.map((area, areaIndex) => (
            <View key={areaIndex} style={styles.areaBlock}>
              <Text style={styles.areaName}>{area.name}</Text>
              {area.equipment.map((line, lineIndex) => {
                const equipmentTotal = line.equipmentPriceSnapshot * line.quantity;
                const installationTotal = line.installationPriceSnapshot * line.quantity;
                const label =
                  line.equipmentNameSnapshot + (line.quantity > 1 ? ` × ${line.quantity}` : "");
                return (
                  <View key={lineIndex}>
                    <View style={styles.row}>
                      <Text>{label}</Text>
                      <Text>{formatCurrency(equipmentTotal)}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text>Instalación ({line.meters} m)</Text>
                      <Text>{formatCurrency(installationTotal)}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={styles.areaTotalRow}>
                <Text>Total área</Text>
                <Text>{formatCurrency(area.areaTotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instalación</Text>
          {/* Texto base obligatorio, siempre presente (sección 19.5). */}
          <Text>{INSTALLATION_BASE_TEXT}</Text>
          {data.installationNotesExtra ? <Text>{data.installationNotesExtra}</Text> : null}
        </View>

        {data.extras.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extras</Text>
            {data.extras.map((extra, index) => (
              <View key={index} style={styles.row}>
                <Text>{extra.description}</Text>
                <Text>{formatCurrency(extra.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.totalsBlock}>
          <View style={styles.row}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 ? (
            <View style={styles.row}>
              <Text style={styles.muted}>Descuento</Text>
              <Text>- {formatCurrency(data.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRowEmphasis}>
            <Text>Total</Text>
            <Text>{formatCurrency(data.total)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.muted}>Anticipo ({data.depositPercentage}%)</Text>
            <Text>{formatCurrency(data.depositAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Saldo</Text>
            <Text>{formatCurrency(data.balance)}</Text>
          </View>
        </View>

        {data.additionalDescription ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text>{data.additionalDescription}</Text>
          </View>
        ) : null}

        {companySettings.commercialTerms ? (
          <View style={styles.footer}>
            <Text style={styles.sectionTitle}>Condiciones comerciales</Text>
            <Text style={styles.muted}>{companySettings.commercialTerms}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
