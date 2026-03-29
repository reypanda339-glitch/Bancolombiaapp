export type DocType = "CC" | "CE" | "DNI" | "CPF" | "DL" | "PA";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  CC: "Cédula de Ciudadanía",
  CE: "Cédula de Extranjería",
  DNI: "DNI",
  CPF: "CPF",
  DL: "Driver Licence",
  PA: "Passport / Pasaporte",
};

export const ALL_DOC_TYPES: DocType[] = ["CC", "CE", "DNI", "CPF", "DL", "PA"];

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
  { code: "CO", name: "Colombia",         flag: "🇨🇴", currency: "Peso colombiano",    currencySymbol: "$", currencyCode: "COP", docTypes: ["CC","CE","PA"],    phoneCode: "+57" },
  { code: "US", name: "Estados Unidos",   flag: "🇺🇸", currency: "Dólar estadounidense",currencySymbol: "$", currencyCode: "USD", docTypes: ["DL","PA"],         phoneCode: "+1"  },
  { code: "BR", name: "Brasil",           flag: "🇧🇷", currency: "Real brasileño",      currencySymbol: "R$",currencyCode: "BRL", docTypes: ["CPF","PA"],        phoneCode: "+55" },
  { code: "ES", name: "España",           flag: "🇪🇸", currency: "Euro",                currencySymbol: "€", currencyCode: "EUR", docTypes: ["DNI","PA"],        phoneCode: "+34" },
  { code: "MX", name: "México",           flag: "🇲🇽", currency: "Peso mexicano",       currencySymbol: "$", currencyCode: "MXN", docTypes: ["CC","PA"],         phoneCode: "+52" },
  { code: "AR", name: "Argentina",        flag: "🇦🇷", currency: "Peso argentino",      currencySymbol: "$", currencyCode: "ARS", docTypes: ["DNI","PA"],        phoneCode: "+54" },
  { code: "VE", name: "Venezuela",        flag: "🇻🇪", currency: "Bolívar venezolano",  currencySymbol: "Bs.",currencyCode: "VES",docTypes: ["CC","CE","PA"],    phoneCode: "+58" },
  { code: "CL", name: "Chile",            flag: "🇨🇱", currency: "Peso chileno",        currencySymbol: "$", currencyCode: "CLP", docTypes: ["CC","PA"],         phoneCode: "+56" },
  { code: "PE", name: "Perú",             flag: "🇵🇪", currency: "Sol peruano",         currencySymbol: "S/",currencyCode: "PEN", docTypes: ["DNI","CE","PA"],  phoneCode: "+51" },
  { code: "EC", name: "Ecuador",          flag: "🇪🇨", currency: "Dólar estadounidense",currencySymbol: "$", currencyCode: "USD", docTypes: ["CC","PA"],         phoneCode: "+593"},
  { code: "GB", name: "Reino Unido",      flag: "🇬🇧", currency: "Libra esterlina",     currencySymbol: "£", currencyCode: "GBP", docTypes: ["DL","PA"],         phoneCode: "+44" },
  { code: "DE", name: "Alemania",         flag: "🇩🇪", currency: "Euro",                currencySymbol: "€", currencyCode: "EUR", docTypes: ["DNI","PA"],        phoneCode: "+49" },
  { code: "FR", name: "Francia",          flag: "🇫🇷", currency: "Euro",                currencySymbol: "€", currencyCode: "EUR", docTypes: ["DNI","PA"],        phoneCode: "+33" },
  { code: "IT", name: "Italia",           flag: "🇮🇹", currency: "Euro",                currencySymbol: "€", currencyCode: "EUR", docTypes: ["DNI","PA"],        phoneCode: "+39" },
  { code: "CA", name: "Canadá",           flag: "🇨🇦", currency: "Dólar canadiense",    currencySymbol: "$", currencyCode: "CAD", docTypes: ["DL","PA"],         phoneCode: "+1"  },
  { code: "PT", name: "Portugal",         flag: "🇵🇹", currency: "Euro",                currencySymbol: "€", currencyCode: "EUR", docTypes: ["DNI","PA"],        phoneCode: "+351"},
  { code: "UY", name: "Uruguay",          flag: "🇺🇾", currency: "Peso uruguayo",       currencySymbol: "$", currencyCode: "UYU", docTypes: ["CC","PA"],         phoneCode: "+598"},
  { code: "BO", name: "Bolivia",          flag: "🇧🇴", currency: "Boliviano",           currencySymbol: "Bs",currencyCode: "BOB", docTypes: ["CC","PA"],         phoneCode: "+591"},
  { code: "PY", name: "Paraguay",         flag: "🇵🇾", currency: "Guaraní",             currencySymbol: "₲", currencyCode: "PYG", docTypes: ["CC","PA"],         phoneCode: "+595"},
  { code: "PA", name: "Panamá",           flag: "🇵🇦", currency: "Balboa / USD",        currencySymbol: "B/.",currencyCode: "PAB",docTypes: ["CC","PA"],         phoneCode: "+507"},
  { code: "CR", name: "Costa Rica",       flag: "🇨🇷", currency: "Colón costarricense", currencySymbol: "₡", currencyCode: "CRC", docTypes: ["CC","PA"],         phoneCode: "+506"},
  { code: "DO", name: "Rep. Dominicana",  flag: "🇩🇴", currency: "Peso dominicano",     currencySymbol: "RD$",currencyCode: "DOP",docTypes: ["CC","CE","PA"],   phoneCode: "+1"  },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function formatAmount(amount: number, country: Country): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: country.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${country.currencySymbol}${amount.toLocaleString()}`;
  }
}
