const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Formato fijo del skill: "Q 1,234.00".
export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const sign = value < 0 ? "-" : "";
  return `${sign}Q ${numberFormatter.format(Math.abs(value))}`;
}

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(value);
}
