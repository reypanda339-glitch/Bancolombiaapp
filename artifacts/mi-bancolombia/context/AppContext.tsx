import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Account = {
  id: string;
  type: "savings" | "checking" | "credit";
  number: string;
  balance: number;
  currency: string;
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
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_ACCOUNTS: Account[] = [
  {
    id: "acc1",
    type: "savings",
    number: "****4521",
    balance: 4850000,
    currency: "COP",
    name: "Cuenta de Ahorros",
  },
  {
    id: "acc2",
    type: "checking",
    number: "****8834",
    balance: 1250000,
    currency: "COP",
    name: "Cuenta Corriente",
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    date: "2026-03-28",
    description: "Éxito Supermercado",
    amount: -87500,
    type: "debit",
    category: "Compras",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t2",
    date: "2026-03-27",
    description: "Nómina Empresa ABC",
    amount: 3500000,
    type: "credit",
    category: "Ingresos",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t3",
    date: "2026-03-27",
    description: "Netflix",
    amount: -52900,
    type: "debit",
    category: "Entretenimiento",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t4",
    date: "2026-03-26",
    description: "Transferencia a Juan",
    amount: -200000,
    type: "debit",
    category: "Transferencias",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t5",
    date: "2026-03-26",
    description: "Recaudo EPM",
    amount: -145000,
    type: "debit",
    category: "Servicios",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t6",
    date: "2026-03-25",
    description: "Rappi Colombia",
    amount: -35900,
    type: "debit",
    category: "Alimentación",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t7",
    date: "2026-03-25",
    description: "Transferencia recibida",
    amount: 500000,
    type: "credit",
    category: "Transferencias",
    accountId: "acc1",
    status: "completed",
  },
  {
    id: "t8",
    date: "2026-03-24",
    description: "Gasolina Shell",
    amount: -120000,
    type: "debit",
    category: "Transporte",
    accountId: "acc1",
    status: "completed",
  },
];

const MOCK_CARDS: Card[] = [
  {
    id: "card1",
    type: "debit",
    number: "4521 **** **** 3842",
    expiry: "12/27",
    holder: "CARLOS HERNANDEZ",
    brand: "visa",
    balance: 4850000,
    color: "#1C1C1E",
    active: true,
  },
  {
    id: "card2",
    type: "credit",
    number: "5412 **** **** 9076",
    expiry: "08/28",
    holder: "CARLOS HERNANDEZ",
    brand: "mastercard",
    balance: 1200000,
    limit: 5000000,
    color: "#FDDA24",
    active: true,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    if (pin === "1234") {
      setIsAuthenticated(true);
      await AsyncStorage.setItem("auth", "true");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    AsyncStorage.removeItem("auth");
  }, []);

  const toggleBalanceVisible = useCallback(() => {
    setBalanceVisible((v) => !v);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("auth").then((val) => {
      if (val === "true") setIsAuthenticated(true);
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        accounts: MOCK_ACCOUNTS,
        transactions: MOCK_TRANSACTIONS,
        cards: MOCK_CARDS,
        userName: "Carlos",
        login,
        logout,
        balanceVisible,
        toggleBalanceVisible,
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
