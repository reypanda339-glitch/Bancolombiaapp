export type DocType =
  | "CC"   // Cédula de Ciudadanía (Colombia)
  | "CE"   // Cédula de Extranjería (Colombia)
  | "TI"   // Tarjeta de Identidad (Colombia)
  | "PA"   // Pasaporte / Passport
  | "DNI"  // DNI (España, Argentina, Perú)
  | "NIE"  // Número de Identidad de Extranjero (España)
  | "NIF"  // Número de Identificación Fiscal (España)
  | "DL"   // Driver License (EE.UU., Canadá)
  | "SSN"  // Social Security Number (EE.UU.)
  | "GC"   // Green Card / Permanent Resident (EE.UU.)
  | "CURP" // Clave Única de Registro de Población (México)
  | "INE"  // INE / IFE (México)
  | "CPF"  // CPF (Brasil)
  | "RG"   // Registro Geral (Brasil)
  | "CI"   // Cédula de Identidad (varios países LATAM)
  | "RUT"; // RUT (Chile)

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  CC:   "Cédula de Ciudadanía (Colombia)",
  CE:   "Cédula de Extranjería (Colombia)",
  TI:   "Tarjeta de Identidad (Colombia)",
  PA:   "Pasaporte / Passport",
  DNI:  "DNI (España / Argentina / Perú)",
  NIE:  "NIE — Extranjero en España",
  NIF:  "NIF — Identificación Fiscal (España)",
  DL:   "Driver License (EE.UU. / Canadá)",
  SSN:  "Social Security Number (EE.UU.)",
  GC:   "Green Card / Permanent Resident (EE.UU.)",
  CURP: "CURP (México)",
  INE:  "INE / IFE (México)",
  CPF:  "CPF (Brasil)",
  RG:   "RG — Registro Geral (Brasil)",
  CI:   "Cédula de Identidad (LATAM)",
  RUT:  "RUT (Chile)",
};

export const ALL_DOC_TYPES: DocType[] = [
  "CC", "CE", "TI", "PA",
  "DNI", "NIE", "NIF",
  "DL", "SSN", "GC",
  "CURP", "INE",
  "CPF", "RG",
  "CI", "RUT",
];

export type Country = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  docTypes: DocType[];
  phoneCode: string;
};

