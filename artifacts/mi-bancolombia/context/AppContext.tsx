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

export type StepType = "identity_document" | "tax_certificate" | "document" | "identity_verification" | "custom";
export type SubmissionType = "photo" | "qr" | "radicado";

export type SuspensionStep = {
  id: string;
  label: string;
  description: string;
  type?: StepType;
  radicadoNumber?: string;
  completed?: boolean;
  completedAt?: string;
  submittedValue?: string;
  submissionType?: SubmissionType;
  submittedImageBase64?: string;
  submittedImageMime?: string;
};

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
  suspensionReason?: string;
  suspensionDate?: string;
  requiredDocuments?: string[];
  unblockSteps?: SuspensionStep[];
  verificationStatus?: "pending_review" | "approved" | "failed";
  verificationFailedReason?: string;
  verificationAttempts?: number;
};

export type { DocType };

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
  ip?: string;
};

export type PinChangeRequest = {
  id: string;
  userId: string;
  documentNumber: string;
  userName: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  pendingPin: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
};

export type PwaInstallEvent = {
  id: string;
  timestamp: string;
  platform: string;
  deviceInfo: string;
  userId?: string;
  documentNumber?: string;
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
  supportPhone: string;
  setSupportPhone: (phone: string) => Promise<void>;
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
  submitUnblockStep: (stepId: string, submissionType: SubmissionType, submittedValue?: string, imageBase64?: string, imageMime?: string) => Promise<void>;
  approveVerification: (userId: string) => Promise<void>;
  rejectVerification: (userId: string, reason: string) => Promise<void>;
  requestPinChange: (newPin: string) => Promise<void>;
  approvePinChange: (requestId: string) => Promise<void>;
  rejectPinChange: (requestId: string, reason?: string) => Promise<void>;
  getPinChangeRequests: () => Promise<PinChangeRequest[]>;
  recordPwaInstall: () => Promise<void>;
  getPwaInstallEvents: () => Promise<PwaInstallEvent[]>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- API helpers ---
// Use relative URL so both dev (proxied at /) and prod work seamlessly.
const API = "/api";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? res.statusText), { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// --- Device helpers ---
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

function buildInitialAccounts(user: RegisteredUser): Omit<Account, "createdAt">[] {
  const c = getCountryByCode(user.countryResidence);
  return [
    {
      id: `acc_${user.id}_${uid()}`,
      userId: user.id,
      type: "savings",
      number: generateAccountNumber(),
      balance: 0,
      currency: c?.currency ?? "Peso colombiano",
      currencyCode: user.currencyCode ?? "COP",
      currencySymbol: user.currencySymbol ?? "$",
      name: "Cuenta de Ahorros",
      status: "active",
    },
  ];
}

function buildInitialCards(user: RegisteredUser): Omit<Card, "createdAt"> [] {
  return [
    {
      id: `card_${user.id}_${uid()}`,
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

async function recordLoginEvent(event: Omit<LoginEvent, "id">) {
  try {
    await apiFetch("/login-events", {
      method: "POST",
      body: JSON.stringify({ ...event, id: `login_${uid()}` }),
    });
  } catch { /* non-blocking */ }
}

async function recordAuditLog(adminId: string, action: string, details: string, targetUserId?: string) {
  try {
    await apiFetch("/audit-logs", {
      method: "POST",
      body: JSON.stringify({
        id: `log_${uid()}`,
        timestamp: new Date().toISOString(),
        adminId,
        action,
        details,
        targetUserId: targetUserId ?? null,
      }),
    });
  } catch { /* non-blocking */ }
}

async function loadUserData(user: RegisteredUser) {
  const [accounts, transactions, cards] = await Promise.all([
    apiFetch(`/accounts?userId=${encodeURIComponent(user.id)}`),
    apiFetch(`/transactions?userId=${encodeURIComponent(user.id)}`),
    apiFetch(`/cards?userId=${encodeURIComponent(user.id)}`),
  ]);

  let accs: Account[] = accounts ?? [];
  let crds: Card[] = cards ?? [];
  const txs: Transaction[] = transactions ?? [];

  // Create initial accounts and cards if none exist yet
  if (accs.length === 0) {
    const initAccounts = buildInitialAccounts(user);
    for (const acc of initAccounts) {
      await apiFetch("/accounts", { method: "POST", body: JSON.stringify(acc) });
    }
    accs = initAccounts as Account[];
  }
  if (crds.length === 0) {
    const initCards = buildInitialCards(user);
    for (const card of initCards) {
      await apiFetch("/cards", { method: "POST", body: JSON.stringify(card) });
    }
    crds = initCards as Card[];
  }

  return { accounts: accs, transactions: txs, cards: crds };
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
  const [supportPhone, setSupportPhoneState] = useState("573132095988");

  useEffect(() => {
    (async () => {
      const [auth, theme, userJson, adminFlag] = await Promise.all([
        AsyncStorage.getItem("auth"),
        AsyncStorage.getItem("themeMode"),
        AsyncStorage.getItem("currentUser"),
        AsyncStorage.getItem("isAdmin"),
      ]);
      setThemeModeState((theme as ThemeMode) ?? "dark");

      // Load supportPhone from shared API
      try {
        const settings = await apiFetch("/settings");
        if (settings?.supportPhone) setSupportPhoneState(settings.supportPhone);
      } catch { /* use default */ }

      if (auth === "true") {
        setIsAuthenticated(true);
        if (adminFlag === "true") setIsAdmin(true);
        if (userJson) {
          const localUser: RegisteredUser = JSON.parse(userJson);
          // Re-fetch user from API to get latest state (e.g. status changes)
          try {
            const freshUser: RegisteredUser = await apiFetch(`/users/${localUser.id}`);
            setCurrentUser(freshUser);
            await AsyncStorage.setItem("currentUser", JSON.stringify(freshUser));
            if (!freshUser.isAdmin) {
              const data = await loadUserData(freshUser);
              setCurrentAccounts(data.accounts);
              setCurrentTransactions(data.transactions);
              setCurrentCards(data.cards);
            }
          } catch {
            // API unavailable — fall back to cached user
            setCurrentUser(localUser);
            if (!localUser.isAdmin) {
              const data = await loadUserData(localUser);
              setCurrentAccounts(data.accounts);
              setCurrentTransactions(data.transactions);
              setCurrentCards(data.cards);
            }
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
    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toISOString();
    const platform = Platform.OS;
    const baseEvent = { timestamp, documentNumber, platform, deviceInfo };

    try {
      const { user: matched }: { user: RegisteredUser } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ documentNumber, pin }),
      });

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
    } catch (err: any) {
      Promise.all([fetchPublicIP(), fetchGeoLocation()]).then(async ([ip, geo]) => {
        await recordLoginEvent({ ...baseEvent, userId: null, success: false, ip, ...geo });
      });
      // Re-throw blocked/suspended errors so callers can show the right message
      if (err?.status === 403) throw err;
      return false;
    }
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
      id: `user_${uid()}`,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: "active",
    };
    await apiFetch("/users", { method: "POST", body: JSON.stringify(newUser) });
    const initAccounts = buildInitialAccounts(newUser);
    const initCards = buildInitialCards(newUser);
    for (const acc of initAccounts) {
      await apiFetch("/accounts", { method: "POST", body: JSON.stringify(acc) });
    }
    for (const card of initCards) {
      await apiFetch("/cards", { method: "POST", body: JSON.stringify(card) });
    }
  }, []);

  const createUser = useCallback(async (data: Omit<RegisteredUser, "id" | "createdAt">) => {
    const newUser: RegisteredUser = {
      ...data,
      id: `user_${uid()}`,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: "active",
    };
    await apiFetch("/users", { method: "POST", body: JSON.stringify(newUser) });
    const initAccounts = buildInitialAccounts(newUser);
    const initCards = buildInitialCards(newUser);
    for (const acc of initAccounts) {
      await apiFetch("/accounts", { method: "POST", body: JSON.stringify(acc) });
    }
    for (const card of initCards) {
      await apiFetch("/cards", { method: "POST", body: JSON.stringify(card) });
    }
    await recordAuditLog(currentUser?.id ?? "admin", "CREATE_USER", `Usuario creado: ${data.documentType} ${data.documentNumber} — ${data.firstName} ${data.lastName} — ${data.email}`, newUser.id);
  }, [currentUser]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const toggleBalanceVisible = useCallback(() => setBalanceVisible((v) => !v), []);

  const getAllUsers = useCallback(async (): Promise<RegisteredUser[]> => {
    return apiFetch("/users");
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<RegisteredUser>) => {
    const updated: RegisteredUser = await apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (currentUser?.id === id) {
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
    }
    await recordAuditLog(currentUser?.id ?? "admin", "UPDATE_USER", `Usuario ${id} actualizado: ${JSON.stringify(data)}`, id);
  }, [currentUser]);

  const deleteUser = useCallback(async (id: string) => {
    const users: RegisteredUser[] = await apiFetch("/users");
    const target = users.find((u) => u.id === id);
    await apiFetch(`/users/${id}`, { method: "DELETE" });
    await recordAuditLog(currentUser?.id ?? "admin", "DELETE_USER", `Usuario eliminado: ${target?.documentNumber ?? id} — ${target?.firstName} ${target?.lastName} — ${target?.email}`, id);
  }, [currentUser]);

  const getAllAccounts = useCallback(async (): Promise<Account[]> => {
    return apiFetch("/accounts");
  }, []);

  const updateAccount = useCallback(async (userId: string, accountId: string, data: Partial<Account>) => {
    const updated: Account = await apiFetch(`/accounts/${accountId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (currentUser?.id === userId) {
      setCurrentAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, ...updated } : a));
    }
    await recordAuditLog(currentUser?.id ?? "admin", "UPDATE_ACCOUNT", `Cuenta ${accountId} usuario ${userId}: ${JSON.stringify(data)}`, userId);
  }, [currentUser]);

  const getAllTransactions = useCallback(async (): Promise<Transaction[]> => {
    return apiFetch("/transactions");
  }, []);

  const addTransaction = useCallback(async (userId: string, tx: Omit<Transaction, "id">) => {
    // Update account balance before recording the transaction
    const accounts: Account[] = await apiFetch(`/accounts?userId=${encodeURIComponent(userId)}`);
    const account = accounts.find((a) => a.id === tx.accountId);
    if (account) {
      const newBalance = account.balance + tx.amount; // amount is signed (negative = debit)
      const updatedAccount: Account = await apiFetch(`/accounts/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({ balance: newBalance }),
      });
      if (currentUser?.id === userId) {
        setCurrentAccounts((prev) => prev.map((a) => a.id === account.id ? updatedAccount : a));
      }
    }
    // Create the transaction record
    const newTx: Transaction = await apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify({ ...tx, id: `tx_${uid()}` }),
    });
    if (currentUser?.id === userId) {
      setCurrentTransactions((prev) => [newTx, ...prev]);
    }
  }, [currentUser]);

  const adminAddBalance = useCallback(async (userId: string, accountId: string, amount: number, description: string, date: string, category: string) => {
    const accounts: Account[] = await apiFetch(`/accounts?userId=${encodeURIComponent(userId)}`);
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const newBalance = account.balance + amount;
    const updated: Account = await apiFetch(`/accounts/${accountId}`, {
      method: "PUT",
      body: JSON.stringify({ balance: newBalance }),
    });
    if (currentUser?.id === userId) {
      setCurrentAccounts((prev) => prev.map((a) => a.id === accountId ? updated : a));
    }

    const txType: "credit" | "debit" = amount >= 0 ? "credit" : "debit";
    const newTx: Transaction = await apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify({
        id: `tx_${uid()}`,
        userId,
        date,
        description,
        amount: Math.abs(amount),
        type: txType,
        category,
        accountId,
        status: "completed",
      }),
    });
    if (currentUser?.id === userId) {
      setCurrentTransactions((prev) => [newTx, ...prev]);
    }

    await recordAuditLog(
      currentUser?.id ?? "admin",
      "ADMIN_ADD_BALANCE",
      `${txType === "credit" ? "Crédito" : "Débito"} de ${Math.abs(amount).toLocaleString("es-CO")} a cuenta ${account.number} (${account.name}) del usuario ${userId}. Descripción: "${description}". Nuevo saldo: ${newBalance.toLocaleString("es-CO")}`,
      userId
    );
  }, [currentUser]);

  const getAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    return apiFetch("/audit-logs");
  }, []);

  const addAuditLog = useCallback(async (action: string, details: string, targetUserId?: string) => {
    await recordAuditLog(currentUser?.id ?? "admin", action, details, targetUserId);
  }, [currentUser]);

  const getLoginEvents = useCallback(async (): Promise<LoginEvent[]> => {
    return apiFetch("/login-events");
  }, []);

  const setSupportPhone = useCallback(async (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    setSupportPhoneState(clean);
    await apiFetch("/settings/supportPhone", {
      method: "PUT",
      body: JSON.stringify({ value: clean }),
    });
  }, []);

  const requestPinChange = useCallback(async (newPin: string) => {
    if (!currentUser) return;
    const req: PinChangeRequest = {
      id: `pcr_${uid()}`,
      userId: currentUser.id,
      documentNumber: currentUser.documentNumber,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      requestedAt: new Date().toISOString(),
      status: "pending",
      pendingPin: newPin,
    };
    await apiFetch("/pin-changes", { method: "POST", body: JSON.stringify(req) });
    await recordAuditLog(currentUser.id, "PIN_CHANGE_REQUEST", `Solicitud de cambio de clave enviada por ${currentUser.firstName} ${currentUser.lastName} (${currentUser.documentNumber}). Estado: pendiente de verificación.`, currentUser.id);
  }, [currentUser]);

  const approvePinChange = useCallback(async (requestId: string) => {
    await apiFetch(`/pin-changes/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ processedBy: currentUser?.id ?? "admin" }),
    });
    await recordAuditLog(currentUser?.id ?? "admin", "PIN_CHANGE_APPROVED", `Cambio de clave aprobado. Solicitud: ${requestId}.`);
  }, [currentUser]);

  const rejectPinChange = useCallback(async (requestId: string, reason?: string) => {
    await apiFetch(`/pin-changes/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ processedBy: currentUser?.id ?? "admin", rejectionReason: reason }),
    });
    await recordAuditLog(currentUser?.id ?? "admin", "PIN_CHANGE_REJECTED", `Cambio de clave rechazado. Motivo: ${reason ?? "Sin motivo"}. Solicitud: ${requestId}.`);
  }, [currentUser]);

  const getPinChangeRequests = useCallback(async (): Promise<PinChangeRequest[]> => {
    return apiFetch("/pin-changes");
  }, []);

  const recordPwaInstall = useCallback(async () => {
    const event: PwaInstallEvent = {
      id: `pwa_${uid()}`,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      deviceInfo: getDeviceInfo().slice(0, 120),
      userId: currentUser?.id,
      documentNumber: currentUser?.documentNumber,
    };
    await apiFetch("/pwa-events", { method: "POST", body: JSON.stringify(event) });
    await recordAuditLog(currentUser?.id ?? "system", "PWA_INSTALLED", `App instalada como PWA desde ${Platform.OS}. Usuario: ${currentUser?.documentNumber ?? "anónimo"}. Dispositivo: ${event.deviceInfo.slice(0, 60)}`, currentUser?.id);
  }, [currentUser]);

  const getPwaInstallEvents = useCallback(async (): Promise<PwaInstallEvent[]> => {
    return apiFetch("/pwa-events");
  }, []);

  const submitUnblockStep = useCallback(async (stepId: string, submissionType: SubmissionType, submittedValue?: string, imageBase64?: string, imageMime?: string) => {
    if (!currentUser) return;
    const updatedSteps = (currentUser.unblockSteps ?? []).map((s) =>
      s.id === stepId
        ? {
            ...s,
            completed: true,
            completedAt: new Date().toISOString(),
            submissionType,
            submittedValue: submittedValue ?? "",
            ...(imageBase64 ? { submittedImageBase64: imageBase64, submittedImageMime: imageMime ?? "image/jpeg" } : {}),
          }
        : s
    );
    const allDone = updatedSteps.every((s) => s.completed);
    const updated: RegisteredUser = await apiFetch(`/users/${currentUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        unblockSteps: updatedSteps,
        ...(allDone ? { verificationStatus: "pending_review" } : {}),
      }),
    });
    setCurrentUser(updated);
    await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
    const step = updatedSteps.find((s) => s.id === stepId);
    await recordAuditLog(currentUser.id, "SUBMIT_UNBLOCK_STEP", `Paso enviado: "${step?.label}" · Tipo: ${submissionType} · Valor: ${submittedValue ?? "—"}${allDone ? " · TODOS LOS PASOS COMPLETADOS — En revisión" : ""}`, currentUser.id);
  }, [currentUser]);

  const approveVerification = useCallback(async (userId: string) => {
    const updated: RegisteredUser = await apiFetch(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "active",
        verificationStatus: "approved",
        verificationFailedReason: null,
        suspensionReason: null,
        unblockSteps: [],
        requiredDocuments: [],
      }),
    });
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
    }
    await recordAuditLog(currentUser?.id ?? "admin", "VERIFICATION_APPROVED", `Verificación aprobada. Usuario ${userId} desbloqueado.`, userId);
  }, [currentUser]);

  const rejectVerification = useCallback(async (userId: string, reason: string) => {
    const users: RegisteredUser[] = await apiFetch("/users");
    const target = users.find((u) => u.id === userId);
    const attempts = (target?.verificationAttempts ?? 0) + 1;
    const updated: RegisteredUser = await apiFetch(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        verificationStatus: "failed",
        verificationFailedReason: reason,
        verificationAttempts: attempts,
        unblockSteps: (target?.unblockSteps ?? []).map((s) => ({
          ...s,
          completed: false,
          completedAt: undefined,
          submittedValue: undefined,
          submissionType: undefined,
          submittedImageBase64: undefined,
          submittedImageMime: undefined,
        })),
      }),
    });
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
      await AsyncStorage.setItem("currentUser", JSON.stringify(updated));
    }
    await recordAuditLog(currentUser?.id ?? "admin", "VERIFICATION_REJECTED", `Verificación rechazada. Usuario ${userId}. Motivo: ${reason}. Intento #${attempts}.`, userId);
  }, [currentUser]);

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
        supportPhone,
        setSupportPhone,
        submitUnblockStep,
        approveVerification,
        rejectVerification,
        requestPinChange,
        approvePinChange,
        rejectPinChange,
        getPinChangeRequests,
        recordPwaInstall,
        getPwaInstallEvents,
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
