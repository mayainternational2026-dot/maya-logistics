import AsyncStorage from "@react-native-async-storage/async-storage";

const COOKIE_KEY = "maya_session_cookie";
const DOMAIN_KEY = "maya_api_domain";

let _baseUrl: string | null = null;

export function setApiBaseUrl(url: string) {
  _baseUrl = url;
}

function getBaseUrl(): string {
  if (_baseUrl) return _baseUrl;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "http://localhost:80";
}

async function getStoredCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
}

async function storeCookie(cookie: string) {
  try {
    await AsyncStorage.setItem(COOKIE_KEY, cookie);
  } catch {}
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(COOKIE_KEY);
  } catch {}
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getBaseUrl();
  const url = `${base}/api${path}`;
  const cookie = await getStoredCookie();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (cookie) {
    headers["Cookie"] = cookie;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const sessionPart = setCookie.split(";")[0];
    if (sessionPart) {
      await storeCookie(sessionPart);
    }
  }

  return response;
}

export type ShipmentStatus =
  | "pending"
  | "collected"
  | "at_warehouse"
  | "customs_clearance"
  | "in_transit"
  | "arrived"
  | "delivered";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface Shipment {
  id: number;
  trackingId: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  senderName: string;
  receiverName: string;
  weight: string | number;
  cost: string | number;
  description: string | null;
  notes: string | null;
  paid: boolean;
  serviceType: string | null;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    return data;
  },

  async logout(): Promise<void> {
    await apiFetch("/auth/logout", { method: "POST" });
    await clearSession();
  },

  async getCurrentUser(): Promise<User | null> {
    const res = await apiFetch("/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  },

  async listShipments(params?: { status?: string; search?: string }): Promise<Shipment[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await apiFetch(`/shipments${query}`);
    if (!res.ok) throw new Error("Failed to load shipments");
    return res.json();
  },

  async getShipment(id: number): Promise<Shipment> {
    const res = await apiFetch(`/shipments/${id}`);
    if (!res.ok) throw new Error("Failed to load shipment");
    return res.json();
  },

  async trackShipment(trackingId: string): Promise<Shipment> {
    const res = await apiFetch(`/shipments/track/${trackingId}`);
    if (!res.ok) throw new Error("Shipment not found");
    return res.json();
  },

  async createInquiry(body: {
    name: string;
    email: string;
    phone?: string;
    productDetails: string;
    productLink?: string;
    quantity?: number;
    estimatedCost?: number;
  }): Promise<void> {
    const res = await apiFetch("/inquiries", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Submission failed");
    }
  },
};