export const COUNTRIES: Country[] = [
  { code: "CO", name: "Colombia",         flag: "🇨🇴", currency: "Peso colombiano",    currencySymbol: "$",   currencyCode: "COP", docTypes: ["CC","CE","TI","PA"],          phoneCode: "+57" },
  { code: "US", name: "Estados Unidos",   flag: "🇺🇸", currency: "Dólar estadounidense",currencySymbol: "US$", currencyCode: "USD", docTypes: ["DL","SSN","GC","PA"],         phoneCode: "+1"  },
  { code: "BR", name: "Brasil",           flag: "🇧🇷", currency: "Real brasileño",      currencySymbol: "R$",  currencyCode: "BRL", docTypes: ["CPF","RG","PA"],              phoneCode: "+55" },
  { code: "ES", name: "España",           flag: "🇪🇸", currency: "Euro",                currencySymbol: "€",   currencyCode: "EUR", docTypes: ["DNI","NIE","NIF","PA"],       phoneCode: "+34" },
  { code: "MX", name: "México",           flag: "🇲🇽", currency: "Peso mexicano",       currencySymbol: "$",   currencyCode: "MXN", docTypes: ["CURP","INE","PA"],            phoneCode: "+52" },
  { code: "AR", name: "Argentina",        flag: "🇦🇷", currency: "Peso argentino",      currencySymbol: "$",   currencyCode: "ARS", docTypes: ["DNI","PA"],                   phoneCode: "+54" },
  { code: "VE", name: "Venezuela",        flag: "🇻🇪", currency: "Bolívar venezolano",  currencySymbol: "Bs.", currencyCode: "VES", docTypes: ["CC","CE","PA"],               phoneCode: "+58" },
  { code: "CL", name: "Chile",            flag: "🇨🇱", currency: "Peso chileno",        currencySymbol: "$",   currencyCode: "CLP", docTypes: ["RUT","CI","PA"],              phoneCode: "+56" },
  { code: "PE", name: "Perú",             flag: "🇵🇪", currency: "Sol peruano",         currencySymbol: "S/",  currencyCode: "PEN", docTypes: ["DNI","CE","PA"],              phoneCode: "+51" },
  { code: "EC", name: "Ecuador",          flag: "🇪🇨", currency: "Dólar estadounidense",currencySymbol: "US$", currencyCode: "USD", docTypes: ["CC","PA"],                    phoneCode: "+593"},
  { code: "GB", name: "Reino Unido",      flag: "🇬🇧", currency: "Libra esterlina",     currencySymbol: "£",   currencyCode: "GBP", docTypes: ["DL","PA"],                    phoneCode: "+44" },
  { code: "DE", name: "Alemania",         flag: "🇩🇪", currency: "Euro",                currencySymbol: "€",   currencyCode: "EUR", docTypes: ["DNI","PA"],                   phoneCode: "+49" },
  { code: "FR", name: "Francia",          flag: "🇫🇷", currency: "Euro",                currencySymbol: "€",   currencyCode: "EUR", docTypes: ["DNI","PA"],                   phoneCode: "+33" },
  { code: "IT", name: "Italia",           flag: "🇮🇹", currency: "Euro",                currencySymbol: "€",   currencyCode: "EUR", docTypes: ["DNI","PA"],                   phoneCode: "+39" },
  { code: "CA", name: "Canadá",           flag: "🇨🇦", currency: "Dólar canadiense",    currencySymbol: "CA$", currencyCode: "CAD", docTypes: ["DL","PA"],                    phoneCode: "+1"  },
  { code: "PT", name: "Portugal",         flag: "🇵🇹", currency: "Euro",                currencySymbol: "€",   currencyCode: "EUR", docTypes: ["DNI","NIF","PA"],             phoneCode: "+351"},
  { code: "UY", name: "Uruguay",          flag: "🇺🇾", currency: "Peso uruguayo",       currencySymbol: "$",   currencyCode: "UYU", docTypes: ["CI","PA"],                    phoneCode: "+598"},
  { code: "BO", name: "Bolivia",          flag: "🇧🇴", currency: "Boliviano",           currencySymbol: "Bs.", currencyCode: "BOB", docTypes: ["CI","PA"],                    phoneCode: "+591"},
  { code: "PY", name: "Paraguay",         flag: "🇵🇾", currency: "Guaraní",             currencySymbol: "₲",   currencyCode: "PYG", docTypes: ["CI","PA"],                    phoneCode: "+595"},
  { code: "PA", name: "Panamá",           flag: "🇵🇦", currency: "Balboa / USD",        currencySymbol: "B/.", currencyCode: "PAB", docTypes: ["CC","PA"],                    phoneCode: "+507"},
  { code: "CR", name: "Costa Rica",       flag: "🇨🇷", currency: "Colón costarricense", currencySymbol: "₡",   currencyCode: "CRC", docTypes: ["CI","PA"],                    phoneCode: "+506"},
  { code: "DO", name: "Rep. Dominicana",  flag: "🇩🇴", currency: "Peso dominicano",     currencySymbol: "RD$", currencyCode: "DOP", docTypes: ["CC","CE","PA"],               phoneCode: "+1"  },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

const WHOLE_CURRENCIES = new Set(["COP", "CLP", "PYG", "VES", "CRC", "DOP"]);
const EN_LOCALES = new Set(["USD", "GBP", "CAD"]);

export function formatBalance(
  amount: number,
  currencyCode: string,
  currencySymbol: string,
  showCode = true,
): string {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const isWhole = WHOLE_CURRENCIES.has(currencyCode);
  const locale = EN_LOCALES.has(currencyCode) ? "en-US" : "es-CO";
  const sign = negative ? "-" : "";
  try {
    const num = new Intl.NumberFormat(locale, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: isWhole ? 0 : 2,
    }).format(abs);
    return showCode
      ? `${currencySymbol} ${sign}${num} ${currencyCode}`
      : `${currencySymbol} ${sign}${num}`;
  } catch {
    return `${currencySymbol} ${sign}${abs.toLocaleString()}${showCode ? ` ${currencyCode}` : ""}`;
  }
}

/** Returns a masked balance string like "$ •••••• COP" for privacy mode */
export function maskedBalance(currencyCode: string, currencySymbol: string): string {
  return `${currencySymbol} •••••• ${currencyCode}`;
}

export function formatAmount(amount: number, country: Country): string {
  return formatBalance(amount, country.currencyCode, country.currencySymbol);
}

