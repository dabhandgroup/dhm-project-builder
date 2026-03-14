import type { CurrencyCode } from "@/types/project";

export const currencies: { code: CurrencyCode; label: string; symbol: string; flag: string }[] = [
  { code: "AUD", label: "Australia", symbol: "A$", flag: "AU" },
  { code: "GBP", label: "United Kingdom", symbol: "£", flag: "GB" },
  { code: "USD", label: "United States", symbol: "$", flag: "US" },
  { code: "CAD", label: "Canada", symbol: "C$", flag: "CA" },
];
