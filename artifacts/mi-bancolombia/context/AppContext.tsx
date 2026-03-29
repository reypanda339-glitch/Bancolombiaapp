import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { DocType } from "@/constants/countries";
import { getCountryByCode } from "@/constants/countries";

export type ThemeMode = "system" | "light" | "dark";

export type RegisteredUser = {
  id: string;
  documentType: DocType;
  documentNumber: string;
  countryResidence: string;
  countryBirth: string;
  currencyCode: string;
  currencySymbol: string;
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  birthDate: string;
  email: string;
  phone: string;
  pin: string;
  createdAt: string;
};

export type Account = {
  id: string;
  type: "savings" | "checking" | "credit";
  number: string;
  balance: number;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  name: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  accountId: string;
  status: "completed" | "pending";
};

export type Card = {
  id: string;
  type: "debit" | "credit";
  number: string;
  expiry: string;
  holder: string;
  brand: "visa" | "mastercard";
  balance: number;
  limit?: number;
  color: string;
  active: boolean;
};

type AppContextType = {
  isAuthenticated: boolean;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  userName: string;
  currentUser: RegisteredUser | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  register: (data: Omit<RegisteredUser, "id" | "createdAt">) => Promise<void>;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Account[] = [
  { id: "acc1", type: "savings",  number: "****4521", balance: 4850000, currency: "Peso colombiano",     currencyCode: "COP", currencySymbol: "$",  name: "Cuenta de Ahorros"  },
  { id: "acc2", type: "checking", number: "****8834", balance: 1250000, currency: "Peso colombiano",     currencyCode: "COP", currencySymbol: "$",  name: "Cuenta Corriente"   },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2026-03-28", description: "Éxito Supermercado",     amount: -87500,   type: "debit",  category: "Compras",       accountId: "acc1", status: "completed" },
  { id: "t2", date: "2026-03-27", description: "Nómina Empresa ABC",     amount: 3500000,  type: "credit", category: "Ingresos",      accountId: "acc1", status: "completed" },
  { id: "t3", date: "2026-03-27", description: "Netflix",                amount: -52900,   type: "debit",  category: "Entretenimiento",accountId: "acc1",status: "completed" },
  { id: "t4", date: "2026-03-26", description: "Transferencia a Juan",   amount: -200000,  type: "debit",  category: "Transferencias",accountId: "acc1", status: "completed" },
  { id: "t5", date: "2026-03-26", description: "Recaudo EPM",            amount: -145000,  type: "debit",  category: "Servicios",     accountId: "acc1", status: "completed" },
  { id: "t6", date: "2026-03-25", description: "Rappi Colombia",         amount: -35900,   type: "debit",  category: "Alimentación",  accountId: "acc1", status: "completed" },
  { id: "t7", date: "2026-03-25", description: "Transferencia recibida", amount: 500000,   type: "credit", category: "Transferencias",accountId: "acc1", status: "completed" },
  { id: "t8", date: "2026-03-24", description: "Gasolina Shell",         amount: -120000,  type: "debit",  category: "Transporte",    accountId: "acc1", status: "completed" },
];

const DEMO_CARDS: Card[] = [
  { id: "card1", type: "debit",  number: "4521 **** **** 3842", expiry: "12/27", holder: "CARLOS HERNANDEZ", brand: "visa",       balance: 4850000, color: "#1C1C1E",  active: true  },
  { id: "card2", type: "credit", number: "5412 **** **** 9076", expiry: "08/28", holder: "CARLOS HERNANDEZ", brand: "mastercard", balance: 1200000, limit: 5000000, color: "#FDDA24", active: true },
];

function zeroAccounts(user: RegisteredUser): Account[] {
  const c = getCountryByCode(user.countryResidence);
  return [
    {
      id: "acc1",
      type: "savings",
      number: "****0001",
      balance: 0,
      currency: c?.currency ?? user.currencyCode,
      currencyCode: user.currencyCode,
      currencySymbol: user.currencySymbol,
      name: "Cuenta de Ahorros",
    },
  ];
}

function zeroCards(user: RegisteredUser): Card[] {
  return [
    {
      id: "card1",
      type: "debit",
      number: "**** **** **** ****",
      expiry: "--/--",
      holder: `${user.firstName} ${user.lastName}`.toUpperCase(),
      brand: "visa",
      balance: 0,
      color: "#1C1C1E",
      active: true,
    },
  ];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    (async () => {
      const [auth, theme, userJson] = await Promise.all([
        AsyncStorage.getItem("auth"),
        AsyncStorage.getItem("themeMode"),
        AsyncStorage.getItem("currentUser"),
      ]);
      if (theme) setThemeModeState(theme as ThemeMode);
      if (userJson) setCurrentUser(JSON.parse(userJson));
      if (auth === "true") setIsAuthenticated(true);
    })();
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const matched = users.find((u) => u.pin === pin);

    if (matched) {
      setIsAuthenticated(true);
      setCurrentUser(matched);
      await AsyncStorage.setItem("auth", "true");
      await AsyncStorage.setItem("currentUser", JSON.stringify(matched));
      return true;
    }
    if (pin === "1234") {
      setIsAuthenticated(true);
      setCurrentUser(null);
      await AsyncStorage.setItem("auth", "true");
      await AsyncStorage.removeItem("currentUser");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    AsyncStorage.removeItem("auth");
    AsyncStorage.removeItem("currentUser");
  }, []);

  const register = useCallback(async (data: Omit<RegisteredUser, "id" | "createdAt">) => {
    const newUser: RegisteredUser = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    await AsyncStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]));
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const toggleBalanceVisible = useCallback(() => setBalanceVisible((v) => !v), []);

  const displayName  = currentUser?.firstName ?? "Carlos";
  const accounts     = currentUser ? zeroAccounts(currentUser) : DEMO_ACCOUNTS;
  const transactions = currentUser ? [] : DEMO_TRANSACTIONS;
  const cards        = currentUser ? zeroCards(currentUser)    : DEMO_CARDS;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        accounts,
        transactions,
        cards,
        userName: displayName,
        currentUser,
        login,
        logout,
        register,
        balanceVisible,
        toggleBalanceVisible,
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
