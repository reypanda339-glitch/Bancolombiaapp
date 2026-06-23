import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
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
  isAdmin?: boolean;
  status?: "active" | "suspended" | "blocked";
  address?: string;
  motherName?: string;
  motherPhone?: string;
  googleEmail?: string;
};

export type Account = {
  id: string;
  userId: string;
  type: "savings" | "checking" | "credit";
  number: string;
  balance: number;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  name: string;
  status: "active" | "suspended" | "blocked";
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
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
  userId: string;
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

export type LoginEvent = {
  id: string;
  timestamp: string;
  documentNumber: string;
  userId: string | null;
  success: boolean;
  platform: string;
  deviceInfo: string;
  ip: string;
  latitude: string;
  longitude: string;
  city: string;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  adminId: string;
  action: string;
  targetUserId?: string;
  details: string;
};

type AppContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  userName: string;
  currentUser: RegisteredUser | null;
  login: (documentNumber: string, pin: string) => Promise<boolean>;
  logout: () => void;
  register: (data: Omit<RegisteredUser, "id" | "createdAt">) => Promise<void>;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  reloadUserData: () => Promise<void>;
  getAllUsers: () => Promise<RegisteredUser[]>;
  updateUser: (id: string, data: Partial<RegisteredUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createUser: (data: Omit<RegisteredUser, "id" | "createdAt">) => Promise<void>;
  getAllAccounts: () => Promise<Account[]>;
  updateAccount: (userId: string, accountId: string, data: Partial<Account>) => Promise<void>;
  getAllTransactions: () => Promise<Transaction[]>;
  addTransaction: (userId: string, tx: Omit<Transaction, "id">) => Promise<void>;
  adminAddBalance: (userId: string, accountId: string, amount: number, description: string, date: string, category: string) => Promise<void>;
  getAuditLogs: () => Promise<AuditLog[]>;
  addAuditLog: (action: string, details: string, targetUserId?: string) => Promise<void>;
  getLoginEvents: () => Promise<LoginEvent[]>;
  requestLocationPermission: () => Promise<boolean>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const ADMIN_USER: RegisteredUser = {
  id: "admin-root",
  documentType: "CC",
  documentNumber: "000000000",
  countryResidence: "CO",
  countryBirth: "CO",
  currencyCode: "COP",
  currencySymbol: "$",
  firstName: "Administrador",
  secondName: "",
  lastName: "Bancolombia",
  secondLastName: "",
  birthDate: "01/01/1990",
  email: "admin@bancolombia.com.co",
  phone: "3000000000",
  pin: "0000",
  createdAt: "2024-01-01T00:00:00.000Z",
  isAdmin: true,
  status: "active",
};

function generateAccountNumber(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `****${num}`;
}

function generateCardNumber(): string {
  const parts = [4, 4, 4, 4].map(() => Math.floor(Math.random() * 9000 + 1000).toString());
  return `${parts[0]} **** **** ${parts[3]}`;
}

function generateExpiry(): string {
  const now = new Date();
  const year = now.getFullYear() + 4;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${month}/${String(year).slice(2)}`;
}

function buildInitialAccounts(user: RegisteredUser): Account[] {
  const c = getCountryByCode(user.countryResidence);
  return [
    {
      id: `acc_${user.id}_1`,
      userId: user.id,
      type: "savings",
      number: generateAccountNumber(),
      balance: 0,
      currency: c?.currency ?? "Peso colombiano",
      currencyCode: user.currencyCode ?? "COP",
      currencySymbol: user.currencySymbol ?? "$",
      name: "Cuenta de Ahorros",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildInitialCards(user: RegisteredUser): Card[] {
  return [
    {
      id: `card_${user.id}_1`,
      userId: user.id,
      type: "debit",
      number: generateCardNumber(),
      expiry: generateExpiry(),
      holder: `${user.firstName} ${user.lastName}`.toUpperCase(),
      brand: "visa",
      balance: 0,
      color: "#1C1C1E",
      active: true,
    },
  ];
}

function getDeviceInfo(): string {
  if (Platform.OS === "web") {
    try { return navigator.userAgent.slice(0, 120); } catch { return "Web Browser"; }
  }
  return `${Platform.OS} ${Platform.Version ?? ""}`.trim();
}

async function fetchPublicIP(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip ?? "Desconocida";
  } catch {
    return "Desconocida";
  }
}

async function fetchGeoLocation(): Promise<{ latitude: string; longitude: string; city: string }> {
  try {
    if (Platform.OS === "web") {
      return await new Promise((resolve) => {
        if (!navigator?.geolocation) { resolve({ latitude: "", longitude: "", city: "" }); return; }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            resolve({ latitude: lat, longitude: lng, city: "" });
          },
          () => resolve({ latitude: "", longitude: "", city: "" }),
          { timeout: 6000, maximumAge: 60000 }
        );
      });
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return { latitude: "", longitude: "", city: "Sin permiso" };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        const city = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
        return { latitude: lat, longitude: lng, city };
      } catch {
        return { latitude: lat, longitude: lng, city: "" };
      }
    }
  } catch {
    return { latitude: "", longitude: "", city: "" };
  }
}

const DEMO_USER: RegisteredUser = {
  id: "demo-user-1",
  documentType: "CC",
  documentNumber: "1234567890",
  countryResidence: "CO",
  countryBirth: "CO",
  currencyCode: "COP",
  currencySymbol: "$",
  firstName: "Alejandra",
  secondName: "",
  lastName: "García",
  secondLastName: "",
  birthDate: "15/06/1995",
  email: "alejandra@email.com",
  phone: "3001234567",
  pin: "1234",
  createdAt: "2024-01-01T00:00:00.000Z",
  isAdmin: false,
  status: "active",
};

const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc_demo_1",
    userId: "demo-user-1",
    type: "savings",
    number: "****5678",
    balance: 2654112,
    currency: "Peso colombiano",
    currencyCode: "COP",
    currencySymbol: "$",
    name: "Mi Cuenta Bancolombia 001",
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "acc_demo_2",
    userId: "demo-user-1",
    type: "checking",
    number: "****9012",
    balance: 450000,
    currency: "Peso colombiano",
    currencyCode: "COP",
    currencySymbol: "$",
    name: "Cuenta Corriente",
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_demo_1",
    userId: "demo-user-1",
    date: new Date().toISOString().split("T")[0],
    description: "Transferencia recibida - Carlos M.",
    amount: 500000,
    type: "credit",
    category: "Transferencias",
    accountId: "acc_demo_1",
    status: "completed",
  },
  {
    id: "tx_demo_2",
    userId: "demo-user-1",
    date: new Date().toISOString().split("T")[0],
    description: "Pago Factura ETB",
    amount: -120000,
    type: "debit",
    category: "Servicios",
    accountId: "acc_demo_1",
    status: "completed",
  },
  {
    id: "tx_demo_3",
    userId: "demo-user-1",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    description: "Recarga Claro",
    amount: -30000,
    type: "debit",
    category: "Recargas",
    accountId: "acc_demo_1",
    status: "completed",
  },
  {
    id: "tx_demo_4",
    userId: "demo-user-1",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    description: "Nómina Empresa SAS",
    amount: 3500000,
    type: "credit",
    category: "Nómina",
    accountId: "acc_demo_1",
    status: "completed",
  },
  {
    id: "tx_demo_5",
    userId: "demo-user-1",
    date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
    description: "Supermercado Éxito",
    amount: -85000,
    type: "debit",
    category: "Compras",
    accountId: "acc_demo_1",
    status: "completed",
  },
];

async function seedAdmin() {
  const usersJson = await AsyncStorage.getItem("registeredUsers");
  const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
  const adminExists = users.find((u) => u.id === "admin-root");
  const demoExists = users.find((u) => u.id === "demo-user-1");

  const newUsers = [...users];
  if (!adminExists) newUsers.push(ADMIN_USER);
  if (!demoExists) newUsers.push(DEMO_USER);
  if (!adminExists || !demoExists) {
    await AsyncStorage.setItem("registeredUsers", JSON.stringify(newUsers));
  }

  if (!demoExists) {
    await AsyncStorage.setItem("accounts_demo-user-1", JSON.stringify(DEMO_ACCOUNTS));
    await AsyncStorage.setItem("transactions_demo-user-1", JSON.stringify(DEMO_TRANSACTIONS));
  }
}

async function recordLoginEvent(event: Omit<LoginEvent, "id">) {
  try {
    const stored = await AsyncStorage.getItem("loginEvents");
    const events: LoginEvent[] = stored ? JSON.parse(stored) : [];
    const newEvent: LoginEvent = { ...event, id: `login_${Date.now()}_${Math.random().toString(36).slice(2)}` };
    await AsyncStorage.setItem("loginEvents", JSON.stringify([newEvent, ...events].slice(0, 2000)));
  } catch { /* non-blocking */ }
}

async function recordAuditLog(adminId: string, action: string, details: string, targetUserId?: string) {
  try {
    const stored = await AsyncStorage.getItem("auditLogs");
    const logs: AuditLog[] = stored ? JSON.parse(stored) : [];
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      adminId,
      action,
      details,
      targetUserId,
    };
    await AsyncStorage.setItem("auditLogs", JSON.stringify([newLog, ...logs].slice(0, 2000)));
  } catch { /* non-blocking */ }
}

async function loadUserData(user: RegisteredUser) {
  const [storedAccounts, storedTx, storedCards] = await Promise.all([
    AsyncStorage.getItem(`accounts_${user.id}`),
    AsyncStorage.getItem(`transactions_${user.id}`),
    AsyncStorage.getItem(`cards_${user.id}`),
  ]);
  let accounts: Account[] = storedAccounts ? JSON.parse(storedAccounts) : [];
  let cards: Card[] = storedCards ? JSON.parse(storedCards) : [];
  let transactions: Transaction[] = storedTx ? JSON.parse(storedTx) : [];
  if (accounts.length === 0) {
    accounts = buildInitialAccounts(user);
    await AsyncStorage.setItem(`accounts_${user.id}`, JSON.stringify(accounts));
  }
  if (cards.length === 0) {
    cards = buildInitialCards(user);
    await AsyncStorage.setItem(`cards_${user.id}`, JSON.stringify(cards));
  }
  return { accounts, transactions, cards };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [currentAccounts, setCurrentAccounts] = useState<Account[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  const [currentCards, setCurrentCards] = useState<Card[]>([]);

  useEffect(() => {
    (async () => {
      await seedAdmin();
      const [auth, theme, userJson, adminFlag] = await Promise.all([
        AsyncStorage.getItem("auth"),
        AsyncStorage.getItem("themeMode"),
        AsyncStorage.getItem("currentUser"),
        AsyncStorage.getItem("isAdmin"),
      ]);
      setThemeModeState((theme as ThemeMode) ?? "dark");
      if (auth === "true") {
        setIsAuthenticated(true);
        if (adminFlag === "true") setIsAdmin(true);
        if (userJson) {
          const user: RegisteredUser = JSON.parse(userJson);
          setCurrentUser(user);
          if (!user.isAdmin) {
            const data = await loadUserData(user);
            setCurrentAccounts(data.accounts);
            setCurrentTransactions(data.transactions);
            setCurrentCards(data.cards);
          }
        }
      }
    })();
  }, []);

  const reloadUserData = useCallback(async () => {
    if (!currentUser || currentUser.isAdmin) return;
    const data = await loadUserData(currentUser);
    setCurrentAccounts(data.accounts);
    setCurrentTransactions(data.transactions);
    setCurrentCards(data.cards);
  }, [currentUser]);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === "web") return true;
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch { return false; }
  }, []);

  const login = useCallback(async (documentNumber: string, pin: string): Promise<boolean> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toISOString();
    const platform = Platform.OS;

    const matched = users.find((u) => u.pin === pin && u.documentNumber === documentNumber);

    const baseEvent = { timestamp, documentNumber, platform, deviceInfo };

    if (matched) {
      if (matched.status === "suspended" || matched.status === "blocked") {
        const [ip, geo] = await Promise.all([fetchPublicIP(), fetchGeoLocation()]);
        await recordLoginEvent({ ...baseEvent, userId: matched.id, success: false, ip, ...geo });
        return false;
      }

      const adminFlag = matched.isAdmin === true;
      setIsAuthenticated(true);
      setIsAdmin(adminFlag);
      setCurrentUser(matched);

      if (!adminFlag) {
        const data = await loadUserData(matched);
        setCurrentAccounts(data.accounts);
        setCurrentTransactions(data.transactions);
        setCurrentCards(data.cards);
      } else {
        setCurrentAccounts([]);
        setCurrentTransactions([]);
        setCurrentCards([]);
      }

      await AsyncStorage.setItem("auth", "true");
      await AsyncStorage.setItem("isAdmin", adminFlag ? "true" : "false");
      await AsyncStorage.setItem("currentUser", JSON.stringify(matched));

      Promise.all([fetchPublicIP(), fetchGeoLocation()]).then(async ([ip, geo]) => {
        await recordLoginEvent({ ...baseEvent, userId: matched.id, success: true, ip, ...geo });
        if (adminFlag) {
          await recordAuditLog(matched.id, "ADMIN_LOGIN", `Inicio admin desde ${platform} · IP ${ip} · ${geo.city || "ubicación desconocida"}`, matched.id);
        }
      });

      return true;
    }

    Promise.all([fetchPublicIP(), fetchGeoLocation()]).then(async ([ip, geo]) => {
      await recordLoginEvent({ ...baseEvent, userId: null, success: false, ip, ...geo });
    });
    return false;
  }, []);

  const logout = useCallback(async () => {
    if (currentUser) {
      Promise.all([fetchPublicIP(), fetchGeoLocation()]).then(async ([ip, geo]) => {
        await recordLoginEvent({
          timestamp: new Date().toISOString(),
          documentNumber: currentUser.documentNumber,
          userId: currentUser.id,
          success: true,
          platform: Platform.OS,
          deviceInfo: `LOGOUT — ${getDeviceInfo().slice(0, 60)}`,
          ip,
          ...geo,
        });
      });
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setCurrentAccounts([]);
    setCurrentTransactions([]);
    setCurrentCards([]);
    await AsyncStorage.multiRemove(["auth", "isAdmin", "currentUser"]);
  }, [currentUser]);

  const register = useCallback(async (data: Omit<RegisteredUser, "id" | "createdAt">) => {
    const newUser: RegisteredUser = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: "active",
    };
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    await AsyncStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]));
    const accounts = buildInitialAccounts(newUser);
    const cards = buildInitialCards(newUser);
    await AsyncStorage.setItem(`accounts_${newUser.id}`, JSON.stringify(accounts));
    await AsyncStorage.setItem(`cards_${newUser.id}`, JSON.stringify(cards));
    await AsyncStorage.setItem(`transactions_${newUser.id}`, JSON.stringify([]));
  }, []);

  const createUser = useCallback(async (data: Omit<RegisteredUser, "id" | "createdAt">) => {
    const newUser: RegisteredUser = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: "active",
    };
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    await AsyncStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]));
    const accounts = buildInitialAccounts(newUser);
    const cards = buildInitialCards(newUser);
    await AsyncStorage.setItem(`accounts_${newUser.id}`, JSON.stringify(accounts));
    await AsyncStorage.setItem(`cards_${newUser.id}`, JSON.stringify(cards));
    await AsyncStorage.setItem(`transactions_${newUser.id}`, JSON.stringify([]));
    await recordAuditLog(currentUser?.id ?? "admin", "CREATE_USER", `Usuario creado: ${data.documentType} ${data.documentNumber} — ${data.firstName} ${data.lastName} — ${data.email}`, newUser.id);
  }, [currentUser]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const toggleBalanceVisible = useCallback(() => setBalanceVisible((v) => !v), []);

  const getAllUsers = useCallback(async (): Promise<RegisteredUser[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    return usersJson ? JSON.parse(usersJson) : [];
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<RegisteredUser>) => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const updated = users.map((u) => (u.id === id ? { ...u, ...data } : u));
    await AsyncStorage.setItem("registeredUsers", JSON.stringify(updated));
    if (currentUser?.id === id) {
      const newUser = { ...currentUser, ...data };
      setCurrentUser(newUser);
      await AsyncStorage.setItem("currentUser", JSON.stringify(newUser));
    }
    await recordAuditLog(currentUser?.id ?? "admin", "UPDATE_USER", `Usuario ${id} actualizado: ${JSON.stringify(data)}`, id);
  }, [currentUser]);

  const deleteUser = useCallback(async (id: string) => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const target = users.find((u) => u.id === id);
    const filtered = users.filter((u) => u.id !== id);
    await AsyncStorage.setItem("registeredUsers", JSON.stringify(filtered));
    await AsyncStorage.multiRemove([`accounts_${id}`, `transactions_${id}`, `cards_${id}`]);
    await recordAuditLog(currentUser?.id ?? "admin", "DELETE_USER", `Usuario eliminado: ${target?.documentNumber ?? id} — ${target?.firstName} ${target?.lastName} — ${target?.email}`, id);
  }, [currentUser]);

  const getAllAccounts = useCallback(async (): Promise<Account[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const all: Account[] = [];
    for (const u of users) {
      if (u.isAdmin) continue;
      const stored = await AsyncStorage.getItem(`accounts_${u.id}`);
      if (stored) all.push(...(JSON.parse(stored) as Account[]));
    }
    return all;
  }, []);

  const updateAccount = useCallback(async (userId: string, accountId: string, data: Partial<Account>) => {
    const stored = await AsyncStorage.getItem(`accounts_${userId}`);
    let accounts: Account[] = stored ? JSON.parse(stored) : [];
    accounts = accounts.map((a) => (a.id === accountId ? { ...a, ...data } : a));
    await AsyncStorage.setItem(`accounts_${userId}`, JSON.stringify(accounts));
    if (currentUser?.id === userId) setCurrentAccounts(accounts);
    await recordAuditLog(currentUser?.id ?? "admin", "UPDATE_ACCOUNT", `Cuenta ${accountId} usuario ${userId}: ${JSON.stringify(data)}`, userId);
  }, [currentUser]);

  const getAllTransactions = useCallback(async (): Promise<Transaction[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const all: Transaction[] = [];
    for (const u of users) {
      if (u.isAdmin) continue;
      const stored = await AsyncStorage.getItem(`transactions_${u.id}`);
      if (stored) all.push(...(JSON.parse(stored) as Transaction[]));
    }
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const addTransaction = useCallback(async (userId: string, tx: Omit<Transaction, "id">) => {
    const stored = await AsyncStorage.getItem(`transactions_${userId}`);
    const txs: Transaction[] = stored ? JSON.parse(stored) : [];
    const newTx: Transaction = { ...tx, id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}` };
    const updated = [newTx, ...txs];
    await AsyncStorage.setItem(`transactions_${userId}`, JSON.stringify(updated));
    if (currentUser?.id === userId) setCurrentTransactions(updated);
  }, [currentUser]);

  const adminAddBalance = useCallback(async (userId: string, accountId: string, amount: number, description: string, date: string, category: string) => {
    const acStored = await AsyncStorage.getItem(`accounts_${userId}`);
    let accounts: Account[] = acStored ? JSON.parse(acStored) : [];
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const newBalance = account.balance + amount;
    accounts = accounts.map((a) => a.id === accountId ? { ...a, balance: newBalance } : a);
    await AsyncStorage.setItem(`accounts_${userId}`, JSON.stringify(accounts));
    if (currentUser?.id === userId) setCurrentAccounts(accounts);

    const txType: "credit" | "debit" = amount >= 0 ? "credit" : "debit";
    const txStored = await AsyncStorage.getItem(`transactions_${userId}`);
    const txs: Transaction[] = txStored ? JSON.parse(txStored) : [];
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      date,
      description,
      amount: Math.abs(amount),
      type: txType,
      category,
      accountId,
      status: "completed",
    };
    const updatedTx = [newTx, ...txs];
    await AsyncStorage.setItem(`transactions_${userId}`, JSON.stringify(updatedTx));
    if (currentUser?.id === userId) setCurrentTransactions(updatedTx);

    await recordAuditLog(
      currentUser?.id ?? "admin",
      "ADMIN_ADD_BALANCE",
      `${txType === "credit" ? "Crédito" : "Débito"} de ${Math.abs(amount).toLocaleString("es-CO")} a cuenta ${account.number} (${account.name}) del usuario ${userId}. Descripción: "${description}". Nuevo saldo: ${newBalance.toLocaleString("es-CO")}`,
      userId
    );
  }, [currentUser]);

  const getAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    const stored = await AsyncStorage.getItem("auditLogs");
    return stored ? JSON.parse(stored) : [];
  }, []);

  const addAuditLog = useCallback(async (action: string, details: string, targetUserId?: string) => {
    await recordAuditLog(currentUser?.id ?? "admin", action, details, targetUserId);
  }, [currentUser]);

  const getLoginEvents = useCallback(async (): Promise<LoginEvent[]> => {
    const stored = await AsyncStorage.getItem("loginEvents");
    return stored ? JSON.parse(stored) : [];
  }, []);

  const displayName = currentUser?.firstName ?? "";
  const accounts = currentUser && !currentUser.isAdmin ? currentAccounts : [];
  const transactions = currentUser && !currentUser.isAdmin ? currentTransactions : [];
  const cards = currentUser && !currentUser.isAdmin ? currentCards : [];

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        accounts,
        transactions,
        cards,
        userName: displayName,
        currentUser,
        login,
        logout,
        register,
        createUser,
        balanceVisible,
        toggleBalanceVisible,
        themeMode,
        setThemeMode,
        reloadUserData,
        getAllUsers,
        updateUser,
        deleteUser,
        getAllAccounts,
        updateAccount,
        getAllTransactions,
        addTransaction,
        adminAddBalance,
        getAuditLogs,
        addAuditLog,
        getLoginEvents,
        requestLocationPermission,
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