export const BANKS_BY_CURRENCY: Record<string, string[]> = {
  COP: [
    "Bancolombia", "Davivienda", "Banco de Bogotá", "BBVA Colombia",
    "Banco Popular", "Banco Caja Social", "Banco AV Villas", "Banco Falabella",
    "Nequi", "Banco Finandina", "Banco Itaú Colombia", "Banco Pichincha Colombia",
    "Banco W", "Banco Mundo Mujer", "Banco Cooperativo Coopcentral",
  ],
  USD: [
    "Chase Bank", "Bank of America", "Wells Fargo", "Citibank",
    "Goldman Sachs", "Morgan Stanley", "US Bancorp", "PNC Financial Services",
    "Capital One", "TD Bank USA", "Ally Financial", "Discover Financial",
    "Fifth Third Bank", "Regions Financial", "KeyBank",
  ],
  EUR: [
    "Santander España", "BBVA España", "CaixaBank", "Banco Sabadell",
    "Bankia", "ING España", "Deutsche Bank España", "BNP Paribas España",
    "Crédit Agricole", "Société Générale", "Intesa Sanpaolo", "UniCredit",
    "Commerzbank", "ABN AMRO", "Rabobank",
  ],
  BRL: [
    "Banco do Brasil", "Bradesco", "Itaú Unibanco", "Santander Brasil",
    "Caixa Econômica Federal", "Nubank", "BTG Pactual", "Banco Inter",
    "Sicoob", "Banco Original", "Banco Pan", "C6 Bank",
  ],
  MXN: [
    "BBVA México", "Banamex (Citigroup)", "Santander México", "HSBC México",
    "Banorte", "Scotiabank México", "Inbursa", "Afirme",
    "Banco Azteca", "Banco Bajío", "Banbajío", "Banregio",
  ],
  ARS: [
    "Banco Nación Argentina", "Banco Galicia", "Santander Argentina",
    "BBVA Argentina", "Banco Macro", "Banco Patagonia", "Banco Supervielle",
    "HSBC Argentina", "Banco Ciudad", "Banco Provincia",
  ],
  CLP: [
    "BancoEstado", "Banco Santander Chile", "Banco de Chile",
    "BCI (Banco de Crédito e Inversiones)", "Banco Falabella Chile",
    "Banco Security", "Scotiabank Chile", "Banco Bice", "Banco Consorcio",
    "HSBC Chile",
  ],
  PEN: [
    "BCP (Banco de Crédito del Perú)", "Interbank", "BBVA Perú",
    "Scotiabank Perú", "Banco de la Nación", "BanBif", "Banco GNB Perú",
    "Banco Pichincha Perú", "Mibanco", "Caja Huancayo",
  ],
  GBP: [
    "Barclays", "HSBC UK", "Lloyds Bank", "NatWest",
    "Santander UK", "Halifax", "Standard Chartered UK",
    "Nationwide Building Society", "Metro Bank", "Monzo",
  ],
  CAD: [
    "RBC Royal Bank", "TD Canada Trust", "BMO Bank of Montreal",
    "Scotiabank Canada", "CIBC", "National Bank of Canada",
    "Desjardins", "HSBC Canada", "Laurentian Bank", "ATB Financial",
  ],
  BOB: [
    "Banco Unión", "Banco Mercantil Santa Cruz", "Banco Nacional de Bolivia",
    "Banco de Crédito BCP Bolivia", "Banco Bisa", "Banco FIE",
    "Banco Solidario", "Banco para el Fomento a Iniciativas Económicas",
  ],
  UYU: [
    "Banco República (BROU)", "Banco Santander Uruguay", "BBVA Uruguay",
    "Banco Itaú Uruguay", "Banco HSBC Uruguay", "Banco Bilbao Vizcaya",
    "Banco Scotiabank Uruguay",
  ],
  VES: [
    "Banco de Venezuela", "Mercantil Banco", "Banesco",
    "BBVA Provincial", "Banco Exterior", "Bicentenario Banco Universal",
    "Banco Nacional de Crédito", "Banco del Tesoro",
  ],
  CRC: [
    "Banco Nacional de Costa Rica", "Banco de Costa Rica",
    "BAC San José", "Scotiabank Costa Rica", "Banco Popular CR",
    "Banco Davivienda CR", "Banco CMB",
  ],
  DOP: [
    "Banco Popular Dominicano", "Banco de Reservas (Banreservas)",
    "Scotiabank República Dominicana", "Banco BHD León",
    "Banco Santa Cruz", "Asociación Popular de Ahorros",
    "Banco Múltiple Caribe",
  ],
  PAB: [
    "Banco Nacional de Panamá", "BAC Panamá", "Banistmo",
    "Banco General", "BBVA Panamá", "Global Bank", "MultiBank",
    "Banco Trasatlántico",
  ],
  PYG: [
    "Banco Nacional de Fomento", "Banco Continental Paraguay",
    "Banco Itaú Paraguay", "BBVA Paraguay", "Banco GNB Paraguay",
    "Banco Regional", "Banco Familiar",
  ],
};

export function getBanksByCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  if (!country) return BANKS_BY_CURRENCY.COP;
  return BANKS_BY_CURRENCY[country.currencyCode] ?? BANKS_BY_CURRENCY.COP;
}
